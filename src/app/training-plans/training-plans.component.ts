import { Component, inject } from '@angular/core';
import {DatabaseService, TrainingPlan} from "../database.service";
import {Router} from "@angular/router";
import { asapScheduler } from 'rxjs';

@Component({
  selector: 'app-training-plans',
  templateUrl: './training-plans.component.html',
  styleUrl: './training-plans.component.scss'
})
export class TrainingPlansComponent {
  private database = inject(DatabaseService);
  private router = inject(Router);
  trainingPlans = this.database.trainingPlans;

  newTraining() {
    const name = window.prompt() as string;

    if (name === null || name === '') {
      return;
    }

    const trainingPlan: TrainingPlan = {
      name,
      exercises: []
    };

    this.database.addTrainingPlan(trainingPlan);
  }

  startTrainingPlan(plan: TrainingPlan) {
    this.router.navigate(['/training', plan.id]);
  }

  editTrainingPlan(plan: any) {

  }
}
