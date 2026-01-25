import {inject, Injectable} from '@angular/core';
import {first, from, Observable, take} from "rxjs";
import Dexie, {Table} from "dexie";
import 'dexie-observable';
import {ulid} from "ulidx";
import {SupabaseService} from "./supabase.service";
import {SupabaseAuthService} from "./supabase-auth.service";
import {map, switchMap} from "rxjs/operators";

import {
  Exercise,
  ExerciseExecution,
  Profile,
  Training,
  TrainingPlan,
  TrainingPlanExercise,
  ExerciseId
} from './models';

Dexie.Observable.createUUID = () => ulid();

/**
 * Main database service for the gymmer application using Dexie (IndexedDB wrapper).
 *
 * This service provides comprehensive data management for the fitness tracking app including:
 * - Exercise management (CRUD operations)
 * - Training session storage and retrieval
 * - Training plan management
 * - Exercise execution history tracking
 * - Data synchronization with Supabase backend
 * - Import/export functionality for data backup
 *
 * The service uses Dexie for local IndexedDB storage with reactive observables
 * and includes automatic data migration and synchronization capabilities.
 *
 * @extends Dexie
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  exercises!: Table<Exercise>;
  trainingPlans!: Table<TrainingPlan>;
  trainingPlanExercises!: Table<TrainingPlanExercise>;
  trainings!: Table<Training>;
  exerciseExecutions!: Table<ExerciseExecution>;

  private supabase = inject(SupabaseService);
  private supabaseAuth = inject(SupabaseAuthService);

  constructor() {
    super('GymmerDB');
    this.version(1).stores({
      // Primary key and indexed props
      exercises: '$$id',
      trainingPlans: '$$id',
      trainings: '$$id',
      trainingPlanExercises: '[trainingPlanId+exerciseId]',
      exerciseExecutions: '$$id,exerciseId,date'
    });
  }

  addTraining(training: Omit<Training, 'id'>): Observable<Training> {
    const allExercises = training.exercises.map(x => this.exerciseExecutions.put(x as ExerciseExecution));
    const finalPromise = Promise.all(allExercises).then(_ => this.trainings.put(training as Training));
    return from(finalPromise);
  }

  getTraining(trainingId: string) {
    return from(this.trainings.get(trainingId));
  }

  addExercise(exercise: Omit<Exercise, 'id'>) {
    this.exercises.add(exercise as Exercise);
  }

  getExercise(id: ExerciseId) {
    return from(this.exercises.get(id));
  }

  getVisibleExercises(): Observable<Exercise[]> {
    return from(
      this.exercises
        .filter(exercise => !exercise.hidden)
        .toArray()
    );
  }

  getLastExerciseExecution(id: ExerciseId) {
    return from(this.ensureExerciseExecutions()).pipe(
      switchMap(() => {
        const queryPromise = this.exerciseExecutions
        .orderBy('date')
        .reverse()
        .filter(x => x.exerciseId == id)
        .limit(1)
    // .where({
    //   exerciseId: id
    // })
       .toArray();

        return from(queryPromise).pipe(map(x => x.length > 0 ? x[0] : null));
      })
    );

    const queryPromise = this.exerciseExecutions
      .orderBy('date')
      .reverse()
      .filter(x => x.exerciseId == id)
      .limit(1)
  // .where({
  //   exerciseId: id
  // })
     .toArray();

    return from(queryPromise).pipe(map(x => x.length > 0 ? x[0] : null));
  }

  private async ensureExerciseExecutions(): Promise<void> {
    if (await this.exerciseExecutions.count() === 0) {
      await this.fillExerciseExecutions();
    }
  }

  async fillExerciseExecutions(): Promise<void> {
    // Get all trainings
    const trainings = await this.trainings.toArray();

    // Prepare an array to hold all exercise executions
    const exerciseExecutions: ExerciseExecution[] = [];

    // Iterate through each training
    for (const training of trainings) {
      // Iterate through each exercise in the training
      for (const exercise of training.exercises) {
        // Create a new ExerciseExecution object
        const exerciseExecution: ExerciseExecution = {
          id: ulid(), // Generate a new ID for this execution
          exerciseId: exercise.id,
          name: exercise.name,
          series: exercise.series,
          date: exercise.date || training.startDate // Use exercise date if available, otherwise use training start date
        };

        exerciseExecutions.push(exerciseExecution);
      }
    }

    // Bulk add all exercise executions to the table
    await this.exerciseExecutions.bulkAdd(exerciseExecutions);

    console.log(`Added ${exerciseExecutions.length} exercise executions.`);
  }

  updateExercise(exercise: Exercise) {
    this.exercises.put(exercise);
  }

  deleteExercise(exercise: Exercise) {
    this.exercises.delete(exercise.id);
  }

  addTrainingPlan(trainingPlan: Omit<TrainingPlan, 'id'>): void {
    this.trainingPlans.add(trainingPlan as TrainingPlan);
  }

  updateTrainingPlan(trainingPlan: TrainingPlan): void {
    this.trainingPlans.put(trainingPlan);
  }

  getTrainingPlan(trainingPlanId: string): Observable<TrainingPlan|undefined> {
    return from(this.trainingPlans.get(trainingPlanId));
  }

  async clear() {
    await this.trainings.clear();
    await this.trainingPlanExercises.clear();
    await this.trainingPlans.clear();
    await this.exercises.clear();
  }

  importFromJson(json: string) {
    const data = JSON.parse(json, (key, value) => {
      if (value != null && (key == 'startDate' || key == 'endDate')) {
        return new Date(value);
      }

      return value;
    });
    const { exercises, trainingPlans, trainings } = data;

    for (const exercise of exercises) {
      this.addExercise(exercise);
    }

    for (const plan of trainingPlans) {
      this.addTrainingPlan(plan);
    }

    for (const training of trainings) {
      const fixedTraining = this.fixTraining(training, trainingPlans);
      this.addTraining(fixedTraining);
    }
  }

  fixTraining(training: Training, trainingPlans: Array<TrainingPlan>) {
    const fixedTraining = { ...training };

    if (training.startDate != null) {
      console.log(training);
    }

    fixedTraining.exercises.forEach(exec => {
      if (exec.id == null || exec.id == exec.exerciseId) {
        exec.id = ulid(training.startDate?.getTime());
      }

      if (exec.date == null) {
        exec.date = training.startDate;
      }
    });

    if (fixedTraining.trainingPlanId == null) {
      const plan = trainingPlans.find(x => fixedTraining.name.startsWith(x.name))
      if (plan != null) {
        fixedTraining.trainingPlanId = plan.id;
      }
    }

    return fixedTraining;
  }

  async exportDb(filename: string = 'database.json') {
    const exercises = await this.exercises.toArray();
    const trainingPlans = await this.trainingPlans.toArray();
    const trainings = await this.trainings.toArray();
    const trainingPlanExercises = await this.trainingPlanExercises.toArray();

    const data = {
      exercises,
      trainingPlans,
      trainings,
      trainingPlanExercises
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "text/json" });
    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);
    link.download = filename;
    link.href = url;
    link.dataset['downloadurl'] = ["text/json", link.download, link.href].join(":");

    const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove();
    URL.revokeObjectURL(url);
  }

  async syncToPostgre() {
    this.supabaseAuth.$user.pipe(first(), take(1)).subscribe(async user => {
      const exercises = await this.exercises.toArray();
      const trainingPlans = await this.trainingPlans.toArray();
      const trainings = await this.trainings.toArray();

      const userTrainings2 = trainings.map(x => ({
        ...x,
        user_id: user?.id,
      }));

      try {
        let res = await this.supabase.supabase
          .from('trainings')
          .upsert(userTrainings2);
        console.log(res);
      } catch (error) {
        console.error(error);
      }

      const postgreSqlVersion = await this.supabase.supabase
        .from('profiles')
        .select()
        .match({ id: user?.id })
        .single();

      // TODO: Select IndexedDB version and PostgreSQL version
      // If one of them doesn't exists, it means full sync
      // One with higher value is the source of truth
      const userExercises = exercises.map(x => ({
        ...x,
        user_id: user?.id,
      }));

      await this.supabase.supabase.from('user_exercises')
        .upsert(userExercises);

      const userTrainingPlans = trainingPlans.map(x => ({
        ...x,
        user_id: user?.id,
      }));

      await this.supabase.supabase.from('training_plans')
        .upsert(userTrainingPlans);

      const userTrainings = trainings.map(x => ({
        ...x,
        user_id: user?.id,
      }));

      this.supabase.supabase
        .from('trainings')
        .upsert(userTrainings);
    });
  }

  async syncFromPostgre() {
    this.supabaseAuth.$user.pipe(first(), take(1)).subscribe(async user => {

      const exercises = await this.supabase
        .supabase
        .from('user_exercises')
        .select()
        .match({ user_id: user?.id });

      const trainingPlans = await this.supabase
        .supabase
        .from('training_plans')
        .select('*');

      const trainings = await this.supabase
        .supabase
        .from('trainings')
        .select()
        .match({ id: user?.id });


    });
  }
}
