import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { firstValueFrom } from 'rxjs';

import { DatabaseService } from './database.service';
import { ExerciseExecution, Training } from './models';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseService } from './supabase.service';

describe('DatabaseService', () => {
  const databaseName = 'GymmerDB';
  const versionOneSchema = {
    exercises: '$$id',
    trainingPlans: '$$id',
    trainings: '$$id',
    trainingPlanExercises: '[trainingPlanId+exerciseId]',
    exerciseExecutions: '$$id,exerciseId,date'
  };

  beforeEach(async () => {
    await Dexie.delete(databaseName);
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: {} },
        { provide: SupabaseAuthService, useValue: {} },
      ]
    });
  });

  afterEach(async () => {
    const service = TestBed.inject(DatabaseService);
    service.close();
    await Dexie.delete(databaseName);
  });

  it('rebuilds derived executions without changing canonical trainings', async () => {
    const firstDate = new Date('2026-01-01T10:00:00.000Z');
    const secondDate = new Date('2026-02-01T10:00:00.000Z');
    const legacyExecutionDate = '2025-12-31T09:00:00.000Z';
    const legacyTrainings: Training[] = [
      {
        id: 'training-1',
        name: 'First training',
        startDate: firstDate,
        endDate: new Date('2026-01-01T11:00:00.000Z'),
        exercises: [
          {
            id: 'exercise-1',
            exerciseId: 'exercise-1',
            name: 'Exercise one',
            series: [{ weight: 20, repetitions: 10, note: 'first', variant: 'wide' }],
          },
          {
            id: 'unlinked-execution',
            name: 'Unlinked exercise',
            date: legacyExecutionDate as unknown as Date,
            series: [{ weight: 5, repetitions: 12 }],
          },
          {
            id: 'unknown-execution',
            exerciseId: 'deleted-exercise',
            name: 'Deleted exercise',
            series: [{ weight: 7, repetitions: 8 }],
          },
        ],
      },
      {
        id: 'training-2',
        name: 'Second training',
        startDate: secondDate,
        endDate: new Date('2026-02-01T11:00:00.000Z'),
        exercises: [{
          id: 'exercise-1',
          exerciseId: 'exercise-1',
          name: 'Exercise one',
          series: [{ weight: 30, repetitions: 8 }],
        }],
      },
      {
        id: 'training-3',
        name: 'Undated training',
        startDate: null,
        endDate: null,
        exercises: [{
          id: 'exercise-2',
          exerciseId: 'exercise-2',
          name: 'Exercise two',
          series: [{ weight: 15, repetitions: 15 }],
        }],
      },
    ];
    const canonicalBeforeMigration = JSON.stringify(legacyTrainings);

    const legacyDatabase = new Dexie(databaseName);
    legacyDatabase.version(1).stores(versionOneSchema);
    await legacyDatabase.table<Training>('trainings').bulkPut(legacyTrainings);
    legacyDatabase.close();

    const service = TestBed.inject(DatabaseService);
    await service.open();

    const derivedExecutions = await service.exerciseExecutions.toArray();
    const migratedTrainings = await service.trainings.toArray();
    const latestExecution = await firstValueFrom(service.getLastExerciseExecution('exercise-1'));
    const undatedLatest = await firstValueFrom(service.getLastExerciseExecution('exercise-2'));

    expect(service.exerciseExecutions.schema.indexes.some(index => index.name === '[exerciseId+date]')).toBeTrue();
    expect(derivedExecutions.length).toBe(5);
    expect(new Set(derivedExecutions.map(execution => execution.id)).size).toBe(5);
    expect(derivedExecutions.filter(execution => execution.exerciseId === 'exercise-1').map(execution => execution.date))
      .toEqual([firstDate, secondDate]);
    expect(derivedExecutions.find(execution => execution.name === 'Unlinked exercise')?.exerciseId).toBeUndefined();
    expect(derivedExecutions.find(execution => execution.name === 'Unlinked exercise')?.date)
      .toEqual(new Date(legacyExecutionDate));
    expect(derivedExecutions.find(execution => execution.name === 'Deleted exercise')?.exerciseId).toBe('deleted-exercise');
    expect(derivedExecutions.find(execution => execution.exerciseId === 'exercise-2')?.date).toBeUndefined();
    expect(latestExecution?.series).toEqual([{ weight: 30, repetitions: 8 }]);
    expect(undatedLatest).toBeNull();
    expect(JSON.stringify(migratedTrainings)).toBe(canonicalBeforeMigration);
  });

  it('stores future derived executions with unique IDs and the training date', async () => {
    const service = TestBed.inject(DatabaseService);
    const startDate = new Date('2026-03-01T10:00:00.000Z');
    const canonicalExecution: ExerciseExecution = {
      id: 'exercise-1',
      exerciseId: 'exercise-1',
      name: 'Exercise one',
      series: [{ weight: 42, repetitions: 6 }],
    };
    const training: Omit<Training, 'id'> = {
      name: 'New training',
      startDate,
      endDate: new Date('2026-03-01T11:00:00.000Z'),
      exercises: [canonicalExecution],
    };

    await firstValueFrom(service.addTraining(training));

    const derivedExecution = await service.exerciseExecutions.where('exerciseId').equals('exercise-1').first();
    const storedTraining = await service.trainings.toCollection().first();

    expect(derivedExecution?.id).not.toBe(canonicalExecution.id);
    expect(derivedExecution?.date).toEqual(startDate);
    expect(derivedExecution?.series).toEqual(canonicalExecution.series);
    expect(storedTraining?.exercises).toEqual([canonicalExecution]);
    expect(canonicalExecution.date).toBeUndefined();
  });

  it('updates a canonical training and rebuilds its derived execution history', async () => {
    const service = TestBed.inject(DatabaseService);
    const training: Training = {
      id: 'training-1',
      name: 'Training',
      startDate: new Date('2026-03-01T10:00:00.000Z'),
      endDate: new Date('2026-03-01T11:00:00.000Z'),
      exercises: [{
        id: 'canonical-execution-1',
        exerciseId: 'exercise-1',
        name: 'Exercise one',
        series: [{ weight: 42, repetitions: 6 }],
      }],
    };
    await firstValueFrom(service.updateTraining(training));

    const updatedTraining: Training = {
      ...training,
      exercises: [{
        ...training.exercises[0],
        series: [{ weight: 45, repetitions: 5 }],
      }],
    };
    await firstValueFrom(service.updateTraining(updatedTraining));

    const storedTraining = await service.trainings.get(training.id);
    const derivedExecutions = await service.exerciseExecutions
      .where('exerciseId')
      .equals('exercise-1')
      .toArray();

    expect(storedTraining).toEqual(updatedTraining);
    expect(storedTraining?.exercises[0].id).toBe('canonical-execution-1');
    expect(derivedExecutions.length).toBe(1);
    expect(derivedExecutions[0].id).not.toBe('canonical-execution-1');
    expect(derivedExecutions[0].series).toEqual([{ weight: 45, repetitions: 5 }]);
  });

  it('rolls back the canonical update when rebuilding derived history fails', async () => {
    const service = TestBed.inject(DatabaseService);
    const originalTraining: Training = {
      id: 'training-1',
      name: 'Training',
      startDate: new Date('2026-03-01T10:00:00.000Z'),
      endDate: new Date('2026-03-01T11:00:00.000Z'),
      exercises: [{
        id: 'canonical-execution-1',
        exerciseId: 'exercise-1',
        name: 'Exercise one',
        series: [{ weight: 42, repetitions: 6 }],
      }],
    };
    await firstValueFrom(service.updateTraining(originalTraining));
    const originalDerivedExecution = await service.exerciseExecutions
      .where('exerciseId')
      .equals('exercise-1')
      .first();
    spyOn<any>(service, 'createDerivedExerciseExecutions').and.throwError('Cannot rebuild history');

    await expectAsync(firstValueFrom(service.updateTraining({
      ...originalTraining,
      exercises: [{
        ...originalTraining.exercises[0],
        series: [{ weight: 50, repetitions: 3 }],
      }],
    }))).toBeRejectedWithError('Cannot rebuild history');

    expect(await service.trainings.get(originalTraining.id)).toEqual(originalTraining);
    expect(await service.exerciseExecutions.toArray()).toEqual([originalDerivedExecution!]);
  });

  it('imports a backup atomically and rebuilds derived execution history', async () => {
    const service = TestBed.inject(DatabaseService);
    const json = JSON.stringify({
      exercises: [{ id: 'exercise-1', name: 'Exercise one' }],
      trainingPlans: [{ id: 'plan-1', name: 'Plan one', exercises: [] }],
      trainingPlanExercises: [{ trainingPlanId: 'plan-1', exerciseId: 'exercise-1' }],
      trainings: [{
        id: 'training-1',
        name: 'Imported training',
        startDate: '2026-04-01T10:00:00.000Z',
        endDate: '2026-04-01T11:00:00.000Z',
        exercises: [{
          id: 'canonical-execution-1',
          exerciseId: 'exercise-1',
          name: 'Exercise one',
          date: '2026-04-01T10:00:00.000Z',
          series: [{ weight: 50, repetitions: 5 }],
        }],
      }],
    });

    await service.importFromJson(json);

    const training = await service.trainings.get('training-1');
    const derivedExecution = await service.exerciseExecutions
      .where('exerciseId')
      .equals('exercise-1')
      .first();
    expect(await service.exercises.get('exercise-1')).toEqual({ id: 'exercise-1', name: 'Exercise one' });
    expect(await service.trainingPlans.get('plan-1')).toEqual({ id: 'plan-1', name: 'Plan one', exercises: [] });
    expect(await service.trainingPlanExercises.count()).toBe(1);
    expect(training?.startDate).toEqual(new Date('2026-04-01T10:00:00.000Z'));
    expect(training?.exercises[0].id).toBe('canonical-execution-1');
    expect(training?.exercises[0].date).toEqual(new Date('2026-04-01T10:00:00.000Z'));
    expect(derivedExecution?.id).not.toBe('canonical-execution-1');
    expect(derivedExecution?.series).toEqual([{ weight: 50, repetitions: 5 }]);
  });

  it('rolls back every imported table when derived history cannot be rebuilt', async () => {
    const service = TestBed.inject(DatabaseService);
    spyOn<any>(service, 'rebuildDerivedExerciseExecutions').and.throwError('Cannot rebuild history');
    const json = JSON.stringify({
      exercises: [{ id: 'exercise-1', name: 'Exercise one' }],
      trainingPlans: [{ id: 'plan-1', name: 'Plan one', exercises: [] }],
      trainingPlanExercises: [{ trainingPlanId: 'plan-1', exerciseId: 'exercise-1' }],
      trainings: [{
        id: 'training-1',
        name: 'Imported training',
        startDate: '2026-04-01T10:00:00.000Z',
        endDate: '2026-04-01T11:00:00.000Z',
        exercises: [],
      }],
    });

    await expectAsync(service.importFromJson(json)).toBeRejectedWithError('Cannot rebuild history');

    expect(await service.exercises.count()).toBe(0);
    expect(await service.trainingPlans.count()).toBe(0);
    expect(await service.trainingPlanExercises.count()).toBe(0);
    expect(await service.trainings.count()).toBe(0);
    expect(await service.exerciseExecutions.count()).toBe(0);
  });

  it('clears derived executions with the rest of the database', async () => {
    const service = TestBed.inject(DatabaseService);
    await service.exerciseExecutions.add({
      id: 'execution-1',
      exerciseId: 'exercise-1',
      name: 'Exercise one',
      date: new Date(),
      series: [],
    });

    await service.clear();

    expect(await service.exerciseExecutions.count()).toBe(0);
  });
});
