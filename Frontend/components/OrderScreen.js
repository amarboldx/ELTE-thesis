import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';

const OrderScreen = () => {
  const [orders, setOrders] = useState([]);
  const [itemMap, setItemMap] = useState({});
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
        fetchOrders();
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/order');
      console.log('Orders response:', response.data);

      const allItemIds = response.data.flatMap(order => order.itemIds);
      await fetchItemNames(allItemIds);

      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response) {
        setError(`Failed to load orders. Server returned ${err.response.status}`);
      } else {
        setError('An error occurred while fetching orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchItemNames = async (itemIds) => {
    try {
      if (itemIds.length === 0) return;
      
      const response = await api.post('/menu/list-id', itemIds);
      console.log('Fetched Items:', response.data);
      
      const itemDictionary = response.data.reduce((acc, item) => {
        acc[item.id] = item.name;
        return acc;
      }, {});

      setItemMap(itemDictionary);
    } catch (err) {
      console.error('Error fetching item names:', err);
    }
  };

  const refreshOrders = () => {
    if (token) {
      fetchOrders();
    } else {
      checkToken();
    }
  };

  const groupItems = (itemIds) => {
    const grouped = {};
    
    itemIds.forEach(id => {
      const itemName = itemMap[id] || `Item ID: ${id}`;
      grouped[itemName] = (grouped[itemName] || 0) + 1;
    });

    return Object.entries(grouped).map(([name, count]) => `${count} x ${name}`);
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Order #{item.id}</Title>
        <Paragraph>Table ID: {item.tableDataId}</Paragraph>
        <Paragraph>Date: {new Date(item.date).toLocaleString()}</Paragraph>
        <Paragraph>Status: {item.status}</Paragraph>
        <Paragraph>Staff ID: {item.staffId}</Paragraph>
        <Paragraph>Ordered Items:</Paragraph>
        {groupItems(item.itemIds).map((groupedItem, index) => (
          <Text key={index} style={styles.itemText}>{groupedItem}</Text>
        ))}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loaderText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>

      <View style={styles.debugContainer}>
        <Text>Token status: {token ? 'Present' : 'Not found'}</Text>
        <Button title="Refresh Orders" onPress={refreshOrders} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : orders.length === 0 ? (
        <Text style={styles.emptyText}>No orders found</Text>
      ) : (
        <FlatList
          data={orders}
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
  itemText: {
    fontSize: 14,
    marginLeft: 10,
  },
});

export default OrderScreen;
