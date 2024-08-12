import {Component, inject} from '@angular/core';
import {DatabaseService} from "../database.service";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private db = inject(DatabaseService);

  export() {
    this.db.exportDb();
  }
}
