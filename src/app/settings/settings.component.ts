import {Component, inject} from '@angular/core';
import {DatabaseService} from "../database.service";
import {SupabaseAuthService} from "../supabase-auth.service";
import {AsyncPipe, DatePipe} from "@angular/common";
import {versions} from "../../environments/version";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton} from "@angular/material/button";
import {Router} from "@angular/router";
import {BehaviorSubject, filter, skipUntil, take, tap} from "rxjs";

/**
 * Component for application settings and data management.
 *
 * This component provides access to various application settings and data management features including:
 * - Export training data to JSON files for backup
 * - Import training data from JSON files
 * - View application version information
 * - User authentication status and management
 * - Data synchronization controls
 *
 * The component handles file operations for data backup/restore and provides
 * integration with the Supabase authentication system.
 *
 * @route /settings
 */
@Component({
    selector: 'app-settings',
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
    const now = new Date();

    const datePipe = new DatePipe('en');
    const defaultName = `database-${datePipe.transform(now, 'yyyy-MM-dd-HH-mm')}.json`;

    const filename = window.prompt('Enter filename:', defaultName);
    if (filename) {
      this.db.exportDb(filename);
    }
  }

  fileContent$ = new BehaviorSubject<string|null>(null);

  public onChange(event: Event): void {
    this.fileContent$.next(null);

    const fileList = (event.target as any)?.files ?? [];

    if (fileList.lenght == 0) {
      return;
    }

    let file = fileList[0];
    let fileReader: FileReader = new FileReader();
    let self = this;
    fileReader.onloadend = function(x) {
      self.fileContent$.next(fileReader.result as string);
    }
    fileReader.readAsText(file);

    this.import();
  }

  import() {
    this.fileContent$.pipe(
      filter(x => x != null),
      take(1),
      tap(x => console.log(x)),
    ).subscribe(value => this.db.importFromJson(value!));
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
    this.authService.signOut();
  }

  login() {
    this.router.navigate(['/', 'account', 'login']);
  }
}
