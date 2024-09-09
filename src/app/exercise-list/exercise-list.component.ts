import {Component, computed, inject, input, signal, TemplateRef, ViewChild} from '@angular/core';
import {DatabaseService, Exercise, ExerciseExecution, ExerciseSeries, Training} from "../database.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {liveQuery} from "dexie";
import {createComputed} from "@angular/core/primitives/signals";
import {MatSelectionList} from "@angular/material/list";

@Component({
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.component.html',
  styleUrls: ['./exercise-list.component.scss']
})
export class ExerciseListComponent {
  db = inject(DatabaseService);

  showSelection = input();
  selectedItems = signal<Training[]>([]);

  searchText = signal<string>('');
  exercises = toSignal<Exercise[]>(liveQuery(() => this.db.exercises.toArray()));
  filteredExercises = computed(() => {
    if (this.searchText() == '') {
      return this.exercises();
    }

    const regex = new RegExp(this.searchText(), 'iu');
    return this.exercises()?.filter(x => x.name.match(regex));
  });

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
