import {Component, effect, inject, input, signal} from '@angular/core';
import {DatabaseService, ExerciseExecution, Training} from "../database.service";
import {asapScheduler} from "rxjs";
import {Router} from "@angular/router";

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.scss']
})
export class TrainingComponent {
  private router = inject(Router);

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
