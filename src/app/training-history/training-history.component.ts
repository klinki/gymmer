import { Component, inject } from '@angular/core';
import {DatabaseService, Training} from "../database.service";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {toSignal} from "@angular/core/rxjs-interop";
import {Router} from "@angular/router";

@Component({
  selector: 'app-training-history',
  templateUrl: './training-history.component.html',
  styleUrl: './training-history.component.scss'
})
export class TrainingHistoryComponent {
  db = inject(DatabaseService);
  router = inject(Router);

  trainings = toSignal(fromPromise(
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
