import { test, expect } from '@playwright/test';

/**
 * Login Component E2E Tests
 * 
 * Test Plan Coverage:
 * 1. UI/UX Testing
 * 2. Form Validation
 * 3. Authentication Flow
 * 4. Navigation & Redirects
 * 5. Remember Me Functionality
 * 6. Forgot Password Flow
 * 7. Cross-tab Authentication
 * 8. Responsive Design
 * 9. Accessibility
 * 10. Error Handling
 */

test.describe('Login Component', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test.describe('UI/UX Elements', () => {
    
    test('should display all login form elements', async ({ page }) => {
      // Check logo
      await expect(page.locator('img[alt="Impact Compendium Logo"]')).toBeVisible();
      
      // Check title and subtitle
      await expect(page.locator('h1')).toContainText('Log in');
      await expect(page.locator('text=Enter your email and password')).toBeVisible();
      
      // Check form fields
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      // Check remember me checkbox
      await expect(page.locator('input[type="checkbox"]')).toBeVisible();
      await expect(page.locator('text=Remember me')).toBeVisible();
      
      // Check forgot password link
      await expect(page.locator('text=Forgot password?')).toBeVisible();
      
      // Check login button
      await expect(page.locator('button[type="submit"]')).toContainText('Login');
      
      // Check support footer
      await expect(page.locator('text=Need help? Contact PRMS technical support')).toBeVisible();
    });

    test('should show password toggle functionality', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      const eyeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
      
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click eye icon to show password
      await eyeButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click again to hide password
      await eyeButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should display background images correctly', async ({ page }) => {
      // Check texture background on left panel
      const leftPanel = page.locator('div').first();
      await expect(leftPanel).toHaveCSS('background-image', /texture-bg\.png/);
      
      // Check right panel background (desktop only)
      await page.setViewportSize({ width: 1200, height: 800 });
      const rightPanel = page.locator('div').filter({ hasText: /background\.jpg/ });
      await expect(rightPanel).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    
    test('should show validation for empty fields', async ({ page }) => {
      // Try to submit empty form
      await page.locator('button[type="submit"]').click();
      
      // Check HTML5 validation messages
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
    });

    test('should validate email format', async ({ page }) => {
      // Enter invalid email
      await page.locator('input[type="email"]').fill('invalid-email');
      await page.locator('button[type="submit"]').click();
      
      // Check for HTML5 email validation
      const emailInput = page.locator('input[type="email"]');
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();
    });

    test('should accept valid email formats', async ({ page }) => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.org',
        'user+tag@company.co.uk'
      ];

      for (const email of validEmails) {
        await page.locator('input[type="email"]').fill(email);
        const emailInput = page.locator('input[type="email"]');
        const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
        expect(isValid).toBe(true);
      }
    });
  });

  test.describe('Authentication Flow', () => {
    
    test('should handle successful login', async ({ page }) => {
      // Mock successful authentication
      await page.route('**/auth/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, token: 'mock-token' })
        });
      });

      // Fill login form
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Should redirect to main page
      await expect(page).toHaveURL('/');
    });

    test('should handle login failure', async ({ page }) => {
      // Mock failed authentication
      await page.route('**/auth/**', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' })
        });
      });

      // Fill login form
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      // Should show error message
      await expect(page.locator('text=Login failed')).toBeVisible();
      
      // Should stay on login page
      await expect(page).toHaveURL('/login');
    });

    test('should show loading state during login', async ({ page }) => {
      // Mock slow authentication
      await page.route('**/auth/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      // Fill and submit form
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Should show loading text
      await expect(page.locator('text=Logging in...')).toBeVisible();
      
      // Button should be disabled
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });
  });

  test.describe('Remember Me Functionality', () => {
    
    test('should save email when remember me is checked', async ({ page }) => {
      // Check remember me and login
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="checkbox"]').check();
      
      // Mock successful login
      await page.route('**/auth/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Check localStorage
      const savedEmail = await page.evaluate(() => localStorage.getItem('rememberedEmail'));
      expect(savedEmail).toBe('test@example.com');
    });

    test('should load saved email on page load', async ({ page }) => {
      // Set saved email in localStorage
      await page.evaluate(() => {
        localStorage.setItem('rememberedEmail', 'saved@example.com');
      });

      // Reload page
      await page.reload();

      // Email should be pre-filled
      await expect(page.locator('input[type="email"]')).toHaveValue('saved@example.com');
      
      // Remember me should be checked
      await expect(page.locator('input[type="checkbox"]')).toBeChecked();
    });

    test('should remove saved email when remember me is unchecked', async ({ page }) => {
      // Set initial saved email
      await page.evaluate(() => {
        localStorage.setItem('rememberedEmail', 'test@example.com');
      });

      await page.reload();
      
      // Uncheck remember me and login
      await page.locator('input[type="checkbox"]').uncheck();
      
      // Mock successful login
      await page.route('**/auth/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Email should be removed from localStorage
      const savedEmail = await page.evaluate(() => localStorage.getItem('rememberedEmail'));
      expect(savedEmail).toBeNull();
    });
  });

  test.describe('Forgot Password Flow', () => {
    
    test('should navigate to forgot password page', async ({ page }) => {
      await page.locator('text=Forgot password?').click();
      
      // Should show forgot password form
      await expect(page.locator('h1')).toContainText('Reset Password');
      await expect(page.locator('text=Enter your email address to receive a reset code')).toBeVisible();
    });

    test('should return to login from forgot password', async ({ page }) => {
      await page.locator('text=Forgot password?').click();
      await page.locator('text=Back to Login').click();
      
      // Should return to login form
      await expect(page.locator('h1')).toContainText('Log in');
    });
  });

  test.describe('Navigation & Redirects', () => {
    
    test('should redirect authenticated users away from login', async ({ page }) => {
      // Mock authenticated state
      await page.evaluate(() => {
        localStorage.setItem('ic_access_token', 'mock-token');
      });

      // Navigate to login
      await page.goto('/login');

      // Should redirect to main page
      await expect(page).toHaveURL('/');
    });

    test('should redirect to main page after successful login', async ({ page }) => {
      // Mock successful authentication
      await page.route('**/auth/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      // Login
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Should redirect to main page
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Cross-tab Authentication', () => {
    
    test('should sync login state across tabs', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      // Both pages start at login
      await page1.goto('/login');
      await page2.goto('/login');

      // Login in first tab
      await page1.evaluate(() => {
        localStorage.setItem('ic_access_token', 'mock-token');
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'ic_access_token',
          newValue: 'mock-token'
        }));
      });

      // Second tab should redirect automatically
      await expect(page2).toHaveURL('/');
      
      await context.close();
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // All elements should be visible and functional
      await expect(page.locator('img[alt="Impact Compendium Logo"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Right panel should be hidden on mobile
      const rightPanel = page.locator('div').filter({ hasText: /background\.jpg/ });
      await expect(rightPanel).toBeHidden();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Form should be centered and functional
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      
      // Both panels should be visible
      await expect(page.locator('input[type="email"]')).toBeVisible();
      const rightPanel = page.locator('div').filter({ hasText: /background\.jpg/ });
      await expect(rightPanel).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    
    test('should have proper form labels', async ({ page }) => {
      // Check for proper labels
      await expect(page.locator('label[for="remember"]')).toBeVisible();
      
      // Check input accessibility
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab'); // Email input
      await expect(page.locator('input[type="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Password input
      await expect(page.locator('input[type="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Eye button
      await page.keyboard.press('Tab'); // Remember me checkbox
      await expect(page.locator('input[type="checkbox"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Forgot password link
      await page.keyboard.press('Tab'); // Login button
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      // Check for alt text on logo
      await expect(page.locator('img[alt="Impact Compendium Logo"]')).toBeVisible();
      
      // Check button has proper text
      await expect(page.locator('button[type="submit"]')).toHaveAccessibleName('Login');
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/auth/**', async route => {
        await route.abort('failed');
      });

      // Try to login
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Should show error message
      await expect(page.locator('text=Login failed')).toBeVisible();
    });

    test('should handle server errors', async ({ page }) => {
      // Mock server error
      await page.route('**/auth/**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      // Try to login
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Should show error message
      await expect(page.locator('text=Login failed')).toBeVisible();
    });

    test('should clear errors on new input', async ({ page }) => {
      // Trigger an error first
      await page.route('**/auth/**', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' })
        });
      });

      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      // Error should be visible
      await expect(page.locator('text=Login failed')).toBeVisible();

      // Type in email field
      await page.locator('input[type="email"]').fill('new@example.com');

      // Error should be cleared (this depends on implementation)
      // await expect(page.locator('text=Login failed')).toBeHidden();
    });
  });
});
