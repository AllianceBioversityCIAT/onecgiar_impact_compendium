import { test, expect } from '@playwright/test';

test.describe('Responsive Design and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('ic_access_token', 'mock-token');
      localStorage.setItem(
        'ic_user',
        JSON.stringify({
          email: 'test@example.com',
          sub: '123',
          groups: ['admin'],
        })
      );
    });

    await page.route('**/api/studies', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ studies: [], total: 0 }),
      });
    });
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/dashboard');

    // Header should be responsive
    await expect(page.locator('header')).toBeVisible();

    // Navigation should adapt to mobile
    await expect(
      page.locator('[data-testid="mobile-menu-button"]')
    ).toBeVisible();

    // Content should not overflow
    const body = page.locator('body');
    const boundingBox = await body.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('should be responsive on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/dashboard');

    // Should show desktop-like layout on tablet
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Studies')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for ARIA labels on interactive elements
    await expect(page.locator('[aria-label="User menu"]')).toBeVisible();
    await expect(page.locator('[aria-label="Main navigation"]')).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard');

    // Check that text is readable (this is a basic check)
    const textElements = page.locator('text=Studies');
    await expect(textElements).toBeVisible();

    // In a real scenario, you'd use axe-core for comprehensive accessibility testing
  });

  test('should handle form validation visually', async ({ page }) => {
    await page.goto('/');

    await page.click('button[type="submit"]');

    // Error messages should be visible and associated with inputs
    const emailError = page.locator('text=Email is required');
    await expect(emailError).toBeVisible();

    // Error styling should be applied
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveClass(/error|invalid/);
  });

  test('should show loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/studies', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ studies: [], total: 0 }),
      });
    });

    await page.goto('/studies');

    // Should show loading indicator
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });

  test('should handle empty states gracefully', async ({ page }) => {
    await page.route('**/api/studies', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ studies: [], total: 0 }),
      });
    });

    await page.goto('/studies');

    // Should show empty state message
    await expect(page.locator('text=No studies found')).toBeVisible();
    await expect(page.locator('text=Create your first study')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/studies', async route => {
      await route.abort('failed');
    });

    await page.goto('/studies');

    // Should show error message
    await expect(page.locator('text=Failed to load studies')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});
