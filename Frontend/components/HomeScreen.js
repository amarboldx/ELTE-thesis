import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigation } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from './context/AuthContext';


import OrderScreen from './OrderScreen';
import ReservationsScreen from './ReservationsScreen';
import MenuScreen from './MenuScreen';
import ShiftsScreen from './ShiftsScreen';
import ProfileScreen from './ProfileScreen';

const HomeScreen = () => {
  const { setIsLoggedIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [roles, setRoles] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const user = await AsyncStorage.getItem('username');
        const rolesString = await AsyncStorage.getItem('roles');
        setUsername(user || 'Guest');
        setRoles(JSON.parse(rolesString || '[]'));
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    getUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const [routes] = useState([
    { key: 'orders', title: 'Orders', icon: 'cart-outline' },
    { key: 'reservations', title: 'Reservations', icon: 'calendar-outline' },
    { key: 'menu', title: 'Menu', icon: 'food-outline' },
    { key: 'shifts', title: 'Shifts', icon: 'clock-outline' },
    { key: 'profile', title: 'Profile', icon: 'account-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    orders: () => <OrderScreen />,
    reservations: () => <ReservationsScreen />,
    menu: () => <MenuScreen />,
    shifts: () => <ShiftsScreen />,
    profile: () => (
      <ProfileScreen
        username={username}
        roles={roles}
        onLogout={handleLogout} 
      />
    ),
  });

  return (
    <View style={styles.container}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        barStyle={{ backgroundColor: '#6200ee' }}
        renderIcon={({ route, focused, color }) => (
          <MaterialCommunityIcons
            name={route.icon}
            size={24}
            color={color}
          />
        )}
        getLabelText={({ route }) => route.title}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default HomeScreen;