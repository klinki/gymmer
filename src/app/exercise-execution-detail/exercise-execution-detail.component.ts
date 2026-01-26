import {ChangeDetectionStrategy, Component, effect, inject, input, signal} from '@angular/core';
import { Location } from "@angular/common";
import {DatabaseService, ExerciseExecution, ExerciseSeries, Training, TrainingPlan} from "../database.service";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from "@angular/material/table";
import {MatFormField, MatLabel, MatSuffix} from "@angular/material/form-field";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";

/**
 * Component for viewing and editing exercise execution details from past training sessions.
 *
 * This component is used when reviewing completed workouts and allows users to:
 * - View series data (weight, repetitions, notes) for a specific exercise execution
 * - Add new series to the exercise execution
 * - Delete individual series from the exercise execution
 *
 * @route /training/:id/:exerciseExecutionId
 * @param id - Training ID from the route
 * @param exerciseExecutionId - Exercise execution ID from the route
 */
@Component({
    selector: 'app-exercise-execution-detail',
    imports: [
    FormsModule,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatFormField,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatRow,
    MatRowDef,
    MatSuffix,
    MatTable,
    ReactiveFormsModule
],
    templateUrl: './exercise-execution-detail.component.html',
    styleUrl: './exercise-execution-detail.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExerciseExecutionDetailComponent {
  private location = inject(Location);

  id = input<string>();
  exerciseExecutionId = input<string>();

  training = signal<Training|null>(null);
  trainingPlan = signal<TrainingPlan|null>(null);
  loading = signal(true);

  exercise: ExerciseExecution|null = null;

  displayedColumns = ['series', 'weight', 'repetitions', 'actions'];

  currentValue: ExerciseSeries = {
    weight: 30,
    repetitions: 10,
    note: '',
  };

  constructor(private db: DatabaseService) {
    effect(() => {
      const id = this.id();
      const exerciseExecutionId = this.exerciseExecutionId();
      if (id == null || exerciseExecutionId == null) {
        return;
      }

      if (this.training() == null) {
        const subscription = this.db.getTraining(id).subscribe(training => {
          if (training == null) {
            return;
          }

          const exercise = training.exercises.find(x => x.id === exerciseExecutionId);

          if (exercise != null) {
            this.training.set(training);
            this.exercise = exercise;
            this.loading.set(false);
          }
        });

        return () => subscription.unsubscribe();
      }

      return () => {};
    });
  }

  add() {
    this.exercise!.series = [ ...this.exercise!.series, this.currentValue ];
    this.currentValue = { ...this.currentValue };
  }

  deleteSeries(element: ExerciseSeries) {
    if (this.exercise == null) {
      return;
    }

    const idx = this.exercise.series.indexOf(element);
    if (idx === -1) { return; }

    this.exercise.series = [
      ...this.exercise.series.slice(0, idx),
      ...this.exercise.series.slice(idx + 1)
    ];
  }

  back() {
    this.location.back();
  }
}
