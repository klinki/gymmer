import {Component, effect, inject, input, Input, numberAttribute, signal} from '@angular/core';
import {DatabaseService, ExerciseExecution, Training, TrainingPlan} from "../database.service";
import {asapScheduler} from "rxjs";
import {Router} from "@angular/router";

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.scss']
})
export class TrainingComponent {
  private router = inject(Router);

  // unknown needed because of https://github.com/angular/angular/issues/53969
  id = input<number, unknown>(0, { transform: numberAttribute });
  training = signal<Training|null>(null);
  trainingPlan = signal<TrainingPlan|null>(null);
  loading = signal(true);

  trainingRunningTime = signal(0);

  interval: any;

  constructor(private db: DatabaseService) {
    this.loading.set(true);

    effect(() => {
      const subscription = this.db.getTrainingPlan(this.id()).subscribe(trainingPlan => {
        if (trainingPlan == null) { return; }
        // https://github.com/ngrx/platform/issues/3932
        asapScheduler.schedule(() => {

          const training: Training = {
            name: trainingPlan.name,
            startDate: null,
            endDate: null,
            exercises: trainingPlan.exercises.map(ex => ({...ex, series: []})),
          };

          this.training.set(training);
          this.trainingPlan.set(trainingPlan);
          this.loading.set(false);
        });
      });

      return () => subscription.unsubscribe();
    });
  }

  start() {
    const training = {
      ...this.training() as any,
      startDate: new Date()
    };

    this.training.set(training);

    this.interval = setInterval(() => {
      this.trainingRunningTime.update(x => x + 1);
    }, 1000);
  }

  stop() {
    const training = {
      ...this.training() as any,
      endDate: new Date()
    };

    this.training.set(training);
    clearInterval(this.interval);
  }

  addExercise() {}

  startExercise(exercise: ExerciseExecution) {
    this.router.navigate(['/exercise', exercise.id])
  }

}
