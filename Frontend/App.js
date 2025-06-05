import React, { useEffect } from 'react';
import { AuthProvider } from './components/context/AuthContext';
import AppNavigator from './components/AppNavigator';
import NotificationService from './components/NotificationService';
import Toast from 'react-native-toast-message';

const App = () => {
  useEffect(() => {
    NotificationService.initialize();

    return () => {
      if (NotificationService.sseEmitter) {
        NotificationService.sseEmitter.close();
      }
      if (NotificationService.reservationEmitter) {
        NotificationService.reservationEmitter.close();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <>
        <AppNavigator />
        <Toast />
      </>
    </AuthProvider>
  );
};

export default App;
