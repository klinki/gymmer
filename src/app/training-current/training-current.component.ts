import {Component, effect, inject, input, signal} from '@angular/core';
import {Router} from "@angular/router";
import {DatabaseService, ExerciseExecution, Training} from "../database.service";
import {TrainingSessionService} from "../training-session.service";
import {MatDialog} from "@angular/material/dialog";
import {ExerciseListComponent} from "../exercise-list/exercise-list.component";
import {first} from "rxjs";

@Component({
  selector: 'app-training-current',
  templateUrl: './training-current.component.html',
  styleUrl: './training-current.component.scss'
})
export class TrainingCurrentComponent {
  private router = inject(Router);
  private db = inject(DatabaseService);
  private session = inject(TrainingSessionService);
  private dialog = inject(MatDialog);

  training = this.session.currentSession;
  trainingRunningTime = signal(0);

  interval: any;

  constructor() {
    const startDate = this.training()?.startDate;
    if (startDate != null) {
      const secondsBetweenDates = Math.floor((new Date().getTime() - startDate.getTime()) / 1000);
      this.trainingRunningTime.set(secondsBetweenDates);
      this.startTimer();
    }
  }

  startTimer() {
    if (this.interval != null) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.interval == null) {
      this.interval = setInterval(() => {
        this.trainingRunningTime.update(x => x + 1);
      }, 1000);
    }
  }

  start() {
    const training = {
      ...this.training() as any,
      startDate: new Date()
    };

    this.session.updateTraining(training);
    this.startTimer();
  }

  stop() {
    if (window.confirm('Finish the training?')) {
      const training = {
        ...this.training() as any,
        endDate: new Date()
      };

      this.session.updateTraining(training);
      clearInterval(this.interval);
      this.interval = null;
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
      this.session.clear();
      this.router.navigate(['/']);
    }
  }
}
