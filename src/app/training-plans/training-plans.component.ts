import { Component, inject } from '@angular/core';
import {DatabaseService, Training, TrainingPlan} from "../database.service";
import {Router} from "@angular/router";
import {toSignal} from "@angular/core/rxjs-interop";
import {liveQuery} from "dexie";

@Component({
  selector: 'app-training-plans',
  templateUrl: './training-plans.component.html',
  styleUrl: './training-plans.component.scss'
})
export class TrainingPlansComponent {
  private database = inject(DatabaseService);
  private router = inject(Router);
  trainingPlans = toSignal<TrainingPlan[]>(liveQuery(() => this.database.trainingPlans.toArray()));

  newTrainingPlan() {
    const name = window.prompt() as string;

    if (name === null || name === '') {
      return;
    }

    const trainingPlan: Omit<TrainingPlan, 'id'> = {
      name,
      exercises: []
    };

    this.database.addTrainingPlan(trainingPlan);
  }

  startTrainingPlan(plan: TrainingPlan) {
    const currentTime = this.getFormattedCurrentTime();
    const name = `${plan.name} - ${currentTime}`;
    const training: Omit<Training, 'id'> = {
      name: name,
      startDate: null,
      endDate: null,
      exercises: plan.exercises.map(x => ({...x, series: []})),
      trainingPlanId: plan.id,
    };

    this.addAndStartTraining(training);
  }

  editTrainingPlan(plan: any) {

  }

  getFormattedCurrentTime() {
    const currentTime = new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24-hour time format
    });

    return currentTime;
  }

  startFreeTraining() {
    const currentTime = this.getFormattedCurrentTime();
    const training: Omit<Training, 'id'> = {
      name: `Volný trénink - ${currentTime}`,
      startDate: null,
      endDate: null,
      exercises: [],
    };

    this.addAndStartTraining(training);
  }

  addAndStartTraining(training: Omit<Training, 'id'>) {
    this.database.addTraining(training).subscribe(newTrainingId => {
      this.router.navigate(['/training', newTrainingId]);
    });
  }
}
