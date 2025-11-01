import { test, expect } from '@playwright/test';

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      localStorage.setItem('ic_access_token', 'mock-admin-token');
      localStorage.setItem('ic_user', JSON.stringify({
        email: 'admin@example.com',
        sub: '123',
        groups: ['admin']
      }));
    });

    // Mock users API
    await page.route('**/api/users', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              username: 'user1@example.com',
              email: 'user1@example.com',
              status: 'CONFIRMED',
              created: '2024-01-01T00:00:00Z',
              groups: ['researchers']
            },
            {
              username: 'admin@example.com',
              email: 'admin@example.com',
              status: 'CONFIRMED',
              created: '2024-01-01T00:00:00Z',
              groups: ['admin']
            }
          ])
        });
      } else if (route.request().method() === 'POST') {
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

    // Mock groups API
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

    await page.goto('/settings');
  });

  test('should display user management interface for admin', async ({ page }) => {
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Create User')).toBeVisible();
    
    // Should show users table
    await expect(page.locator('text=user1@example.com')).toBeVisible();
    await expect(page.locator('text=admin@example.com')).toBeVisible();
  });

  test('should open create user modal', async ({ page }) => {
    await page.click('button:has-text("Create User")');
    
    await expect(page.locator('text=Create New User')).toBeVisible();
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should validate user creation form', async ({ page }) => {
    await page.click('button:has-text("Create User")');
    
    // Try to submit without filling fields
    await page.click('button:has-text("Create User")');
    
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should validate email format in user creation', async ({ page }) => {
    await page.click('button:has-text("Create User")');
    
    await page.fill('input[placeholder*="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'TempPass123!');
    
    await page.click('button:has-text("Create User")');
    
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should create new user successfully', async ({ page }) => {
    await page.click('button:has-text("Create User")');
    
    await page.fill('input[placeholder*="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'TempPass123!');
    
    await page.click('button:has-text("Create User")');
    
    // Should show success message
    await expect(page.locator('text=User created successfully')).toBeVisible();
    
    // Modal should close
    await expect(page.locator('text=Create New User')).not.toBeVisible();
  });

  test('should display user status correctly', async ({ page }) => {
    // Check status badges
    await expect(page.locator('text=CONFIRMED')).toBeVisible();
    
    // Check group assignments
    await expect(page.locator('text=admin')).toBeVisible();
    await expect(page.locator('text=researchers')).toBeVisible();
  });

  test('should filter users by status', async ({ page }) => {
    // Should have status filter dropdown
    await expect(page.locator('select[name="status"]')).toBeVisible();
    
    await page.selectOption('select[name="status"]', 'CONFIRMED');
    
    // Should filter results
    await expect(page.locator('text=user1@example.com')).toBeVisible();
  });

  test('should search users', async ({ page }) => {
    await page.fill('input[placeholder*="search"]', 'user1');
    
    await expect(page.locator('text=user1@example.com')).toBeVisible();
    await expect(page.locator('text=admin@example.com')).not.toBeVisible();
  });

  test('should show user actions menu', async ({ page }) => {
    // Click on user actions button
    await page.click('[data-testid="user-actions-user1@example.com"]');
    
    await expect(page.locator('text=Edit User')).toBeVisible();
    await expect(page.locator('text=Reset Password')).toBeVisible();
    await expect(page.locator('text=Disable User')).toBeVisible();
  });

  test('should handle user editing', async ({ page }) => {
    await page.click('[data-testid="user-actions-user1@example.com"]');
    await page.click('text=Edit User');
    
    await expect(page.locator('text=Edit User')).toBeVisible();
    await expect(page.locator('input[value="user1@example.com"]')).toBeVisible();
  });

  test('should not show settings for non-admin users', async ({ page }) => {
    // Mock non-admin user
    await page.addInitScript(() => {
      localStorage.setItem('ic_user', JSON.stringify({
        email: 'user@example.com',
        sub: '456',
        groups: ['researchers']
      }));
    });

    await page.goto('/dashboard');
    
    // Settings should not be visible in navigation
    await expect(page.locator('text=Settings')).not.toBeVisible();
    
    // Direct navigation to settings should be blocked
    await page.goto('/settings');
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('should handle password reset', async ({ page }) => {
    await page.route('**/api/users/*/reset-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password reset successfully' })
      });
    });

    await page.click('[data-testid="user-actions-user1@example.com"]');
    await page.click('text=Reset Password');
    
    await expect(page.locator('text=Confirm Password Reset')).toBeVisible();
    await page.click('button:has-text("Reset Password")');
    
    await expect(page.locator('text=Password reset successfully')).toBeVisible();
  });
});
