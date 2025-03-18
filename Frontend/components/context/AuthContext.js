import React, { createContext, useState, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children, initialState = false }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(initialState);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
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