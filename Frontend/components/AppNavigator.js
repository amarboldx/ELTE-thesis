import React, { useContext, useEffect, useState, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './context/AuthContext';
import { setNavigationRef } from './config/api';

import LoginScreen from './LoginScreen';
import HomeScreen from './HomeScreen';
import AddOrderScreen from './AddOrderScreen';
import AddReservationScreen from './AddReservationScreen ';
import AddMenuScreen from './AddMenuScreen';
import AddShiftScreen from './AddShiftScreen';
import EditShiftScreen from './EditShiftScreen';
import RegisterScreen from './RegisterScreen';
import ShiftsScreen from './ShiftsScreen';
import OrderScreen from './OrderScreen';
import TableScreen from './TableScreen';
import Receipt from './Receipt';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isLoggedIn, setIsLoggedIn, logout } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (token) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLoginStatus();
  }, []);

  // Set up logout callback for API interceptor
  useEffect(() => {
    const setupLogoutHandler = () => {
      const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
      };
      
      // Import and set the callback
      const apiModule = require('./config/api');
      apiModule.setOnLogout(handleLogout);
    };
    
    setupLogoutHandler();
  }, [logout, setIsLoggedIn]);

  if (isLoading) {
    return null;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddOrder" component={AddOrderScreen} />
          <Stack.Screen name="AddReservation" component={AddReservationScreen} />
          <Stack.Screen name="AddMenu" component={AddMenuScreen} />
          <Stack.Screen name="AddShift" component={AddShiftScreen} />
          <Stack.Screen name="EditShift" component={EditShiftScreen} />
          <Stack.Screen name="ShiftsScreen" component={ShiftsScreen} />
          <Stack.Screen name="OrderScreen" component={OrderScreen} />
          <Stack.Screen name="TableScreen" component={TableScreen} />
          <Stack.Screen name="Receipt" component={Receipt}/>
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;