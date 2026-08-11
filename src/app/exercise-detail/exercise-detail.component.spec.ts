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
import { Exercise, ExerciseExecution } from '../models';

describe('ExerciseDetailComponent', () => {
  let component: ExerciseDetailComponent;
  let fixture: ComponentFixture<ExerciseDetailComponent>;
  let database: jasmine.SpyObj<DatabaseService>;
  let session: jasmine.SpyObj<TrainingSessionService>;

  beforeEach(async () => {
    database = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['getExercise', 'getLastExerciseExecution']);
    session = jasmine.createSpyObj<TrainingSessionService>('TrainingSessionService', ['getExercise']);
    database.getExercise.and.returnValue(of(undefined));
    database.getLastExerciseExecution.and.returnValue(of(null));
    session.getExercise.and.returnValue(undefined);

    await TestBed.configureTestingModule({
      declarations: [ExerciseDetailComponent],
      imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatTableModule, NoopAnimationsModule, FormsModule],
      providers: [
        { provide: DatabaseService, useValue: database },
        { provide: TrainingSessionService, useValue: session },
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

  it('prefills weight from the final series of the last execution', () => {
    const exercise: ExerciseExecution = {
      id: 'current-execution',
      exerciseId: 'exercise-1',
      name: 'Exercise one',
      series: [],
    };
    const lastExecution: ExerciseExecution = {
      id: 'previous-execution',
      exerciseId: 'exercise-1',
      name: 'Exercise one',
      series: [
        { weight: 40, repetitions: 10 },
        { weight: 45, repetitions: 8 },
      ],
    };
    session.getExercise.and.returnValue(exercise);
    database.getLastExerciseExecution.and.returnValue(of(lastExecution));

    fixture.componentRef.setInput('id', 'exercise-1');
    fixture.detectChanges();

    expect(component.currentValue.weight).toBe(45);
    expect(component.currentValue.repetitions).toBe(8);
    expect(component.lastExecution).toBe(lastExecution);
  });

  it('keeps the default weight when there is no previous execution', () => {
    const exercise: Exercise = { id: 'exercise-1', name: 'Exercise one' };
    database.getExercise.and.returnValue(of(exercise));
    database.getLastExerciseExecution.and.returnValue(of(null));

    fixture.componentRef.setInput('id', 'exercise-1');
    fixture.detectChanges();

    expect(component.currentValue.weight).toBe(30);
    expect(component.currentValue.repetitions).toBe(10);
  });

  it('keeps the default weight when the final previous series has no weight', () => {
    const exercise: ExerciseExecution = {
      id: 'current-execution',
      exerciseId: 'exercise-1',
      name: 'Exercise one',
      series: [],
    };
    const lastExecution: ExerciseExecution = {
      id: 'previous-execution',
      exerciseId: 'exercise-1',
      name: 'Exercise one',
      series: [
        { weight: 40, repetitions: 10 },
        { repetitions: 8 },
      ],
    };
    session.getExercise.and.returnValue(exercise);
    database.getLastExerciseExecution.and.returnValue(of(lastExecution));

    fixture.componentRef.setInput('id', 'exercise-1');
    fixture.detectChanges();

    expect(component.currentValue.weight).toBe(30);
    expect(component.currentValue.repetitions).toBe(8);
  });

  it('keeps the default repetitions when the final previous series has no repetitions', () => {
    const exercise: ExerciseExecution = {
      id: 'current-execution',
      exerciseId: 'exercise-1',
      name: 'Exercise one',
      series: [],
    };
    const lastExecution: ExerciseExecution = {
      id: 'previous-execution',
      exerciseId: 'exercise-1',
      name: 'Exercise one',
      series: [
        { weight: 40, repetitions: 10 },
        { weight: 45 },
      ],
    };
    session.getExercise.and.returnValue(exercise);
    database.getLastExerciseExecution.and.returnValue(of(lastExecution));

    fixture.componentRef.setInput('id', 'exercise-1');
    fixture.detectChanges();

    expect(component.currentValue.weight).toBe(45);
    expect(component.currentValue.repetitions).toBe(10);
  });
});
