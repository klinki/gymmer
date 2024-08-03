import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import Dexie, {Table} from "dexie";
import 'dexie-observable';
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {ulid} from "ulidx";

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

  currentSession: Training = {
    id: '',
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    exercises: [],
  };

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
    return fromPromise(this.trainings.add(training as Training));
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

  getTrainingPlan(trainingPlanId: string): Observable<TrainingPlan|undefined> {
    return fromPromise(this.trainingPlans.get(trainingPlanId));
  }

  addExerciseToCurrentTraining(exercise: ExerciseExecution): void {
    this.currentSession.exercises = [
      ...this.currentSession.exercises,
      exercise,
    ]
  }

  importFromJson(json: string) {

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
}
