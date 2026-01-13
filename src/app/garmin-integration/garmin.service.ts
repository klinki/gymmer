import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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
    // In a real app, this would make an API call to Garmin Connect
    return of(true).pipe(delay(1000));
  }
}
