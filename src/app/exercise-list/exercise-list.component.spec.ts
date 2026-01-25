import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DatabaseService } from '../database.service';

import { ExerciseListComponent } from './exercise-list.component';

describe('ExerciseListComponent', () => {
  let component: ExerciseListComponent;
  let fixture: ComponentFixture<ExerciseListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExerciseListComponent],
      imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatListModule, NoopAnimationsModule, FormsModule],
      providers: [
        {
          provide: DatabaseService,
          useValue: {
            exercises: { toArray: () => Promise.resolve([]) },
            exerciseExecutions: { where: () => ({ equals: () => ({ count: () => Promise.resolve(0) }) }) },
            addExercise: () => Promise.resolve(),
            deleteExercise: () => Promise.resolve(),
            updateExercise: () => Promise.resolve()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
