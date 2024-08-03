import {Component, inject} from '@angular/core';
import {DatabaseService, Exercise} from "../database.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {liveQuery} from "dexie";

@Component({
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.component.html',
  styleUrls: ['./exercise-list.component.scss']
})
export class ExerciseListComponent {
  db = inject(DatabaseService);

  exercises = toSignal<Exercise[]>(liveQuery(() => this.db.exercises.toArray()));

  async newExercise() {
    const exerciseName = window.prompt('Add exercise name');
    if (exerciseName != null && exerciseName != '') {
      const exercise = {
        name: exerciseName!,
      };
      this.db.addExercise(exercise);
    }
  }

  deleteExercise(exercise: Exercise) {
    this.db.deleteExercise(exercise);
  }

  editExercise(updatedExercise: Exercise) {
    this.db.updateExercise(updatedExercise);
  }
}
