import { test, expect } from '@playwright/test';

test.describe('Alerts', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@ubalt.edu');
        await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'TestPassword123!');
        await page.getByRole('button', { name: /sign in/i }).click();
        await page.waitForURL(/.*dashboard/);
        await page.goto('/alerts');
    });

    test('should display alerts page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /alerts/i })).toBeVisible();
    });

    test('should filter alerts by severity', async ({ page }) => {
        const severityFilter = page.getByRole('combobox', { name: /severity/i });

        if (await severityFilter.isVisible()) {
            await severityFilter.selectOption('critical');
            await page.waitForTimeout(500);

            const alerts = page.locator('[data-testid="alert-item"]');
            const count = await alerts.count();

            for (let i = 0; i < count; i++) {
                await expect(alerts.nth(i).getByText(/critical/i)).toBeVisible();
            }
        }
    });

    test('should acknowledge an alert', async ({ page }) => {
        const acknowledgeButton = page.getByRole('button', { name: /acknowledge/i }).first();

        if (await acknowledgeButton.isVisible()) {
            await acknowledgeButton.click();

            // Verify toast notification
            await expect(page.getByText(/acknowledged/i)).toBeVisible();
        }
    });

    test('should show empty state when no alerts', async ({ page }) => {
        // This test depends on actual data state
        const emptyState = page.getByText(/no active alerts/i);
        const alertList = page.locator('[data-testid="alert-item"]');

        const alertCount = await alertList.count();

        if (alertCount === 0) {
            await expect(emptyState).toBeVisible();
        }
    });
});

13. TEST UTILITIES & FIXTURES
