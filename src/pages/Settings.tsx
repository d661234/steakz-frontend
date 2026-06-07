import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Settings as SettingsIcon, User, Lock, Bell, Palette, Check } from 'lucide-react';
import { themeManager, ThemeMode, ThemeColor } from '../utils/themeManager';
import { diagnosticTests } from '../utils/diagnosticTests';
import { projectReview } from '../utils/projectReview';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(themeManager.getConfig().mode);
  const [themeColor, setThemeColor] = useState<ThemeColor>(themeManager.getConfig().primaryColor);
  const [notifications, setNotifications] = useState(true);
  const [diagnosticResults, setDiagnosticResults] = useState<any[]>([]);

  const handleThemeToggle = () => {
    const newTheme = themeManager.toggleMode();
    setTheme(newTheme);
  };

  const handleThemeColorChange = (color: ThemeColor) => {
    const newColor = themeManager.setColor(color);
    setThemeColor(newColor);
  };

  const handleNotificationToggle = () => {
    setNotifications(!notifications);
    toast.info(`Notifications ${notifications ? 'disabled' : 'enabled'}`);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const runDiagnostics = () => {
    const diagnosticResults = diagnosticTests.displayResults();
    const projectReviewResults = projectReview.performFullReview();
    setDiagnosticResults([...diagnosticResults, ...projectReviewResults]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <SettingsIcon className="w-10 h-10 mr-4 text-gray-700" />
        <h1 className="text-4xl font-bold text-gray-800">System Settings</h1>
      </div>

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 mr-3 text-blue-500" />
              <h2 className="text-xl font-semibold">Profile Settings</h2>
            </div>
            <div className="space-y-4">
              <p><strong>Name:</strong> {user.firstName || 'Not set'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <button 
                onClick={handleLogout}
                className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Palette className="w-6 h-6 mr-3 text-purple-500" />
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <span>Dark Mode</span>
                <button 
                  onClick={handleThemeToggle}
                  className={`w-12 h-6 rounded-full ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                >
                  <span 
                    className={`absolute top-0.5 ${theme === 'dark' ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow-md transition-all`}
                  />
                </button>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Theme Color</h3>
                <div className="flex space-x-2">
                  {(['blue', 'green', 'purple', 'red', 'orange'] as ThemeColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => handleThemeColorChange(color)}
                      className={`w-8 h-8 rounded-full bg-theme-${color}-500 relative`}
                    >
                      {themeColor === color && (
                        <Check 
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" 
                          size={16} 
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Bell className="w-6 h-6 mr-3 text-green-500" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Enable Notifications</span>
                <button 
                  onClick={handleNotificationToggle}
                  className={`w-12 h-6 rounded-full ${notifications ? 'bg-green-600' : 'bg-gray-300'} relative`}
                >
                  <span 
                    className={`absolute top-0.5 ${notifications ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow-md transition-all`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Lock className="w-6 h-6 mr-3 text-red-500" />
              <h2 className="text-xl font-semibold">System Diagnostics</h2>
            </div>
            <div className="space-y-4">
              <button 
                onClick={runDiagnostics}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
              >
                Run Diagnostic Tests
              </button>
              {diagnosticResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Diagnostic Results</h3>
                  {diagnosticResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded mb-2 ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {result.name}: {result.passed ? 'PASSED' : 'FAILED'}
                      {result.message && <p className="text-xs mt-1">{result.message}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;