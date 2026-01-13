import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { DatabaseService, Training, ExerciseExecution } from '../database.service';
import { GarminService, GarminActivity, GarminExercise } from './garmin.service';
import { firstValueFrom } from 'rxjs';

interface ExerciseMatch {
  gymmerExercise: ExerciseExecution;
  garminExercise: GarminExercise | null;
  selected: boolean;
}

@Component({
  selector: 'app-garmin-integration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatCheckboxModule
  ],
  templateUrl: './garmin-integration.component.html',
  styleUrls: ['./garmin-integration.component.scss']
})
export class GarminIntegrationComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);
  private db = inject(DatabaseService);
  private garminService = inject(GarminService);

  trainings = signal<Training[]>([]);
  garminActivities = signal<GarminActivity[]>([]);

  selectedTraining = signal<Training | null>(null);
  selectedGarminActivity = signal<GarminActivity | null>(null);

  matches = signal<ExerciseMatch[]>([]);

  selectionFormGroup = this._formBuilder.group({
    trainingCtrl: ['', Validators.required],
    garminCtrl: ['', Validators.required],
  });

  constructor() {}

  async ngOnInit() {
    // Load Gymmer trainings
    const trainings = await this.db.trainings.orderBy('startDate').reverse().limit(10).toArray();
    this.trainings.set(trainings);

    // Load Garmin activities
    const activities = await firstValueFrom(this.garminService.getActivities());
    this.garminActivities.set(activities);
  }

  onStep1Next() {
    const trainingId = this.selectionFormGroup.get('trainingCtrl')?.value;
    const garminId = this.selectionFormGroup.get('garminCtrl')?.value;

    const training = this.trainings().find(t => t.id === trainingId) || null;
    const garminActivity = this.garminActivities().find(a => a.id === garminId) || null;

    this.selectedTraining.set(training);
    this.selectedGarminActivity.set(garminActivity);

    if (training && garminActivity) {
      this.matchExercises(training, garminActivity);
    }
  }

  matchExercises(training: Training, garminActivity: GarminActivity) {
    const matches: ExerciseMatch[] = [];
    const usedGarminIds = new Set<string>();

    // Strategy: Match by name (case-insensitive)
    for (const gymmerEx of training.exercises) {
      // Find best match in Garmin
      // Simple normalized name matching
      const gymmerName = gymmerEx.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      const garminMatch = garminActivity.exercises.find(gEx => {
        if (usedGarminIds.has(gEx.id)) return false;
        const garminName = gEx.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return garminName.includes(gymmerName) || gymmerName.includes(garminName);
      });

      if (garminMatch) {
        usedGarminIds.add(garminMatch.id);
      }

      matches.push({
        gymmerExercise: gymmerEx,
        garminExercise: garminMatch || null,
        selected: true // Default to selected
      });
    }

    this.matches.set(matches);
  }

  async executeMerge() {
    const training = this.selectedTraining();
    const garminActivity = this.selectedGarminActivity();
    const currentMatches = this.matches();

    if (!training || !garminActivity) return;

    // 1. Update Gymmer Data (Sets & Weights)
    let gymmerUpdated = false;
    const updatedExercises = training.exercises.map(ex => {
        const match = currentMatches.find(m => m.gymmerExercise.id === ex.id);
        if (match && match.selected && match.garminExercise) {
            // Overwrite series
            gymmerUpdated = true;
            return {
                ...ex,
                series: match.garminExercise.sets.map(s => ({
                    weight: s.weight,
                    repetitions: s.reps,
                    // Preserve other fields if needed, or default
                }))
            };
        }
        return ex;
    });

    if (gymmerUpdated) {
        const updatedTraining = { ...training, exercises: updatedExercises };
        // Using updateTraining to ensure we update the existing record
        await firstValueFrom(this.db.updateTraining(updatedTraining));
        console.log('Gymmer training updated');
    }

    // 2. Update Garmin Data (Order)
    // We want Garmin exercises to follow Gymmer order.
    // We construct a list of Garmin Exercise IDs in the order of Gymmer exercises.
    const newOrderIds: string[] = [];

    // First, add the matched ones in Gymmer order
    for (const match of currentMatches) {
        if (match.selected && match.garminExercise) {
            newOrderIds.push(match.garminExercise.id);
        }
    }

    // Then append any unmatched Garmin exercises (at the end)
    for (const gEx of garminActivity.exercises) {
        if (!newOrderIds.includes(gEx.id)) {
            newOrderIds.push(gEx.id);
        }
    }

    await firstValueFrom(this.garminService.updateActivityExerciseOrder(garminActivity.id, newOrderIds));
    console.log('Garmin activity order updated');
  }
}
