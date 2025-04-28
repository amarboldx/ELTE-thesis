// AppNavigator.js
import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './context/AuthContext';

import LoginScreen from './LoginScreen';
import HomeScreen from './HomeScreen';
import AddOrderScreen from './AddOrderScreen';
import AddReservationScreen from './AddReservationScreen ';
import AddMenuScreen from './AddMenuScreen';


const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
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
  
  if (isLoading) {
    return null;
  }
  
  return (
    <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isLoggedIn ? (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="AddOrder" component={AddOrderScreen} />
                <Stack.Screen name="AddReservation" component={AddReservationScreen} />
                <Stack.Screen name="AddMenu" component={AddMenuScreen} />
              </>
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>

      
    </NavigationContainer>
  );
};

export default AppNavigator;