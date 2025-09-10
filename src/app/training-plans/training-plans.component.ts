import { Component, inject } from '@angular/core';
import {DatabaseService, Training, TrainingPlan} from "../database.service";
import {Router} from "@angular/router";
import {toSignal} from "@angular/core/rxjs-interop";
import {liveQuery} from "dexie";
import {TrainingSessionService} from "../training-session.service";

/**
 * Component for managing training plans and starting new training sessions.
 *
 * This component serves as the main entry point for workout planning and allows users to:
 * - View all available training plans
 * - Create new training plans
 * - Start a training session from an existing plan
 * - Start a free-form training session without a plan
 * - Edit existing training plans
 *
 * When starting a training from a plan, the component creates a new training session
 * with the plan's exercises and navigates to the current training interface.
 *
 * @route / (root route)
 */
@Component({
  selector: 'app-training-plans',
  templateUrl: './training-plans.component.html',
  styleUrl: './training-plans.component.scss'
})
export class TrainingPlansComponent {
  private database = inject(DatabaseService);
  private router = inject(Router);
  private session = inject(TrainingSessionService);
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
      exercises: plan.exercises.map(x => ({ ...x, series: [], exerciseId: x.id, id: undefined,  })) as any,
      trainingPlanId: plan.id,
    };

    this.addAndStartTraining(training);
  }

  editTrainingPlan(plan: TrainingPlan) {
    this.router.navigate(['/training-plans', plan.id, 'edit']);
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
    this.session.startTraining(training as any);
    this.router.navigate(['/training']);
    // this.database.addTraining(training).subscribe(newTrainingId => {
    //   this.router.navigate(['/training', newTrainingId]);
    // });
  }
}
