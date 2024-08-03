import {Component, effect, inject, input, signal} from '@angular/core';
import {DatabaseService, ExerciseExecution, ExerciseSeries, Training, TrainingPlan} from "../database.service";
import {Location} from "@angular/common";
import {TrainingSessionService} from "../training-session.service";
import {asapScheduler} from "rxjs";

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
        const subscription = this.db.getExercise(id).subscribe(exercise => {
          if (exercise == null) {
            return;
          }
          // https://github.com/ngrx/platform/issues/3932
          asapScheduler.schedule(() => {
            this.exercise = ({...exercise, exerciseId: exercise.id, series: []});
            this.loading.set(false);
          });
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

  next() {
    this.session.addExerciseToCurrentTraining(this.exercise!);
    this.location.back();
  }
}
