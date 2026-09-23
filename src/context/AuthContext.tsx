import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (userData: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Initial Load when the app opens
  useEffect(() => {
    const loadLocalUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');

        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAdmin(parsedUser.role === 'admin' || parsedUser.isAdmin === true || parsedUser.email === 'gokuldinesh32@gmail.com');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      }
    };
    loadLocalUser();
  }, []);

  const login = async (userData: any, token: string) => {
    // 🔥 THE FIX: We MUST await these so the token is physically on the device
    // BEFORE the ShopContext tries to make database calls!
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', token);

    setUser(userData);
    setIsAdmin(userData.role === 'admin' || userData.isAdmin === true || userData.email === 'gokuldinesh32@gmail.com');
    setIsAuthenticated(true);
  };

  const logout = async () => {
    // 🔥 Wipes everything clean instantly
    await AsyncStorage.multiRemove(['user', 'token', 'shop_cart', 'shop_wishlist']);
    setUser(null);
    setIsAdmin(false);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, logout }}>
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