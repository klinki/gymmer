import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import Dexie, {Table} from "dexie";
import 'dexie-observable';
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {ulid} from "ulidx";

type ExerciseId = string;
type TrainingPlanId = string;
type TrainingId = string;

type ExerciseType = 'weighted' | 'duration' | 'repetitions' | 'distance';

export interface Exercise {
  id: ExerciseId;
  type?: ExerciseType;
  name: string;
}

export interface ExerciseSeriesBase {
  note?: string;
  variant?: string;
}

export interface WeightedExerciseSeries extends ExerciseSeriesBase {
  weight: number;
  repetitions: number;
}

export interface DurationExerciseSeries extends ExerciseSeriesBase {
  durationInSeconds: number;
}

export interface RepetitionsExerciseSeries extends ExerciseSeriesBase {
  repetitions: number;
}

export interface DistanceExerciseSeries extends ExerciseSeriesBase {
  distance: number;
}

export type ExerciseSeries = WeightedExerciseSeries | DurationExerciseSeries | RepetitionsExerciseSeries | DistanceExerciseSeries;


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
}
