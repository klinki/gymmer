import { TestBed } from '@angular/core/testing';
import { TrainingDurationPipe } from './training-duration.pipe';
import { DurationPipe } from './duration-pipe.pipe';

describe('TrainingDurationPipe', () => {
  let pipe: TrainingDurationPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrainingDurationPipe, DurationPipe]
    });

    pipe = TestBed.inject(TrainingDurationPipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('formats the date difference as seconds', () => {
    const startDate = new Date('2026-08-12T10:00:00Z');
    const training = {
      id: 'training-1',
      name: 'One hour workout',
      startDate,
      endDate: new Date(startDate.getTime() + 60 * 60 * 1000),
      exercises: []
    };

    expect(pipe.transform(training)).toBe('1:00:00');
  });
});
