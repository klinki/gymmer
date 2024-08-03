import { Pipe, PipeTransform } from '@angular/core';
import '@formatjs/intl-durationformat/polyfill';


@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {

  transform(totalSeconds: number, format: string = 'digital'): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const duration = {
      hours,
      minutes,
      seconds,
    };

    return new Intl.DurationFormat(undefined, { style: format }).format(duration);
  }
}
