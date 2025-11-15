import { test, expect } from '@playwright/test';

test.describe('Login Component - Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.describe('Form Validation', () => {
    test('should show validation errors for empty fields', async ({ page }) => {
      await page.click('[data-testid="login-submit"]');

      // Browser native validation will prevent form submission
      // Check that form is still on login page
      await expect(page).toHaveURL('/login');
    });

    test('should validate email format', async ({ page }) => {
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="login-submit"]');

      // Browser native validation will show invalid email message
      await expect(page).toHaveURL('/login');
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
            token: 'mock-jwt-token',
          }),
        });
      });

      await page.click('[data-testid="login-submit"]');

      // Should attempt to submit (no validation errors)
      await expect(page.locator('[data-testid="login-submit"]')).toBeDisabled();
    });
  });

  test.describe('Authentication Flow', () => {
    test('should handle successful login', async ({ page }) => {
      // Mock successful authentication
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: { id: 1, email: 'test@example.com' },
          }),
        });
      });

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'validpassword123');
      await page.click('[data-testid="login-submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/');
    });

    test('should handle login failure', async ({ page }) => {
      // Mock failed authentication
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid credentials',
          }),
        });
      });

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-submit"]');

      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should show loading state during authentication', async ({
      page,
    }) => {
      // Mock slow response
      await page.route('**/api/auth/login', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'validpassword123');
      await page.click('[data-testid="login-submit"]');

      // Check loading state
      await expect(page.locator('[data-testid="login-submit"]')).toBeDisabled();
      await expect(page.locator('text=Logging in...')).toBeVisible();
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
          body: JSON.stringify({ success: true }),
        });
      });

      await page.fill('[data-testid="password-input"]', 'validpassword123');
      await page.click('[data-testid="login-submit"]');

      // Navigate back to login and check if email is remembered
      await page.goto('/login');
      await expect(page.locator('[data-testid="email-input"]')).toHaveValue(
        'test@example.com'
      );
      await expect(
        page.locator('[data-testid="remember-checkbox"]')
      ).toBeChecked();
    });

    test('should not save email when remember me is unchecked', async ({
      page,
    }) => {
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      // Ensure checkbox is unchecked
      await page.uncheck('[data-testid="remember-checkbox"]');

      // Mock successful login
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.fill('[data-testid="password-input"]', 'validpassword123');
      await page.click('[data-testid="login-submit"]');

      // Navigate back to login and check if email is not remembered
      await page.goto('/login');
      await expect(page.locator('[data-testid="email-input"]')).toHaveValue('');
      await expect(
        page.locator('[data-testid="remember-checkbox"]')
      ).not.toBeChecked();
    });
  });

  test.describe('Password Visibility Toggle', () => {
    test('should toggle password visibility', async ({ page }) => {
      await page.fill('[data-testid="password-input"]', 'testpassword');

      // Initially password should be hidden
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toHaveAttribute('type', 'password');

      // Click show password button
      await page.click('[data-testid="toggle-password"]');

      // Password should now be visible
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toHaveAttribute('type', 'text');
      await expect(page.locator('[data-testid="password-input"]')).toHaveValue(
        'testpassword'
      );

      // Click hide password button
      await page.click('[data-testid="toggle-password"]');

      // Password should be hidden again
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Forgot Password Flow', () => {
    test('should open forgot password component', async ({ page }) => {
      await page.click('text=Forgot password?');

      // Should navigate to forgot password component
      await expect(page.locator('text=Reset Password')).toBeVisible();
    });
  });

  test.describe('UI Elements Visibility', () => {
    test('should display all login form elements', async ({ page }) => {
      // Check logo
      await expect(
        page.locator('img[alt="Impact Compendium Logo"]')
      ).toBeVisible();

      // Check title and subtitle
      await expect(page.locator('h1')).toContainText('Log in');
      await expect(
        page.locator('text=Enter your email and password')
      ).toBeVisible();

      // Check form fields
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();

      // Check remember me checkbox
      await expect(
        page.locator('[data-testid="remember-checkbox"]')
      ).toBeVisible();
      await expect(page.locator('text=Remember me')).toBeVisible();

      // Check forgot password link
      await expect(page.locator('text=Forgot password?')).toBeVisible();

      // Check login button
      await expect(page.locator('[data-testid="login-submit"]')).toContainText(
        'Login'
      );

      // Check support footer
      await expect(
        page.locator('text=Need help? Contact PRMS technical support')
      ).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors', async ({ page }) => {
      // Mock network error
      await page.route('**/api/auth/login', async route => {
        await route.abort('failed');
      });

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'validpassword123');
      await page.click('[data-testid="login-submit"]');

      // Should show error message
      await expect(page.locator('.bg-red-50')).toBeVisible();
    });

    test('should handle server errors', async ({ page }) => {
      // Mock server error
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Internal server error',
          }),
        });
      });

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'validpassword123');
      await page.click('[data-testid="login-submit"]');

      await expect(page.locator('text=Internal server error')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(
        page.locator('[data-testid="toggle-password"]')
      ).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(
        page.locator('[data-testid="remember-checkbox"]')
      ).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
        'aria-label',
        'Email address'
      );
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toHaveAttribute('aria-label', 'Password');
      await expect(
        page.locator('[data-testid="remember-checkbox"]')
      ).toHaveAttribute('aria-label', 'Remember me');
    });

    test('should support screen readers', async ({ page }) => {
      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible();

      // Check for form labels
      await expect(
        page.locator('label:has-text("Email address")')
      ).toBeVisible();
      await expect(page.locator('label:has-text("Password")')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Check if all elements are visible and properly sized
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();

      // Check if form is properly centered
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
    });
  });
});
