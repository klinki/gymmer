import { Component, inject } from '@angular/core';
import {DatabaseService} from "../database.service";
import {Training} from "../models";
import {from} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";
import {Router} from "@angular/router";

/**
 * Component for viewing the complete history of all training sessions.
 *
 * This component displays a chronological list of all completed training sessions and allows users to:
 * - View all past training sessions sorted by date (most recent first)
 * - Navigate to individual training session details
 * - See training session information at a glance
 *
 * The component automatically sorts training sessions by start date in descending order,
 * with sessions without dates placed at the end of the list.
 *
 * @route /training/history
 */
@Component({
    selector: 'app-training-history',
    templateUrl: './training-history.component.html',
    styleUrl: './training-history.component.scss',
    standalone: false
})
export class TrainingHistoryComponent {
  db = inject(DatabaseService);
  router = inject(Router);

  trainings = toSignal(from(
    this.db.trainings
      .toArray()
      .then(trainings => trainings.sort((a, b) => {
        // If both dates are null, maintain original order
        if (!a.startDate && !b.startDate) return 0;
        // If only a's date is null, move it to the end
        if (!a.startDate) return 1;
        // If only b's date is null, move it to the end
        if (!b.startDate) return -1;
        // Sort by date descending
        return b.startDate.getTime() - a.startDate.getTime();
      }))
  ));

  openTrainingDetail(training: Training) {
    this.router.navigate(['/training', training.id]);
  }
}
