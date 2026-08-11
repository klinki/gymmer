import {inject, Injectable} from '@angular/core';
import {first, from, Observable, take} from "rxjs";
import Dexie, {Table} from "dexie";
import 'dexie-observable';
import {ulid} from "ulidx";
import {SupabaseService} from "./supabase.service";
import {SupabaseAuthService} from "./supabase-auth.service";
import {map} from "rxjs/operators";

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
    this.version(2).stores({
      exercises: '$$id',
      trainingPlans: '$$id',
      trainings: '$$id',
      trainingPlanExercises: '[trainingPlanId+exerciseId]',
      exerciseExecutions: '$$id,exerciseId,date,[exerciseId+date]'
    }).upgrade(async transaction => {
      const trainings = await transaction.table<Training>('trainings').toArray();
      const exerciseExecutions = this.createDerivedExerciseExecutions(trainings);
      const exerciseExecutionsTable = transaction.table<ExerciseExecution>('exerciseExecutions');

      await exerciseExecutionsTable.clear();
      await exerciseExecutionsTable.bulkPut(exerciseExecutions);
    });
  }

  addTraining(training: Omit<Training, 'id'>): Observable<Training> {
    return from(this.persistTraining(training));
  }

  updateTraining(training: Training): Observable<Training> {
    return from(this.persistTraining(training));
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
    const queryPromise = this.exerciseExecutions
      .where('[exerciseId+date]')
      .between([id, Dexie.minKey], [id, Dexie.maxKey], true, true)
      .last();

    return from(queryPromise).pipe(map(execution => execution ?? null));
  }

  private createDerivedExerciseExecutions(trainings: Training[]): ExerciseExecution[] {
    return trainings.flatMap(training => training.exercises.map(exercise => {
      const date = this.toDate(exercise.date) ?? this.toDate(training.startDate) ?? this.toDate(training.endDate);

      return {
        ...exercise,
        id: ulid(date?.getTime()),
        date,
      };
    }));
  }

  private async persistTraining(training: Training|Omit<Training, 'id'>): Promise<Training> {
    return this.transaction('rw', this.trainings, this.exerciseExecutions, async () => {
      const trainingId = await this.trainings.put(training as Training);
      const storedTraining = await this.trainings.get(trainingId);

      if (storedTraining == null) {
        throw new Error(`Training ${String(trainingId)} could not be read after it was saved.`);
      }

      const trainings = await this.trainings.toArray();
      await this.rebuildDerivedExerciseExecutions(this.exerciseExecutions, trainings);
      return storedTraining;
    });
  }

  private async rebuildDerivedExerciseExecutions(
    table: Table<ExerciseExecution>,
    trainings: Training[]
  ): Promise<void> {
    await table.clear();
    const exerciseExecutions = this.createDerivedExerciseExecutions(trainings);

    if (exerciseExecutions.length > 0) {
      await table.bulkPut(exerciseExecutions);
    }
  }

  private toDate(value: Date|string|null|undefined): Date|undefined {
    if (value == null) {
      return undefined;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
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
    await this.exerciseExecutions.clear();
    await this.trainingPlanExercises.clear();
    await this.trainingPlans.clear();
    await this.exercises.clear();
  }

  async importFromJson(json: string): Promise<void> {
    const data = JSON.parse(json, (key, value) => {
      if (value != null && (key == 'startDate' || key == 'endDate' || key == 'date')) {
        return new Date(value);
      }

      return value;
    });
    const exercises: Exercise[] = data.exercises ?? [];
    const trainingPlans: TrainingPlan[] = data.trainingPlans ?? [];
    const trainingPlanExercises: TrainingPlanExercise[] = data.trainingPlanExercises ?? [];
    const trainings: Training[] = (data.trainings ?? [])
      .map((training: Training) => this.fixTraining(training, trainingPlans));

    await this.transaction(
      'rw',
      [
        this.exercises,
        this.trainingPlans,
        this.trainingPlanExercises,
        this.trainings,
        this.exerciseExecutions,
      ],
      async () => {
        if (exercises.length > 0) {
          await this.exercises.bulkPut(exercises);
        }
        if (trainingPlans.length > 0) {
          await this.trainingPlans.bulkPut(trainingPlans);
        }
        if (trainingPlanExercises.length > 0) {
          await this.trainingPlanExercises.bulkPut(trainingPlanExercises);
        }
        if (trainings.length > 0) {
          await this.trainings.bulkPut(trainings);
        }

        const allTrainings = await this.trainings.toArray();
        await this.rebuildDerivedExerciseExecutions(this.exerciseExecutions, allTrainings);
      }
    );
  }

  fixTraining(training: Training, trainingPlans: Array<TrainingPlan>) {
    const fixedTraining = {
      ...training,
      exercises: training.exercises.map(execution => ({ ...execution })),
    };

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
