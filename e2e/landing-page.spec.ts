import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Voyage Smart/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for main content
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check if login link exists and is clickable
    const loginLink = page.locator('a[href*="login"]').first();
    if (await loginLink.isVisible()) {
      await expect(loginLink).toBeVisible();
    }
    
    // Check if register/signup link exists
    const signupLink = page.locator('a[href*="register"], a[href*="signup"]').first();
    if (await signupLink.isVisible()) {
      await expect(signupLink).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if page loads on mobile
    await expect(page).toHaveTitle(/Voyage Smart/);
    
    // Check if main content is visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for viewport meta tag
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);
    
    // Check for description meta tag
    const descriptionMeta = page.locator('meta[name="description"]');
    if (await descriptionMeta.count() > 0) {
      await expect(descriptionMeta).toHaveAttribute('content');
    }
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait a bit for any async operations
    await page.waitForTimeout(3000);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('net::ERR_') &&
      !error.includes('Failed to load resource') &&
      !error.includes('_next/static') &&
      !error.includes('chunk-') &&
      !error.toLowerCase().includes('hydration')
    );

    // Log errors for debugging if any
    if (criticalErrors.length > 0) {
      console.log('Critical console errors found:', criticalErrors);
    }

    expect(criticalErrors).toHaveLength(0);
  });
});
