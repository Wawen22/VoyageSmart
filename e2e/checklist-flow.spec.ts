import { test, expect } from '@playwright/test';

test.describe('Trip Checklist Flow', () => {
  test.skip(!process.env.E2E_CHECKLIST_TRIP_URL, 'E2E_CHECKLIST_TRIP_URL must be set to run this spec');

  test('opens checklist modal from trip page', async ({ page }) => {
    const tripUrl = process.env.E2E_CHECKLIST_TRIP_URL!;

    await page.goto(tripUrl);

    await expect(page.getByRole('button', { name: /checklist/i })).toBeVisible();

    await page.getByRole('button', { name: /checklist/i }).click();

    await expect(page.getByText(/Trip Checklist/i)).toBeVisible();
    await expect(page.getByPlaceholder('Add a new checklist item...')).toBeVisible();
  });
});
