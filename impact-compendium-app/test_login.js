// Test login with AWS SDK directly
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const testLogin = async () => {
  try {
    console.log('Testing Cognito login...');
    
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: '***REMOVED***',
      AuthParameters: {
        USERNAME: 'jucacar28@hotmail.com',
        PASSWORD: '***REMOVED***'
      }
    });

    const response = await client.send(command);
    console.log('✅ Login successful!');
    console.log('Challenge Name:', response.ChallengeName);
    console.log('Session:', response.Session ? 'Present' : 'None');
    
    if (response.AuthenticationResult) {
      console.log('Access Token:', response.AuthenticationResult.AccessToken.substring(0, 20) + '...');
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.message);
  }
};

testLogin();
