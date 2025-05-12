import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Switch, 
  Modal, 
  Pressable,
  Alert,
  ToastAndroid,
  Platform,
  RefreshControl
} from 'react-native';
import { Card, Title, Paragraph, Snackbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect  } from '@react-navigation/native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import api from './config/api';

const statuses = ['IN_PROGRESS', 'PENDING', 'COMPLETED', 'CANCELLED'];

const OrderScreen = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [itemMap, setItemMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [statusFilter, setStatusFilter] = useState('IN_PROGRESS');
  const [onlyMine, setOnlyMine] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [staffNames, setStaffNames] = useState({});

  const navigation = useNavigation();

  useEffect(() => {
    checkToken();
    fetchAllItems();
  }, []);

  useEffect(() => {
    if (allOrders.length > 0) {
      applyFilters();
    }
  }, [statusFilter, onlyMine, allOrders]);

  useEffect(() => {
    if (token) {
      fetchOrders(); 
    }
  }, [statusFilter, token]);

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders(); 
    }, [])
  );

  useEffect(() => {
    if (allOrders.length > 0) {
      allOrders.forEach((order) => {
        if (order.staffId && !staffNames[order.staffId]) {
          getStaffName(order.staffId);
        }
      });
    }
  }, [allOrders]);

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
      const response = await api.get(`/order/status/${statusFilter}`);
      
      const allItemIds = response.data.flatMap(order => order.itemIds || []);
      await fetchItemNames(allItemIds);
  
      const sortedOrders = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllOrders(sortedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response ? `Failed to load orders. Server returned ${err.response.status}` : 'An error occurred while fetching orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllItems = async () => {
    try {
      const response = await api.get('/menu/get');
      setAllItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
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

  const applyFilters = async () => {
    const currentUserId = await AsyncStorage.getItem('staffId');
    let result = [...allOrders];
    
    if (statusFilter) {
      result = result.filter(order => order.status === statusFilter);
    }
  
    if (onlyMine) {
      result = result.filter(order => order.staffId == currentUserId);
    }
    
    setFilteredOrders(result);
  };

  const groupItems = (itemIds) => {
    const itemCounts = {};
    (itemIds || []).forEach(id => {
      itemCounts[id] = (itemCounts[id] || 0) + 1;
    });
    return Object.entries(itemCounts).map(([id, count]) => ({
      id,
      name: itemMap[id] || `Item ID: ${id}`,
      count
    }));
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'IN_PROGRESS': return 'PENDING';
      case 'PENDING': return 'COMPLETED';
      default: return currentStatus;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return '#2196F3';
      case 'PENDING': return '#FF9800';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#000';
    }
  };

  const getCardBackground = (status) => {
    switch (status) {
      case 'COMPLETED': return '#e8f5e9';
      case 'CANCELLED': return '#ffebee';
      default: return 'white';
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    const originalOrders = [...allOrders];
    
    try {
      // Optimistic update
      const updatedOrders = allOrders.map(o => 
        o.id === order.id ? { ...o, status: newStatus } : o
      );
      setAllOrders(updatedOrders);
      
      if (modalVisible) {
        setModalVisible(false);
      }
      
      await api.patch(`/order/${order.id}/status`, null, {
        params: { status: newStatus }
      });
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Order #${order.id} updated to ${newStatus}`, ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setAllOrders(originalOrders);
      showSnackbar('Failed to update order status');
    }
  };

  const handleDeleteOrder = async () => {
    const originalOrders = [...allOrders];
    
    try {
      const updatedOrders = allOrders.filter(o => o.id !== selectedOrder.id);
      setAllOrders(updatedOrders);
      setModalVisible(false);
      
      await api.delete(`/order/${selectedOrder.id}`);
    } catch (err) {
      console.error('Error deleting order:', err);
      setAllOrders(originalOrders);
      showSnackbar('Failed to delete order');
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddItem = async (itemId) => {
    const originalOrders = [...allOrders];
    const originalSelectedOrder = selectedOrder;
    
    try {
      const updatedOrders = allOrders.map(o => {
        if (o.id === selectedOrder.id) {
          return { ...o, itemIds: [...(o.itemIds || []), itemId] };
        }
        return o;
      });
      
      setAllOrders(updatedOrders);
      
      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          itemIds: [...(selectedOrder.itemIds || []), itemId]
        });
      }
      
      await api.patch(`/order/${selectedOrder.id}/add-item`, null, {
        params: { itemId }
      });
    } catch (err) {
      console.error('Error adding item:', err);
      setAllOrders(originalOrders);
      setSelectedOrder(originalSelectedOrder);
      showSnackbar('Failed to add item to order');
    }
  };

  const handleRemoveItem = async (itemId) => {
    const originalOrders = [...allOrders];
    const originalSelectedOrder = selectedOrder;
    
    try {
      if (!selectedOrder) {
        showSnackbar('No order selected');
        return;
      }
  
      const itemIndex = selectedOrder.itemIds.findIndex(id => Number(id) === Number(itemId));
      
      if (itemIndex === -1) {
        showSnackbar('Item not found in order');
        return;
      }
  
      const updatedItemIds = [...selectedOrder.itemIds];
      updatedItemIds.splice(itemIndex, 1);
  
      setAllOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, itemIds: updatedItemIds }
            : order
        )
      );
  
      setSelectedOrder(prev => ({ ...prev, itemIds: updatedItemIds }));
  
      await api.patch(`/order/${selectedOrder.id}/remove-item`, null, {
        params: { itemId }
      });
    } catch (err) {
      console.error('Error removing item:', err);
      setAllOrders(originalOrders);
      setSelectedOrder(originalSelectedOrder);
      showSnackbar(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const renderEditModal = () => {
    const groupedItems = groupItems(selectedOrder?.itemIds);
    
    return (
      <Modal
        transparent
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModalBox}>
            <Text style={styles.modalTitle}>Edit Order #{selectedOrder?.id}</Text>
            
            <Text style={styles.sectionTitle}>Current Items:</Text>
            {groupedItems.length > 0 ? (
              groupedItems.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name} (x{item.count})</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={[styles.quantityButton, styles.removeButton]}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <MaterialCommunityIcons name="minus" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.quantityButton, styles.addButton]}
                      onPress={() => handleAddItem(item.id)}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No items in this order</Text>
            )}
            
            <Text style={styles.sectionTitle}>Add New Items:</Text>
            <FlatList
              data={allItems}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name} (${item.price})</Text>
                  <TouchableOpacity 
                    style={[styles.quantityButton, styles.addButton]}
                    onPress={() => handleAddItem(item.id)}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={item => item.id.toString()}
              maxHeight={200}
            />
            
            <Pressable
              style={[styles.modalOption, { backgroundColor: '#6200ee', marginTop: 20 }]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.modalOptionText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  const renderRightActions = (item) => {
    if (item.status === 'COMPLETED') return null;
    
    const nextStatus = getNextStatus(item.status);
    const bgColor = nextStatus === 'PENDING' ? '#FF9800' : '#4CAF50';

    return (
      <RectButton
        style={[styles.actionContainer, { backgroundColor: bgColor }]}
        onPress={() => handleStatusChange(item, nextStatus)}
      >
        <Text style={styles.actionText}>{nextStatus.replace('_', ' ')}</Text>
      </RectButton>
    );
  };

  const renderLeftActions = (item) => {
    if (item.status === 'COMPLETED') return null;

    return (
      <RectButton
        style={[styles.actionContainer, { backgroundColor: '#F44336' }]}
        onPress={() => {
          Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
              { text: 'No', style: 'cancel' },
              { text: 'Yes', onPress: () => handleStatusChange(item, 'CANCELLED') }
            ]
          );
        }}
      >
        <Text style={styles.actionText}>CANCEL</Text>
      </RectButton>
    );
  };

  const getStaffName = async (staffId) => {
    try {
      const response = await api.get(`/staff/${staffId}`);
      setStaffNames((prevNames) => ({
        ...prevNames,
        [staffId]: response.data.name,
      }));
    } catch (err) {
      console.error('Error fetching staff name:', err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.swipeableOuterContainer}>
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        renderLeftActions={() => renderLeftActions(item)}
        onSwipeableRightOpen={() => {
          if (item.status !== 'COMPLETED') {
            const nextStatus = getNextStatus(item.status);
            handleStatusChange(item, nextStatus);
          }
        }}
        onSwipeableLeftOpen={() => {
          if (item.status !== 'COMPLETED') {
            Alert.alert(
              'Cancel Order',
              'Are you sure you want to cancel this order?',
              [
                { text: 'No', style: 'cancel', onPress: () => {} },
                { text: 'Yes', onPress: () => handleStatusChange(item, 'CANCELLED') }
              ]
            );
          }
        }}
        friction={2}
        rightThreshold={40}
        leftThreshold={40}
      >
        <TouchableOpacity 
          onPress={() => {
            setSelectedOrder(item);
            setModalVisible(true);
          }}
          activeOpacity={0.9}
        >
          <Card style={[styles.card, { backgroundColor: getCardBackground(item.status) }]}>
            <Card.Content>
              <Title>Order #{item.id}</Title>
              <Paragraph>Table: {item.tableDataId}</Paragraph>
              <Paragraph>Date: {new Date(item.date).toLocaleString()}</Paragraph>
              <View style={styles.statusRow}>
                <Text>Status: </Text>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.replace('_', ' ')}
                </Text>
                
                <Paragraph style={{ marginLeft: 'auto' }}>
                  Staff: {staffNames[item.staffId] || 'Loading...'}
                </Paragraph>
              </View>
              <Paragraph>Items:</Paragraph>
              {groupItems(item.itemIds).map((item, i) => (
                <Text key={`${item.id}-${i}`} style={styles.itemText}>
                  {item.count}x {item.name}
                </Text>
              ))}
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );

  const renderStatusFilter = (status) => (
    <TouchableOpacity
      key={status}
      style={[
        styles.filterButton,
        statusFilter === status && styles.activeFilterButton
      ]}
      onPress={() => setStatusFilter(status)}
    >
      <Text style={statusFilter === status ? styles.activeFilterText : styles.filterText}>
        {status.replace('_', ' ')}
      </Text>
    </TouchableOpacity>
  );

  const handleAddOrder = () => {
    navigation.navigate('AddOrder');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loaderText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Orders</Text>

      <View style={styles.filterRow}>
        {statuses.map(renderStatusFilter)}
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>Only My Orders</Text>
        <Switch
          value={onlyMine}
          onValueChange={(value) => {
            setOnlyMine(value);
          }}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={onlyMine ? '#6200ee' : '#f4f3f4'}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <Text style={styles.emptyText}>No orders found</Text>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
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

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddOrder}
      >
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </View>
      </TouchableOpacity>

      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Order #{selectedOrder?.id}</Text>
            
            <Text style={styles.sectionTitle}>Change Status:</Text>
            {statuses.map((status) => (
              <Pressable
                key={status}
                style={[styles.modalOption, { 
                  backgroundColor: getStatusColor(status) 
                }]}
                onPress={() => {
                  handleStatusChange(selectedOrder, status);
                }}
              >
                <Text style={styles.modalOptionText}>{status.replace('_', ' ')}</Text>
              </Pressable>
            ))}
            
            <Text style={styles.sectionTitle}>Actions:</Text>
            <Pressable
              style={[styles.modalOption, { backgroundColor: '#6200ee' }]}
              onPress={() => {
                setModalVisible(false);
                setEditModalVisible(true);
              }}
            >
              <Text style={styles.modalOptionText}>Edit Items</Text>
            </Pressable>
            
            <Pressable
              style={[styles.modalOption, { backgroundColor: '#d32f2f' }]}
              onPress={() => {
                Alert.alert(
                  'Delete Order',
                  'Are you sure you want to delete this order?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', onPress: handleDeleteOrder }
                  ]
                );
              }}
            >
              <Text style={styles.modalOptionText}>Delete Order</Text>
            </Pressable>
            
            <Pressable
              style={[styles.modalOption, { backgroundColor: '#ccc' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalOptionText, { color: '#333' }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {renderEditModal()}

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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    margin: 4,
  },
  activeFilterButton: {
    backgroundColor: '#6200ee',
  },
  filterText: {
    color: '#333',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleText: {
    marginRight: 8,
    fontSize: 16,
  },
  card: {
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontWeight: 'bold',
  },
  itemText: {
    marginLeft: 8,
    marginBottom: 2,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    padding: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#757575',
    marginTop: 24,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 6,
    marginVertical: 6,
    alignItems: 'center',
  },
  modalOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  swipeableContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  swipeableInnerContainer: {
    borderRadius: 8,
  },
  editModalBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#F44336',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  swipeableOuterContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    height: 'auto',
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    flex: 1,
  },
  actionButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrderScreen;