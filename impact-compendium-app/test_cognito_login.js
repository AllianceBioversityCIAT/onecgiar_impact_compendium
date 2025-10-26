// Test Cognito login directly
import { signIn } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_IvjuJmtXt',
      userPoolClientId: '6fsj4vir71ojli3pgr3km11clq',
      loginWith: {
        email: true,
        username: false,
      },
    },
  },
});

const testLogin = async () => {
  try {
    console.log('Testing Cognito login...');
    
    // Try with username
    const result = await signIn({
      username: 'testuser', // Use actual username, not email
      password: 'TestPass123!',
    });
    
    console.log('Login successful:', result);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

testLogin();
