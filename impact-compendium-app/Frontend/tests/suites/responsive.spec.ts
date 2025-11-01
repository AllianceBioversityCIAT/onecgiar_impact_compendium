import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 }
];

test.describe('Responsive Design', () => {
  viewports.forEach(({ name, width, height }) => {
    test(`should display correctly on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      // Take screenshot for visual comparison
      await page.screenshot({ 
        path: `test-results/screenshots/${name.toLowerCase()}-login.png`,
        fullPage: true 
      });
      
      // Check basic layout elements
      await expect(page.locator('form')).toBeVisible();
      
      if (width < 768) {
        // Mobile-specific checks
        await expect(page.locator('.mobile-menu, [data-testid="mobile-menu"]')).toBeVisible();
      } else {
        // Desktop/Tablet checks
        await expect(page.locator('nav')).toBeVisible();
      }
    });
  });

  test('should handle navigation menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-token');
    });
    
    await page.goto('/dashboard');
    
    // Check if mobile menu toggle exists
    const menuToggle = page.locator('.menu-toggle, [data-testid="menu-toggle"]');
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await expect(page.locator('.mobile-menu, [data-testid="mobile-menu"]')).toBeVisible();
    }
  });

  test('should maintain functionality across viewports', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Test form interaction
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com');
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    }
  });
});
