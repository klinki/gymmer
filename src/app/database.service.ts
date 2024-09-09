import {inject, Injectable} from '@angular/core';
import {first, Observable, take} from "rxjs";
import Dexie, {Table} from "dexie";
import 'dexie-observable';
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {ulid} from "ulidx";
import {SupabaseService} from "./supabase.service";
import {SupabaseAuthService} from "./supabase-auth.service";

type ExerciseId = string;
type TrainingPlanId = string;
type TrainingId = string;

export interface Exercise {
  id: ExerciseId;
  name: string;
}

export interface ExerciseSeries {
  weight?: number;
  repetitions?: number;
  note?: string;
  variant?: string;
}

export interface ExerciseExecution extends Exercise {
  exerciseId?: ExerciseId;
  series: ExerciseSeries[];
}

export interface Training {
  id: TrainingId;
  name: string;
  startDate: Date|null;
  endDate: Date|null;
  exercises: ExerciseExecution[];
  trainingPlanId?: TrainingPlanId;
}

export interface TrainingPlan {
  id: TrainingPlanId;
  name: string;
  exercises: Exercise[];
}

export interface TrainingPlanExercise {
  trainingPlanId: string;
  exerciseId: string;
}

export interface Routine {}

Dexie.Observable.createUUID = () => ulid();

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  exercises!: Table<Exercise>;
  trainingPlans!: Table<TrainingPlan>;
  trainingPlanExercises!: Table<TrainingPlanExercise>;
  trainings!: Table<Training>;

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
    });
  }

  addTraining(training: Omit<Training, 'id'>): Observable<Training> {
    return fromPromise(this.trainings.put(training as Training));
  }

  getTraining(trainingId: string) {
    return fromPromise(this.trainings.get(trainingId));
  }

  addExercise(exercise: Omit<Exercise, 'id'>) {
    this.exercises.add(exercise as Exercise);
  }

  getExercise(id: ExerciseId) {
    return fromPromise(this.exercises.get(id));
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
    return fromPromise(this.trainingPlans.get(trainingPlanId));
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
      const fixedTraining = this.fixTraining(training);
      this.addTraining(fixedTraining);
    }
  }

  fixTraining(training: Training) {
    const fixedTraining = { ...training };

    if (training.startDate != null) {
      console.log(training);
    }

    fixedTraining.exercises.forEach(exec => {
      if (exec.id == null || exec.id == exec.exerciseId) {
        exec.id = ulid(training.startDate?.getTime());
      }
    });

    return fixedTraining;
  }

  async exportDb() {
    const exercises = await this.exercises.toArray();
    const trainingPlans = await this.trainingPlans.toArray();
    const trainings = await this.trainings.toArray();

    const data = {
      exercises,
      trainingPlans,
      trainings
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "text/json" });
    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);
    link.download = "database.json";
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
