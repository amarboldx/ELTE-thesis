import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';

const ReservationsScreen = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwtToken');
      console.log('Stored Token:', storedToken);
      setToken(storedToken);

      if (storedToken) {
        fetchReservations();
      } else {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error getting token:', err);
      setError('Error checking authentication status');
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservations');

      console.log('Reservations response:', response.data);
      setReservations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      if (err.response) {
        console.log('Error response:', err.response.status, err.response.data);
        setError(`Failed to load reservations. Server returned ${err.response.status}`);
      } else if (err.request) {
        console.log('Error request:', err.request);
        setError('No response received from server');
      } else {
        setError('An error occurred while fetching reservations');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshReservations = () => {
    if (token) {
      fetchReservations();
    } else {
      checkToken();
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Reservation #{item.id}</Title>
        <Paragraph>Customer: {item.customerName}</Paragraph>
        <Paragraph>Table ID: {item.tableId}</Paragraph>
        <Paragraph>Start: {new Date(item.startTime).toLocaleString()}</Paragraph>
        <Paragraph>End: {new Date(item.endTime).toLocaleString()}</Paragraph>
        <Paragraph>Status: {item.status}</Paragraph>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loaderText}>Loading reservations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reservations</Text>

      <View style={styles.debugContainer}>
        <Text>Token status: {token ? 'Present' : 'Not found'}</Text>
        <Button title="Refresh Reservations" onPress={refreshReservations} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : reservations.length === 0 ? (
        <Text style={styles.emptyText}>No reservations found</Text>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  debugContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#757575',
  },
});

export default ReservationsScreen;
