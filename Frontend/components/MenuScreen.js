import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';

const MenuScreen = () => {
  const [menuItems, setMenuItems] = useState([]);
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
        fetchMenuItems();
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
  

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/menu/get');
  
      console.log('Menu response:', response.data);
      setMenuItems(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      if (err.response) {
        console.log('Error response:', err.response.status, err.response.data);
        setError(`Failed to load menu items. Server returned ${err.response.status}`);
      } else if (err.request) {
        console.log('Error request:', err.request);
        setError('No response received from server');
      } else {
        setError('An error occurred while fetching menu items');
      }
    } finally {
      setLoading(false);
    }
  };
  

  const refreshMenu = () => {
    if (token) {
      fetchMenuItems(token);
    } else {
      checkToken();
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>{item.description}</Paragraph>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          {item.category && <Text style={styles.category}>{item.category}</Text>}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loaderText}>Loading menu items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
      
      <View style={styles.debugContainer}>
        <Text>Token status: {token ? 'Present' : 'Not found'}</Text>
        <Button title="Refresh Menu" onPress={refreshMenu} />
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : menuItems.length === 0 ? (
        <Text style={styles.emptyText}>No menu items available</Text>
      ) : (
        <FlatList
          data={menuItems}
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
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  category: {
    fontSize: 14,
    color: '#757575',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
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

export default MenuScreen;