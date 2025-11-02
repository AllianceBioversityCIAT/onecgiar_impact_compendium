# Authenticated Testing Setup

## 🔐 Configure Valid Credentials

To test authenticated features, update the credentials in:
`tests/scenarios/authenticated-test.cjs`

### Step 1: Set Environment Variables (SECURE)
```bash
export TEST_EMAIL='your-valid-email@domain.com'
export TEST_PASSWORD='your-actual-password'
export TEST_BASE_URL='https://your-app-url.com'
```

**⚠️ NEVER hardcode credentials in test files!**

### Step 2: Run Authenticated Tests
```bash
npm run test:authenticated
```

## 🧪 What Gets Tested

### ✅ Login Process
- Form submission with real credentials
- Authentication success/failure detection
- Redirect to dashboard verification

### ✅ Dashboard Features (if login succeeds)
- Navigation menu access
- Study items display
- Create buttons functionality
- User menu availability

### ✅ Study Management (if authenticated)
- Create study page access
- Form elements validation
- Studies list functionality
- Search capabilities

### ✅ Navigation Testing
- Menu links functionality
- User profile access
- Breadcrumb navigation

### ✅ Logout Process
- Logout button detection
- Session termination
- Redirect to login page

## 📸 Generated Screenshots

After successful authentication:
- `login-attempt.png` - Login form submission
- `authenticated-dashboard.png` - Dashboard with user session
- `create-study-form.png` - Study creation form
- `studies-list.png` - Studies management page
- `navigation-menu.png` - Navigation elements
- `after-logout.png` - Post-logout state

## 🔒 Security Notes

- **Never commit real credentials to git**
- Use environment variables for CI/CD
- Consider creating test-specific accounts
- Rotate credentials regularly

## 🚀 Alternative Approaches

### Option 1: Environment Variables
```javascript
this.credentials = {
  email: process.env.TEST_EMAIL || 'admin@example.com',
  password: process.env.TEST_PASSWORD || 'password123'
};
```

### Option 2: External Config File
Create `tests/config/credentials.json` (add to .gitignore):
```json
{
  "email": "your-email@domain.com",
  "password": "your-password"
}
```

### Option 3: Interactive Input
The test could prompt for credentials at runtime.

## 🎯 Expected Results

With valid credentials, you should see:
- ✅ Login successful
- ✅ Dashboard features accessible
- ✅ Study management functional
- ✅ Navigation working
- ✅ Logout process complete

This provides comprehensive testing of all authenticated application features!
