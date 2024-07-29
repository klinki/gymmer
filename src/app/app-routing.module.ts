import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {TrainingComponent} from "./training/training.component";
import {ExerciseDetailComponent} from "./exercise-detail/exercise-detail.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: DashboardComponent,
      },
      {
        path: 'training',
        component: TrainingComponent,
      },
      {
        path: 'exercise',
        component: ExerciseDetailComponent,
      }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
