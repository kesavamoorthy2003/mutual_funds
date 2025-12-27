import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User { 
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'CUSTOMER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access'); 
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  };

  const login = async (username: string, password: string) => {
    const response = await authAPI.login(username, password);

    localStorage.setItem('access', response.data.access); 
    localStorage.setItem('refresh', response.data.refresh); 

    const userResponse = await authAPI.getCurrentUser();
    setUser(userResponse.data);
  };

  const register = async (data: any) => {
    await authAPI.register(data);

    const loginRes = await authAPI.login(data.username, data.password);
    localStorage.setItem('access', loginRes.data.access);
    localStorage.setItem('refresh', loginRes.data.refresh);

    const userResponse = await authAPI.getCurrentUser();
    setUser(userResponse.data);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAdmin: user?.role === 'ADMIN',
        isCustomer: user?.role === 'CUSTOMER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
