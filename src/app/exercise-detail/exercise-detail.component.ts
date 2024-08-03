import {Component, inject, input, signal} from '@angular/core';
import {DatabaseService, ExerciseSeries, Training, TrainingPlan} from "../database.service";
import {Location} from "@angular/common";

@Component({
  selector: 'app-exercise-detail',
  templateUrl: './exercise-detail.component.html',
  styleUrls: ['./exercise-detail.component.scss']
})
export class ExerciseDetailComponent {
  private location = inject(Location);

  id = input<string>();
  training = signal<Training|null>(null);
  trainingPlan = signal<TrainingPlan|null>(null);
  loading = signal(true);

  displayedColumns = ['series', 'weight', 'repetitions'];

  exercise = {
    id: 'blabla',
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
    this.db.addExerciseToCurrentTraining(this.exercise);
    this.location.back();
  }
}
