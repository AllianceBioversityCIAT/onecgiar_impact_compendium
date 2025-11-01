import { test, expect } from '@playwright/test';

test.describe('Dashboard and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await page.addInitScript(() => {
      localStorage.setItem('ic_access_token', 'mock-token');
      localStorage.setItem('ic_user', JSON.stringify({
        email: 'test@example.com',
        sub: '123',
        groups: ['admin']
      }));
    });

    // Mock API responses
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'test@example.com',
          sub: '123',
          groups: ['admin']
        })
      });
    });

    await page.route('**/api/studies', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          studies: [
            {
              id: 1,
              title: 'Sample Study 1',
              description: 'This is a sample study',
              status: 'draft',
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 2,
              title: 'Sample Study 2',
              description: 'Another sample study',
              status: 'published',
              created_at: '2024-01-02T00:00:00Z'
            }
          ],
          total: 2
        })
      });
    });

    await page.goto('/dashboard');
  });

  test('should display dashboard with header navigation', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check navigation items
    await expect(page.locator('text=Studies')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible(); // Admin user should see settings
    
    // Check user menu
    await page.click('[data-testid="user-menu-button"]');
    await expect(page.locator('text=My Account')).toBeVisible();
    await expect(page.locator('text=Log out')).toBeVisible();
  });

  test('should navigate to studies section', async ({ page }) => {
    await page.click('text=Studies');
    await expect(page).toHaveURL('/studies');
    
    // Should display studies list
    await expect(page.locator('text=Sample Study 1')).toBeVisible();
    await expect(page.locator('text=Sample Study 2')).toBeVisible();
  });

  test('should show add study button for authenticated users', async ({ page }) => {
    await page.goto('/studies');
    await expect(page.locator('button:has-text("Add Study")')).toBeVisible();
  });

  test('should open add study modal', async ({ page }) => {
    await page.goto('/studies');
    await page.click('button:has-text("Add Study")');
    
    // Should open the study creation form
    await expect(page.locator('text=Create New Study')).toBeVisible();
    await expect(page.locator('input[placeholder*="title"]')).toBeVisible();
  });

  test('should navigate to settings for admin users', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page).toHaveURL('/settings');
    
    // Should display user management
    await expect(page.locator('text=User Management')).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    await page.click('[data-testid="user-menu-button"]');
    await page.click('text=Log out');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome to Impact Compendium')).toBeVisible();
  });
});
