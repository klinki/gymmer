import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DatabaseService } from '../database.service';
import { TrainingSessionService } from '../training-session.service';
import { Location } from '@angular/common';

import { ExerciseDetailComponent } from './exercise-detail.component';
import { of } from 'rxjs';

describe('ExerciseDetailComponent', () => {
  let component: ExerciseDetailComponent;
  let fixture: ComponentFixture<ExerciseDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExerciseDetailComponent],
      imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatTableModule, NoopAnimationsModule, FormsModule],
      providers: [
        { provide: DatabaseService, useValue: { getExercise: () => of(null), getLastExerciseExecution: () => of(null) } },
        { provide: TrainingSessionService, useValue: { getExercise: () => null } },
        { provide: Location, useValue: { back: () => {} } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
