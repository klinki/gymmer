import {Component, inject} from '@angular/core';
import {DatabaseService, ExerciseExecution, ExerciseSeries, Training} from "../database.service";
import {exerciseData} from "../db";
import {SupabaseAuthService} from "../supabase-auth.service";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private db = inject(DatabaseService);
  private authService = inject(SupabaseAuthService);

  user$ = this.authService.$user;

  export() {
    this.db.exportDb();
  }


  fileContent: string = '';

  public onChange(event: Event): void {
    const fileList = (event.target as any)?.files;
    let file = fileList[0];
    let fileReader: FileReader = new FileReader();
    let self = this;
    fileReader.onloadend = function(x) {
      self.fileContent = fileReader.result as string;
    }
    fileReader.readAsText(file);
  }

  import() {
    this.db.importFromJson(this.fileContent);
  }

  async importCustomData() {
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

  syncToDb() {
    this.db.syncToPostgre();
  }

  syncFromDb() {
    this.db.syncFromPostgre();
  }
}
