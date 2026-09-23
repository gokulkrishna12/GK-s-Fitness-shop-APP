import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthContext';
import api from '../services/api';

export interface Product {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  image?: string;
  [key: string]: any; 
}

export interface CartItem {
  product: Product;
  qty: number;
}

interface ShopContextType {
  cart: CartItem[];
  wishlist: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    const fetchDatabaseState = async () => {
      // 🛑 FIX: If NOT authenticated (logout triggered), instantly wipe state to empty
      if (!isAuthenticated) {
        setCart([]);
        setWishlist([]);
        return; 
      }

      const token = await AsyncStorage.getItem('token');
      
      // If user has a token, ONLY pull from the database. Never upload empty state.
      if (token) {
        try {
          const res = await api.get('/auth/data'); 
          if (res.data) {
            setCart(res.data.cart || []);
            setWishlist(res.data.wishlist || []);
            await AsyncStorage.setItem('shop_cart', JSON.stringify(res.data.cart || []));
            await AsyncStorage.setItem('shop_wishlist', JSON.stringify(res.data.wishlist || []));
          }
        } catch (error) {
          console.error("Failed to download cart/wishlist", error);
        }
      }
    };

    fetchDatabaseState();
  }, [isAuthenticated]); // Re-runs instantly whenever login or logout happens

  const syncStateToDatabase = async (newCart: CartItem[], newWishlist: Product[]) => {
    setCart(newCart);
    setWishlist(newWishlist);

    try {
      await AsyncStorage.setItem('shop_cart', JSON.stringify(newCart));
      await AsyncStorage.setItem('shop_wishlist', JSON.stringify(newWishlist));

      const token = await AsyncStorage.getItem('token');
      if (token) {
        await api.post('/auth/sync', { cart: newCart, wishlist: newWishlist });
      }
    } catch (err) {
      console.error("Explicit Sync failed", err);
    }
  };

  const addToCart = (product: Product) => {
    const id = product._id || product.id;
    if (!id) return;
    let newCart = [...cart];
    const existingIdx = newCart.findIndex(item => (item.product._id || item.product.id) === id);
    if (existingIdx >= 0) {
      newCart[existingIdx] = { ...newCart[existingIdx], qty: newCart[existingIdx].qty + 1 };
    } else {
      newCart.push({ product, qty: 1 });
    }
    Toast.show({ type: 'success', text1: 'Added to cart!', text2: product.name });
    syncStateToDatabase(newCart, wishlist);
  };

  const removeFromCart = (id: string) => {
    const newCart = cart.filter(item => (item.product._id || item.product.id) !== id);
    syncStateToDatabase(newCart, wishlist);
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return removeFromCart(id);
    const newCart = cart.map(item => (item.product._id || item.product.id) === id ? { ...item, qty } : item);
    syncStateToDatabase(newCart, wishlist);
  };

  const clearCart = () => syncStateToDatabase([], wishlist);

  const toggleWishlist = (product: Product) => {
    const id = product._id || product.id;
    if (!id) return;
    const exists = wishlist.some(item => (item._id || item.id) === id);
    let newWishlist;
    if (exists) {
      newWishlist = wishlist.filter(item => (item._id || item.id) !== id);
      Toast.show({ type: 'info', text1: 'Removed from wishlist' });
    } else {
      newWishlist = [...wishlist, product];
      Toast.show({ type: 'success', text1: 'Added to wishlist!' });
    }
    syncStateToDatabase(cart, newWishlist);
  };

  const isInWishlist = (id: string) => wishlist.some(item => (item._id || item.id) === id);
  const getCartTotal = () => cart.reduce((total, item) => total + (item.product.price * item.qty), 0);
  const getCartCount = () => cart.reduce((count, item) => count + item.qty, 0);

  return (
    <ShopContext.Provider value={{
      cart, wishlist, addToCart, removeFromCart, updateQuantity, clearCart,
      toggleWishlist, isInWishlist, getCartTotal, getCartCount
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) throw new Error('useShop must be used within a ShopProvider');
  return context;
};