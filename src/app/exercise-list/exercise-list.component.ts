import {Component, computed, inject, input, signal, TemplateRef, ViewChild} from '@angular/core';
import {DatabaseService} from "../database.service";
import {Exercise, Training} from "../models";
import {toSignal} from "@angular/core/rxjs-interop";
import {liveQuery} from "dexie";
import {createComputed} from "@angular/core/primitives/signals";
import {MatSelectionList} from "@angular/material/list";
import {MatDialogRef} from "@angular/material/dialog";

/**
 * Component for managing the exercise library and exercise selection.
 *
 * This component provides a comprehensive exercise management interface that allows users to:
 * - View all available exercises with execution count statistics
 * - Search and filter exercises by name (with diacritics support)
 * - Create new exercises
 * - Edit existing exercises
 * - Delete exercises
 * - Select exercises for training plans or current training sessions
 *
 * The component sorts exercises by execution count (most used first) and provides
 * real-time search functionality with normalized text matching.
 *
 * @route /exercise-list
 */
@Component({
    selector: 'app-exercise-list',
    templateUrl: './exercise-list.component.html',
    styleUrls: ['./exercise-list.component.scss'],
    standalone: false
})
export class ExerciseListComponent {
  db = inject(DatabaseService);
  // Inject DialogRef optionally to close the dialog if opened as one
  constructor(@Optional() public dialogRef: MatDialogRef<ExerciseListComponent>) {}

  showSelection = input();
  selectedItems = signal<Training[]>([]);

  searchText = signal<string>('');
  exercises = toSignal<(Exercise & { executionCount: number })[]>(liveQuery(async () => {
    const exercises = await this.db.exercises.toArray();
    const exercisesWithCount = await Promise.all(exercises.map(async exercise => ({
      ...exercise,
      executionCount: await this.db.exerciseExecutions
          .where('exerciseId')
          .equals(exercise.id)
          .count()
    })));

    return exercisesWithCount;
  }));

  filteredExercises = computed(() => {
    const exercises = (this.exercises()?.filter(x => !x.hidden) ?? [])
      .sort((a, b) => (b.executionCount ?? 0) - (a.executionCount ?? 0));

    if (this.searchText() == '') {
      return exercises;
    }

    // Other way is to use localeCompare(this.searchText(), undefined, {sensitivity: 'base'}) === 0
    // Normalize string to ignore diacritics and other special characters
    const normalize = (str: string) =>
      str.normalize('NFKD')
         .replace(/[\u0300-\u036f]/g, '')
         .toLowerCase();

    const search = normalize(this.searchText());
    return exercises?.filter(x => normalize(x.name).includes(search));
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

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close(this.selectedItems());
    }
  }
}
