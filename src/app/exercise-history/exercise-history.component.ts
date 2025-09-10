import {Component, effect, inject, input, signal} from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import {DatabaseService, Exercise, ExerciseExecution} from "../database.service";
import {combineLatest} from "rxjs";
import {from} from "rxjs";

/**
 * Component for viewing the historical performance of a specific exercise.
 *
 * This component displays all past executions of a particular exercise across
 * different training sessions and allows users to:
 * - View a chronological list of all exercise executions
 * - See performance trends over time (weight, repetitions, dates)
 * - Analyze progress and performance patterns
 *
 * The component aggregates exercise execution data from all training sessions
 * where the exercise was performed, providing a comprehensive view of
 * the user's progress with that specific exercise.
 *
 * @route /exercise/:id/history
 * @param id - Exercise ID from the route
 */
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
        from(this.db.trainings.toArray()),
        from(this.db.exercises.get(id)),
      ]).subscribe(([trainings, exercise]) => {
        const trainingsWithExecutions = trainings.filter(x => x.exercises.some(ex => ex.exerciseId == id));
        const justExecutions = trainingsWithExecutions
          .flatMap(x => x.exercises)
          .filter(x => x.exerciseId == id);

        this.executions.set(justExecutions);
        this.exercise.set(exercise!);
      });

      return () => subscription.unsubscribe();
    });
  }
}
