import { test, expect } from '@playwright/test';
import { loginAsAdmin, mockStudiesAPI } from './helpers/auth';

test.describe('End-to-End User Journey', () => {
  test('complete admin workflow: login -> create study -> manage users', async ({ page }) => {
    // Step 1: Login as admin
    await loginAsAdmin(page);
    await mockStudiesAPI(page);
    
    await page.goto('/');
    
    // Should redirect to dashboard for authenticated user
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Step 2: Navigate to studies and create a new study
    await page.click('text=Studies');
    await expect(page).toHaveURL('/studies');
    
    await page.click('button:has-text("Add Study")');
    await expect(page.locator('text=Create New Study')).toBeVisible();

    // Fill out study form
    await page.fill('input[placeholder*="title"]', 'E2E Test Study');
    await page.fill('textarea[placeholder*="description"]', 'This is an end-to-end test study');
    await page.fill('input[placeholder*="doi"]', 'https://doi.org/10.1000/e2e-test');

    // Mock study creation
    await page.route('**/api/studies', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 999,
            title: 'E2E Test Study',
            description: 'This is an end-to-end test study',
            status: 'draft'
          })
        });
      }
    });

    await page.click('button:has-text("Save as Draft")');
    
    // Should show success and redirect
    await expect(page.locator('text=Study saved as draft')).toBeVisible();
    await expect(page).toHaveURL('/studies');

    // Step 3: Navigate to user management
    await page.click('text=Settings');
    await expect(page).toHaveURL('/settings');

    // Mock users API for settings page
    await page.route('**/api/users', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            username: 'admin@example.com',
            email: 'admin@example.com',
            status: 'CONFIRMED',
            groups: ['admin']
          }
        ])
      });
    });

    await page.route('**/api/users/groups', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { GroupName: 'admin', Description: 'Administrator group' },
          { GroupName: 'researchers', Description: 'Researchers group' }
        ])
      });
    });

    await expect(page.locator('text=User Management')).toBeVisible();

    // Step 4: Create a new user
    await page.click('button:has-text("Create User")');
    await page.fill('input[placeholder*="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'TempPass123!');

    // Mock user creation
    await page.route('**/api/users', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            username: 'newuser@example.com',
            email: 'newuser@example.com',
            status: 'FORCE_CHANGE_PASSWORD'
          })
        });
      }
    });

    await page.click('button:has-text("Create User")');
    await expect(page.locator('text=User created successfully')).toBeVisible();

    // Step 5: Logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('text=Log out');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome to Impact Compendium')).toBeVisible();
  });

  test('complete researcher workflow: login -> view studies -> cannot access admin', async ({ page }) => {
    // Login as regular user
    await page.addInitScript(() => {
      localStorage.setItem('ic_access_token', 'mock-user-token');
      localStorage.setItem('ic_user', JSON.stringify({
        email: 'researcher@example.com',
        sub: '456',
        groups: ['researchers']
      }));
    });

    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'researcher@example.com',
          sub: '456',
          groups: ['researchers']
        })
      });
    });

    await mockStudiesAPI(page, [
      {
        id: 1,
        title: 'Research Study',
        description: 'A study for researchers',
        status: 'published'
      }
    ]);

    await page.goto('/dashboard');

    // Should see dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Should NOT see Settings in navigation (non-admin)
    await expect(page.locator('text=Settings')).not.toBeVisible();

    // Can view studies
    await page.click('text=Studies');
    await expect(page.locator('text=Research Study')).toBeVisible();

    // Cannot access settings directly
    await page.goto('/settings');
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('handles network failures gracefully', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Mock network failure
    await page.route('**/api/studies', async route => {
      await route.abort('failed');
    });

    await page.goto('/studies');
    
    // Should show error state
    await expect(page.locator('text=Failed to load studies')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // Test retry functionality
    await mockStudiesAPI(page, [{ id: 1, title: 'Recovered Study', status: 'draft' }]);
    await page.click('button:has-text("Retry")');
    
    await expect(page.locator('text=Recovered Study')).toBeVisible();
  });
});
