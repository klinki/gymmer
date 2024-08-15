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
}
