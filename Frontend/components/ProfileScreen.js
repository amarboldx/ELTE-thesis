import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';


const ProfileScreen = ({ username, roles, onLogout }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.welcome}>Welcome, {username}</Text>
      <Text style={styles.roles}>Roles: {roles.join(', ')}</Text>
      <Button
        mode="contained"
        onPress={onLogout}
        style={styles.logoutButton}
        icon="logout"
      >
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  roles: {
    fontSize: 18,
    marginVertical: 10,
  },
  logoutButton: {
    marginTop: 20,
    width: '80%',
  },
});

export default ProfileScreen;