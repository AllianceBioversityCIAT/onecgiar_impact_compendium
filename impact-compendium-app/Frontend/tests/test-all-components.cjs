const { chromium } = require('playwright');

async function testAllComponents() {
  console.log('🧪 Impact Compendium - Complete UI Component Test');
  console.log('================================================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. LOGIN PAGE COMPONENTS
    console.log('\n📱 Testing Login Page Components...');
    await page.goto('https://dt3m7tyug8c1q.cloudfront.net');
    
    // Test login form elements
    await testLoginComponents(page);
    await page.screenshot({ path: 'test-results/screenshots/01-login-page.png' });
    
    // 2. AUTHENTICATION FLOW
    console.log('\n🔐 Testing Authentication Flow...');
    await testAuthenticationFlow(page);
    
    // 3. DASHBOARD COMPONENTS
    console.log('\n📊 Testing Dashboard Components...');
    await testDashboardComponents(page);
    await page.screenshot({ path: 'test-results/screenshots/02-dashboard.png' });
    
    // 4. NAVIGATION COMPONENTS
    console.log('\n🧭 Testing Navigation Components...');
    await testNavigationComponents(page);
    
    // 5. STUDY MANAGEMENT COMPONENTS
    console.log('\n📚 Testing Study Management Components...');
    await testStudyComponents(page);
    
    // 6. RESPONSIVE DESIGN
    console.log('\n📱 Testing Responsive Design...');
    await testResponsiveComponents(page);
    
    console.log('\n🎉 All component tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Component test failed:', error.message);
    await page.screenshot({ path: 'test-results/screenshots/error-state.png' });
  } finally {
    await browser.close();
  }
}

async function testLoginComponents(page) {
  // Logo
  const logo = await page.locator('img').first().isVisible();
  console.log(`  📷 Logo: ${logo ? '✅' : '❌'}`);
  
  // Title and subtitle
  const title = await page.locator('h1, h2, .title').first().isVisible();
  console.log(`  📝 Title: ${title ? '✅' : '❌'}`);
  
  // Form elements
  const emailInput = await page.locator('input[type="email"]').isVisible();
  const passwordInput = await page.locator('input[type="password"]').isVisible();
  const submitButton = await page.locator('button[type="submit"]').isVisible();
  
  console.log(`  📧 Email Input: ${emailInput ? '✅' : '❌'}`);
  console.log(`  🔒 Password Input: ${passwordInput ? '✅' : '❌'}`);
  console.log(`  🚀 Submit Button: ${submitButton ? '✅' : '❌'}`);
  
  // Additional UI elements
  const links = await page.locator('a').count();
  console.log(`  🔗 Links found: ${links}`);
}

async function testAuthenticationFlow(page) {
  // Test form validation
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  
  const errorMessages = await page.locator('.error, .text-red-500, [class*="error"]').count();
  console.log(`  ⚠️  Validation errors: ${errorMessages > 0 ? '✅' : '❌'}`);
  
  // Test form interaction
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'testpassword');
  
  const emailValue = await page.locator('input[type="email"]').inputValue();
  const passwordValue = await page.locator('input[type="password"]').inputValue();
  
  console.log(`  📧 Email filled: ${emailValue === 'test@example.com' ? '✅' : '❌'}`);
  console.log(`  🔒 Password filled: ${passwordValue === 'testpassword' ? '✅' : '❌'}`);
}

async function testDashboardComponents(page) {
  // Try to access dashboard (might redirect to login)
  await page.goto('https://dt3m7tyug8c1q.cloudfront.net/dashboard');
  await page.waitForTimeout(2000);
  
  // Check for dashboard elements
  const navigation = await page.locator('nav, .nav, [role="navigation"]').count();
  const headers = await page.locator('h1, h2, h3').count();
  const buttons = await page.locator('button').count();
  const tables = await page.locator('table, .table').count();
  
  console.log(`  🧭 Navigation elements: ${navigation}`);
  console.log(`  📝 Headers: ${headers}`);
  console.log(`  🔘 Buttons: ${buttons}`);
  console.log(`  📊 Tables/Lists: ${tables}`);
}

async function testNavigationComponents(page) {
  // Test menu items
  const menuItems = await page.locator('a, button').count();
  console.log(`  📋 Menu items: ${menuItems}`);
  
  // Test mobile menu (if exists)
  const mobileMenu = await page.locator('.menu-toggle, [data-testid="menu-toggle"], .hamburger').count();
  console.log(`  📱 Mobile menu toggle: ${mobileMenu > 0 ? '✅' : '❌'}`);
  
  // Test breadcrumbs
  const breadcrumbs = await page.locator('.breadcrumb, nav[aria-label="breadcrumb"]').count();
  console.log(`  🍞 Breadcrumbs: ${breadcrumbs > 0 ? '✅' : '❌'}`);
}

async function testStudyComponents(page) {
  // Try to access create study page
  await page.goto('https://dt3m7tyug8c1q.cloudfront.net/create-study');
  await page.waitForTimeout(2000);
  
  // Check for form elements
  const textInputs = await page.locator('input[type="text"], input[name*="title"]').count();
  const textareas = await page.locator('textarea').count();
  const selects = await page.locator('select').count();
  const checkboxes = await page.locator('input[type="checkbox"]').count();
  const radios = await page.locator('input[type="radio"]').count();
  
  console.log(`  📝 Text inputs: ${textInputs}`);
  console.log(`  📄 Text areas: ${textareas}`);
  console.log(`  📋 Select dropdowns: ${selects}`);
  console.log(`  ☑️  Checkboxes: ${checkboxes}`);
  console.log(`  🔘 Radio buttons: ${radios}`);
}

async function testResponsiveComponents(page) {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('https://dt3m7tyug8c1q.cloudfront.net');
    await page.waitForTimeout(1000);
    
    const isFormVisible = await page.locator('form').isVisible();
    await page.screenshot({ 
      path: `test-results/screenshots/responsive-${viewport.name.toLowerCase()}.png` 
    });
    
    console.log(`  📱 ${viewport.name} (${viewport.width}x${viewport.height}): ${isFormVisible ? '✅' : '❌'}`);
  }
}

// Create results directory
const fs = require('fs');
if (!fs.existsSync('test-results/screenshots')) {
  fs.mkdirSync('test-results/screenshots', { recursive: true });
}

testAllComponents();
