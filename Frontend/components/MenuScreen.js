import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const MenuScreen = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(""); 

  const navigation = useNavigation();

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwtToken');
      const storedRole = await AsyncStorage.getItem('role'); 
      console.log('Stored Token:', storedToken);
      console.log('Stored Role:', storedRole);

      setToken(storedToken);
      if (storedRole) {
        setRole(storedRole);
      }

      if (storedToken && storedRole) {
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
      setError('Failed to load menu items.');
    } finally {
      setLoading(false);
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

  const handleAddItem = () => {
    console.log('Attempting to navigate to AddMenu');
    try {
      navigation.navigate('AddMenu');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

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
        
        {/* FlatList inside a container */}
        <View style={{ flex: 1 }}>
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

        {role== 'ADMIN' && (
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddItem}
          >
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="plus" size={24} color="white" />
            </View>
          </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#6200ee',
    borderRadius: 50,
    padding: 16,
    elevation: 10,
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
