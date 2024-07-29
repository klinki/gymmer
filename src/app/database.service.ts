import { Injectable } from '@angular/core';

export interface Exercise {
  name: string;
}

export interface ExerciseSeries {
  weight?: number;
  repetitions?: number;
  note?: string;
  variant?: string;
}

export interface ExerciseExecution {
  series: ExerciseSeries[];
}

export interface Training {
  startDate: Date;
  endDate: Date;
  exercises: ExerciseExecution[];
}

export interface Routine {}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  currentSession: Training = {
    startDate: new Date(),
    endDate: new Date(),
    exercises: [],
  };

  constructor() { }

  addExercise(exercise: ExerciseExecution): void {
    this.currentSession.exercises = [
      ...this.currentSession.exercises,
      exercise,
    ]
  }
}
