// App.js
import React, { useEffect, useState, useRef } from 'react';
import { AuthProvider } from './components/context/AuthContext';
import AppNavigator from './components/AppNavigator';
import NotificationService from './components/NotificationService';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { setNavigationRef } from './components/config/api';

const App = () => {
  const [initialAuthState, setInitialAuthState] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigationRef = useRef();

  useEffect(() => {
    // Only initialize SSE if user is logged in
    const initApp = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const isLoggedIn = !!token;
        setInitialAuthState(isLoggedIn);
        
        // Only initialize SSE if user is logged in
        if (isLoggedIn) {
          NotificationService.initialize();
        }
      } catch (error) {
        console.error('Error loading JWT token from storage:', error);
        setInitialAuthState(false);
      } finally {
        setIsAuthReady(true);
      }
    };

    initApp();

    return () => {
      // Clean up SSE connections when app unmounts
      NotificationService.stopAll();
    };
  }, []);

  if (!isAuthReady) {
    return null;
  }

  return (
    <AuthProvider initialState={initialAuthState}>
      <NavigationContainer 
        ref={navigationRef}
        onReady={() => {
          setNavigationRef(navigationRef);
        }}
      >
        <AppNavigator />
        <Toast />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;