import {Component, NgZone} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Location} from "@angular/common";
import {versions} from "../environments/version";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    host: {
        'build-version': versions.version,
        'build-date': versions.date,
        'build-branch': versions.branch,
        'build-commit': versions.commitHash,
    },
    standalone: false
})
export class AppComponent {
  title = 'gymmer';

  constructor(
    private zone: NgZone,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location
  ) {
  }
}
