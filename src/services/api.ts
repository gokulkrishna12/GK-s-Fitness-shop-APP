import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

// 100% connected to your AWS EC2 server
const API_URL = 'http://100.48.98.100:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user', 'shop_cart', 'shop_wishlist']);
      Toast.show({ type: 'error', text1: 'Session expired. Please log in again.' });
      router.replace('/Auth/login' as any);
    }
    return Promise.reject(error);
  }
);

export default api;