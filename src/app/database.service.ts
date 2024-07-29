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

  constructor() { }
}
