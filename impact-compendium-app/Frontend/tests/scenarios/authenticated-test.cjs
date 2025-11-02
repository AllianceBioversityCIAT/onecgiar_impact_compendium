const { chromium } = require('playwright');

class AuthenticatedTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    // Use environment variables for security
    this.credentials = {
      email: process.env.TEST_EMAIL || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'test123'
    };
  }

  async setup() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
  }

  async teardown() {
    if (this.browser) await this.browser.close();
  }

  async runAuthenticatedTests() {
    console.log('🔐 Authenticated Feature Tests');
    console.log('==============================');
    
    await this.setup();
    
    try {
      const loginSuccess = await this.performLogin();
      
      if (loginSuccess) {
        await this.testDashboardFeatures();
        await this.testStudyManagement();
        await this.testNavigation();
        await this.testLogout();
      } else {
        console.log('❌ Login failed - cannot test authenticated features');
        console.log('💡 Please update credentials in the test file');
      }
      
    } catch (error) {
      console.error('❌ Authenticated test failed:', error.message);
      await this.page.screenshot({ path: 'test-results/screenshots/auth-test-error.png' });
    } finally {
      await this.teardown();
    }
  }

  async performLogin() {
    console.log('\n🚪 Performing Login with Valid Credentials');
    
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState('networkidle');
    
    // Fill login form
    await this.page.fill('input[type="email"]', this.credentials.email);
    await this.page.fill('input[type="password"]', this.credentials.password);
    
    console.log(`  Email: ${this.credentials.email}`);
    console.log(`  Password: ${'*'.repeat(this.credentials.password.length)}`);
    
    // Submit form
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(3000);
    
    // Check if login was successful
    const currentUrl = this.page.url();
    const isOnDashboard = currentUrl.includes('dashboard') || !currentUrl.includes('login');
    const hasErrorMessage = await this.page.locator('.error, .text-red-500, [class*="error"]').count() > 0;
    
    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  Login successful: ${isOnDashboard && !hasErrorMessage ? '✅' : '❌'}`);
    
    if (hasErrorMessage) {
      const errorText = await this.page.locator('.error, .text-red-500').first().textContent();
      console.log(`  Error message: ${errorText}`);
    }
    
    await this.page.screenshot({ path: 'test-results/screenshots/login-attempt.png' });
    
    return isOnDashboard && !hasErrorMessage;
  }

  async testDashboardFeatures() {
    console.log('\n📊 Testing Authenticated Dashboard Features');
    
    // Navigate to dashboard if not already there
    if (!this.page.url().includes('dashboard')) {
      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.page.waitForTimeout(2000);
    }
    
    // Test dashboard elements
    const navigation = await this.page.locator('nav, .nav, [role="navigation"]').count();
    const studyItems = await this.page.locator('.study, .card, .item, [data-testid*="study"]').count();
    const createButtons = await this.page.locator('button:has-text("Create"), a:has-text("Create")').count();
    const userMenu = await this.page.locator('.user, .profile, [data-testid*="user"]').count();
    
    console.log(`  Navigation menu: ${navigation > 0 ? '✅' : '❌'} (${navigation} found)`);
    console.log(`  Study items: ${studyItems > 0 ? '✅' : '❌'} (${studyItems} found)`);
    console.log(`  Create buttons: ${createButtons > 0 ? '✅' : '❌'} (${createButtons} found)`);
    console.log(`  User menu: ${userMenu > 0 ? '✅' : '❌'} (${userMenu} found)`);
    
    // Test page title and content
    const title = await this.page.title();
    const headings = await this.page.locator('h1, h2, h3').count();
    
    console.log(`  Page title: "${title}"`);
    console.log(`  Content headings: ${headings}`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/authenticated-dashboard.png' });
  }

  async testStudyManagement() {
    console.log('\n📚 Testing Study Management Features');
    
    // Try to access create study page
    const createButtons = this.page.locator('button:has-text("Create"), a:has-text("Create")');
    if (await createButtons.count() > 0) {
      await createButtons.first().click();
      await this.page.waitForTimeout(2000);
      
      const currentUrl = this.page.url();
      const isOnCreatePage = currentUrl.includes('create') || currentUrl.includes('new');
      
      console.log(`  Create study page accessible: ${isOnCreatePage ? '✅' : '❌'}`);
      console.log(`  Current URL: ${currentUrl}`);
      
      if (isOnCreatePage) {
        // Test form elements
        const textInputs = await this.page.locator('input[type="text"], input[name*="title"]').count();
        const textareas = await this.page.locator('textarea').count();
        const selects = await this.page.locator('select').count();
        const submitButtons = await this.page.locator('button[type="submit"]').count();
        
        console.log(`  Text inputs: ${textInputs > 0 ? '✅' : '❌'} (${textInputs} found)`);
        console.log(`  Textareas: ${textareas > 0 ? '✅' : '❌'} (${textareas} found)`);
        console.log(`  Select dropdowns: ${selects > 0 ? '✅' : '❌'} (${selects} found)`);
        console.log(`  Submit buttons: ${submitButtons > 0 ? '✅' : '❌'} (${submitButtons} found)`);
        
        await this.page.screenshot({ path: 'test-results/screenshots/create-study-form.png' });
      }
    } else {
      console.log('  No create buttons found on dashboard');
    }
    
    // Try direct access to studies list
    await this.page.goto(`${this.baseUrl}/studies`);
    await this.page.waitForTimeout(2000);
    
    const studiesUrl = this.page.url();
    const isOnStudiesPage = studiesUrl.includes('studies') && !studiesUrl.includes('login');
    
    console.log(`  Studies list accessible: ${isOnStudiesPage ? '✅' : '❌'}`);
    
    if (isOnStudiesPage) {
      const studyItems = await this.page.locator('.study, .card, .item').count();
      const searchInputs = await this.page.locator('input[type="search"], input[placeholder*="search"]').count();
      
      console.log(`  Study items displayed: ${studyItems > 0 ? '✅' : '❌'} (${studyItems} found)`);
      console.log(`  Search functionality: ${searchInputs > 0 ? '✅' : '❌'} (${searchInputs} found)`);
      
      await this.page.screenshot({ path: 'test-results/screenshots/studies-list.png' });
    }
  }

  async testNavigation() {
    console.log('\n🧭 Testing Authenticated Navigation');
    
    // Test main navigation links
    const navLinks = this.page.locator('nav a, .nav a');
    const linkCount = await navLinks.count();
    
    console.log(`  Navigation links: ${linkCount > 0 ? '✅' : '❌'} (${linkCount} found)`);
    
    if (linkCount > 0) {
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = navLinks.nth(i);
        const linkText = await link.textContent();
        const href = await link.getAttribute('href');
        
        console.log(`  Link ${i + 1}: "${linkText}" -> ${href}`);
      }
    }
    
    // Test user menu/profile access
    const userMenus = await this.page.locator('.user, .profile, button:has-text("Profile")').count();
    console.log(`  User menu available: ${userMenus > 0 ? '✅' : '❌'} (${userMenus} found)`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/navigation-menu.png' });
  }

  async testLogout() {
    console.log('\n🚪 Testing Logout Functionality');
    
    const logoutButtons = this.page.locator('button:has-text("Logout"), a:has-text("Logout"), .logout');
    const logoutCount = await logoutButtons.count();
    
    console.log(`  Logout buttons found: ${logoutCount > 0 ? '✅' : '❌'} (${logoutCount} found)`);
    
    if (logoutCount > 0) {
      await logoutButtons.first().click();
      await this.page.waitForTimeout(2000);
      
      const currentUrl = this.page.url();
      const isBackToLogin = currentUrl.includes('login') || currentUrl === this.baseUrl + '/';
      
      console.log(`  Logout successful: ${isBackToLogin ? '✅' : '❌'}`);
      console.log(`  Redirected to: ${currentUrl}`);
      
      await this.page.screenshot({ path: 'test-results/screenshots/after-logout.png' });
    } else {
      console.log('  Manual logout test: Navigate to login page');
      await this.page.goto(this.baseUrl);
      await this.page.waitForTimeout(1000);
      
      const hasLoginForm = await this.page.locator('form').count() > 0;
      console.log(`  Login form visible: ${hasLoginForm ? '✅' : '❌'}`);
    }
  }
}

// Create results directory
const fs = require('fs');
if (!fs.existsSync('test-results/screenshots')) {
  fs.mkdirSync('test-results/screenshots', { recursive: true });
}

// Run authenticated tests
const tester = new AuthenticatedTester();
tester.runAuthenticatedTests();
