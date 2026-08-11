import { TestBed } from '@angular/core/testing';

import { TrainingSessionService } from './training-session.service';
import { Training } from './models';

describe('TrainingSessionService', () => {
  let service: TrainingSessionService;

  beforeEach(() => {
    localStorage.removeItem('currentSession');
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrainingSessionService);
  });

  afterEach(() => {
    localStorage.removeItem('currentSession');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('persists a draft as soon as training starts', () => {
    const training: Training = {
      id: 'training-1',
      name: 'Training',
      startDate: null,
      endDate: null,
      exercises: [],
    };

    service.startTraining(training);

    expect(JSON.parse(localStorage.getItem('currentSession')!)).toEqual(training);
    expect(new TrainingSessionService().currentSession()).toEqual(training);
  });

  it('starts and persists an unstarted current training', () => {
    const startDate = new Date('2026-08-12T08:00:00.000Z');
    const training: Training = {
      id: 'training-1',
      name: 'Training',
      startDate: null,
      endDate: null,
      exercises: [],
    };
    service.startTraining(training);

    const started = service.startCurrentTrainingIfNeeded(startDate);

    expect(started).toBeTrue();
    expect(service.currentSession()?.startDate).toEqual(startDate);
    expect(JSON.parse(localStorage.getItem('currentSession')!).startDate).toBe(startDate.toISOString());
  });

  it('does not reset an existing training start time', () => {
    const originalStartDate = new Date('2026-08-12T08:00:00.000Z');
    const training: Training = {
      id: 'training-1',
      name: 'Training',
      startDate: originalStartDate,
      endDate: null,
      exercises: [],
    };
    service.startTraining(training);

    const started = service.startCurrentTrainingIfNeeded(new Date('2026-08-12T09:00:00.000Z'));

    expect(started).toBeFalse();
    expect(service.currentSession()?.startDate).toBe(originalStartDate);
  });

  it('does nothing when there is no current training', () => {
    expect(service.startCurrentTrainingIfNeeded()).toBeFalse();
    expect(localStorage.getItem('currentSession')).toBeNull();
  });

  it('removes a discarded training from persistent storage', () => {
    const training: Training = {
      id: 'training-1',
      name: 'Training',
      startDate: null,
      endDate: null,
      exercises: [],
    };
    service.startTraining(training);

    service.clear();

    expect(service.currentSession()).toBeNull();
    expect(localStorage.getItem('currentSession')).toBeNull();
    expect(new TrainingSessionService().currentSession()).toBeNull();
  });
});
