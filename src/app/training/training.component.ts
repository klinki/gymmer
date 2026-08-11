import {Component, effect, inject, input, signal} from '@angular/core';
import {DatabaseService} from "../database.service";
import {Exercise, ExerciseExecution, Training} from "../models";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ExerciseListComponent} from "../exercise-list/exercise-list.component";
import {first} from "rxjs";
import {ulid} from "ulidx";

/**
 * Component for viewing completed training sessions and their exercise executions.
 *
 * This component displays a summary of a past training session and allows users to:
 * - View the training duration and overall information
 * - See all exercises that were performed in the training
 * - Navigate to individual exercise execution details for review/editing
 * - Add new exercises to the training (if needed)
 *
 * The component calculates and displays the total training time based on
 * start and end dates.
 *
 * @route /training/:id
 * @param id - Training ID from the route
 */
@Component({
    selector: 'app-training',
    templateUrl: './training.component.html',
    styleUrls: ['./training.component.scss'],
    standalone: false
})
export class TrainingComponent {
  private router = inject(Router);
  private dialog = inject(MatDialog);

  id = input<string>();
  training = signal<Training|null>(null);
  loading = signal(true);

  trainingRunningTime = signal(0);

  constructor(private db: DatabaseService) {
    this.loading.set(true);

    effect(() => {
      const id = this.id();
      if (id == null) {return;}

      const subscription = this.db.getTraining(id).subscribe(training => {
        if (training == null) { return; }
        this.training.set(training);
        const totalTime = ((training.endDate ?? new Date()).getTime() - (training.startDate ?? new Date()).getTime()) / 1000;
        this.trainingRunningTime.set(totalTime);
        this.loading.set(false);
      });

      return () => subscription.unsubscribe();
    });
  }

  addExercise() {
    const dialogRef = this.dialog.open(ExerciseListComponent, { height: '100%' });
    dialogRef.afterClosed().pipe(first()).subscribe((selection: Exercise[]|undefined) => {
      const training = this.training();
      if (training == null || selection == null || selection.length === 0) {
        return;
      }

      const executions = selection.map(exercise => ({
        id: ulid(),
        exerciseId: exercise.id,
        name: exercise.name,
        series: [],
      }));
      const updatedTraining = {
        ...training,
        exercises: [ ...training.exercises, ...executions ],
      };

      this.db.updateTraining(updatedTraining).pipe(first()).subscribe(savedTraining => {
        this.training.set(savedTraining);
      });
    });
    dialogRef.componentRef?.setInput('showSelection', true);
  }

  showExercise(exercise: ExerciseExecution) {
    this.router.navigate(['training', this.training()?.id ?? '', exercise.id])
  }

}
