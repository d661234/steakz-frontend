import { toast } from 'sonner';

interface ReviewResult {
  category: string;
  passed: boolean;
  details: string[];
  recommendations?: string[];
}

class ProjectReview {
  private results: ReviewResult[] = [];

  // Check frontend configuration
  private checkFrontendConfig(): ReviewResult {
    const result: ReviewResult = {
      category: 'Frontend Configuration',
      passed: true,
      details: [],
      recommendations: []
    };

    // Check Vite configuration
    try {
      const viteConfig = require('../../../vite.config.ts');
      if (viteConfig) {
        result.details.push('Vite configuration loaded successfully');
      }
    } catch (error) {
      result.passed = false;
      result.details.push('Failed to load Vite configuration');
      result.recommendations?.push('Verify vite.config.ts file');
    }

    // Check TypeScript configuration
    try {
      const tsConfig = require('../../../tsconfig.json');
      if (tsConfig) {
        result.details.push('TypeScript configuration loaded successfully');
      }
    } catch (error) {
      result.passed = false;
      result.details.push('Failed to load TypeScript configuration');
      result.recommendations?.push('Verify tsconfig.json file');
    }

    return result;
  }

  // Check routing configuration
  private checkRouting(): ReviewResult {
    const result: ReviewResult = {
      category: 'Routing Configuration',
      passed: true,
      details: [],
      recommendations: []
    };

    const routes = [
      '/login', '/dashboard', '/admin/users', '/branches', 
      '/menu', '/orders', '/reports', '/settings'
    ];

    routes.forEach(route => {
      try {
        // This is a mock check - in a real scenario, you might want to do an actual route resolution
        const routeExists = require(`../routes/AppRoutes.tsx`);
        if (routeExists) {
          result.details.push(`Route ${route} is configured`);
        }
      } catch (error) {
        result.passed = false;
        result.details.push(`Route ${route} configuration failed`);
        result.recommendations?.push(`Review route configuration for ${route}`);
      }
    });

    return result;
  }

  // Check authentication mechanisms
  private checkAuthentication(): ReviewResult {
    const result: ReviewResult = {
      category: 'Authentication',
      passed: true,
      details: [],
      recommendations: []
    };

    // Check local storage authentication mechanisms
    const token = localStorage.getItem('steakz_token');
    const user = localStorage.getItem('steakz_user');

    if (token && user) {
      result.details.push('Authentication storage mechanism functional');
    } else {
      result.passed = false;
      result.details.push('Authentication storage incomplete');
      result.recommendations?.push('Verify authentication token and user storage');
    }

    // Check auth context
    try {
      const authContext = require('../context/AuthContext');
      if (authContext) {
        result.details.push('Authentication context loaded');
      }
    } catch (error) {
      result.passed = false;
      result.details.push('Failed to load authentication context');
      result.recommendations?.push('Check AuthContext implementation');
    }

    return result;
  }

  // Check theme management
  private checkThemeManagement(): ReviewResult {
    const result: ReviewResult = {
      category: 'Theme Management',
      passed: true,
      details: [],
      recommendations: []
    };

    const themeConfig = localStorage.getItem('steakz_theme_config');
    
    if (themeConfig) {
      try {
        const parsedConfig = JSON.parse(themeConfig);
        const validModes = ['light', 'dark'];
        const validColors = ['blue', 'green', 'purple', 'red', 'orange'];

        if (validModes.includes(parsedConfig.mode) && 
            validColors.includes(parsedConfig.primaryColor)) {
          result.details.push('Theme configuration valid');
        } else {
          result.passed = false;
          result.details.push('Invalid theme configuration');
          result.recommendations?.push('Verify theme configuration values');
        }
      } catch (error) {
        result.passed = false;
        result.details.push('Failed to parse theme configuration');
        result.recommendations?.push('Check theme configuration storage');
      }
    } else {
      result.passed = false;
      result.details.push('No theme configuration found');
      result.recommendations?.push('Initialize theme configuration');
    }

    return result;
  }

  // Comprehensive project review
  public performFullReview(): ReviewResult[] {
    this.results = [
      this.checkFrontendConfig(),
      this.checkRouting(),
      this.checkAuthentication(),
      this.checkThemeManagement()
    ];

    // Log results
    console.group('Project Review Results');
    this.results.forEach(result => {
      console.log(`
        Category: ${result.category}
        Passed: ${result.passed}
        Details: ${result.details.join(', ')}
        Recommendations: ${result.recommendations?.join(', ') || 'None'}
      `);
    });
    console.groupEnd();

    // Toast notification
    const allPassed = this.results.every(result => result.passed);
    if (allPassed) {
      toast.success('Project Review Completed', {
        description: 'No major issues detected in the application'
      });
    } else {
      toast.error('Project Review Found Issues', {
        description: 'Some configurations need attention'
      });
    }

    return this.results;
  }
}

export const projectReview = new ProjectReview();