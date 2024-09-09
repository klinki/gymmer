import {Component, inject} from '@angular/core';
import {DatabaseService} from "../database.service";
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

  async clear() {
    if (window.confirm('Are you sure? This will delete all data')) {
      await this.db.clear();
    }
  }

  syncToDb() {
    this.db.syncToPostgre();
  }

  syncFromDb() {
    this.db.syncFromPostgre();
  }
}
