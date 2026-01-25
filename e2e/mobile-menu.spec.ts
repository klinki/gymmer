import { test, expect, Page } from '@playwright/test';
import { seedDatabase } from './utils/database-seeder';

// Helper for screenshots
async function takeScreenshot(page: Page, name: string) {
    if (process.env.SCREENSHOTS) {
        await page.screenshot({ path: `e2e/screenshots/${name}-${test.info().project.name}.png`, fullPage: true });
    }
}

test.describe('Mobile Menu', () => {
    test.beforeEach(async ({ page }, testInfo) => {
        // Only run on mobile
        if (testInfo.project.name !== 'Mobile') {
            test.skip(true, 'Mobile menu only exists on mobile');
        }

        await page.goto('/');
        await expect(page.locator('app-root')).toBeVisible();
        await seedDatabase(page);
        await page.reload();
        await expect(page.locator('app-root')).toBeVisible();
    });

    test('Menu opens on click and closes on backdrop click', async ({ page }) => {
        // 1. Verify hamburger icon exists
        const menuButton = page.locator('button[aria-label="Toggle sidenav"]');
        await expect(menuButton).toBeVisible();

        // 2. Click it
        await menuButton.click();

        // 3. Verify drawer is open
        const drawer = page.locator('mat-sidenav');
        await expect(drawer).toBeVisible();
        // Angular Material drawer usually has .mat-drawer-opened class when open
        await expect(drawer).toHaveClass(/mat-drawer-opened/);

        // 4. Verify links exist
        await expect(page.getByRole('link', { name: 'Training Plans' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Exercise List' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'History' })).toBeVisible();

        await takeScreenshot(page, 'mobile-menu-open');

        // 5. Click backdrop to close
        // The backdrop is usually .mat-drawer-backdrop (Material 15+) or .cdk-overlay-backdrop
        // Inspecting typical Angular Material Sidenav: .mat-drawer-backdrop.mat-drawer-shown
        const backdrop = page.locator('.mat-drawer-backdrop');
        await expect(backdrop).toBeVisible();
        await backdrop.click();

        // 6. Verify drawer is closed
        await expect(drawer).not.toHaveClass(/mat-drawer-opened/);

        await takeScreenshot(page, 'mobile-menu-closed');
    });
});
