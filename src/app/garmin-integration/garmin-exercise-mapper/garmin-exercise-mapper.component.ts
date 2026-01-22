import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Training, ExerciseExecution, ExerciseSeries } from '../../database.service';
import { GarminActivity, GarminExercise, GarminSet } from '../garmin.service';

interface MappingRow {
  index: number;
  
  // Gymmer Side
  gymmerExerciseName?: string;
  gymmerSeriesIndex?: number;
  gymmerWeight?: number;
  gymmerReps?: number;
  
  // Garmin Side
  garminExerciseName?: string;
  garminSetIndex?: number; // Index within the exercise
  garminWeight?: number;
  garminReps?: number;
  
  isMatch?: boolean; // Do they align?
}

@Component({
  selector: 'app-garmin-exercise-mapper',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './garmin-exercise-mapper.component.html',
  styleUrls: ['./garmin-exercise-mapper.component.scss']
})
export class GarminExerciseMapperComponent implements OnChanges {
  @Input() training: Training | null = null;
  @Input() garminActivity: GarminActivity | null = null;

  mappingRows = signal<MappingRow[]>([]);
  displayedColumns: string[] = ['index', 'gymmer', 'garmin', 'status'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['training'] || changes['garminActivity']) {
      this.computeMapping();
    }
  }

  private computeMapping() {
    if (!this.training || !this.garminActivity) {
      this.mappingRows.set([]);
      return;
    }

    const rows: MappingRow[] = [];

    // Flatten Gymmer Exercises -> Series
    const gymmerFlat: { exName: string, series: ExerciseSeries, seriesIdx: number }[] = [];
    for (const ex of this.training.exercises) {
      if (ex.series) {
        ex.series.forEach((s, i) => {
          gymmerFlat.push({
            exName: ex.name,
            series: s,
            seriesIdx: i + 1
          });
        });
      }
    }

    // Flatten Garmin Activity -> Exercises -> Sets
    const garminFlat: { exName: string, set: GarminSet, setIdx: number }[] = [];
    for (const ex of this.garminActivity.exercises) {
        ex.sets.forEach((s, i) => {
            garminFlat.push({
                exName: ex.name,
                set: s,
                setIdx: i + 1
            });
        });
    }

    // Map by Index (Simple 1-to-1)
    const maxLen = Math.max(gymmerFlat.length, garminFlat.length);

    for (let i = 0; i < maxLen; i++) {
      const gRow = gymmerFlat[i];
      const garRow = garminFlat[i];

      rows.push({
        index: i + 1,
        
        gymmerExerciseName: gRow?.exName,
        gymmerSeriesIndex: gRow?.seriesIdx,
        gymmerWeight: gRow?.series?.weight,
        gymmerReps: gRow?.series?.repetitions,

        garminExerciseName: garRow?.exName,
        garminSetIndex: garRow?.setIdx,
        garminWeight: garRow?.set?.weight,
        garminReps: garRow?.set?.reps,

        // Heuristic Match check: Reps match exactly?
        isMatch: !!(gRow && garRow && gRow.series.repetitions === garRow.set.reps)
      });
    }

    this.mappingRows.set(rows);
  }
}
