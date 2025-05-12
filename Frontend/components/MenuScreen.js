import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Card, Title, Paragraph, Snackbar } from 'react-native-paper';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from './config/api';

const MenuScreen = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      checkToken();
      return () => {};
    }, [])
  );

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwtToken');
      const storedRole = await AsyncStorage.getItem('role');
      setToken(storedToken);
      setRole(storedRole || '');

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
      setMenuItems(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items. Please try again.');
      showSnackbar('Failed to load menu items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMenuItems();
  };

  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      await api.patch(`/menu/${itemId}/availability`, null, {
        params: { available: !currentStatus },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchMenuItems();
      showSnackbar(`Item marked as ${!currentStatus ? 'available' : 'unavailable'}`);
    } catch (err) {
      console.error('Failed to update availability:', err);
      showSnackbar('Failed to update item availability');
    }
  };

  const handleAddItem = () => {
    navigation.navigate('AddMenu');
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const renderRightActions = (item) => (
    <RectButton
      style={[styles.actionContainer, { backgroundColor: item.available ? '#d32f2f' : '#388e3c' }]}
      onPress={() => toggleAvailability(item.id, item.available)}
    >
      <Text style={styles.actionText}>
        {item.available ? 'Make Unavailable' : 'Make Available'}
      </Text>
    </RectButton>
  );

  const renderItem = ({ item }) => (
    <View style={styles.swipeableOuterContainer}>
      <Swipeable
        renderRightActions={() => (role === 'ADMIN' || role === 'CHEF') ? renderRightActions(item) : null}
        onSwipeableRightOpen={() => {
          if (role === 'ADMIN' || role === 'CHEF') {
            toggleAvailability(item.id, item.available);
          }
        }}
        friction={2}
        rightThreshold={40}
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.itemName}>{item.name}</Title>
              <Text style={[styles.availabilityBadge, { 
                backgroundColor: item.available ? '#e8f5e9' : '#ffebee',
                color: item.available ? '#388e3c' : '#d32f2f'
              }]}>
                {item.available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
            
            <Paragraph style={styles.description}>{item.description}</Paragraph>
            
            <View style={styles.footer}>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
              {item.category && (
                <Text style={styles.category}>{item.category.toUpperCase()}</Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </Swipeable>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loaderText}>Loading menu items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Menu</Text>
      
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchMenuItems} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : menuItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="food-off" size={48} color="#757575" />
          <Text style={styles.emptyText}>No menu items available</Text>
          <TouchableOpacity onPress={fetchMenuItems} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={menuItems}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#6200ee']}
              tintColor={'#6200ee'}
            />
          }
        />
      )}

      {role === 'ADMIN' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddItem}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    borderRadius: 8,
    marginBottom: 0,
    backgroundColor: 'white',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  description: {
    color: '#666',
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  category: {
    fontSize: 12,
    color: '#757575',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  availabilityBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#6200ee',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  swipeableOuterContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    height: 'auto', 
  },
  actionContainer: {
    height: '100%',
    justifyContent: 'center',
    width: 120,
    borderRadius: 8,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    padding: 10,
  },
});

export default MenuScreen;