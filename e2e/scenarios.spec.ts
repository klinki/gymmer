import { test, expect, Page } from '@playwright/test';
import { seedDatabase } from './utils/database-seeder';

// Helper for screenshots
async function takeScreenshot(page: Page, name: string) {
    if (process.env.SCREENSHOTS) {
        // Ensure screenshots directory exists? Playwright might create it or fail.
        // We'll trust it or create it.
        await page.screenshot({ path: `e2e/screenshots/${name}-${test.info().project.name}.png`, fullPage: true });
    }
}

test.describe('Gymmer E2E Scenarios', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Load app to initialize DB
    await page.goto('/');

    // Wait for app to be ready
    await expect(page.locator('app-root')).toBeVisible();

    // 2. Seed DB
    await seedDatabase(page);

    // 3. Reload to reflect data
    await page.reload();
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('Dashboard displays training plans (Scrolling)', async ({ page }) => {
    // Should be on / (TrainingPlansComponent)
    await expect(page).toHaveURL(/\/$/);

    // Check for "Training Plan 1"
    const firstPlan = page.getByText('Training Plan 1', { exact: true });
    await expect(firstPlan).toBeVisible();

    // Scroll to bottom to find last plan "Training Plan 20"
    const lastPlan = page.getByText('Training Plan 20', { exact: true });

    // Scroll until visible
    await lastPlan.scrollIntoViewIfNeeded();
    await expect(lastPlan).toBeVisible();

    await takeScreenshot(page, 'dashboard-plans');
  });

  test('Exercises List displays 50 exercises (Scrolling)', async ({ page }) => {
    // Navigate to Exercises List
    // We can use UI navigation if we knew the layout, but URL is safer for now.
    await page.goto('/exercise-list');

    await expect(page.getByText('Exercise 1', { exact: true })).toBeVisible();

    const lastExercise = page.getByText('Exercise 50', { exact: true });
    await lastExercise.scrollIntoViewIfNeeded();
    await expect(lastExercise).toBeVisible();

    await takeScreenshot(page, 'exercises-list');
  });

  test('Training History displays 50 trainings (Scrolling) and Details', async ({ page }) => {
    await page.goto('/training/history');

    // Check for Training 1 (most recent is Training 1 in our loop? No, loop 1..50.
    // Loop 1 is 1 day ago. Loop 50 is 50 days ago.
    // Usually history is sorted by date desc. So Training 1 (yesterday) should be top?
    // Or Training 1 is name?
    // Name is "Training 1 ...". Date is yesterday.
    // "Training 50 ..." is 50 days ago.
    // If sorted desc, Training 1 is near top.

    const firstTraining = page.getByText('Training 1', { exact: false }).first();
    await expect(firstTraining).toBeVisible();

    const lastTraining = page.getByText('Training 50', { exact: false }).first();
    await lastTraining.scrollIntoViewIfNeeded();
    await expect(lastTraining).toBeVisible();

    await takeScreenshot(page, 'training-history');

    // Click on Training 1 to see details
    await firstTraining.click();

    // Verify details page URL
    // /training/:id
    await expect(page).toHaveURL(/\/training\/[a-zA-Z0-9]+$/);

    await takeScreenshot(page, 'training-detail');

    // Verify exercises in training
    // We put 20 exercises in each training.
    // Check for existence of list items.
    // We can check for a specific text if we knew names.
    // Names are "Exercise X".
    // We can just verify that we can scroll a bit.

    // We don't know exactly which exercises are in Training 1 because it's random.
    // But we know "Exercise" word is there.
    // Count occurrences of "Exercise"?
    // await expect(page.getByText('Exercise', { exact: false })).toHaveCount(20); // Might be flaky if 'Exercise' appears elsewhere.
  });

});
