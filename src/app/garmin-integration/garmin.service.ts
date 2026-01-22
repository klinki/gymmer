import { Injectable } from '@angular/core';
import { Observable, of, delay, from, map } from 'rxjs';
import { ulid } from 'ulidx';
import { Decoder, Stream, Profile, Utils, DecoderReadResult } from '@garmin/fitsdk';

export interface GarminSet {
  weight: number;
  reps: number;
  duration?: number;
}

export interface GarminExercise {
  id: string;
  name: string;
  sets: GarminSet[];
}

export interface GarminActivity {
  id: string;
  name: string;
  startTime: Date;
  exercises: GarminExercise[];
}

/**
 * Service to handle Garmin integration.
 *
 * NOTE: This is a MOCK implementation for the prototype.
 * In a production environment, this service should:
 * 1. Handle OAuth authentication with Garmin Connect.
 * 2. Fetch real activities using Garmin API.
 * 3. Update activity details using Garmin API.
 */
@Injectable({
  providedIn: 'root'
})
export class GarminService {

  constructor() { }

  getActivities(): Observable<GarminActivity[]> {
    // Mock data for prototype
    const activities: GarminActivity[] = [
      {
        id: '1',
        name: 'Gym - Chest Day',
        startTime: new Date(new Date().getTime() - 1000 * 60 * 60 * 24), // Yesterday
        exercises: [
          {
            id: 'g1',
            name: 'Bench Press',
            sets: [
              { weight: 60, reps: 10 },
              { weight: 65, reps: 8 },
              { weight: 70, reps: 6 }
            ]
          },
          {
            id: 'g2',
            name: 'Incline Dumbbell Press',
            sets: [
              { weight: 20, reps: 10 },
              { weight: 22, reps: 8 }
            ]
          },
          {
            id: 'g3',
            name: 'Push Ups',
            sets: [
              { weight: 0, reps: 20 },
              { weight: 0, reps: 15 }
            ]
          }
        ]
      },
      {
        id: '2',
        name: 'Gym - Back Day',
        startTime: new Date(), // Today
        exercises: [
          {
            id: 'g4',
            name: 'Deadlift',
            sets: [
              { weight: 100, reps: 5 },
              { weight: 120, reps: 3 }
            ]
          },
          {
            id: 'g5',
            name: 'Pull Ups',
            sets: [
              { weight: 0, reps: 10 },
              { weight: 0, reps: 8 }
            ]
          }
        ]
      }
    ];
    return of(activities).pipe(delay(500)); // Simulate network latency
  }

  getActivityDetails(id: string): Observable<GarminActivity | undefined> {
    return new Observable(observer => {
      this.getActivities().subscribe(activities => {
        const activity = activities.find(a => a.id === id);
        observer.next(activity);
        observer.complete();
      });
    });
  }

  updateActivityExerciseOrder(activityId: string, newExerciseOrderIds: string[]): Observable<boolean> {
    console.log(`[GarminService] Updating order for activity ${activityId}:`, newExerciseOrderIds);

    // In a real app, this would use the Garmin Connect Activity API.
    // Likely endpoint: PUT https://connect.garmin.com/activity-service/activity/{activityId}
    // Payload would be the full activity JSON with reordered exercises.

    return of(true).pipe(delay(1000));
  }

  parseFitFile(file: File): Observable<GarminActivity> {
    return new Observable<GarminActivity>(observer => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const buffer = event.target?.result;
        if (!buffer || !(buffer instanceof ArrayBuffer)) {
          observer.error('Failed to read file');
          return;
        }

        try {
          const result = this.officialParserParse(buffer);
          const activity = this.mapFitDataToActivity(result);
          observer.next(activity);
          observer.complete();
        } catch (e) {
          observer.error(e);
        }
      };

      reader.onerror = (error) => observer.error(error);
      reader.readAsArrayBuffer(file);
    });
  }

  private officialParserParse(buffer: ArrayBuffer) {
    const uintArr = new Uint8Array(buffer);
    const bytes = Array.from(uintArr);

    const stream = Stream.fromByteArray(bytes);
    const decoder = new Decoder(stream);

    const result = decoder.read({
      expandComponents: true,
      expandSubFields: true,
      convertTypesToStrings: true,
      convertDateTimesToDates: true,
    });

    return result;
  }

  private mapFitDataToActivity(data: DecoderReadResult): GarminActivity {
    const session = data.messages.sessionMesgs?.[0] || {};
    const startTime = session.startTime || new Date();
    const name = `Workout - ${session.sportProfileName || 'Unknown'}`;

    const setsData = data.messages.setMesgs || [];
    const exercises: GarminExercise[] = [];

    let currentExercise: GarminExercise | null = null;
    let lastType = '';

    for (const set of setsData) {
      // Logic for active sets:
      // Garmin SDK might correctly identify 'setType' as 'active' (string) if convertTypesToStrings is true.
      if (set.setType !== 'active') {
          continue;
      }

      // Handling array categories from SDK
      const category = Array.isArray(set.category) ? set.category[0] : set.category;
      const subCategory = Array.isArray(set.categorySubtype) ? set.categorySubtype[0] : set.categorySubtype;
      
      const type = `${category}_${subCategory}`;
      const reps = set.repetitions || 0;

      if (!currentExercise || type !== lastType) {
        if (currentExercise) {
          exercises.push(currentExercise);
        }
        currentExercise = {
          id: ulid(),
          name: this.getExerciseName(category ?? 'Unknown', subCategory ?? undefined),
          sets: []
        };
        lastType = type;
      }

      currentExercise.sets.push({
        weight: set.weight || 0,
        reps: reps,
        duration: set.duration
      });
    }

    if (currentExercise) {
      exercises.push(currentExercise);
    }

    return {
      id: ulid(),
      name: name,
      startTime: startTime,
      exercises: exercises
    };
  }

  private getExerciseName(category: string | number, subCategory?: string | number): string {
    const catStr = category ? category.toString() : 'Unknown';
    const subCatStr = subCategory ? ` / ${subCategory}` : '';
    return `${catStr}${subCatStr}`;
  }

}
