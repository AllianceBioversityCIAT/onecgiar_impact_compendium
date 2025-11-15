import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Complete Application Test Suite', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Full application flow - Authentication to Study Creation', async ({
    page,
  }) => {
    // 1. Test login page load
    await page.goto('/');
    await helpers.checkNoConsoleErrors();
    await helpers.takeScreenshot('01-login-page');

    // 2. Mock successful authentication
    await helpers.mockApiResponse('/auth/login', {
      token: 'mock-token',
      user: { id: 1, email: 'test@example.com', role: 'researcher' },
    });

    // 3. Perform login
    await helpers.login();
    await helpers.waitForNavigation(/.*dashboard/);
    await helpers.takeScreenshot('02-dashboard');

    // 4. Mock studies API
    await helpers.mockApiResponse('/api/studies', [
      { id: 1, title: 'Existing Study', status: 'active' },
    ]);

    // 5. Navigate to create study
    await page.click(
      'button:has-text("Create Study"), a:has-text("Create Study")'
    );
    await helpers.waitForNavigation(/.*create-study/);
    await helpers.takeScreenshot('03-create-study-form');

    // 6. Fill and submit study form
    await helpers.mockApiResponse(
      '/api/studies',
      {
        id: 2,
        title: 'New Test Study',
        status: 'draft',
      },
      201
    );

    await helpers.fillStudyForm({
      title: 'New Test Study',
      description: 'Comprehensive test study for validation',
      category: 'impact-assessment',
    });

    await page.click('button[type="submit"]');
    await helpers.waitForNavigation(/.*dashboard/);
    await helpers.takeScreenshot('04-study-created');

    // 7. Verify study appears in list
    await expect(page.locator('text=New Test Study')).toBeVisible();
  });

  test('Cross-browser compatibility check', async ({ page, browserName }) => {
    await page.goto('/');

    // Basic functionality should work across all browsers
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await helpers.takeScreenshot(`browser-${browserName}-compatibility`);
  });

  test('Error handling and recovery', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/**', route => route.abort());

    await page.goto('/');
    await helpers.login();

    // Should show appropriate error message
    await expect(
      page.locator('.error, .text-red-500, [data-testid="error"]')
    ).toBeVisible();

    // Test recovery after network is restored
    await page.unroute('**/api/**');
    await helpers.mockApiResponse('/auth/login', {
      token: 'mock-token',
      user: { id: 1, email: 'test@example.com', role: 'user' },
    });

    await page.reload();
    await helpers.login();
    await helpers.waitForNavigation(/.*dashboard/);
  });
});
