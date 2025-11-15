import { test, expect } from '@playwright/test';

test.describe('Study Management', () => {
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

    // Mock studies API
    await page.route('**/api/studies', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            studies: [
              {
                id: 1,
                title: 'Climate Change Impact Study',
                description: 'Analyzing climate change effects on agriculture',
                status: 'draft',
                created_at: '2024-01-01T00:00:00Z',
                doi: 'https://doi.org/10.1000/xyz123',
              },
            ],
            total: 1,
          }),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 2,
            title: 'New Study',
            description: 'A new study',
            status: 'draft',
          }),
        });
      }
    });

    await page.goto('/studies');
  });

  test('should display studies list', async ({ page }) => {
    await expect(
      page.locator('text=Climate Change Impact Study')
    ).toBeVisible();
    await expect(
      page.locator('text=Analyzing climate change effects')
    ).toBeVisible();
    await expect(page.locator('text=draft')).toBeVisible();
  });

  test('should open study creation form', async ({ page }) => {
    await page.click('button:has-text("Add Study")');

    await expect(page.locator('text=Create New Study')).toBeVisible();
    await expect(page.locator('text=Step 1')).toBeVisible();
    await expect(page.locator('text=Basic Information')).toBeVisible();
  });

  test('should validate required fields in study form', async ({ page }) => {
    await page.click('button:has-text("Add Study")');

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');

    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
  });

  test('should validate DOI format', async ({ page }) => {
    await page.click('button:has-text("Add Study")');

    await page.fill('input[placeholder*="title"]', 'Test Study');
    await page.fill('textarea[placeholder*="description"]', 'Test description');
    await page.fill('input[placeholder*="doi"]', 'invalid-doi');

    await page.click('button:has-text("Next")');

    await expect(page.locator('text=Please enter a valid DOI')).toBeVisible();
  });

  test('should accept valid DOI formats', async ({ page }) => {
    await page.click('button:has-text("Add Study")');

    await page.fill('input[placeholder*="title"]', 'Test Study');
    await page.fill('textarea[placeholder*="description"]', 'Test description');

    // Test different valid DOI formats
    const validDOIs = [
      'https://doi.org/10.1000/xyz123',
      'https://cgspace.cgiar.org/handle/10568/12345',
      'https://mel.cgiar.org/reporting/download/hash/abcd1234',
      '10.1000/xyz123',
    ];

    for (const doi of validDOIs) {
      await page.fill('input[placeholder*="doi"]', doi);
      await page.click('button:has-text("Next")');

      // Should proceed to next step
      await expect(page.locator('text=Step 2')).toBeVisible();

      // Go back to test next DOI
      await page.click('button:has-text("Previous")');
    }
  });

  test('should navigate through study creation steps', async ({ page }) => {
    await page.click('button:has-text("Add Study")');

    // Step 1: Basic Information
    await page.fill('input[placeholder*="title"]', 'Multi-step Study');
    await page.fill(
      'textarea[placeholder*="description"]',
      'Testing multi-step form'
    );
    await page.fill(
      'input[placeholder*="doi"]',
      'https://doi.org/10.1000/test123'
    );

    await page.click('button:has-text("Next")');

    // Step 2: Should be visible
    await expect(page.locator('text=Step 2')).toBeVisible();

    // Progress indicator should show current step
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(
      /completed/
    );
    await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/active/);
  });

  test('should save study as draft', async ({ page }) => {
    await page.click('button:has-text("Add Study")');

    await page.fill('input[placeholder*="title"]', 'Draft Study');
    await page.fill(
      'textarea[placeholder*="description"]',
      'This will be saved as draft'
    );

    await page.click('button:has-text("Save as Draft")');

    // Should show success message and redirect
    await expect(page.locator('text=Study saved as draft')).toBeVisible();
    await expect(page).toHaveURL('/studies');
  });

  test('should filter studies by status', async ({ page }) => {
    // Add more mock studies with different statuses
    await page.route('**/api/studies*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          studies: [
            { id: 1, title: 'Draft Study', status: 'draft' },
            { id: 2, title: 'Published Study', status: 'published' },
            { id: 3, title: 'Under Review Study', status: 'under_review' },
          ],
          total: 3,
        }),
      });
    });

    await page.reload();

    // Should show filter options
    await expect(page.locator('select[name="status"]')).toBeVisible();

    // Filter by published
    await page.selectOption('select[name="status"]', 'published');
    await expect(page.locator('text=Published Study')).toBeVisible();
  });

  test('should search studies', async ({ page }) => {
    await page.fill('input[placeholder*="search"]', 'Climate');
    await page.press('input[placeholder*="search"]', 'Enter');

    await expect(
      page.locator('text=Climate Change Impact Study')
    ).toBeVisible();
  });
});
