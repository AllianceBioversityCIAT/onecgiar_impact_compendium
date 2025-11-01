const { chromium } = require('playwright');

class StudiesTester {
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
    console.log('📚 Studies Management Test Suite');
    console.log('================================');
    
    await this.setup();
    
    try {
      await this.testCreateStudyAccess();
      await this.testFormElements();
      await this.testFormValidation();
      await this.testStudyViewing();
      await this.testStudyManagement();
      
      console.log('\n✅ All studies tests completed!');
    } catch (error) {
      console.error('❌ Studies test failed:', error.message);
      await this.page.screenshot({ path: 'test-results/screenshots/studies-error.png' });
    } finally {
      await this.teardown();
    }
  }

  async testCreateStudyAccess() {
    console.log('\n📝 TC-STUDY-001: Testing Create Study Access');
    
    // Try direct access to create study
    await this.page.goto(`${this.baseUrl}/create-study`);
    await this.page.waitForTimeout(2000);
    
    const currentUrl = this.page.url();
    const isOnCreateStudy = currentUrl.includes('create-study') || currentUrl.includes('new-study');
    const hasForm = await this.page.locator('form').count() > 0;
    
    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  Create study page accessible: ${isOnCreateStudy ? '✅' : '❌'}`);
    console.log(`  Form present: ${hasForm ? '✅' : '❌'}`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/create-study-access.png' });
  }

  async testFormElements() {
    console.log('\n🏗️  TC-STUDY-022-028: Testing Form Elements');
    
    // Test text inputs
    const textInputs = await this.page.locator('input[type="text"], input[name*="title"], input[name*="name"]').count();
    const emailInputs = await this.page.locator('input[type="email"]').count();
    const urlInputs = await this.page.locator('input[type="url"]').count();
    
    console.log(`  Text inputs: ${textInputs > 0 ? '✅' : '❌'} (${textInputs} found)`);
    console.log(`  Email inputs: ${emailInputs > 0 ? '✅' : '❌'} (${emailInputs} found)`);
    console.log(`  URL inputs: ${urlInputs > 0 ? '✅' : '❌'} (${urlInputs} found)`);
    
    // Test textarea fields
    const textareas = await this.page.locator('textarea').count();
    console.log(`  Textarea fields: ${textareas > 0 ? '✅' : '❌'} (${textareas} found)`);
    
    // Test select dropdowns
    const selects = await this.page.locator('select').count();
    console.log(`  Select dropdowns: ${selects > 0 ? '✅' : '❌'} (${selects} found)`);
    
    // Test checkboxes and radio buttons
    const checkboxes = await this.page.locator('input[type="checkbox"]').count();
    const radios = await this.page.locator('input[type="radio"]').count();
    
    console.log(`  Checkboxes: ${checkboxes > 0 ? '✅' : '❌'} (${checkboxes} found)`);
    console.log(`  Radio buttons: ${radios > 0 ? '✅' : '❌'} (${radios} found)`);
    
    // Test file inputs
    const fileInputs = await this.page.locator('input[type="file"]').count();
    console.log(`  File inputs: ${fileInputs > 0 ? '✅' : '❌'} (${fileInputs} found)`);
    
    // Test date inputs
    const dateInputs = await this.page.locator('input[type="date"], input[type="datetime-local"]').count();
    console.log(`  Date inputs: ${dateInputs > 0 ? '✅' : '❌'} (${dateInputs} found)`);
    
    // Test buttons
    const submitButtons = await this.page.locator('button[type="submit"], input[type="submit"]').count();
    const cancelButtons = await this.page.locator('button:has-text("Cancel"), button[type="button"]').count();
    
    console.log(`  Submit buttons: ${submitButtons > 0 ? '✅' : '❌'} (${submitButtons} found)`);
    console.log(`  Cancel buttons: ${cancelButtons > 0 ? '✅' : '❌'} (${cancelButtons} found)`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/study-form-elements.png' });
  }

  async testFormValidation() {
    console.log('\n⚠️  TC-STUDY-002-006: Testing Form Validation');
    
    // Test empty form submission
    const submitButton = this.page.locator('button[type="submit"], input[type="submit"]').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await this.page.waitForTimeout(1000);
      
      const errorElements = await this.page.locator('.error, .text-red-500, [class*="error"], .invalid').count();
      console.log(`  Empty form validation: ${errorElements > 0 ? '✅' : '❌'} (${errorElements} errors)`);
    }
    
    // Test field interactions
    const textInputs = this.page.locator('input[type="text"], input[name*="title"]');
    if (await textInputs.count() > 0) {
      const firstInput = textInputs.first();
      await firstInput.fill('Test Study Title');
      const value = await firstInput.inputValue();
      console.log(`  Text input interaction: ${value === 'Test Study Title' ? '✅' : '❌'}`);
    }
    
    const textareas = this.page.locator('textarea');
    if (await textareas.count() > 0) {
      const firstTextarea = textareas.first();
      await firstTextarea.fill('Test study description');
      const value = await firstTextarea.inputValue();
      console.log(`  Textarea interaction: ${value.includes('Test study') ? '✅' : '❌'}`);
    }
    
    const selects = this.page.locator('select');
    if (await selects.count() > 0) {
      const firstSelect = selects.first();
      const options = await firstSelect.locator('option').count();
      console.log(`  Select options available: ${options > 1 ? '✅' : '❌'} (${options} options)`);
      
      if (options > 1) {
        await firstSelect.selectOption({ index: 1 });
        const selectedValue = await firstSelect.inputValue();
        console.log(`  Select interaction: ${selectedValue ? '✅' : '❌'}`);
      }
    }
    
    await this.page.screenshot({ path: 'test-results/screenshots/study-form-validation.png' });
  }

  async testStudyViewing() {
    console.log('\n👁️  TC-STUDY-012-016: Testing Study Viewing');
    
    // Try to access a study view page
    await this.page.goto(`${this.baseUrl}/studies`);
    await this.page.waitForTimeout(2000);
    
    const currentUrl = this.page.url();
    console.log(`  Studies page URL: ${currentUrl}`);
    
    // Test study list elements
    const studyItems = await this.page.locator('.study, .card, .item, [data-testid*="study"]').count();
    const studyLinks = await this.page.locator('a[href*="study"], a[href*="studies"]').count();
    
    console.log(`  Study items displayed: ${studyItems > 0 ? '✅' : '❌'} (${studyItems} found)`);
    console.log(`  Study links: ${studyLinks > 0 ? '✅' : '❌'} (${studyLinks} found)`);
    
    // Test study metadata display
    const titles = await this.page.locator('h1, h2, h3, .title, [class*="title"]').count();
    const descriptions = await this.page.locator('.description, [class*="description"], p').count();
    const dates = await this.page.locator('.date, [class*="date"], time').count();
    
    console.log(`  Study titles: ${titles > 0 ? '✅' : '❌'} (${titles} found)`);
    console.log(`  Descriptions: ${descriptions > 0 ? '✅' : '❌'} (${descriptions} found)`);
    console.log(`  Date elements: ${dates > 0 ? '✅' : '❌'} (${dates} found)`);
    
    // Test status indicators
    const statusElements = await this.page.locator('.status, .badge, [class*="status"]').count();
    console.log(`  Status indicators: ${statusElements > 0 ? '✅' : '❌'} (${statusElements} found)`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/study-viewing.png' });
  }

  async testStudyManagement() {
    console.log('\n🔧 TC-STUDY-017-021: Testing Study Management');
    
    // Test search functionality
    const searchInputs = await this.page.locator('input[type="search"], input[placeholder*="search"], .search').count();
    console.log(`  Search inputs: ${searchInputs > 0 ? '✅' : '❌'} (${searchInputs} found)`);
    
    if (searchInputs > 0) {
      const searchInput = this.page.locator('input[type="search"], input[placeholder*="search"]').first();
      await searchInput.fill('test');
      const searchValue = await searchInput.inputValue();
      console.log(`  Search interaction: ${searchValue === 'test' ? '✅' : '❌'}`);
    }
    
    // Test filter options
    const filterElements = await this.page.locator('select[class*="filter"], .filter, button[class*="filter"]').count();
    console.log(`  Filter elements: ${filterElements > 0 ? '✅' : '❌'} (${filterElements} found)`);
    
    // Test sort options
    const sortElements = await this.page.locator('select[class*="sort"], .sort, button[class*="sort"]').count();
    console.log(`  Sort elements: ${sortElements > 0 ? '✅' : '❌'} (${sortElements} found)`);
    
    // Test action buttons
    const editButtons = await this.page.locator('button:has-text("Edit"), a:has-text("Edit"), .edit').count();
    const deleteButtons = await this.page.locator('button:has-text("Delete"), .delete').count();
    const viewButtons = await this.page.locator('button:has-text("View"), a:has-text("View"), .view').count();
    
    console.log(`  Edit buttons: ${editButtons > 0 ? '✅' : '❌'} (${editButtons} found)`);
    console.log(`  Delete buttons: ${deleteButtons > 0 ? '✅' : '❌'} (${deleteButtons} found)`);
    console.log(`  View buttons: ${viewButtons > 0 ? '✅' : '❌'} (${viewButtons} found)`);
    
    // Test pagination
    const paginationElements = await this.page.locator('.pagination, .pager, button[class*="page"]').count();
    console.log(`  Pagination: ${paginationElements > 0 ? '✅' : '❌'} (${paginationElements} found)`);
    
    await this.page.screenshot({ path: 'test-results/screenshots/study-management.png' });
  }
}

// Create results directory
const fs = require('fs');
if (!fs.existsSync('test-results/screenshots')) {
  fs.mkdirSync('test-results/screenshots', { recursive: true });
}

// Run tests
const tester = new StudiesTester();
tester.runAllTests();
