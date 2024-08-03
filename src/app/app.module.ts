import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ExerciseListComponent } from './exercise-list/exercise-list.component';
import { ExerciseDetailComponent } from './exercise-detail/exercise-detail.component';
import { TrainingComponent } from './training/training.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppNavigationComponent } from './app-navigation/app-navigation.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import {MatFormField, MatLabel, MatPrefix, MatSuffix} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from "@angular/material/table";
import {FormsModule} from "@angular/forms";
import { TrainingPlansComponent } from './training-plans/training-plans.component';
import { ExerciseHistoryComponent } from './exercise-history/exercise-history.component';
import {DurationPipe} from "./duration-pipe.pipe";
import { TrainingCurrentComponent } from './training-current/training-current.component';
import { TrainingHistoryComponent } from './training-history/training-history.component';
import {TrainingDurationPipe} from "./training-duration.pipe";

@NgModule({
  declarations: [
    AppComponent,
    ExerciseListComponent,
    ExerciseDetailComponent,
    TrainingComponent,
    AppNavigationComponent,
    DashboardComponent,
    TrainingPlansComponent,
    ExerciseHistoryComponent,
    TrainingCurrentComponent,
    TrainingHistoryComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatFormField,
    MatSuffix,
    MatPrefix,
    MatInput,
    MatLabel,
    MatCellDef,
    MatCell,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatRow,
    MatRowDef,
    MatHeaderRowDef,
    MatHeaderCellDef,
    FormsModule,
    DurationPipe,
    TrainingDurationPipe,
  ],
  providers: [
    provideAnimationsAsync(),
    DurationPipe,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
