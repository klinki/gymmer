import { Injectable } from '@angular/core';
import { Observable, of, delay, from, map } from 'rxjs';
// @ts-ignore
import FitParser from 'fit-file-parser';
import { ulid } from 'ulidx';
import { Decoder, Stream, Profile, Utils } from '@garmin/fitsdk';

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

        this.officialParserParse(buffer);

        const fitParser = new FitParser({
          force: true,
          speedUnit: 'km/h',
          lengthUnit: 'm',
          temperatureUnit: 'celsius',
          elapsedRecordField: true,
          mode: 'list'
        });

        fitParser.parse(buffer, (error: any, data: any) => {
          if (error) {
            observer.error(error);
          } else {
            try {
              const activity = this.mapFitDataToActivity(data);
              observer.next(activity);
              observer.complete();
            } catch (e) {
              observer.error(e);
            }
          }
        });
      };

      reader.onerror = (error) => observer.error(error);
      reader.readAsArrayBuffer(file);
    });
  }

  private officialParserParse(buffer: ArrayBuffer) {
    // TODO: Implement official parsing logic.
    // Decoder requires a Stream object.
    const uintArr = new Uint8Array(buffer);
    const bytes = Array.from(uintArr);

    const stream = Stream.fromByteArray(bytes);
    const decoder = new Decoder(stream);

    console.log("isFIT (static method): " + Decoder.isFIT(stream));
    console.log("isFIT (instance method): " + decoder.isFIT());
    console.log("checkIntegrity: " + decoder.checkIntegrity());

    const { messages, errors } = decoder.read();

    console.log(errors);
    console.log(messages);

    const jsonStr = JSON.stringify(messages, undefined, 2);
    console.log(jsonStr);
  }

  private mapFitDataToActivity(data: any): GarminActivity {
    // Basic extraction logic - this depends on FIT file structure for Strength Training
    // which usually involves 'session', 'lap', and 'set' messages.
    // 'set' messages contain 'weight', 'repetitions', 'start_time', 'category', 'sub_category'

    const session = data.sessions?.[0] || {};
    const startTime = new Date(session.start_time || Date.now());
    const name = 'Imported Activity'; // FIT files often don't have a user-friendly name field unless typed manually

    const setsData = data.set_mesgs || [];

    const exercises: GarminExercise[] = [];

    // Group sets by exercise?
    // In Garmin FIT, sets are just a list. We need to infer exercise groupings if they are contiguous?
    // Or just treat each set as an exercise if we don't know the grouping?
    // Usually, Garmin groups them by 'category' and 'sub_category' (e.g. BENCH_PRESS).

    // Simple grouping strategy: adjacent sets with same category/sub_category are the same exercise.
    let currentExercise: GarminExercise | null = null;
    let lastType = '';

    for (const set of setsData) {
        // 1 = active, 0 = rest? Check 'duration' or 'repetition_count'
        // Only interested in sets with reps > 0 or type = active

        // category + sub_category uniquely identifies the exercise type (e.g. 13 + 2 = Bench Press)
        const type = `${set.category}_${set.sub_category}`;
        const weight = (set.weight || 0) / 1000; // FIT weight is often scaled?
        // Actually fit-file-parser might handle scaling.
        // Standard FIT: weight is in kg * 16? No, usually native units.
        // Let's assume parsed value is correct or verify.
        // fit-file-parser applies scale/offset by default.
        // Weight is in kg.

        const reps = set.repetition_count || 0;

        if (reps === 0) continue; // Skip rest sets

        if (!currentExercise || type !== lastType) {
            if (currentExercise) {
                exercises.push(currentExercise);
            }
            currentExercise = {
                id: ulid(),
                name: this.getExerciseName(set.category, set.sub_category),
                sets: []
            };
            lastType = type;
        }

        currentExercise.sets.push({
            weight: set.weight || 0, // Assuming library handles scaling
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

  private getExerciseName(category: number, subCategory: number): string {
      // This would need a massive lookup table for all Garmin types.
      // For now, return a generic name with IDs so user can identify it.
      // Or map a few common ones.
      return `Exercise (${category}/${subCategory})`;
  }
}
