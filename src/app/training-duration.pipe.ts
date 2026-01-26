import {inject, Pipe, PipeTransform} from '@angular/core';
import {Training} from "./database.service";
import {DurationPipe} from "./duration-pipe.pipe";

@Pipe({
  name: 'trainingDuration',
  standalone: true
})
export class TrainingDurationPipe implements PipeTransform {
  durationPipe = inject(DurationPipe);

  transform(training: Training): string {
    const seconds = (training.endDate?.getTime() ?? 0) - (training.startDate?.getTime() ?? 0);
    return this.durationPipe.transform(seconds);
  }

}
