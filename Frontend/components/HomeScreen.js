import React, {useState, useEffect, useContext} from 'react';
import {View, StyleSheet, Platform, Text} from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BottomNavigation} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AuthContext} from './context/AuthContext';
import OrderScreen from './OrderScreen';
import ReservationsScreen from './ReservationsScreen';
import MenuScreen from './MenuScreen';
import ShiftsScreen from './ShiftsScreen';
import ProfileScreen from './ProfileScreen';
import TableScreen from './TableScreen';
import NotificationService from './NotificationService';
import api from './config/api';

const HomeScreen = ({navigation}) => {
  const {setIsLoggedIn} = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('WAITER');
  const [index, setIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reservationUnreadCount, setReservationUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const isIOS = Platform.OS === 'ios';
  const bottomBarHeight = isIOS ? 80 : 60;

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const user = await AsyncStorage.getItem('username');
        const roleString = await AsyncStorage.getItem('role');
        setUsername(user || 'Guest');
        setRole(roleString || '[]');
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    getUserInfo();
  }, []);

  useEffect(() => {
    NotificationService.initialize();
    NotificationService.setupSSE();
    NotificationService.setupReservationSSE();

    const unsubscribe = NotificationService.addCountListener(count => {
      console.log('🔔 Order count received:', count);
      setUnreadCount(count);
    });

    const unsubscribeReservation = 
      NotificationService.addReservationCountListener(count => {
        setReservationUnreadCount(count);
      });

    return () => {
      unsubscribe();
      unsubscribeReservation();
      if (NotificationService.sseEmitter) 
        NotificationService.sseEmitter.close();
      if (NotificationService.reservationEmitter) 
        NotificationService.reservationEmitter.close();
    };
  }, []);

  useEffect(() => {
    const unsubscribeNavigation = navigation.addListener('state', () => {
      const currentRoute =
        navigation.getState()?.routes[navigation.getState().index]?.name;
      if (currentRoute === 'Home') {
        const tabRoute = routes[index].key;
        NotificationService.setCurrentScreen(tabRoute);
      } else {
        NotificationService.setCurrentScreen(null);
      }
    });

    const unsubscribeNotification = NotificationService.addNotificationListener(
      notification => {
      Toast.show({
        type: 'info',
        text1: notification.title || 'Notification',
        text2: notification.message,
        visibilityTime: 3000,
        autoHide: true,
      });
        
      },
    );

    return () => {
      unsubscribeNavigation();
      unsubscribeNotification();
      NotificationService.setCurrentScreen(null);
    };
  }, [navigation, index]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      setIsLoggedIn(false);
      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const [routes] = useState([
    {key: 'orders', title: 'Orders', icon: 'cart-outline'},
    {key: 'reservations', title: 'Reservations', icon: 'calendar-outline'},
    {key: 'menu', title: 'Menu', icon: 'food-outline'},
    {key: 'shifts', title: 'Shifts', icon: 'clock-outline'},
    {key: 'tables', title: 'Tables', icon: 'table-chair'},
    {key: 'profile', title: 'Profile', icon: 'account-outline'},
  ]);

  const renderScene = BottomNavigation.SceneMap({
    orders: () => <OrderScreen />,
    reservations: () => <ReservationsScreen />,
    menu: () => <MenuScreen />,
    shifts: () => <ShiftsScreen />,
    tables: () => <TableScreen />,
    profile: () => (
      <ProfileScreen username={username} role={role} onLogout={handleLogout} />
    ),
  });

  const renderIcon = ({route, focused, color}) => {
    const showBadge = 
      (route.key === 'reservations' && reservationUnreadCount > 0) || 
      (route.key === 'orders' && unreadCount > 0);

    return (
      <View>
        <MaterialCommunityIcons name={route.icon} size={24} color={color} />
        {showBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {route.key === 'reservations' 
                ? reservationUnreadCount > 9 ? '9+' : reservationUnreadCount
                : unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BottomNavigation
        navigationState={{index, routes}}
        onIndexChange={setIndex}
        renderScene={renderScene}
        barStyle={[styles.bottomBar, {height: bottomBarHeight}]}
        renderIcon={renderIcon}
        getLabelText={({route}) => route.title}
      />

      <View style={styles.notificationContainer}>
        {notifications.map(notification => (
          <View
            key={notification.id}
            style={[
              styles.notification,
              notification.type === 'order'
                ? styles.orderNotification
                : styles.reservationNotification,
            ]}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>
              {notification.message}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bottomBar: {
    backgroundColor: '#6200ee',
    marginBottom: Platform.OS === 'ios' ? 20 : 20,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  notification: {
    width: '90%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderNotification: {
    backgroundColor: '#6200ee',
  },
  reservationNotification: {
    backgroundColor: '#4CAF50',
  },
  notificationTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  notificationMessage: {
    color: 'white',
    fontSize: 14,
  },
});

export default HomeScreen;