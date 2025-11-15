import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          email: 'test@example.com',
          role: 'user',
        })
      );
    });

    await page.goto('/dashboard');
  });

  test('should display dashboard header and navigation', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h1, .dashboard-title')).toBeVisible();
  });

  test('should show studies list', async ({ page }) => {
    // Mock studies API response
    await page.route('**/api/studies', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, title: 'Test Study 1', status: 'active' },
          { id: 2, title: 'Test Study 2', status: 'draft' },
        ]),
      });
    });

    await page.reload();
    await expect(
      page.locator('.study-item, [data-testid="study-item"]')
    ).toHaveCount(2);
  });

  test('should navigate to create study page', async ({ page }) => {
    await page.click(
      'button:has-text("Create Study"), a:has-text("Create Study")'
    );
    await expect(page).toHaveURL(/.*create-study/);
  });

  test('should handle logout functionality', async ({ page }) => {
    await page.click('button:has-text("Logout"), [data-testid="logout"]');
    await expect(page).toHaveURL(/.*login/);
  });
});
