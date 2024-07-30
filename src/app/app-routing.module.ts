import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {TrainingComponent} from "./training/training.component";
import {ExerciseDetailComponent} from "./exercise-detail/exercise-detail.component";
import {ExerciseListComponent} from "./exercise-list/exercise-list.component";
import {TrainingPlansComponent} from "./training-plans/training-plans.component";

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
        path: 'training-plans',
        component: TrainingPlansComponent,
      },
      {
        path: 'exercise',
        component: ExerciseDetailComponent,
      },
      {
        path: 'exercise-list',
        component: ExerciseListComponent,
      }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
