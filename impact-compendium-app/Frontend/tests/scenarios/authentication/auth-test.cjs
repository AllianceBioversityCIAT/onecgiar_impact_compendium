const { chromium } = require('playwright');

class AuthenticationTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'https://dt3m7tyug8c1q.cloudfront.net';
  }

  async setup() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
  }

  async teardown() {
    if (this.browser) await this.browser.close();
  }

  async runAllTests() {
    console.log('🔐 Authentication Test Suite');
    console.log('============================');
    
    await this.setup();
    
    try {
      await this.testLoginFormElements();
      await this.testFormValidation();
      await this.testAuthenticationFlow();
      await this.testUIElements();
      await this.testResponsiveAuth();
      
      console.log('\n✅ All authentication tests completed!');
    } catch (error) {
      console.error('❌ Authentication test failed:', error.message);
      await this.page.screenshot({ path: 'test-results/screenshots/auth-error.png' });
    } finally {
      await this.teardown();
    }
  }

  async testLoginFormElements() {
    console.log('\n📝 TC-AUTH-001: Testing Login Form Elements');
    
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState('networkidle');
    
    // Test form presence
    const form = await this.page.locator('form').isVisible();
    console.log(`  Form present: ${form ? '✅' : '❌'}`);
    
    // Test input fields
    const emailInput = await this.page.locator('input[type="email"]').isVisible();
    const passwordInput = await this.page.locator('input[type="password"]').isVisible();
    const submitButton = await this.page.locator('button[type="submit"]').isVisible();
    
    console.log(`  Email input: ${emailInput ? '✅' : '❌'}`);
    console.log(`  Password input: ${passwordInput ? '✅' : '❌'}`);
    console.log(`  Submit button: ${submitButton ? '✅' : '❌'}`);
    
    // Test input attributes
    const emailPlaceholder = await this.page.locator('input[type="email"]').getAttribute('placeholder');
    const passwordPlaceholder = await this.page.locator('input[type="password"]').getAttribute('placeholder');
    
    console.log(`  Email placeholder: ${emailPlaceholder || 'None'}`);
    console.log(`  Password placeholder: ${passwordPlaceholder || 'None'}`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/auth-form-elements.png' });
  }

  async testFormValidation() {
    console.log('\n⚠️  TC-AUTH-002-004: Testing Form Validation');
    
    // Test empty form submission
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(1000);
    
    const errorElements = await this.page.locator('.error, .text-red-500, [class*="error"], .invalid').count();
    console.log(`  Empty form validation: ${errorElements > 0 ? '✅' : '❌'} (${errorElements} errors)`);
    
    // Test invalid email format
    await this.page.fill('input[type="email"]', 'invalid-email');
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(1000);
    
    const emailErrors = await this.page.locator('.error, .text-red-500, [class*="error"]').count();
    console.log(`  Invalid email validation: ${emailErrors > 0 ? '✅' : '❌'}`);
    
    // Test valid email format
    await this.page.fill('input[type="email"]', 'test@example.com');
    const emailValue = await this.page.locator('input[type="email"]').inputValue();
    console.log(`  Valid email input: ${emailValue === 'test@example.com' ? '✅' : '❌'}`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/auth-validation.png' });
  }

  async testAuthenticationFlow() {
    console.log('\n🔄 TC-AUTH-006-007: Testing Authentication Flow');
    
    // Clear form
    await this.page.fill('input[type="email"]', '');
    await this.page.fill('input[type="password"]', '');
    
    // Test with invalid credentials
    await this.page.fill('input[type="email"]', 'invalid@test.com');
    await this.page.fill('input[type="password"]', 'wrongpassword');
    
    const submitButton = this.page.locator('button[type="submit"]');
    const isButtonEnabled = await submitButton.isEnabled();
    console.log(`  Submit button enabled: ${isButtonEnabled ? '✅' : '❌'}`);
    
    // Check button text/loading state
    const buttonText = await submitButton.textContent();
    console.log(`  Button text: "${buttonText}"`);
    
    await submitButton.click();
    await this.page.waitForTimeout(2000);
    
    // Check for error messages or redirects
    const currentUrl = this.page.url();
    const hasErrors = await this.page.locator('.error, .text-red-500, [class*="error"]').count();
    
    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  Authentication errors: ${hasErrors > 0 ? '✅' : '❌'} (${hasErrors} found)`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/auth-flow.png' });
  }

  async testUIElements() {
    console.log('\n🎨 TC-AUTH-015-019: Testing UI Elements');
    
    await this.page.goto(this.baseUrl);
    
    // Test logo/branding
    const images = await this.page.locator('img').count();
    const logos = await this.page.locator('img[alt*="logo"], img[alt*="Logo"], .logo').count();
    console.log(`  Images found: ${images}`);
    console.log(`  Logo elements: ${logos > 0 ? '✅' : '❌'}`);
    
    // Test page title
    const title = await this.page.title();
    console.log(`  Page title: "${title}"`);
    
    // Test headings
    const headings = await this.page.locator('h1, h2, h3').count();
    const mainHeading = await this.page.locator('h1, h2').first().textContent();
    console.log(`  Headings found: ${headings}`);
    console.log(`  Main heading: "${mainHeading}"`);
    
    // Test links
    const links = await this.page.locator('a').count();
    console.log(`  Links found: ${links}`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/auth-ui-elements.png' });
  }

  async testResponsiveAuth() {
    console.log('\n📱 TC-AUTH-016: Testing Responsive Design');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.goto(this.baseUrl);
      await this.page.waitForTimeout(1000);
      
      const formVisible = await this.page.locator('form').isVisible();
      const inputsVisible = await this.page.locator('input[type="email"]').isVisible();
      
      console.log(`  ${viewport.name} (${viewport.width}x${viewport.height}): Form ${formVisible ? '✅' : '❌'}, Inputs ${inputsVisible ? '✅' : '❌'}`);
      
      await this.page.screenshot({ 
        path: `test-results/screenshots/auth-${viewport.name.toLowerCase()}.png` 
      });
    }
  }
}

// Create results directory
const fs = require('fs');
if (!fs.existsSync('test-results/screenshots')) {
  fs.mkdirSync('test-results/screenshots', { recursive: true });
}

// Run tests
const tester = new AuthenticationTester();
tester.runAllTests();
