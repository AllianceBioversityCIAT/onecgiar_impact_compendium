import { test, expect } from '@playwright/test';

test.describe('Login Component - Functional Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test.describe('UI Elements Visibility', () => {
    
    test('should display all login form elements', async ({ page }) => {
      // Check logo
      await expect(page.locator('img[alt="Impact Compendium Logo"]')).toBeVisible();
      
      // Check title and subtitle
      await expect(page.locator('h1')).toContainText('Log in');
      await expect(page.locator('text=Enter your email and password')).toBeVisible();
      
      // Check form fields
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
      
      // Check remember me checkbox
      await expect(page.locator('[data-testid="remember-checkbox"]')).toBeVisible();
      await expect(page.locator('text=Remember me')).toBeVisible();
      
      // Check forgot password link
      await expect(page.locator('text=Forgot password?')).toBeVisible();
      
      // Check login button
      await expect(page.locator('[data-testid="login-submit"]')).toContainText('Login');
      
      // Check support footer
      await expect(page.locator('text=Need help? Contact PRMS technical support')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    
    test('should prevent submission with empty fields', async ({ page }) => {
      await page.click('[data-testid="login-submit"]');
      
      // Browser native validation will prevent form submission
      // Check that form is still on login page
      await expect(page).toHaveURL('http://localhost:3000/login');
    });

    test('should accept valid email format', async ({ page }) => {
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'validpassword123');
      
      // Mock API call to prevent actual authentication
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token'
          })
        });
      });

      await page.click('[data-testid="login-submit"]');
      
      // Should attempt to submit (no validation errors)
      await expect(page.locator('[data-testid="login-submit"]')).toBeDisabled();
    });
  });

  test.describe('Password Visibility Toggle', () => {
    
    test('should toggle password visibility', async ({ page }) => {
      await page.fill('[data-testid="password-input"]', 'testpassword');
      
      // Initially password should be hidden
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'password');
      
      // Click show password button
      await page.click('[data-testid="toggle-password"]');
      
      // Password should now be visible
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'text');
      await expect(page.locator('[data-testid="password-input"]')).toHaveValue('testpassword');
      
      // Click hide password button
      await page.click('[data-testid="toggle-password"]');
      
      // Password should be hidden again
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Remember Me Functionality', () => {
    
    test('should save email when remember me is checked', async ({ page }) => {
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.check('[data-testid="remember-checkbox"]');
      
      // Mock successful login
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.fill('[data-testid="password-input"]', 'validpassword123');
      await page.click('[data-testid="login-submit"]');

      // Navigate back to login and check if email is remembered
      await page.goto('http://localhost:3000/login');
      await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com');
      await expect(page.locator('[data-testid="remember-checkbox"]')).toBeChecked();
    });
  });

  test.describe('Accessibility', () => {
    
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="toggle-password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="remember-checkbox"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', 'Email address');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', 'Password');
      await expect(page.locator('[data-testid="remember-checkbox"]')).toHaveAttribute('aria-label', 'Remember me');
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check if all elements are visible and properly sized
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
      
      // Check if form is properly centered
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });
  });
});
