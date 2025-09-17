import { Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {TrainingSessionService} from "../training-session.service";

@Component({
    selector: 'app-app-navigation',
    templateUrl: './app-navigation.component.html',
    styleUrl: './app-navigation.component.scss',
    standalone: false
})
export class AppNavigationComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private trainingSession = inject(TrainingSessionService);

  currentTraining = this.trainingSession.currentSession;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}
