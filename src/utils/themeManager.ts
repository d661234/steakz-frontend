import { toast } from 'sonner';

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'blue' | 'green' | 'purple' | 'red' | 'orange';

interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: ThemeColor;
}

class ThemeManager {
  private static instance: ThemeManager;
  private config: ThemeConfig;

  private constructor() {
    // Load from localStorage or use default
    const savedConfig = localStorage.getItem('steakz_theme_config');
    this.config = savedConfig 
      ? JSON.parse(savedConfig) 
      : { mode: 'light', primaryColor: 'blue' };
    
    this.applyTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private applyTheme() {
    // Apply dark/light mode
    document.documentElement.classList.toggle('dark', this.config.mode === 'dark');

    // Apply color theme
    document.documentElement.setAttribute('data-theme', this.config.primaryColor);

    // Save to localStorage
    localStorage.setItem('steakz_theme_config', JSON.stringify(this.config));
  }

  public toggleMode() {
    this.config.mode = this.config.mode === 'light' ? 'dark' : 'light';
    this.applyTheme();
    toast.success(`Switched to ${this.config.mode} mode`);
    return this.config.mode;
  }

  public setColor(color: ThemeColor) {
    this.config.primaryColor = color;
    this.applyTheme();
    toast.success(`Theme color changed to ${color}`);
    return color;
  }

  public getConfig(): ThemeConfig {
    return { ...this.config };
  }
}

export const themeManager = ThemeManager.getInstance();