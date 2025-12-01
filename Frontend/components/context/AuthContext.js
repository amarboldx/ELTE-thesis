import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children, initialState = false }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(initialState);

  

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      setIsLoggedIn(!!token);
    };

    checkToken();
  }, []);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('jwtToken');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error during logout:', error);
      setIsLoggedIn(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
