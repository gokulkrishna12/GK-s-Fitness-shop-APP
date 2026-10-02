import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role?: string;
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

  // 🔥 NEW: Background function to safely sync the Push Token to MongoDB
  const syncPushToken = async () => {
    try {
      if (!Device.isDevice) return;
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

      // Post the token to the correct /auth/push-token backend route
      await api.post('/auth/push-token', { expoPushToken: tokenData.data });
      console.log("✅ Push Token successfully saved to MongoDB!");
    } catch (error) {
      console.log('⚠️ Push token sync failed:', error);
    }
  };

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          // 🔥 Automatically sync token when app restores session
          syncPushToken();
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

      // 🔥 Automatically sync token instantly upon manual login
      syncPushToken();
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

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);