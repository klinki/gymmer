import {Component, effect, inject, input, signal} from '@angular/core';
import {Router} from "@angular/router";
import {DatabaseService, Exercise, ExerciseExecution, Training, TrainingPlan} from "../database.service";
import {asapScheduler, first} from "rxjs";
import {DatePipe, NgIf} from "@angular/common";
import {DurationPipe} from "../duration-pipe.pipe";
import {MatFabButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {
  MatList,
  MatListItem,
  MatListItemIcon,
  MatListItemLine,
  MatListItemTitle,
  MatListSubheaderCssMatStyler
} from "@angular/material/list";
import {ExerciseListComponent} from "../exercise-list/exercise-list.component";
import {TrainingSessionService} from "../training-session.service";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-training-plan-edit',
  standalone: true,
  imports: [
    DatePipe,
    DurationPipe,
    MatFabButton,
    MatIcon,
    MatList,
    MatListItem,
    MatListItemIcon,
    MatListItemLine,
    MatListItemTitle,
    MatListSubheaderCssMatStyler,
    NgIf
  ],
  templateUrl: './training-plan-edit.component.html',
  styleUrl: './training-plan-edit.component.scss'
})
export class TrainingPlanEditComponent {
  private router = inject(Router);
  private db = inject(DatabaseService);
  private dialog = inject(MatDialog);

  id = input<string>();
  trainingPlan = signal<TrainingPlan|null>(null);
  loading = signal(true);

  constructor() {
    this.loading.set(true);

    effect(() => {
      const id = this.id();
      if (id == null) {
        return;
      }

      const subscription = this.db.getTrainingPlan(id).subscribe(trainingPlan => {
        if (trainingPlan == null) { return; }
        // https://github.com/ngrx/platform/issues/3932
        asapScheduler.schedule(() => {
          this.trainingPlan.set(trainingPlan);
          this.loading.set(false);
        });
      });

      return () => subscription.unsubscribe();
    });
  }

  addExercise() {
    const dialogRef = this.dialog.open(ExerciseListComponent);
    dialogRef.beforeClosed().pipe(first()).subscribe(_ => {
      const selection = dialogRef.componentInstance.selectedItems();
      this.addExerciseToTrainingPlan(selection);
    })
    dialogRef.componentRef?.setInput('showSelection', true);
  }

  private addExerciseToTrainingPlan(exercises: Exercise|Exercise[]) {
    const plan = this.trainingPlan();

    if (plan == null) {
      return;
    }

    const planExercises = plan?.exercises ?? [];
    const exercisesArr = Array.isArray(exercises) ? exercises : [ exercises ];

    const newExercises = [ ...planExercises, ...exercisesArr ];

    this.trainingPlan.set({ ...plan!, exercises: newExercises });
  }
}
