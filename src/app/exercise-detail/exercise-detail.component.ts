import {Component, inject, input, numberAttribute, signal} from '@angular/core';
import {DatabaseService, ExerciseSeries, Training, TrainingPlan} from "../database.service";
import {Router} from "@angular/router";
import {Location} from "@angular/common";

@Component({
  selector: 'app-exercise-detail',
  templateUrl: './exercise-detail.component.html',
  styleUrls: ['./exercise-detail.component.scss']
})
export class ExerciseDetailComponent {
  private location = inject(Location);

  id = input<number, unknown>(0, { transform: numberAttribute });
  training = signal<Training|null>(null);
  trainingPlan = signal<TrainingPlan|null>(null);
  loading = signal(true);

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

  constructor(private db: DatabaseService) {

  }

  add() {
    this.exercise.series = [ ...this.exercise.series, this.currentValue ];
    this.currentValue = { ...this.currentValue };
  }

  next() {
    this.db.addExercise(this.exercise);
    this.location.back();
  }
}
