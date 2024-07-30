import { Component } from '@angular/core';

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.scss']
})
export class TrainingComponent {
  training = {
    name: 'Training',
    hasStarted: false,
    exercises: [] as any[]
  };

  start() {}

  stop() {}

  addExercise() {}

  startExercise(exercise: any) {

  }

}
