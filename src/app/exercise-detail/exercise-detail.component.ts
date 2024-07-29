import { Component } from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {ExerciseExecution, ExerciseSeries} from "../database.service";

@Component({
  selector: 'app-exercise-detail',
  templateUrl: './exercise-detail.component.html',
  styleUrls: ['./exercise-detail.component.scss']
})
export class ExerciseDetailComponent {
  displayedColumns = ['series', 'weight', 'repetitions'];

  exercise = {
    name: 'Some Exercise',
    series: [] as any[],
  }

  currentValue: ExerciseSeries = {
    weight: 30,
    repetitions: 10,
    note: '',
  };

  add() {
    this.exercise.series = [ ...this.exercise.series, this.currentValue ];
    this.currentValue = { ...this.currentValue };
  }

  next() {

  }
}
