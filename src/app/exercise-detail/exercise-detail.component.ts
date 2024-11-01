import {Component, effect, inject, input, signal} from '@angular/core';
import {DatabaseService, ExerciseExecution, ExerciseSeries, Training, TrainingPlan} from "../database.service";
import {Location} from "@angular/common";
import {TrainingSessionService} from "../training-session.service";
import {asapScheduler, combineLatest} from "rxjs";

@Component({
  selector: 'app-exercise-detail',
  templateUrl: './exercise-detail.component.html',
  styleUrls: ['./exercise-detail.component.scss']
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

  displayedColumns = ['series', 'weight', 'repetitions'];

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

          // https://github.com/ngrx/platform/issues/3932
          asapScheduler.schedule(() => {
            this.lastExecution = execution;
            this.exercise = ({...exercise, exerciseId: exercise.id, series: []});
            this.loading.set(false);
          });
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

  next() {
    this.session.addExerciseExecutionToCurrentTraining(this.exercise!);
    this.location.back();
  }
}
