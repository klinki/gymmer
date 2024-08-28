import {Component, effect, inject, input, signal} from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import {DatabaseService, Exercise, ExerciseExecution} from "../database.service";
import {asapScheduler, combineLatest} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";

@Component({
  selector: 'app-exercise-history',
  templateUrl: './exercise-history.component.html',
  styleUrl: './exercise-history.component.scss'
})
export class ExerciseHistoryComponent {
  private db = inject(DatabaseService);

  id = input<string>();
  executions = signal<ExerciseExecution[]>([]);
  exercise = signal<Exercise|null>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (id == null) {
        return;
      }

      const subscription = combineLatest([
        fromPromise(this.db.trainings.toArray()),
        fromPromise(this.db.exercises.get(id)),
      ]).subscribe(([trainings, exercise]) => {
        const trainingsWithExecutions = trainings.filter(x => x.exercises.some(ex => ex.exerciseId == id));
        const justExecutions = trainingsWithExecutions
          .flatMap(x => x.exercises)
          .filter(x => x.exerciseId == id);

        // https://github.com/ngrx/platform/issues/3932
        asapScheduler.schedule(() => {
          this.executions.set(justExecutions);
          this.exercise.set(exercise!);
        });
      });

      return () => subscription.unsubscribe();
    });
  }
}
