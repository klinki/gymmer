import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { TrainingComponent } from './training.component';
import { DatabaseService } from '../database.service';
import { DurationPipe } from '../duration-pipe.pipe';
import { Exercise, Training } from '../models';

describe('TrainingComponent', () => {
  let component: TrainingComponent;
  let fixture: ComponentFixture<TrainingComponent>;
  let getTraining: jasmine.Spy;
  let updateTraining: jasmine.Spy;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    getTraining = jasmine.createSpy('getTraining');
    updateTraining = jasmine.createSpy('updateTraining').and.callFake(training => of(training));
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    TestBed.configureTestingModule({
      declarations: [TrainingComponent],
      imports: [CommonModule, DurationPipe, MatIconModule, MatListModule],
      providers: [
        {
          provide: DatabaseService,
          useValue: { getTraining, updateTraining }
        },
        { provide: MatDialog, useValue: dialog },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ]
    });
    fixture = TestBed.createComponent(TrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stores the training duration in seconds', () => {
    const startDate = new Date('2026-08-12T10:00:00Z');
    getTraining.and.returnValue(of({
      id: 'training-1',
      name: 'One hour workout',
      startDate,
      endDate: new Date(startDate.getTime() + 60 * 60 * 1000),
      exercises: []
    }));

    fixture.componentRef.setInput('id', 'training-1');
    fixture.detectChanges();

    expect(component.trainingRunningTime()).toBe(3600);
  });

  it('adds selected exercises to the completed training and persists them', () => {
    const training: Training = {
      id: 'training-1',
      name: 'Training',
      startDate: new Date('2026-03-01T10:00:00.000Z'),
      endDate: new Date('2026-03-01T11:00:00.000Z'),
      exercises: [],
    };
    const selectedExercise: Exercise = {
      id: 'exercise-1',
      name: 'Exercise one',
    };
    const setInput = jasmine.createSpy('setInput');
    dialog.open.and.returnValue({
      afterClosed: () => of([selectedExercise]),
      componentRef: { setInput },
    } as any);
    component.training.set(training);

    component.addExercise();

    const savedTraining = updateTraining.calls.mostRecent().args[0];
    expect(savedTraining.exercises.length).toBe(1);
    expect(savedTraining.exercises[0]).toEqual(jasmine.objectContaining({
      exerciseId: selectedExercise.id,
      name: selectedExercise.name,
      series: [],
    }));
    expect(savedTraining.exercises[0].id).not.toBe(selectedExercise.id);
    expect(component.training()).toEqual(savedTraining);
    expect(setInput).toHaveBeenCalledWith('showSelection', true);
  });

  it('does not update a completed training when exercise selection is cancelled', () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(undefined),
      componentRef: { setInput: jasmine.createSpy('setInput') },
    } as any);

    component.addExercise();

    expect(updateTraining).not.toHaveBeenCalled();
  });
});
