import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TrainingComponent} from "./training/training.component";
import {ExerciseDetailComponent} from "./exercise-detail/exercise-detail.component";
import {ExerciseListComponent} from "./exercise-list/exercise-list.component";
import {TrainingPlansComponent} from "./training-plans/training-plans.component";
import {TrainingCurrentComponent} from "./training-current/training-current.component";
import {TrainingHistoryComponent} from "./training-history/training-history.component";
import {TrainingPlanEditComponent} from "./training-plan-edit/training-plan-edit.component";
import {SynchronizeDataComponent} from "./synchronize-data/synchronize-data.component";
import {GarminIntegrationComponent} from "./garmin-integration/garmin-integration.component";
import {SettingsComponent} from "./settings/settings.component";
import {ExerciseExecutionDetailComponent} from "./exercise-execution-detail/exercise-execution-detail.component";
import {ExerciseHistoryComponent} from "./exercise-history/exercise-history.component";
import {LoginComponent} from "./user/login/login.component";
import {AccountComponent} from "./user/account/account.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: TrainingPlansComponent,
      },
      {
        path: 'training',
        children: [
          {
            path: '',
            component: TrainingCurrentComponent,
          },
          {
            path: 'history',
            component: TrainingHistoryComponent,
          },
          {
            path: ':id',
            children: [
              {
                path: '',
                component: TrainingComponent,
              },
              {
                path: ':exerciseExecutionId',
                component: ExerciseExecutionDetailComponent,
              },
            ],
          }
        ],
      },
      {
        path: 'training-plans',
        children: [
          {
            path: '',
            component: TrainingPlansComponent,
          },
          {
            path: ':id/edit',
            component: TrainingPlanEditComponent,
          },
        ]
      },
      {
        path: 'exercise',
        children: [
          {
            path: ':id',
            children: [
              {
                path: '',
                component: ExerciseDetailComponent,
              },
              {
                path: 'history',
                component: ExerciseHistoryComponent,
              }
            ],
          }
        ],
      },
      {
        path: 'exercise-list',
        component: ExerciseListComponent,
      },
      {
        path: 'synchronize',
        component: SynchronizeDataComponent,
      },
      {
        path: 'garmin-integration',
        component: GarminIntegrationComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: 'account',
        children: [
          {
            path: 'login',
            component: LoginComponent,
          },
          {
            path: 'profile',
            component: AccountComponent,
          }
        ]
      }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    bindToComponentInputs: true,
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
