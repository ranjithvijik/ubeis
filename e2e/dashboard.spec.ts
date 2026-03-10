import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@ubalt.edu');
        await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'TestPassword123!');
        await page.getByRole('button', { name: /sign in/i }).click();
        await page.waitForURL(/.*dashboard/);
    });

    test('should display dashboard summary cards', async ({ page }) => {
        await expect(page.getByText(/total kpis/i)).toBeVisible();
        await expect(page.getByText(/on target/i)).toBeVisible();
        await expect(page.getByText(/at risk/i)).toBeVisible();
        await expect(page.getByText(/below target/i)).toBeVisible();
    });

    test('should display KPI cards', async ({ page }) => {
        const kpiCards = page.locator('[data-testid="kpi-card"]');
        await expect(kpiCards.first()).toBeVisible();
    });

    test('should filter KPIs by category', async ({ page }) => {
        // Select enrollment category
        await page.getByRole('combobox', { name: /category/i }).selectOption('enrollment');

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify filtered results
        const kpiCards = page.locator('[data-testid="kpi-card"]');
        const count = await kpiCards.count();

        if (count > 0) {
            await expect(kpiCards.first().getByText(/enrollment/i)).toBeVisible();
        }
    });

    test('should filter KPIs by period', async ({ page }) => {
        await page.getByRole('combobox', { name: /period/i }).selectOption('weekly');

        // Verify filter is applied
        await expect(page.getByRole('combobox', { name: /period/i })).toHaveValue('weekly');
    });

    test('should navigate to KPI detail page', async ({ page }) => {
        const firstKPICard = page.locator('[data-testid="kpi-card"]').first();
        await firstKPICard.click();

        await expect(page).toHaveURL(/.*kpis\/.+/);
    });

    test('should display alerts banner', async ({ page }) => {
        const alertBanner = page.locator('[data-testid="alert-banner"]');

        // Alert banner may or may not be visible depending on data
        if (await alertBanner.isVisible()) {
            await expect(alertBanner).toContainText(/alert/i);
        }
    });

    test('should toggle dark mode', async ({ page }) => {
        const themeToggle = page.getByRole('button', { name: /toggle theme/i });
        await themeToggle.click();

        await expect(page.locator('html')).toHaveClass(/dark/);

        await themeToggle.click();
        await expect(page.locator('html')).not.toHaveClass(/dark/);
    });
});
