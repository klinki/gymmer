import {Component, computed, inject, input, signal, TemplateRef, ViewChild} from '@angular/core';
import {DatabaseService, Exercise, ExerciseExecution, ExerciseSeries, Training} from "../database.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {liveQuery} from "dexie";
import {createComputed} from "@angular/core/primitives/signals";
import {MatSelectionList} from "@angular/material/list";
import {exerciseData} from "../db";

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


      if (exerciseName === '666') {
        const data = exerciseData;

        const exercisesFromDbByName = new Map((await this.db.exercises.toArray()).map(x => [x.name, x.id]));

        for (const aTraining of data) {
          const executions: ExerciseExecution[] = aTraining.exercises.map(x => {
            return {
              name: x.exercise,
              exerciseId: exercisesFromDbByName.get(x.exercise),
              series: x.executions.map(serie => {
                const weight = (serie as any)?.['weight'] ?? '';
                let variant = '';

                if (weight.indexOf(':') !== -1) {
                  variant = weight.substring(weight.indexOf(':'));
                }

                const note = `${weight}`;

                return {
                  repetitions: serie.count,
                  weight: 0,
                  note: note
                } as ExerciseSeries;
              })
            } as ExerciseExecution;
          });

          const training: Partial<Training> = {
            name: aTraining.date,
            exercises: executions
          };

          console.log(training);
          this.db.trainings.put(training as Training);
        }

      }
    }
  }

  deleteExercise(exercise: Exercise) {
    this.db.deleteExercise(exercise);
  }

  editExercise(updatedExercise: Exercise) {
    this.db.updateExercise(updatedExercise);
  }
}
