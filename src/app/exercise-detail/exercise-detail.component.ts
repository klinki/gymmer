import {Component, effect, inject, input, signal} from '@angular/core';
import {DatabaseService} from "../database.service";
import {ExerciseExecution, ExerciseSeries, Training, TrainingPlan} from "../models";
import {Location} from "@angular/common";
import {TrainingSessionService} from "../training-session.service";
import {combineLatest} from "rxjs";

/**
 * Component for performing exercises during an active training session.
 *
 * This component is used when actively working out and allows users to:
 * - View the last execution of an exercise for reference
 * - Add new series (weight, repetitions, notes) to the current exercise
 * - Delete individual series from the current exercise
 * - Save the exercise execution and move to the next exercise
 *
 * The component automatically loads the last execution data to pre-populate
 * weight values for better user experience.
 *
 * @route /exercise/:id
 * @param id - Exercise ID from the route
 */
@Component({
    selector: 'app-exercise-detail',
    templateUrl: './exercise-detail.component.html',
    styleUrls: ['./exercise-detail.component.scss'],
    standalone: false
})
export class ExerciseDetailComponent {
  private location = inject(Location);
  private session = inject(TrainingSessionService);

  id = input<string>();
  training = signal<Training|null>(null);
  trainingPlan = signal<TrainingPlan|null>(null);
  loading = signal(true);

  exercise: ExerciseExecution|null = null;
  lastExecution: ExerciseExecution|null = null;

  displayedColumns = ['series', 'weight', 'repetitions', 'actions'];

  currentValue: ExerciseSeries = {
    weight: 30,
    repetitions: 10,
    note: '',
  };

  constructor(private db: DatabaseService) {
    effect(() => {
      const id = this.id();
      if (id == null) {
        return;
      }

      this.exercise = this.session.getExercise(id)!;

      if (this.exercise == null) {
        const subscription = combineLatest([this.db.getExercise(id), this.db.getLastExerciseExecution(id)]).subscribe(([exercise, execution]) => {
          if (exercise == null) {
            return;
          }

          if (execution != null) {
            if (execution.series.length > 0) {
              this.currentValue.weight = execution.series[0].weight;
            }
          }

          this.lastExecution = execution;
          this.exercise = ({...exercise, exerciseId: exercise.id, series: []});
          this.loading.set(false);
        });

        return () => subscription.unsubscribe();
      }

      const subscription = this.db.getLastExerciseExecution(id).subscribe(execution => {
        if (execution != null) {
          this.lastExecution = execution;
          this.currentValue.weight = execution.series[0].weight;
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  add() {
    this.exercise!.series = [ ...this.exercise!.series, this.currentValue ];
    this.currentValue = { ...this.currentValue };
  }

  deleteSeries(element: ExerciseSeries) {
    if (this.exercise == null) { return; }
    const idx = this.exercise.series.indexOf(element);
    if (idx === -1) { return; }
    this.exercise.series = [
      ...this.exercise.series.slice(0, idx),
      ...this.exercise.series.slice(idx + 1)
    ];
  }

  next() {
    this.session.addExerciseExecutionToCurrentTraining(this.exercise!);
    this.location.back();
  }
}
