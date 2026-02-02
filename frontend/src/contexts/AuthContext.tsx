import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { loginClient, loginAdmin, logout as apiLogout, verifyToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('leadai_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('leadai_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await verifyToken();
        if (!result.valid) {
          // Token invalid, clear storage
          localStorage.removeItem('leadai_token');
          localStorage.removeItem('leadai_user');
          localStorage.removeItem('leadai_client_id');
          setUser(null);
        } else {
          // Token valid, update user data if needed (e.g. agentType might have changed)
          setUser(prev => {
            if (!prev) return null;
            const updated = {
              ...prev,
              id: result.client_id || prev.id,
              name: result.business_name || prev.name,
              agentType: result.agent_type || prev.agentType || 'text',
              voiceDirection: result.voice_direction || prev.voiceDirection || 'inbound'
            };
            // Update storage to keep it in sync
            localStorage.setItem('leadai_user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch {
        // Token verification failed, keep existing user state
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    try {
      let response;

      if (role === 'admin') {
        response = await loginAdmin(email, password);

        if (response.success && response.token) {
          const newUser: User = {
            id: 'admin',
            email,
            name: 'Admin',
            role: 'admin',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          };

          localStorage.setItem('leadai_token', response.token);
          localStorage.setItem('leadai_user', JSON.stringify(newUser));
          localStorage.setItem('leadai_admin_key', password); // Store admin key for API calls
          setUser(newUser);
          return true;
        }
      } else {
        response = await loginClient(email, password);

        if (response.success && response.token && response.client_id) {
          const newUser: User = {
            id: response.client_id,
            email,
            name: response.business_name || 'Client',
            role: 'client',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            agentType: response.agent_type || 'text',
            voiceDirection: response.voice_direction || 'inbound',
          };

          localStorage.setItem('leadai_token', response.token);
          localStorage.setItem('leadai_client_id', response.client_id);
          localStorage.setItem('leadai_user', JSON.stringify(newUser));
          setUser(newUser);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore logout API errors
    }

    localStorage.removeItem('leadai_token');
    localStorage.removeItem('leadai_client_id');
    localStorage.removeItem('leadai_user');
    localStorage.removeItem('leadai_admin_key');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
