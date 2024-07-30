import { Component, inject } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import {DatabaseService, TrainingPlan} from "../database.service";

@Component({
  selector: 'app-training-plans',
  templateUrl: './training-plans.component.html',
  styleUrl: './training-plans.component.scss'
})
export class TrainingPlansComponent {

  private breakpointObserver = inject(BreakpointObserver);
  private database = inject(DatabaseService);
  trainingPlans = this.database.trainingPlans;

  /** Based on the screen size, switch from standard to one column per row */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
          { title: 'Card 1', cols: 1, rows: 1 },
          { title: 'Card 2', cols: 1, rows: 1 },
          { title: 'Card 3', cols: 1, rows: 1 },
          { title: 'Card 4', cols: 1, rows: 1 }
        ];
      }

      return [
        { title: 'Card 1', cols: 2, rows: 1 },
        { title: 'Card 2', cols: 1, rows: 1 },
        { title: 'Card 3', cols: 1, rows: 2 },
        { title: 'Card 4', cols: 1, rows: 1 }
      ];
    })
  );

  newTraining() {
    const name = window.prompt() as string;
    const trainingPlan: TrainingPlan = {
      name,
      exercises: []
    };

    this.database.addTrainingPlan(trainingPlan);
  }


  startTrainingPlan(plan: any) {

  }
}
