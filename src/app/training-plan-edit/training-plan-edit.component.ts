import {Component, effect, inject, input, signal} from '@angular/core';
import {Router} from "@angular/router";
import {DatabaseService, Exercise, TrainingPlan} from "../database.service";
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
import {MatDialog} from "@angular/material/dialog";
import {toSignal} from "@angular/core/rxjs-interop";
import {liveQuery} from "dexie";

/**
 * Component for editing training plans and managing their exercise composition.
 *
 * This component provides a detailed interface for modifying training plans and allows users to:
 * - View the current training plan details and exercises
 * - Add new exercises to the training plan from the exercise library
 * - Remove exercises from the training plan
 * - Save changes to the training plan
 *
 * The component loads the training plan data based on the route parameter and provides
 * a dialog-based interface for exercise selection and management.
 *
 * @route /training-plans/:id/edit
 * @param id - Training plan ID from the route
 */
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
  loading = signal(true);
  trainingPlan = toSignal<TrainingPlan|null|undefined>(liveQuery(() => this.db.trainingPlans.get(this.id())));

  constructor() {
    effect(() => {
      if (this.trainingPlan() != null) {
        asapScheduler.schedule(() => {
          this.loading.set(false);
        });
      }
    });
  }

  addExercise() {
    const dialogRef = this.dialog.open(ExerciseListComponent, { height: '100%' });
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

    const updatedPlan = { ...plan!, exercises: newExercises };
    this.db.updateTrainingPlan(updatedPlan);
  }
}
