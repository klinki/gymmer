export type ExerciseId = string;
export type TrainingPlanId = string;
export type TrainingId = string;

export interface Exercise {
  id: ExerciseId;
  name: string;
  hidden?: boolean;
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
  date?: Date|null;
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

export interface Profile {
  id?: string
  username: string
  website: string
  avatar_url: string
}
