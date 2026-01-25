import { TestBed } from '@angular/core/testing';
import { TrainingDurationPipe } from './training-duration.pipe';
import { DurationPipe } from './duration-pipe.pipe';

describe('TrainingDurationPipe', () => {
  it('create an instance', () => {
    TestBed.configureTestingModule({
      providers: [TrainingDurationPipe, DurationPipe]
    });
    const pipe = TestBed.inject(TrainingDurationPipe);
    expect(pipe).toBeTruthy();
  });
});
