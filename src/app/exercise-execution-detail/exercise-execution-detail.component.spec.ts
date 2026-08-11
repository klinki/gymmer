import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { of } from 'rxjs';

import { ExerciseExecutionDetailComponent } from './exercise-execution-detail.component';
import { DatabaseService } from '../database.service';
import { ExerciseExecution, Training } from '../models';

describe('ExerciseExecutionDetailComponent', () => {
  let component: ExerciseExecutionDetailComponent;
  let fixture: ComponentFixture<ExerciseExecutionDetailComponent>;
  let database: jasmine.SpyObj<DatabaseService>;

  const execution: ExerciseExecution = {
    id: 'execution-1',
    exerciseId: 'exercise-1',
    name: 'Exercise',
    series: [{ weight: 30, repetitions: 10 }],
  };
  const training: Training = {
    id: 'training-1',
    name: 'Training',
    startDate: new Date('2026-03-01T10:00:00.000Z'),
    endDate: new Date('2026-03-01T11:00:00.000Z'),
    exercises: [execution],
  };

  beforeEach(async () => {
    database = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['getTraining', 'updateTraining']);
    database.getTraining.and.returnValue(of(undefined));
    database.updateTraining.and.callFake(updatedTraining => of(updatedTraining));

    await TestBed.configureTestingModule({
      imports: [ExerciseExecutionDetailComponent],
      providers: [
        { provide: DatabaseService, useValue: database },
        { provide: Location, useValue: { back: jasmine.createSpy('back') } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciseExecutionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('persists a newly added series in the canonical training', () => {
    component.training.set(training);
    component.exercise = execution;
    component.currentValue = { weight: 35, repetitions: 8, note: 'last set' };

    component.add();

    const savedTraining = database.updateTraining.calls.mostRecent().args[0];
    expect(savedTraining.exercises[0].id).toBe(execution.id);
    expect(savedTraining.exercises[0].series).toEqual([
      { weight: 30, repetitions: 10 },
      { weight: 35, repetitions: 8, note: 'last set' },
    ]);
    expect(component.exercise?.series).toEqual(savedTraining.exercises[0].series);
  });

  it('persists a deleted series in the canonical training', () => {
    const secondSeries = { weight: 35, repetitions: 8 };
    const executionWithTwoSeries = {
      ...execution,
      series: [ ...execution.series, secondSeries ],
    };
    component.training.set({ ...training, exercises: [executionWithTwoSeries] });
    component.exercise = executionWithTwoSeries;

    component.deleteSeries(execution.series[0]);

    const savedTraining = database.updateTraining.calls.mostRecent().args[0];
    expect(savedTraining.exercises[0].id).toBe(execution.id);
    expect(savedTraining.exercises[0].series).toEqual([secondSeries]);
    expect(component.exercise?.series).toEqual([secondSeries]);
  });
});
