# Impact Compendium Frontend Tests

This directory contains comprehensive Playwright tests for the Impact Compendium frontend application.

## Test Structure

### Test Files
- `auth.spec.ts` - Authentication flow tests (login, validation, error handling)
- `dashboard.spec.ts` - Dashboard and navigation tests
- `studies.spec.ts` - Study management functionality tests
- `admin.spec.ts` - Admin user management tests
- `responsive.spec.ts` - Responsive design and accessibility tests
- `e2e.spec.ts` - End-to-end integration tests

### Helper Files
- `helpers/auth.ts` - Authentication utilities and API mocking helpers

## Running Tests

### Prerequisites
1. Make sure the frontend development server is running:
   ```bash
   npm run dev
   ```

### Test Commands

#### Run all tests (headless)
```bash
npm test
```

#### Run tests with UI (visual test runner)
```bash
npm run test:ui
```

#### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

#### Run specific test file
```bash
npx playwright test auth.spec.ts
```

#### Run tests in debug mode
```bash
npx playwright test --debug
```

## Test Features

### 🔐 Authentication Tests
- Login form validation
- Email format validation
- Password requirements
- Success/failure scenarios
- Error message display

### 📊 Dashboard Tests
- Navigation functionality
- User menu interactions
- Admin vs regular user permissions
- Responsive layout

### 📚 Study Management Tests
- Study creation workflow
- Multi-step form validation
- DOI format validation (supports multiple formats)
- Study filtering and search
- Draft saving functionality

### 👥 Admin Tests
- User creation and management
- Permission-based access control
- User status management
- Group assignments

### 📱 Responsive & Accessibility Tests
- Mobile/tablet layouts
- Keyboard navigation
- ARIA labels and accessibility
- Loading states
- Error handling

### 🔄 End-to-End Tests
- Complete user workflows
- Cross-feature integration
- Network failure handling
- State persistence

## Test Data & Mocking

Tests use comprehensive API mocking to:
- Avoid dependencies on backend services
- Ensure consistent test data
- Test error scenarios
- Speed up test execution

### Mock Data Examples
```typescript
// Mock authenticated admin user
await loginAsAdmin(page);

// Mock studies API with custom data
await mockStudiesAPI(page, [
  { id: 1, title: 'Test Study', status: 'draft' }
]);
```

## Visual Testing

Tests include:
- Screenshot capture on failures
- Video recording for debugging
- Trace files for detailed analysis
- HTML reports with visual timeline

## Accessibility Testing

Tests verify:
- Keyboard navigation
- ARIA labels and roles
- Color contrast (basic checks)
- Screen reader compatibility
- Focus management

## Best Practices

### Test Organization
- Each test file focuses on a specific feature area
- Tests are independent and can run in parallel
- Shared utilities are extracted to helpers

### Assertions
- Use semantic locators (text, labels, roles)
- Verify both visual and functional behavior
- Test error states and edge cases

### Performance
- Tests run in parallel for speed
- API responses are mocked for consistency
- Minimal setup/teardown for efficiency

## Debugging Failed Tests

1. **Run with UI**: `npm run test:ui` to see visual test runner
2. **Run in headed mode**: `npm run test:headed` to see browser
3. **Use debug mode**: `npx playwright test --debug` for step-by-step debugging
4. **Check screenshots**: Failed tests automatically capture screenshots
5. **Review traces**: Use `npx playwright show-trace` for detailed analysis

## CI/CD Integration

Tests are configured for:
- Parallel execution in CI environments
- Retry on failure (2 retries in CI)
- HTML report generation
- Artifact collection (screenshots, videos, traces)

## Adding New Tests

1. Create test file in appropriate category
2. Use existing helpers for common setup
3. Follow naming convention: `feature.spec.ts`
4. Include both positive and negative test cases
5. Add accessibility and responsive checks where relevant

## Configuration

Test configuration is in `playwright.config.ts`:
- Base URL: `http://localhost:5173`
- Browsers: Chrome, Firefox, Safari
- Timeouts and retries
- Report settings
- Web server auto-start
