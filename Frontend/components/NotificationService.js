import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventSource from 'react-native-sse';
import BASE_URL from './config/BASE_URL';

class NotificationService {
  constructor() {
    this.sseEmitter = null;
    this.reservationEmitter = null;
    this.listeners = [];
    this.reservationListeners = [];
    this.unreadCount = 0;
    this.reservationUnreadCount = 0;
    this.countListeners = [];
    this.reservationCountListeners = [];
    this.appState = AppState.currentState;
    this.currentScreen = null;

    AppState.addEventListener('change', this.handleAppStateChange);
  }

  initialize = () => {
    this.setupSSE();
    this.setupReservationSSE();
  };

  handleAppStateChange = nextAppState => {
    console.log(`App state changed from ${this.appState} to ${nextAppState}`);

    if (
      this.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // Only reconnect if we don't have an active connection
      if (!this.isOrderSSEConnected()) {
        this.setupSSE();
      }
      if (!this.isReservationSSEConnected()) {
        this.setupReservationSSE();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // Don't close connections when app goes to background
      console.log('App in background, keeping SSE connections alive');
    }
    this.appState = nextAppState;
  };

  setupSSE = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    if (this.sseEmitter) {
      console.log('Closing existing SSE connection for orders');
      this.sseEmitter.close();
    }

    const eventSourceUrl = `${BASE_URL}/sse/orders`;

    console.log('Connecting to:', eventSourceUrl);

    this.sseEmitter = new EventSource(eventSourceUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.sseEmitter.addEventListener('open', () => {
      console.log('Order SSE connection opened');
    });

    this.sseEmitter.addEventListener('connection', event => {
      console.log('SSE connection confirmed:', event.data);
    });

    this.sseEmitter.addEventListener('order-event', event => {
      try {
        if (event.data) {
          const orderEvent = {
            eventType: event.lastEventId || 'updated',
            order: JSON.parse(event.data),
          };
          this.handleOrderEvent(orderEvent);
        }
      } catch (error) {
        console.error('Error parsing order event:', error);
      }
    });

    this.sseEmitter.addEventListener('error', error => {
      console.error('Order SSE error:', error);
      this.sseEmitter.close();
      setTimeout(this.setupSSE, 5000);
    });
  };

  setupReservationSSE = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    if (this.reservationEmitter) {
      console.log('Closing existing SSE connection for reservations');
      this.reservationEmitter.close();
    }

    const eventSourceUrl = `${BASE_URL}/sse/reservations`;

    this.reservationEmitter = new EventSource(eventSourceUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.reservationEmitter.addEventListener('open', () => {
      console.log('Reservation SSE connection opened');
    });

    this.reservationEmitter.addEventListener('connection', event => {
      console.log('Reservation SSE connection confirmed:', event.data);
    });

    this.reservationEmitter.addEventListener('reservation-event', event => {
      try {
        if (event.data) {
          const reservationEvent = {
            eventType: event.lastEventId || 'updated',
            reservation: JSON.parse(event.data),
          };
          this.handleReservationEvent(reservationEvent);
        }
      } catch (error) {
        console.error('Error parsing reservation event:', error);
      }
    });

    this.reservationEmitter.addEventListener('error', error => {
      console.error('Reservation SSE error:', error);
      this.reservationEmitter.close();
      setTimeout(this.setupReservationSSE, 5000);
    });
  };

  isOrderSSEConnected() {
    return this.sseEmitter && this.sseEmitter.readyState === 1;
  }

  isReservationSSEConnected() {
    return this.reservationEmitter && this.reservationEmitter.readyState === 1;
  }

  setCurrentScreen = screenName => {
    this.currentScreen = screenName;
    if (screenName === 'orders') {
      this.resetUnreadCount();
    } else if (screenName === 'reservations') {
      this.resetReservationUnreadCount();
    }
  };

  handleOrderEvent = orderEvent => {
    if (this.appState === 'active') {
      if (this.currentScreen !== 'orders') {
        this.incrementUnreadCount();
      }
      this.notifyListeners(orderEvent);
      if (this.currentScreen !== 'orders') {
        this.showOrderNotification(orderEvent);
      }
    }
  };

  handleReservationEvent = reservationEvent => {
      console.log('Received reservation event:', reservationEvent);
      
      if (this.appState === 'active') {
          if (this.currentScreen !== 'reservations') {
              this.incrementReservationUnreadCount();
          }
          
          const normalizedEvent = {
              eventType: reservationEvent.lastEventId || 'updated',
              reservation: reservationEvent.data || reservationEvent
          };
          
          this.notifyReservationListeners(normalizedEvent);
          
          if (this.currentScreen !== 'reservations') {
              this.showReservationNotification(normalizedEvent);
          }
      }
  };

  showOrderNotification = orderEvent => {
    let title, message;

    switch (orderEvent.eventType) {
      case 'created':
        title = 'New Order Created';
        message = `Order #${orderEvent.order.id} has been created`;
        break;
      case 'status-updated':
        title = 'Order Status Updated';
        message = `Order #${orderEvent.order.id} is now ${orderEvent.order.status}`;
        break;
      case 'deleted':
        title = 'Order Deleted';
        message = `Order #${orderEvent.order.id} has been deleted`;
        break;
      default:
        title = 'Order Update';
        message = `Order #${orderEvent.order.id} has been updated`;
    }

    const notification = {
      id: Date.now(),
      type: 'order',
      title,
      message,
      data: orderEvent,
    };
    this.notifyNotificationListeners(notification);
  };

  showReservationNotification = reservationEvent => {
    let title, message;

    switch (reservationEvent.eventType) {
      case 'created':
        title = 'New Reservation';
        message = `Reservation #${reservationEvent.reservation.id} created`;
        break;
      case 'updated':
      case 'status-updated': 
        title = 'Reservation Updated';
        message = `Reservation #${reservationEvent.reservation.id} is now ${reservationEvent.reservation.status}`;
        break;
      case 'deleted':
        title = 'Reservation Deleted';
        message = `Reservation #${reservationEvent.reservation.id} was deleted`;
        break;
      default:
        title = 'Reservation Update';
        message = `Reservation #${reservationEvent.reservation.id} updated`;
    }

    const notification = {
      id: Date.now(),
      type: 'reservation',
      title,
      message,
      data: reservationEvent,
    };
    this.notifyNotificationListeners(notification);
  };

  notificationListeners = [];

  addNotificationListener = listener => {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(
        l => l !== listener,
      );
    };
  };

