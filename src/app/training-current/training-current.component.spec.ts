import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { TrainingCurrentComponent } from './training-current.component';
import { DatabaseService } from '../database.service';
import { TrainingSessionService } from '../training-session.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { Training } from '../models';
import { DurationPipe } from '../duration-pipe.pipe';

describe('TrainingCurrentComponent', () => {
  let component: TrainingCurrentComponent;
  let fixture: ComponentFixture<TrainingCurrentComponent>;
  let saveResult: Subject<Training>;
  let database: { addTraining: jasmine.Spy };
  let session: {
    currentSession: ReturnType<typeof signal<Training|null>>;
    startCurrentTrainingIfNeeded: jasmine.Spy;
    stopTraining: jasmine.Spy;
    clear: jasmine.Spy;
  };
  let router: { navigate: jasmine.Spy };

  const training: Training = {
    id: 'training-1',
    name: 'Training',
    startDate: new Date('2026-08-12T08:00:00.000Z'),
    endDate: null,
    exercises: [],
  };

  beforeEach(waitForAsync(() => {
    saveResult = new Subject<Training>();
    database = {
      addTraining: jasmine.createSpy('addTraining').and.returnValue(saveResult.asObservable()),
    };
    session = {
      currentSession: signal<Training|null>(training),
      startCurrentTrainingIfNeeded: jasmine.createSpy('startCurrentTrainingIfNeeded'),
      stopTraining: jasmine.createSpy('stopTraining'),
      clear: jasmine.createSpy('clear'),
    };
    router = {
      navigate: jasmine.createSpy('navigate'),
    };

    TestBed.configureTestingModule({
      declarations: [TrainingCurrentComponent],
      imports: [
        CommonModule,
        DurationPipe,
        NoopAnimationsModule,
        MatButtonModule,
        MatCardModule,
        MatGridListModule,
        MatIconModule,
        MatMenuModule,
      ],
      providers: [
        { provide: DatabaseService, useValue: database },
        { provide: TrainingSessionService, useValue: session },
        { provide: Router, useValue: router },
        { provide: MatDialog, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrainingCurrentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the active session until the completed training is saved', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.stop();

    expect(database.addTraining).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      id: training.id,
      endDate: jasmine.any(Date),
    }));
    expect(component.saving()).toBeTrue();
    expect(session.stopTraining).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    fixture.detectChanges();
    const stopButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[color="warn"]');
    expect(stopButton.disabled).toBeTrue();
    expect(stopButton.textContent).toContain('SAVING…');

    saveResult.next(training);
    saveResult.complete();

    expect(session.stopTraining).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/']);
    expect(component.saving()).toBeFalse();
  });

  it('preserves the active session when saving fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(console, 'error');

    component.stop();
    saveResult.error(new Error('IndexedDB unavailable'));

    expect(session.currentSession()).toBe(training);
    expect(session.stopTraining).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.saving()).toBeFalse();
    expect(component.saveError()).toBe('Training could not be saved. Please try again.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent)
      .toContain('Training could not be saved. Please try again.');
  });

  it('does not submit the same training twice while saving', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.stop();
    component.stop();

    expect(database.addTraining).toHaveBeenCalledTimes(1);
    expect(window.confirm).toHaveBeenCalledTimes(1);
  });
});
