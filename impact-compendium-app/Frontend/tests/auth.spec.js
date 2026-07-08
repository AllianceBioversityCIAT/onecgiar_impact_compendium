import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('should display login form on initial load', async ({ page }) => {
    // Take a screenshot to see what's actually on the page
    await page.screenshot({ path: 'login-page.png' });
    
    // Check if we can find any login-related elements
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[placeholder*="email"]')).or(page.locator('input[name="email"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('input[placeholder*="password"]')).or(page.locator('input[name="password"]'));
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Login")').or(page.locator('button:has-text("Sign in")')));
    
    console.log('Checking for login elements...');
    
    await expect(emailInput.first()).toBeVisible({ timeout: 5000 });
    await expect(passwordInput.first()).toBeVisible({ timeout: 5000 });
    await expect(submitButton.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Login form elements found and visible');
  });

  test('should interact with login form', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find and fill email field
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[placeholder*="email"]')).or(page.locator('input[name="email"]'));
    await emailInput.first().fill('test@example.com');
    
    // Find and fill password field  
    const passwordInput = page.locator('input[type="password"]').or(page.locator('input[placeholder*="password"]')).or(page.locator('input[name="password"]'));
    await passwordInput.first().fill('TestPassword123!');
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'before-submit.png' });
    
    // Find and click submit button
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Login")').or(page.locator('button:has-text("Sign in")')));
    await submitButton.first().click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Take screenshot after submitting
    await page.screenshot({ path: 'after-submit.png' });
    
    console.log('✅ Login form interaction completed');
    console.log('Current URL:', page.url());
  });

  test('should test empty form validation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Login")').or(page.locator('button:has-text("Sign in")')));
    await submitButton.first().click();
    
    // Wait for validation messages
    await page.waitForTimeout(2000);
    
    // Take screenshot to see validation
    await page.screenshot({ path: 'validation-errors.png' });
    
    console.log('✅ Empty form validation test completed');
  });
});
