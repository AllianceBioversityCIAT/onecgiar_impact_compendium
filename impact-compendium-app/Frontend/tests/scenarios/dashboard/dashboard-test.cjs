const { chromium } = require('playwright');

class DashboardTester {
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
    console.log('📊 Dashboard Test Suite');
    console.log('=======================');
    
    await this.setup();
    
    try {
      await this.testDashboardAccess();
      await this.testLayoutElements();
      await this.testDataDisplay();
      await this.testUserActions();
      await this.testNavigation();
      await this.testLoadingStates();
      
      console.log('\n✅ All dashboard tests completed!');
    } catch (error) {
      console.error('❌ Dashboard test failed:', error.message);
      await this.page.screenshot({ path: 'test-results/screenshots/dashboard-error.png' });
    } finally {
      await this.teardown();
    }
  }

  async testDashboardAccess() {
    console.log('\n🚪 Testing Dashboard Access');
    
    // Try direct access to dashboard
    await this.page.goto(`${this.baseUrl}/dashboard`);
    await this.page.waitForTimeout(2000);
    
    const currentUrl = this.page.url();
    const isOnDashboard = currentUrl.includes('dashboard');
    const isRedirectedToLogin = currentUrl.includes('login') || currentUrl === this.baseUrl + '/';
    
    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  Dashboard accessible: ${isOnDashboard ? '✅' : '❌'}`);
    console.log(`  Redirected to login: ${isRedirectedToLogin ? '✅' : '❌'}`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/dashboard-access.png' });
  }

  async testLayoutElements() {
    console.log('\n🏗️  TC-DASH-001-005: Testing Layout Elements');
    
    // Test header elements
    const headers = await this.page.locator('header, .header, nav').count();
    const headings = await this.page.locator('h1, h2, h3').count();
    const navigation = await this.page.locator('nav, .nav, [role="navigation"]').count();
    
    console.log(`  Header elements: ${headers > 0 ? '✅' : '❌'} (${headers} found)`);
    console.log(`  Headings: ${headings > 0 ? '✅' : '❌'} (${headings} found)`);
    console.log(`  Navigation: ${navigation > 0 ? '✅' : '❌'} (${navigation} found)`);
    
    // Test main content area
    const mainContent = await this.page.locator('main, .main, .content, #content').count();
    const containers = await this.page.locator('.container, .wrapper').count();
    
    console.log(`  Main content area: ${mainContent > 0 ? '✅' : '❌'} (${mainContent} found)`);
    console.log(`  Content containers: ${containers}`);
    
    // Test footer
    const footer = await this.page.locator('footer, .footer').count();
    console.log(`  Footer: ${footer > 0 ? '✅' : '❌'} (${footer} found)`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/dashboard-layout.png' });
  }

  async testDataDisplay() {
    console.log('\n📋 TC-DASH-006-010: Testing Data Display');
    
    // Test studies display
    const studyItems = await this.page.locator('.study, .card, .item, [data-testid*="study"]').count();
    const tables = await this.page.locator('table, .table').count();
    const lists = await this.page.locator('ul, ol, .list').count();
    
    console.log(`  Study items: ${studyItems > 0 ? '✅' : '❌'} (${studyItems} found)`);
    console.log(`  Tables: ${tables > 0 ? '✅' : '❌'} (${tables} found)`);
    console.log(`  Lists: ${lists > 0 ? '✅' : '❌'} (${lists} found)`);
    
    // Test search and filter elements
    const searchInputs = await this.page.locator('input[type="search"], input[placeholder*="search"], .search').count();
    const filterButtons = await this.page.locator('button[class*="filter"], .filter, select').count();
    const sortOptions = await this.page.locator('select[class*="sort"], .sort, button[class*="sort"]').count();
    
    console.log(`  Search inputs: ${searchInputs > 0 ? '✅' : '❌'} (${searchInputs} found)`);
    console.log(`  Filter options: ${filterButtons > 0 ? '✅' : '❌'} (${filterButtons} found)`);
    console.log(`  Sort options: ${sortOptions > 0 ? '✅' : '❌'} (${sortOptions} found)`);
    
    // Test pagination
    const pagination = await this.page.locator('.pagination, .pager, button[class*="page"]').count();
    console.log(`  Pagination: ${pagination > 0 ? '✅' : '❌'} (${pagination} found)`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/dashboard-data.png' });
  }

  async testUserActions() {
    console.log('\n🎯 TC-DASH-011-015: Testing User Actions');
    
    // Test action buttons
    const createButtons = await this.page.locator('button:has-text("Create"), button:has-text("New"), a:has-text("Create")').count();
    const editButtons = await this.page.locator('button:has-text("Edit"), a:has-text("Edit"), .edit').count();
    const deleteButtons = await this.page.locator('button:has-text("Delete"), .delete').count();
    const viewButtons = await this.page.locator('button:has-text("View"), a:has-text("View"), .view').count();
    
    console.log(`  Create buttons: ${createButtons > 0 ? '✅' : '❌'} (${createButtons} found)`);
    console.log(`  Edit buttons: ${editButtons > 0 ? '✅' : '❌'} (${editButtons} found)`);
    console.log(`  Delete buttons: ${deleteButtons > 0 ? '✅' : '❌'} (${deleteButtons} found)`);
    console.log(`  View buttons: ${viewButtons > 0 ? '✅' : '❌'} (${viewButtons} found)`);
    
    // Test button functionality
    if (createButtons > 0) {
      const createButton = this.page.locator('button:has-text("Create"), a:has-text("Create")').first();
      const isEnabled = await createButton.isEnabled();
      console.log(`  Create button enabled: ${isEnabled ? '✅' : '❌'}`);
      
      // Test click (but don't navigate away)
      const href = await createButton.getAttribute('href');
      if (href) {
        console.log(`  Create button links to: ${href}`);
      }
    }
    
    await this.page.screenshot({ path: 'test-results/screenshots/dashboard-actions.png' });
  }

  async testNavigation() {
    console.log('\n🧭 TC-DASH-016-020: Testing Navigation');
    
    // Test menu items
    const menuItems = await this.page.locator('nav a, .nav a, .menu a').count();
    const buttons = await this.page.locator('button').count();
    
    console.log(`  Menu items: ${menuItems > 0 ? '✅' : '❌'} (${menuItems} found)`);
    console.log(`  Total buttons: ${buttons}`);
    
    // Test user profile/settings
    const profileLinks = await this.page.locator('a:has-text("Profile"), button:has-text("Profile"), .profile').count();
    const settingsLinks = await this.page.locator('a:has-text("Settings"), button:has-text("Settings"), .settings').count();
    const logoutButtons = await this.page.locator('button:has-text("Logout"), a:has-text("Logout"), .logout').count();
    
    console.log(`  Profile links: ${profileLinks > 0 ? '✅' : '❌'} (${profileLinks} found)`);
    console.log(`  Settings links: ${settingsLinks > 0 ? '✅' : '❌'} (${settingsLinks} found)`);
    console.log(`  Logout buttons: ${logoutButtons > 0 ? '✅' : '❌'} (${logoutButtons} found)`);
    
    // Test breadcrumbs
    const breadcrumbs = await this.page.locator('.breadcrumb, nav[aria-label="breadcrumb"], .breadcrumbs').count();
    console.log(`  Breadcrumbs: ${breadcrumbs > 0 ? '✅' : '❌'} (${breadcrumbs} found)`);
    
    // Test mobile menu
    const mobileMenuToggle = await this.page.locator('.menu-toggle, .hamburger, button[aria-label*="menu"]').count();
    console.log(`  Mobile menu toggle: ${mobileMenuToggle > 0 ? '✅' : '❌'} (${mobileMenuToggle} found)`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/dashboard-navigation.png' });
  }

  async testLoadingStates() {
    console.log('\n⏳ TC-DASH-021-025: Testing Loading States');
    
    // Test loading indicators
    const loadingElements = await this.page.locator('.loading, .spinner, .loader, [class*="loading"]').count();
    console.log(`  Loading indicators: ${loadingElements > 0 ? '✅' : '❌'} (${loadingElements} found)`);
    
    // Test empty state
    const emptyStateElements = await this.page.locator('.empty, .no-data, [class*="empty"]').count();
    console.log(`  Empty state elements: ${emptyStateElements > 0 ? '✅' : '❌'} (${emptyStateElements} found)`);
    
    // Test error handling
    const errorElements = await this.page.locator('.error, .alert, [class*="error"]').count();
    console.log(`  Error elements: ${errorElements > 0 ? '✅' : '❌'} (${errorElements} found)`);
    
    // Test refresh functionality
    const refreshButtons = await this.page.locator('button:has-text("Refresh"), .refresh, [aria-label*="refresh"]').count();
    console.log(`  Refresh buttons: ${refreshButtons > 0 ? '✅' : '❌'} (${refreshButtons} found)`);
    
    // Test page responsiveness
    await this.page.reload();
    await this.page.waitForTimeout(1000);
    const pageLoaded = await this.page.locator('body').isVisible();
    console.log(`  Page reload successful: ${pageLoaded ? '✅' : '❌'}`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/dashboard-loading.png' });
  }
}

// Create results directory
const fs = require('fs');
if (!fs.existsSync('test-results/screenshots')) {
  fs.mkdirSync('test-results/screenshots', { recursive: true });
}

// Run tests
const tester = new DashboardTester();
tester.runAllTests();
