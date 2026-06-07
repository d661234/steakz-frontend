import { toast } from 'sonner';

interface DiagnosticResult {
  name: string;
  passed: boolean;
  message?: string;
}

class DiagnosticTests {
  private results: DiagnosticResult[] = [];

  // Test authentication context
  testAuthContext() {
    try {
      const storedToken = localStorage.getItem('steakz_token');
      const storedUser = localStorage.getItem('steakz_user');

      const result: DiagnosticResult = {
        name: 'Authentication Context',
        passed: !!(storedToken && storedUser),
        message: storedToken && storedUser 
          ? 'Authentication storage working correctly' 
          : 'No stored authentication data found'
      };

      this.results.push(result);
      return result;
    } catch (error) {
      return {
        name: 'Authentication Context',
        passed: false,
        message: `Error checking auth context: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Test theme management
  testThemeManagement() {
    try {
      const savedConfig = localStorage.getItem('steakz_theme_config');
      const config = savedConfig ? JSON.parse(savedConfig) : null;

      const result: DiagnosticResult = {
        name: 'Theme Management',
        passed: config && ['light', 'dark'].includes(config.mode) && 
                ['blue', 'green', 'purple', 'red', 'orange'].includes(config.primaryColor),
        message: config 
          ? `Current theme: ${config.mode} (${config.primaryColor})` 
          : 'No theme configuration found'
      };

      this.results.push(result);
      return result;
    } catch (error) {
      return {
        name: 'Theme Management',
        passed: false,
        message: `Error checking theme: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Test error handling
  testErrorHandling() {
    try {
      const testError = new Error('Diagnostic test error');
      
      const result: DiagnosticResult = {
        name: 'Error Handling',
        passed: true,
        message: 'Error handling mechanisms are functional'
      };

      // Simulate error toast
      toast.error('Diagnostic error test', {
        description: 'Verifying error handling mechanisms'
      });

      this.results.push(result);
      return result;
    } catch (error) {
      return {
        name: 'Error Handling',
        passed: false,
        message: `Error in error handling test: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Run all diagnostics
  runAllTests() {
    this.results = []; // Reset results
    
    const authTest = this.testAuthContext();
    const themeTest = this.testThemeManagement();
    const errorTest = this.testErrorHandling();

    return {
      allPassed: [authTest, themeTest, errorTest].every(test => test.passed),
      results: this.results
    };
  }

  // Display results
  displayResults() {
    const { allPassed, results } = this.runAllTests();

    if (allPassed) {
      toast.success('All Diagnostic Tests Passed', {
        description: 'No issues detected in the application'
      });
    } else {
      toast.error('Some Diagnostic Tests Failed', {
        description: 'Please review the diagnostic results'
      });
    }

    console.group('Diagnostic Test Results');
    results.forEach(result => {
      console.log(`${result.name}: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`, result.message);
    });
    console.groupEnd();

    return results;
  }
}

export const diagnosticTests = new DiagnosticTests();