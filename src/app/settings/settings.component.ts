import {Component, inject, signal} from '@angular/core';
import {DatabaseService} from "../database.service";
import {SupabaseAuthService} from "../supabase-auth.service";
import {AsyncPipe, DatePipe} from "@angular/common";
import {versions} from "../../environments/version";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton} from "@angular/material/button";
import {Router} from "@angular/router";
import {MatProgressBar} from "@angular/material/progress-bar";

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
    imports: [AsyncPipe, MatCard, MatCardTitle, MatCardHeader, MatCardActions, MatButton, MatCardContent, MatProgressBar],
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

  importing = signal(false);
  importStatus = signal<string|null>(null);
  importError = signal<string|null>(null);

  public async onChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file == null) {
      return;
    }

    this.importing.set(true);
    this.importStatus.set(null);
    this.importError.set(null);

    try {
      const json = await file.text();
      await this.db.importFromJson(json);
      this.importStatus.set('Import completed successfully.');
    } catch (error) {
      console.error('Database import failed', error);
      this.importError.set('Import failed. No database changes were saved.');
    } finally {
      this.importing.set(false);
      input.value = '';
    }
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
