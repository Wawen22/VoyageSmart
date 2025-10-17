
import { test, expect } from '@playwright/test';

test.describe('Journal Flow', () => {
  test('should navigate to the journal page from trip actions', async ({ page }) => {
    // Navigate to a trip page
    await page.goto('/trips/trip-123');

    // Find the "Travel Journal" link in the trip actions and click it
    const journalLink = page.locator('a:has-text("Travel Journal")');
    await journalLink.click();

    // Verify the URL
    await expect(page).toHaveURL('/trips/trip-123/journal');

    // Verify the title
    const title = page.locator('h1:has-text("Travel Journal")');
    await expect(title).toBeVisible();
  });
});
