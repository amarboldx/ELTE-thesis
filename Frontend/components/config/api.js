import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './BASE_URL.js';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('jwtToken');

    const isAuthRoute =
      config.url.includes('/api/v1/users/register') ||
      config.url.includes('/api/v1/users/login');

    if (token && !isAuthRoute) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
