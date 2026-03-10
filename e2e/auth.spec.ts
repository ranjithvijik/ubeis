import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel(/email/i).fill('invalid@test.com');
        await page.getByLabel(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /sign in/i }).click();

        await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@ubalt.edu');
        await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'TestPassword123!');
        await page.getByRole('button', { name: /sign in/i }).click();

        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.getByText(/executive dashboard/i)).toBeVisible();
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
        await page.goto('/dashboard');

        await expect(page).toHaveURL(/.*login/);
    });
});