  notifyNotificationListeners = notification => {
    this.notificationListeners.forEach(listener => listener(notification));
  };

  incrementUnreadCount = () => {
    this.unreadCount += 1;
    this.notifyCountListeners();
  };

  decrementUnreadCount = () => {
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    this.notifyCountListeners();
  };

  resetUnreadCount = () => {
    this.unreadCount = 0;
    this.notifyCountListeners();
  };

  incrementReservationUnreadCount = () => {
    this.reservationUnreadCount += 1;
    this.notifyReservationCountListeners();
  };

  resetReservationUnreadCount = () => {
    this.reservationUnreadCount = 0;
    this.notifyReservationCountListeners();
  };

  addReservationCountListener = listener => {
    this.reservationCountListeners.push(listener);
    return () => {
      this.reservationCountListeners = this.reservationCountListeners.filter(
        l => l !== listener,
      );
    };
  };

  notifyReservationCountListeners = () => {
    this.reservationCountListeners.forEach(listener =>
      listener(this.reservationUnreadCount),
    );
  };

  addListener = listener => {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  };

  addCountListener = listener => {
    this.countListeners.push(listener);
    return () => {
      this.countListeners = this.countListeners.filter(l => l !== listener);
    };
  };

  notifyListeners = event => {
    this.listeners.forEach(listener => listener(event));
  };

  notifyCountListeners = () => {
    this.countListeners.forEach(listener => listener(this.unreadCount));
  };

  addReservationListener = listener => {
    this.reservationListeners.push(listener);
    return () => {
      this.reservationListeners = this.reservationListeners.filter(
        l => l !== listener,
      );
    };
  };

  notifyReservationListeners = event => {
    this.reservationListeners.forEach(listener => listener(event));
  };

    stopAll = () => {
    if (this.sseEmitter) {
      this.sseEmitter.close();
      this.sseEmitter = null;
    }
    if (this.reservationEmitter) {
      this.reservationEmitter.close();
      this.reservationEmitter = null;
    }
    this.currentScreen = null;
    this.unreadCount = 0;
    this.reservationUnreadCount = 0;

    this.listeners = [];
    this.reservationListeners = [];
    this.countListeners = [];
    this.reservationCountListeners = [];
    this.notificationListeners = [];
  };
}

export default new NotificationService();