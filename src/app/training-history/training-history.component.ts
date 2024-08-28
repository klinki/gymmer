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

  trainings = toSignal(fromPromise(this.db.trainings.toArray()));

  openTrainingDetail(training: Training) {
    this.router.navigate(['/training', training.id]);
  }
}
