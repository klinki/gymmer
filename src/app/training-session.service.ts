import {Injectable, signal} from '@angular/core';
import {ExerciseExecution, Training} from "./database.service";

@Injectable({
  providedIn: 'root'
})
export class TrainingSessionService {
  currentSession = signal<Training|null>(null);

  constructor() {
    try {
      const currentSessionStr = localStorage.getItem('currentSession');
      if (currentSessionStr != null) {
        const currentSession = JSON.parse(currentSessionStr, (key, value) => {
          if (value != null && (key == 'startDate' || key == 'endDate')) {
            return new Date(value);
          }

          return value;
        });
        this.currentSession.set(currentSession);
      }
    } catch (err) {
      console.error(err);
    }
  }

  startTraining(training: Training) {
    this.currentSession.set(training);
  }

  updateTraining(training: Training) {
    this.currentSession.set(training);
    localStorage.setItem('currentSession', JSON.stringify(this.currentSession()));
  }

  addExerciseToCurrentTraining(exercise: ExerciseExecution): void {
    const session = this.currentSession()!;

    session.exercises = [
      ...(session.exercises ?? []).filter(x => x.exerciseId != exercise.exerciseId),
      exercise,
    ];

    localStorage.setItem('currentSession', JSON.stringify(session));
    this.currentSession.set(session);
  }

  getExercise(id: any) {
    const session = this.currentSession();
    return session?.exercises?.find((exercise) => exercise.exerciseId === id);
  }

  clear() {
    this.currentSession.set(null);
  }
}
