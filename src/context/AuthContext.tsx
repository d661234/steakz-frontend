import React, { 
  createContext, 
  useState, 
  useContext, 
  ReactNode, 
  useEffect 
} from 'react';
import { UserRole } from '../types/index';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: UserRole;
  branch_id?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const clearAuthStorage = () => {
    localStorage.removeItem('steakz_token');
    localStorage.removeItem('steakz_user');
    localStorage.removeItem('steakz_session_expiry');
  };

  useEffect(() => {
    const token = localStorage.getItem('steakz_token');
    const storedUser = localStorage.getItem('steakz_user');
    const expiry = localStorage.getItem('steakz_session_expiry');

    if (token && storedUser && expiry) {
      const expiryTime = Number(expiry);
      if (Date.now() < expiryTime) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          return;
        } catch (error) {
          // fall through to clear invalid stored data
        }
      }
    }

    clearAuthStorage();
  }, []);

  const login = (token: string, userData: User) => {
    const expiryTime = Date.now() + ONE_WEEK_MS;
    localStorage.setItem('steakz_token', token);
    localStorage.setItem('steakz_user', JSON.stringify(userData));
    localStorage.setItem('steakz_session_expiry', expiryTime.toString());
    setUser(userData);
    setIsAuthenticated(true);
    toast.success(`Welcome, ${userData.firstName || userData.email}!`);
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const loginAsGuest = () => {
    const guestUser: User = {
      id: 'guest_' + Date.now(),
      email: 'guest@steakz.com',
      role: 'OPEN_ACCESS',
      firstName: 'Guest'
    };

    // Generate a temporary token for guest
    const guestToken = `guest_${Math.random().toString(36).substring(2)}`;
    
    login(guestToken, guestUser);
    toast.info('Logged in as Guest', {
      description: 'Limited access mode activated'
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      logout,
      loginAsGuest 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};