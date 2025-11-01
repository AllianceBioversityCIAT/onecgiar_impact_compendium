import { test, expect } from '@playwright/test';

test.describe('Study Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ 
        id: 1, 
        email: 'test@example.com', 
        role: 'researcher' 
      }));
    });
  });

  test('should create new study', async ({ page }) => {
    await page.goto('/create-study');
    
    // Mock successful creation
    await page.route('**/api/studies', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: 3, 
            title: 'New Test Study',
            status: 'draft'
          })
        });
      }
    });

    await page.fill('input[name="title"]', 'New Test Study');
    await page.fill('textarea[name="description"]', 'Test study description');
    await page.selectOption('select[name="category"]', 'impact-assessment');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/create-study');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error, .text-red-500')).toBeVisible();
  });

  test('should edit existing study', async ({ page }) => {
    // Mock study data
    await page.route('**/api/studies/1', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: 1, 
            title: 'Existing Study',
            description: 'Existing description',
            status: 'active'
          })
        });
      }
    });

    await page.goto('/studies/1/edit');
    
    await expect(page.locator('input[name="title"]')).toHaveValue('Existing Study');
    
    await page.fill('input[name="title"]', 'Updated Study Title');
    await page.click('button[type="submit"]');
  });

  test('should delete study with confirmation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Mock studies list
    await page.route('**/api/studies', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, title: 'Study to Delete', status: 'draft' }
        ])
      });
    });

    await page.reload();
    await page.click('button:has-text("Delete"), [data-testid="delete-study"]');
    
    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    await expect(page.locator('.study-item')).toHaveCount(0);
  });
});
