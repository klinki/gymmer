import {Component, effect, inject, input, signal} from '@angular/core';
import {DatabaseService, ExerciseExecution, Training} from "../database.service";
import {asapScheduler} from "rxjs";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ExerciseListComponent} from "../exercise-list/exercise-list.component";

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.scss']
})
export class TrainingComponent {
  private router = inject(Router);
  private dialog = inject(MatDialog);

  id = input<string>();
  training = signal<Training|null>(null);
  loading = signal(true);

  trainingRunningTime = signal(0);

  interval: any;

  constructor(private db: DatabaseService) {
    this.loading.set(true);

    effect(() => {
      const id = this.id();
      if (id == null) {return;}

      const subscription = this.db.getTraining(id).subscribe(training => {
        if (training == null) { return; }
        // https://github.com/ngrx/platform/issues/3932
        asapScheduler.schedule(() => {
          this.training.set(training);
          const totalTime = (training.endDate ?? new Date()).getTime() - (training.startDate ?? new Date()).getTime();
          this.trainingRunningTime.set(totalTime);
          this.loading.set(false);
        });
      });

      return () => subscription.unsubscribe();
    });
  }

  addExercise() {
    const dialogRef = this.dialog.open(ExerciseListComponent);
    this.dialog.afterOpened.subscribe(_ => {
      dialogRef.componentRef?.setInput('showSelection', true);
    });
  }

  showExercise(exercise: ExerciseExecution) {
    this.router.navigate(['exercise', exercise.id])
  }

}
