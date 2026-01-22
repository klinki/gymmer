import {Component, effect, inject, input, signal, OnInit, OnDestroy, DestroyRef} from '@angular/core';
import {Router} from "@angular/router";
import {DatabaseService} from "../database.service";
import {ExerciseExecution, Training} from "../models";
import {TrainingSessionService} from "../training-session.service";
import {MatDialog} from "@angular/material/dialog";
import {ExerciseListComponent} from "../exercise-list/exercise-list.component";
import {first, interval, Subscription} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

/**
 * Component for managing the current active training session.
 *
 * This component is the main interface for an ongoing workout and allows users to:
 * - Start a new training session with a timer
 * - View the current training duration in real-time
 * - Add exercises to the current training from the exercise library
 * - Navigate to individual exercises to perform them
 * - Stop and save the training session to the database
 * - Delete the current training session if needed
 *
 * The component manages the training session state and provides a live timer
 * that tracks the duration of the current workout.
 *
 * @route /training (current session)
 */
@Component({
    selector: 'app-training-current',
    templateUrl: './training-current.component.html',
    styleUrl: './training-current.component.scss',
    standalone: false
})
export class TrainingCurrentComponent implements OnInit {
  private router = inject(Router);
  private db = inject(DatabaseService);
  private session = inject(TrainingSessionService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  training = this.session.currentSession;
  trainingRunningTime = signal(0);

  constructor() {
    // Constructor should only handle dependency injection
    // Register a callback to be called when the component is destroyed
    this.destroyRef.onDestroy(() => {
      console.log('💀 TrainingCurrentComponent destroyed');
    });
  }

  ngOnInit(): void {
    console.log('🚀 TrainingCurrentComponent initialized');
    const startDate = this.training()?.startDate;
    if (startDate != null) {
      const secondsBetweenDates = Math.floor((new Date().getTime() - startDate.getTime()) / 1000);
      this.trainingRunningTime.set(secondsBetweenDates);
      this.startTimer();
    }
  }

  private startTimer(): void {
    console.log('🟢 Starting timer...');
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.trainingRunningTime.update(x => x + 1);
        },
        complete: () => {
          console.log('🔴 Timer destroyed - subscription completed');
        },
        error: (error) => {
          console.error('❌ Timer error:', error);
        }
      });
  }

  start() {
    console.log('▶️ Starting new training session');
    const training = {
      ...this.training() as any,
      startDate: new Date()
    };

    this.session.updateTraining(training);
    this.startTimer();
  }

  stop() {
    if (window.confirm('Finish the training?')) {
      console.log('⏹️ Stopping training session');
      const training = {
        ...this.training() as any,
        endDate: new Date()
      };

      this.session.updateTraining(training);
      this.session.stopTraining();
      this.db.addTraining(training);
      this.router.navigate(['/']);
    }
  }

  addExercise() {
    const dialogRef = this.dialog.open(ExerciseListComponent, { height: '100%' });
    dialogRef.beforeClosed().pipe(first()).subscribe(_ => {
      const selection = dialogRef.componentInstance.selectedItems();
      this.session.addExercisesToCurrentTraining(selection);
    })
    dialogRef.componentRef?.setInput('showSelection', true);
  }

  startExercise(exercise: ExerciseExecution) {
    this.router.navigate(['/exercise', exercise.exerciseId])
  }

  deleteCurrentSession() {
    if (window.confirm('Delete current training?')) {
      console.log('🗑️ Deleting current training session');
      this.session.clear();
      this.router.navigate(['/']);
    }
  }
}
