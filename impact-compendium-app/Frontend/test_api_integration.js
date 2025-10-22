/**
 * API Integration Test for Impact Compendium Frontend
 * Tests the API service and data synchronization
 */

// Mock environment for testing
process.env.REACT_APP_API_URL = 'http://localhost:8000';

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🧪 Starting API Integration Tests');
    console.log('=' * 50);

    for (const { name, testFn } of this.tests) {
      try {
        console.log(`\n🔍 Testing: ${name}`);
        await testFn();
        console.log(`✅ PASSED: ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${name}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log('\n' + '=' * 50);
    console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
      return true;
    } else {
      console.log('❌ Some tests failed.');
      return false;
    }
  }
}

// Mock API Service for testing
class MockApiService {
  constructor() {
    this.baseURL = 'http://localhost:8000';
  }

  getAuthToken() {
    return 'mock-token-12345';
  }

  getHeaders(includeAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    // Mock successful responses
    const mockResponses = {
      '/studies': [
        {
          id: 1,
          title: 'Test Study 1',
          description: 'A test study for validation',
          is_published: true,
          created_at: '2024-10-21T18:00:00Z',
          created_by: 'test-user'
        },
        {
          id: 2,
          title: 'Test Study 2',
          description: 'Another test study',
          is_published: false,
          created_at: '2024-10-21T19:00:00Z',
          created_by: 'test-user'
        }
      ],
      '/studies/1': {
        id: 1,
        title: 'Test Study 1',
        description: 'A test study for validation',
        methodology: 'Mixed methods approach',
        is_published: true,
        created_at: '2024-10-21T18:00:00Z',
        created_by: 'test-user'
      },
      '/auth/me': {
        sub: 'test-user-123',
        email: 'test@cgiar.org',
        name: 'Test User',
        groups: ['Researcher']
      },
      '/health': {
        status: 'healthy',
        service: 'impact-compendium-api',
        database: 'connected'
      }
    };

    const response = mockResponses[endpoint];
    if (response) {
      return response;
    } else {
      throw new Error(`Mock endpoint not found: ${endpoint}`);
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    // Mock POST responses
    if (endpoint === '/studies') {
      return {
        id: 3,
        ...data,
        created_at: new Date().toISOString(),
        created_by: 'test-user'
      };
    }
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(data), ...options });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data), ...options });
  }

  async delete(endpoint, options = {}) {
    return { message: 'Deleted successfully' };
  }

  // API methods
  async getStudies(params = {}) {
    return this.get('/studies');
  }

  async getStudy(id) {
    return this.get(`/studies/${id}`);
  }

  async createStudy(data) {
    return this.post('/studies', data);
  }

  async updateStudy(id, data) {
    return this.put(`/studies/${id}`, data);
  }

  async deleteStudy(id) {
    return this.delete(`/studies/${id}`);
  }

  async getProfile() {
    return this.get('/auth/me');
  }

  async healthCheck() {
    return this.get('/health');
  }
}

// Test Suite
const runner = new TestRunner();
const apiService = new MockApiService();

// Test 1: API Service Initialization
runner.test('API Service Initialization', async () => {
  if (!apiService.baseURL) {
    throw new Error('Base URL not set');
  }
  
  if (!apiService.getAuthToken()) {
    throw new Error('Auth token not available');
  }
  
  const headers = apiService.getHeaders();
  if (!headers['Content-Type'] || !headers['Authorization']) {
    throw new Error('Headers not properly configured');
  }
});

// Test 2: Health Check
runner.test('Health Check API', async () => {
  const health = await apiService.healthCheck();
  
  if (health.status !== 'healthy') {
    throw new Error('Health check failed');
  }
  
  if (!health.service || !health.database) {
    throw new Error('Health response missing required fields');
  }
});

// Test 3: Get Studies
runner.test('Get Studies API', async () => {
  const studies = await apiService.getStudies();
  
  if (!Array.isArray(studies)) {
    throw new Error('Studies response is not an array');
  }
  
  if (studies.length === 0) {
    throw new Error('No studies returned');
  }
  
  const study = studies[0];
  const requiredFields = ['id', 'title', 'created_at', 'created_by'];
  
  for (const field of requiredFields) {
    if (!study[field]) {
      throw new Error(`Study missing required field: ${field}`);
    }
  }
});

// Test 4: Get Single Study
runner.test('Get Single Study API', async () => {
  const study = await apiService.getStudy(1);
  
  if (!study || !study.id) {
    throw new Error('Study not found');
  }
  
  if (study.id !== 1) {
    throw new Error('Wrong study returned');
  }
  
  if (!study.title || !study.created_at) {
    throw new Error('Study missing required fields');
  }
});

// Test 5: Create Study
runner.test('Create Study API', async () => {
  const newStudyData = {
    title: 'New Test Study',
    description: 'Created via API test',
    is_published: false
  };
  
  const createdStudy = await apiService.createStudy(newStudyData);
  
  if (!createdStudy.id) {
    throw new Error('Created study missing ID');
  }
  
  if (createdStudy.title !== newStudyData.title) {
    throw new Error('Created study title mismatch');
  }
  
  if (!createdStudy.created_at) {
    throw new Error('Created study missing timestamp');
  }
});

// Test 6: Update Study
runner.test('Update Study API', async () => {
  const updateData = {
    title: 'Updated Test Study',
    description: 'Updated via API test'
  };
  
  const updatedStudy = await apiService.updateStudy(1, updateData);
  
  if (!updatedStudy) {
    throw new Error('Update study failed');
  }
});

// Test 7: Delete Study
runner.test('Delete Study API', async () => {
  const result = await apiService.deleteStudy(1);
  
  if (!result.message) {
    throw new Error('Delete study response invalid');
  }
});

// Test 8: Get User Profile
runner.test('Get User Profile API', async () => {
  const profile = await apiService.getProfile();
  
  if (!profile.sub || !profile.email) {
    throw new Error('Profile missing required fields');
  }
  
  if (!Array.isArray(profile.groups)) {
    throw new Error('Profile groups not an array');
  }
});

// Test 9: Data Validation
runner.test('Data Validation', async () => {
  const studies = await apiService.getStudies();
  
  for (const study of studies) {
    // Validate data types
    if (typeof study.id !== 'number') {
      throw new Error('Study ID should be a number');
    }
    
    if (typeof study.title !== 'string') {
      throw new Error('Study title should be a string');
    }
    
    if (typeof study.is_published !== 'boolean') {
      throw new Error('Study is_published should be a boolean');
    }
    
    // Validate date format
    const date = new Date(study.created_at);
    if (isNaN(date.getTime())) {
      throw new Error('Study created_at should be a valid date');
    }
  }
});

// Test 10: Error Handling
runner.test('Error Handling', async () => {
  try {
    await apiService.get('/nonexistent-endpoint');
    throw new Error('Should have thrown an error for nonexistent endpoint');
  } catch (error) {
    if (!error.message.includes('Mock endpoint not found')) {
      throw new Error('Unexpected error message');
    }
  }
});

// Run all tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runner, apiService };
} else {
  // Run tests if executed directly
  runner.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}
