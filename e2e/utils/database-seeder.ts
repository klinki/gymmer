import { Page } from '@playwright/test';
import { generateMockData } from '../data/mock-data';

export async function seedDatabase(page: Page) {
  const data = generateMockData();

  await page.evaluate(async (mockData) => {
    // 1. Restore Dates from JSON strings
    const trainings = mockData.trainings.map((t: any) => ({
        ...t,
        startDate: t.startDate ? new Date(t.startDate) : null,
        endDate: t.endDate ? new Date(t.endDate) : null,
        exercises: t.exercises.map((e: any) => ({
            ...e,
            date: e.date ? new Date(e.date) : null
        }))
    }));

    const exerciseExecutions = mockData.exerciseExecutions.map((e: any) => ({
        ...e,
        date: e.date ? new Date(e.date) : null
    }));

    const dbName = 'GymmerDB';
    const version = 1;

    return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName); // Let it open current version

        request.onerror = (e) => reject('Could not open DB');

        request.onsuccess = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;

            // Check if stores exist (App should have created them)
            const requiredStores = ['exercises', 'trainingPlans', 'trainings', 'exerciseExecutions'];
            const missing = requiredStores.filter(s => !db.objectStoreNames.contains(s));

            if (missing.length > 0) {
                db.close();
                reject(`Missing stores: ${missing.join(', ')}. App might not have initialized DB yet.`);
                return;
            }

            const transaction = db.transaction(requiredStores, 'readwrite');

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
            transaction.onerror = (e) => {
                 // console.error(e);
                 reject('Transaction error: ' + (e.target as any).error);
            }

            const exercisesStore = transaction.objectStore('exercises');
            const plansStore = transaction.objectStore('trainingPlans');
            const trainingsStore = transaction.objectStore('trainings');
            const executionsStore = transaction.objectStore('exerciseExecutions');

            // Clear existing data
            exercisesStore.clear();
            plansStore.clear();
            trainingsStore.clear();
            executionsStore.clear();

            // Insert Mock Data
            mockData.exercises.forEach((item: any) => exercisesStore.put(item));
            mockData.trainingPlans.forEach((item: any) => plansStore.put(item));
            trainings.forEach((item: any) => trainingsStore.put(item));
            exerciseExecutions.forEach((item: any) => executionsStore.put(item));
        };
    });
  }, data);
}
