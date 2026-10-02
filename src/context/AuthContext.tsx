import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role?: string; // Database role from MongoDB (e.g., 'admin', 'customer')
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (userData: User, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => { },
  logout: async () => { },
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stored session on app startup
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Failed to load storage auth', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (userData: User, authToken: string) => {
    try {
      setToken(authToken);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login storage error:', error);
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];

      await AsyncStorage.multiRemove(['token', 'user', 'shop_cart', 'shop_wishlist']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Database-driven RBAC check (Completely independent of hardcoded emails)
  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);