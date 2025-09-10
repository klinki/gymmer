import {Injectable, signal} from '@angular/core';
import {Exercise, ExerciseExecution, Training} from "./database.service";

/**
 * Service for managing the current active training session.
 *
 * This service provides state management for ongoing workout sessions and includes:
 * - Current session state management with reactive signals
 * - Local storage persistence for session data
 * - Exercise management within the current session
 * - Session lifecycle management (start, update, stop, clear)
 *
 * The service automatically persists the current session to localStorage
 * and restores it on application startup, ensuring users don't lose
 * their workout progress.
 */
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

  stopTraining() {
    this.currentSession.set(null);
    localStorage.setItem('currentSession', "null");
  }

  addExercisesToCurrentTraining(exercises: Exercise[]|Exercise): void {
    const session = this.currentSession()!;

    const exercisesArr = Array.isArray(exercises) ? exercises : [ exercises ];

    session.exercises = [
      ...session.exercises,
      ...exercisesArr.map(x => ({ ...x, exerciseId: x.id, series: [] }))
    ];

    localStorage.setItem('currentSession', JSON.stringify(session));
    this.currentSession.set(session);
  }

  addExerciseExecutionToCurrentTraining(exercise: ExerciseExecution): void {
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
