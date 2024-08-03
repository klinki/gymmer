import { Component, inject } from '@angular/core';
import {DatabaseService} from "../database.service";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {toSignal} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-training-history',
  templateUrl: './training-history.component.html',
  styleUrl: './training-history.component.scss'
})
export class TrainingHistoryComponent {
  db = inject(DatabaseService);

  trainings = toSignal(fromPromise(this.db.trainings.toArray()));

}
