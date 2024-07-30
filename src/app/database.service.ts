import {Injectable, signal} from '@angular/core';
import {TrainingPlansComponent} from "./training-plans/training-plans.component";
import {Observable, of} from "rxjs";

export interface Exercise {
  id?: number;
  name: string;
}

export interface ExerciseSeries {
  weight?: number;
  repetitions?: number;
  note?: string;
  variant?: string;
}

export interface ExerciseExecution extends Exercise {
  exerciseId?: number;
  series: ExerciseSeries[];
}

export interface Training {
  name: string;
  startDate: Date|null;
  endDate: Date|null;
  exercises: ExerciseExecution[];
}

export interface TrainingPlan {
  id?: number;
  name: string;
  exercises: Exercise[];
}

export interface Routine {}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  currentSession: Training = {
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    exercises: [],
  };

  trainingPlans = signal<TrainingPlan[]>(
    [
      {
        id: 1,
        name: 'Nohy',
        exercises: [
          {
            id: 1,
            name: 'Mrtvý tah',
          },
          {
            name: 'Hack Squat',
          },
          {
            name: 'Hack Squat Lýtka',
          },
          {
            name: 'Leg Extension',
          },
          {
            name: 'Leg Curl',
          },
          {
            name: 'Leg Press',
          },
          {
            name: 'Lower Back',
          },
          {
            name: 'Sklapovačky',
          },
          {
            name: 'Hack Leg Press',
          },
        ],
      },
      {
        id: 2,
        name: 'Push',
        exercises: [
          {
            name: 'Bench press'
          }
        ],
      },
      {
        id: 3,
        name: 'Pull',
        exercises: [

        ],
      }
    ]
  );

  constructor() { }

  getTrainingPlan(trainingPlanId: number): Observable<TrainingPlan|undefined> {
    const training = this.trainingPlans().find(x => x.id === trainingPlanId);
    return of(training);
  }

  addExercise(exercise: ExerciseExecution): void {
    this.currentSession.exercises = [
      ...this.currentSession.exercises,
      exercise,
    ]
  }

  addTrainingPlan(trainingPlan: TrainingPlan): void {
    const trainingPlans = [ ...this.trainingPlans(), trainingPlan ];
    this.trainingPlans.set(trainingPlans);
  }
}
