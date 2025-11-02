const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

class MasterTestRunner {
  constructor() {
    this.testScenarios = [
      {
        name: 'Authentication',
        script: 'test:auth-scenario',
        description: 'Login form, validation, and authentication flow'
      },
      {
        name: 'Dashboard',
        script: 'test:dashboard-scenario', 
        description: 'Dashboard layout, navigation, and data display'
      },
      {
        name: 'Studies Management',
        script: 'test:studies-scenario',
        description: 'Study creation, editing, and management features'
      },
      {
        name: 'Authenticated Features',
        script: 'test:authenticated',
        description: 'Full application testing with valid credentials'
      }
    ];
    this.results = [];
    this.credentials = null;
  }

  async promptForCredentials() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🔐 Authenticated Testing Setup');
    console.log('==============================');
    console.log('To test authenticated features, please provide login credentials:');
    console.log('(Press Enter to skip authenticated testing)\n');

    return new Promise((resolve) => {
      rl.question('Email: ', (email) => {
        if (!email.trim()) {
          console.log('⏭️  Skipping authenticated testing\n');
          rl.close();
          resolve(null);
          return;
        }

        rl.question('Password: ', (password) => {
          rl.close();
          console.log(`✅ Credentials provided for: ${email}\n`);
          resolve({ email: email.trim(), password: password.trim() });
        });
      });
    });
  }

  async updateAuthenticatedTestCredentials(credentials) {
    const fs = require('fs');
    const authTestPath = 'tests/scenarios/authenticated-test.cjs';
    
    try {
      let content = fs.readFileSync(authTestPath, 'utf8');
      
      // Replace credentials in the file
      const credentialsRegex = /this\.credentials = \{[\s\S]*?\};/;
      const newCredentials = `this.credentials = {
      email: '${credentials.email}',
      password: '${credentials.password}'
    };`;
      
      content = content.replace(credentialsRegex, newCredentials);
      fs.writeFileSync(authTestPath, content);
      
      console.log('✅ Credentials updated in authenticated test file');
    } catch (error) {
      console.error('❌ Failed to update credentials:', error.message);
    }
  }

  async runAllScenarios() {
    console.log('🧪 Impact Compendium - Complete Test Suite');
    console.log('==========================================');
    
    // Prompt for credentials before starting tests
    this.credentials = await this.promptForCredentials();
    
    if (this.credentials) {
      await this.updateAuthenticatedTestCredentials(this.credentials);
    }
    
    console.log(`Running ${this.testScenarios.length} test scenarios...\n`);

    for (const scenario of this.testScenarios) {
      // Skip authenticated test if no credentials provided
      if (scenario.name === 'Authenticated Features' && !this.credentials) {
        console.log(`⏭️  Skipping ${scenario.name} (no credentials provided)\n`);
        this.results.push({
          name: scenario.name,
          success: true,
          skipped: true,
          script: scenario.script
        });
        continue;
      }

      console.log(`🚀 Starting ${scenario.name} Tests`);
      console.log(`📝 ${scenario.description}`);
      console.log('─'.repeat(50));
      
      const success = await this.runScenario(scenario);
      this.results.push({
        name: scenario.name,
        success: success,
        skipped: false,
        script: scenario.script
      });
      
      console.log('─'.repeat(50));
      console.log(`${success ? '✅' : '❌'} ${scenario.name} tests ${success ? 'completed' : 'failed'}\n`);
    }

    this.printSummary();
  }

  async runScenario(scenario) {
    return new Promise((resolve) => {
      const child = spawn('npm', ['run', scenario.script], {
        stdio: 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        resolve(code === 0);
      });

      child.on('error', (error) => {
        console.error(`Error running ${scenario.name}:`, error.message);
        resolve(false);
      });
    });
  }

  printSummary() {
    console.log('📊 Test Execution Summary');
    console.log('=========================');
    
    const passed = this.results.filter(r => r.success && !r.skipped).length;
    const failed = this.results.filter(r => !r.success && !r.skipped).length;
    const skipped = this.results.filter(r => r.skipped).length;
    
    console.log(`Total Scenarios: ${this.results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    if (skipped > 0) {
      console.log(`Skipped: ${skipped} ⏭️`);
    }
    
    console.log('\nDetailed Results:');
    this.results.forEach(result => {
      if (result.skipped) {
        console.log(`  ⏭️  ${result.name} (skipped)`);
      } else {
        console.log(`  ${result.success ? '✅' : '❌'} ${result.name}`);
      }
    });
    
    if (failed === 0) {
      console.log('\n🎉 All test scenarios completed successfully!');
      console.log('📸 Screenshots saved to: test-results/screenshots/');
      
      if (this.credentials) {
        console.log('🔐 Authenticated features were tested with provided credentials');
      }
    } else {
      console.log('\n⚠️  Some test scenarios failed. Check the output above for details.');
    }
    
    console.log('\nAvailable individual test commands:');
    this.testScenarios.forEach(scenario => {
      console.log(`  npm run ${scenario.script}`);
    });
    
    if (skipped > 0) {
      console.log('\n💡 To test authenticated features, run with credentials:');
      console.log('  node tests/run-all-scenarios.cjs');
    }
  }
}

// Run all scenarios
const runner = new MasterTestRunner();
runner.runAllScenarios();
