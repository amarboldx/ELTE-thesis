import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import BASE_URL from './BASE_URL.js';
import NotificationService from '../NotificationService';

let navigationRef = null;
let isLogoutInProgress = false;

export const setNavigationRef = (navRef) => {
  navigationRef = navRef;
};

let onLogoutCallback = null;

export const setOnLogout = (fn) => {
  onLogoutCallback = fn;
};

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
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (response) {
      const status = response.status;
      const serverMessage = response.data?.message || response.data?.error || '';

      if (status === 401) {
        if (isLogoutInProgress) {
          return Promise.reject(error);
        }
        
        isLogoutInProgress = true;

        await AsyncStorage.removeItem('jwtToken');

        NotificationService.stopAll();

        if (typeof onLogoutCallback === 'function') {
          onLogoutCallback();
        }

        let userMessage = 'Your session has expired. Please log in again.';

        if (serverMessage.toLowerCase().includes('invalid token')) {
          userMessage = 'Your login token is no longer valid. Please sign in again.';
        } else if (serverMessage.toLowerCase().includes('expired')) {
          userMessage = 'You were signed out because your session expired.';
        }

        Alert.alert(
          'Signed out', 
          userMessage,
          [
            { 
              text: 'OK', 
              onPress: () => {
                isLogoutInProgress = false;

                if (navigationRef && navigationRef.current) {
                  navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }
              }
            }
          ]
        );
        setTimeout(() => {
          isLogoutInProgress = false;
        }, 3000);
      }
    }

    return Promise.reject(error);
  }
);

export default api;