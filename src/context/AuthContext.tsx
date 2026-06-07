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

  useEffect(() => {
    const token = localStorage.getItem('steakz_token');
    const storedUser = localStorage.getItem('steakz_user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('steakz_token');
        localStorage.removeItem('steakz_user');
      }
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('steakz_token', token);
    localStorage.setItem('steakz_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    toast.success(`Welcome, ${userData.firstName || userData.email}!`);
  };

  const logout = () => {
    localStorage.removeItem('steakz_token');
    localStorage.removeItem('steakz_user');
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