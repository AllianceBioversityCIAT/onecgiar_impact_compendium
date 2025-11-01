const { spawn } = require('child_process');
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
      }
    ];
    this.results = [];
  }

  async runAllScenarios() {
    console.log('🧪 Impact Compendium - Complete Test Suite');
    console.log('==========================================');
    console.log(`Running ${this.testScenarios.length} test scenarios...\n`);

    for (const scenario of this.testScenarios) {
      console.log(`🚀 Starting ${scenario.name} Tests`);
      console.log(`📝 ${scenario.description}`);
      console.log('─'.repeat(50));
      
      const success = await this.runScenario(scenario);
      this.results.push({
        name: scenario.name,
        success: success,
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
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`Total Scenarios: ${this.results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    
    console.log('\nDetailed Results:');
    this.results.forEach(result => {
      console.log(`  ${result.success ? '✅' : '❌'} ${result.name}`);
    });
    
    if (failed === 0) {
      console.log('\n🎉 All test scenarios completed successfully!');
      console.log('📸 Screenshots saved to: test-results/screenshots/');
    } else {
      console.log('\n⚠️  Some test scenarios failed. Check the output above for details.');
    }
    
    console.log('\nAvailable individual test commands:');
    this.testScenarios.forEach(scenario => {
      console.log(`  npm run ${scenario.script}`);
    });
  }
}

// Run all scenarios
const runner = new MasterTestRunner();
runner.runAllScenarios();
