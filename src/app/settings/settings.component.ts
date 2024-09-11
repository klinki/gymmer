import {Component, inject} from '@angular/core';
import {DatabaseService} from "../database.service";
import {SupabaseAuthService} from "../supabase-auth.service";
import {AsyncPipe} from "@angular/common";
import {versions} from "../../environments/version";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton} from "@angular/material/button";
import {Router} from "@angular/router";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [AsyncPipe, MatCard, MatCardTitle, MatCardHeader, MatCardActions, MatButton, MatCardContent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private db = inject(DatabaseService);
  private authService = inject(SupabaseAuthService);
  private router = inject(Router);

  user$ = this.authService.$user;

  version = versions;

  export() {
    this.db.exportDb();
  }


  fileContent: string = '';

  public onChange(event: Event): void {
    const fileList = (event.target as any)?.files ?? [];

    if (fileList.lenght == 0) {
      return;
    }

    let file = fileList[0];
    let fileReader: FileReader = new FileReader();
    let self = this;
    fileReader.onloadend = function(x) {
      self.fileContent = fileReader.result as string;
    }
    fileReader.readAsText(file);

    this.import();
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

  logout() {
    this.router.navigate(['/', 'account', 'login']);
  }

  login() {
    this.authService.signOut();
  }
}
