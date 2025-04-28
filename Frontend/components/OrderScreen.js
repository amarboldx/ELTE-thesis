import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Switch } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from './config/api';

const statuses = ['IN_PROGRESS', 'PENDING', 'COMPLETED', 'CANCELLED'];

const OrderScreen = () => {
  const [orders, setOrders] = useState([]);
  const [itemMap, setItemMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [statusFilter, setStatusFilter] = useState('IN_PROGRESS');
  const [onlyMine, setOnlyMine] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    checkToken();
  }, [statusFilter, onlyMine]);

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwtToken');
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
      const endpoint = onlyMine
        ? `/order/staff/status/${statusFilter}`
        : `/order/status/${statusFilter}`;

      const response = await api.get(endpoint);
      const allItemIds = response.data.flatMap(order => order.itemIds || []);
      await fetchItemNames(allItemIds);

      // Sort orders by date (latest first)
      const sortedOrders = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));

      setOrders(sortedOrders);
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
      const itemDictionary = response.data.reduce((acc, item) => {
        acc[item.id] = item.name;
        return acc;
      }, {});
      setItemMap(itemDictionary);
    } catch (err) {
      console.error('Error fetching item names:', err);
    }
  };

  const groupItems = (itemIds) => {
    const grouped = {};
    (itemIds || []).forEach(id => {
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

  const renderStatusButton = (label) => (
    <TouchableOpacity
      key={label}
      style={[styles.filterButton, statusFilter === label && styles.filterButtonActive]}
      onPress={() => setStatusFilter(label)}
    >
      <Text style={statusFilter === label ? styles.filterTextActive : styles.filterText}>
        {label.replace('_', ' ')}
      </Text>
    </TouchableOpacity>
  );

  const handleAddOrder = () => {
    navigation.navigate('AddOrder');
  };

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

      <View style={styles.statusFilterContainer}>
        {statuses.map(renderStatusButton)}
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Only My Orders</Text>
        <Switch
          value={onlyMine}
          onValueChange={setOnlyMine}
          trackColor={{ false: '#ccc', true: '#6200ee' }}
          thumbColor={onlyMine ? '#fff' : '#f4f3f4'}
        />
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

      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleAddOrder}
      >
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </View>
      </TouchableOpacity>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8, // If your RN version < 0.71, remove gap and rely on margin
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ddd',
    margin: 4,
  },
  filterButtonActive: {
    backgroundColor: '#6200ee',
  },
  filterText: {
    color: '#333',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    marginRight: 8,
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
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#6200ee',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default OrderScreen;
