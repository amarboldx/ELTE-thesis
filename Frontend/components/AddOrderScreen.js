import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions, 
  Alert,
  PanResponder,
  Animated,
  Platform,
  useWindowDimensions,
  SectionList,
  KeyboardAvoidingView
} from 'react-native';
import { 
  Button, 
  Card, 
  Searchbar, 
  Divider, 
  Modal, 
  Portal, 
  Provider,
  Banner,
  Snackbar
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable, LongPressGestureHandler, State, ScrollView, RectButton } from 'react-native-gesture-handler';
import api from './config/api';

const AddOrderScreen = ({ navigation }) => {
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: quantity }
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({ tables: true, items: true });
  const [error, setError] = useState({ tables: null, items: null });
  const [itemDetailsVisible, setItemDetailsVisible] = useState(false);
  const [currentItemDetails, setCurrentItemDetails] = useState(null);
  const [errorSnackbarVisible, setErrorSnackbarVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const windowDimensions = useWindowDimensions();
  const isTablet = windowDimensions.width >= 768;
  const numColumns = isTablet ? 2 : 1;
  
  const swipeableRefs = useRef({});
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    fetchTables();
    fetchItems();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  const getSelectedItemsArray = () => {
    return Object.keys(selectedItems).map(id => {
      const item = items.find(i => i.id === Number(id));
      return {
        ...item,
        quantity: selectedItems[id]
      };
    });
  };

  const renderSelectedItem = ({ item }) => {
    return (
      <View style={[
        numColumns > 1 ? { width: windowDimensions.width / numColumns - 24 } : { width: '100%' },
        { margin: 4 }
      ]}>
        <Card style={styles.selectedItemCard}>
          <Card.Title
            title={item.name}
            subtitle={`€${item.price}`}
            right={() => (
              <View style={styles.quantityActions}>
                <Button 
                  mode="text" 
                  onPress={() => changeItemQuantity(item.id, -1)}
                  compact
                >-</Button>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <Button 
                  mode="text" 
                  onPress={() => changeItemQuantity(item.id, 1)}
                  compact
                >+</Button>
              </View>
            )}
          />
        </Card>
      </View>
    );
  };

  const getSections = () => {
    const selectedItemsArray = getSelectedItemsArray();
    const sections = [];
    
    if (selectedItemsArray.length > 0) {
      sections.push({
        title: 'Selected Items',
        data: selectedItemsArray,
        renderItem: renderSelectedItem,
        keyExtractor: (item) => `selected-${item.id}`,
        count: selectedItemsArray.length
      });
    }
    
    sections.push({
      title: 'Menu Items',
      data: filteredItems,
      renderItem: renderMenuItem,
      keyExtractor: (item) => `menu-${item.id}`
    });
    
    return sections;
  };

  const fetchTables = async () => {
    setLoading(prev => ({ ...prev, tables: true }));
    setError(prev => ({ ...prev, tables: null }));
    
    try {
      const response = await api.get('/table');
      setTables(response.data);
    } catch (err) {
      console.error('Error fetching tables', err);
      setError(prev => ({ 
        ...prev, 
        tables: err.response?.data?.message || 'Unable to fetch tables' 
      }));
      setErrorMessage('Failed to load tables. Please try again.');
      setErrorSnackbarVisible(true);
    } finally {
      setLoading(prev => ({ ...prev, tables: false }));
    }
  };

  const fetchItems = async () => {
    setLoading(prev => ({ ...prev, items: true }));
    setError(prev => ({ ...prev, items: null }));
    
    try {
      const response = await api.get('/menu/get');
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (err) {
      console.error('Error fetching items', err);
      setError(prev => ({ 
        ...prev, 
        items: err.response?.data?.message || 'Unable to fetch menu items' 
      }));
      setErrorMessage('Failed to load menu items. Please try again.');
      setErrorSnackbarVisible(true);
    } finally {
      setLoading(prev => ({ ...prev, items: false }));
    }
  };

  const onChangeSearch = query => {
    setSearchQuery(query);
  };

  const toggleItemSelection = (itemId) => {
    const item = items.find(i => i.id === Number(itemId));
    if (!item?.available) return;
    
    setSelectedItems((prev) => {
      const currentQty = prev[itemId] || 0;
      if (currentQty === 0) {
        return { ...prev, [itemId]: 1 };
      } else {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
    });
  };

  const changeItemQuantity = (itemId, delta) => {
    const item = items.find(i => i.id === Number(itemId));
    if (delta > 0 && !item?.available) return;
    
    setSelectedItems((prev) => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      if (newQty === 0) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleLongPress = (item) => {
    setCurrentItemDetails(item);
    setItemDetailsVisible(true);
  };

  const renderRightActions = (itemId) => {
    return (
      <RectButton
        style={[styles.actionContainer, styles.swipeActionAdd]}
        onPress={() => changeItemQuantity(itemId, 1)}
      >
        <Text style={styles.actionText}>Add</Text>
      </RectButton>
    );
  };
  
  const renderLeftActions = (itemId) => {
    return (
      <RectButton
        style={[styles.actionContainer, styles.swipeActionRemove]}
        onPress={() => changeItemQuantity(itemId, -1)}
      >
        <Text style={styles.actionText}>Remove</Text>
      </RectButton>
    );
  };

  const renderMenuItem = ({ item }) => {
    const isSelected = selectedItems[item.id] > 0;
    const isAvailable = item.available;
    
    return (
      <View style={[
        numColumns > 1 ? { width: windowDimensions.width / numColumns - 24 } : { width: '100%' },
        { margin: 4 }
      ]}>
        {isAvailable ? (
          <Swipeable
            ref={ref => swipeableRefs.current[item.id] = ref}
            renderRightActions={() => renderRightActions(item.id)}
            renderLeftActions={isSelected ? () => renderLeftActions(item.id) : null}
            onSwipeableOpen={(direction) => {
              if (direction === 'right') {
                changeItemQuantity(item.id, 1);
              } else if (direction === 'left' && isSelected) {
                changeItemQuantity(item.id, -1);
              }
              setTimeout(() => {
                if (swipeableRefs.current[item.id]) {
                  swipeableRefs.current[item.id].close();
                }
              }, 300);
            }}
            friction={2}
            rightThreshold={40}
            leftThreshold={40}
            containerStyle={styles.swipeableContainer}
          >
            <LongPressGestureHandler
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.ACTIVE) {
                  handleLongPress(item);
                }
              }}
              minDurationMs={800}
            >
              <View style={styles.swipeableChildContainer}>
                <Card 
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected
                  ]}
                >
                  <TouchableOpacity onPress={() => toggleItemSelection(item.id)}>
                    <Card.Title 
                      title={item.name} 
                      subtitle={`€${item.price}`} 
                      right={() => isSelected ? (
                        <View style={styles.quantityBadge}>
                          <Text style={styles.quantityBadgeText}>{selectedItems[item.id]}</Text>
                        </View>
                      ) : null}
                    />
                  </TouchableOpacity>
                  {isSelected && (
                    <View style={styles.quantityRow}>
                      <Button 
                        mode="outlined" 
                        onPress={() => changeItemQuantity(item.id, -1)}
                        compact
                      >-</Button>
                      <Text style={styles.quantityText}>{selectedItems[item.id]}</Text>
                      <Button 
                        mode="outlined" 
                        onPress={() => changeItemQuantity(item.id, 1)}
                        compact
                      >+</Button>
                    </View>
                  )}
                </Card>
              </View>
            </LongPressGestureHandler>
          </Swipeable>
        ) : (
          <View style={styles.unavailableContainer}>
            <Card style={[styles.itemCard, styles.unavailableCard]}>
              <Card.Title 
                title={item.name} 
                subtitle={`€${item.price}`} 
                right={() => (
                  <View style={styles.unavailableBadge}>
                    <Text style={styles.unavailableBadgeText}>Unavailable</Text>
                  </View>
                )}
              />
            </Card>
            <View style={styles.unavailableOverlay} />
          </View>
        )}
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.header}>{section.title}</Text>
        {section.count && (
          <Text style={styles.selectedCount}>{section.count} items</Text>
        )}
      </View>
    );
  };

  const renderListFooter = () => {
    return (
      <Button
        mode="contained"
        onPress={handleSubmitOrder}
        style={styles.submitButton}
        loading={loading.submit}
        disabled={loading.submit || !selectedTableId || Object.keys(selectedItems).length === 0}
      >
        Submit Order
      </Button>
    );
  };

  const renderListEmpty = () => {
    if (loading.items) {
      return <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />;
    }
    
    return (
      <Text style={styles.noResults}>No menu items found matching your search.</Text>
    );
  };

  const handleSubmitOrder = async () => {
    if (!selectedTableId || Object.keys(selectedItems).length === 0) {
      Alert.alert(
        'Incomplete Order',
        'Please select a table and at least one item.',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      );
      return;
    }

    const itemIds = [];
    Object.entries(selectedItems).forEach(([id, qty]) => {
      for (let i = 0; i < qty; i++) {
        itemIds.push(Number(id));
      }
    });

    try {
      setLoading(prev => ({ ...prev, submit: true }));
      const staffId = await AsyncStorage.getItem('staffId');

      const toLocalISOString = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date - offset).toISOString().slice(0, -1);
        return localISOTime;
      };

      const orderPayload = {
        tableDataId: selectedTableId,
        date: toLocalISOString(new Date()),
        status: "IN_PROGRESS",
        staffId: Number(staffId),
        itemIds: itemIds,
      };

      const response = await api.post('/order', orderPayload);
      console.log('Order Created:', response.data);
      Alert.alert(
        'Success',
        'Order created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error creating order:', err.response?.data || err.message);
      setErrorMessage('Failed to create order. Please try again.');
      setErrorSnackbarVisible(true);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const sections = getSections();

  return (
    <GestureHandlerRootView style={styles.flex}>
      <Provider>
        <Portal>
          <Modal
            visible={itemDetailsVisible}
            onDismiss={() => setItemDetailsVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            {currentItemDetails && (
              <View>
                <Text style={styles.modalTitle}>{currentItemDetails.name}</Text>
                <Text style={styles.modalPrice}>€{currentItemDetails.price}</Text>
                <Divider style={styles.divider} />
                <Text style={styles.modalDescription}>
                  {currentItemDetails.description || 'No description available'}
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => {
                    if (currentItemDetails.available) {
                      toggleItemSelection(currentItemDetails.id);
                    }
                    setItemDetailsVisible(false);
                  }}
                  style={styles.modalButton}
                  disabled={!currentItemDetails.available}
                >
                  {!currentItemDetails.available 
                    ? 'Unavailable' 
                    : selectedItems[currentItemDetails.id] 
                      ? 'Remove from Order' 
                      : 'Add to Order'
                  }
                </Button>
              </View>
            )}
          </Modal>
        </Portal>

        <ScrollView style={[styles.container, { paddingBottom: insets.bottom }]}>
          {error.tables || error.items ? (
            <Banner
              visible={true}
              actions={[
                {
                  label: 'Retry',
                  onPress: () => {
                    if (error.tables) fetchTables();
                    if (error.items) fetchItems();
                  },
                },
              ]}
              icon="alert-circle"
            >
              There was an error loading data. Please try again.
            </Banner>
          ) : null}

          <Text style={styles.header}>Select a Table</Text>
          {loading.tables ? (
            <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
          ) : (
            <FlatList
            horizontal
            data={tables}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.tableButton,
                  selectedTableId === item.id && styles.tableButtonSelected,
                ]}
                onPress={() => setSelectedTableId(item.id)}
              >
                <Text
                  style={[
                    styles.tableText,
                    selectedTableId === item.id && styles.tableTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  Table #{item.tableNumber}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tableList}
            showsHorizontalScrollIndicator={false}
          />

          )}

          {/* Search Bar */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.searchContainer}
          >
            <Searchbar
              placeholder="Search menu items"
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={styles.searchBar}
            />
          </KeyboardAvoidingView>


          <SectionList
            sections={sections}
            keyExtractor={(item, index) => `section-item-${item.id}-${index}`}
            renderSectionHeader={renderSectionHeader}
            renderItem={({ item, index, section }) => section.renderItem({ item, index, section })}
            ListEmptyComponent={renderListEmpty}
            ListFooterComponent={renderListFooter}
            contentContainerStyle={{ paddingBottom: 100 }}
            numColumns={numColumns}
            stickySectionHeadersEnabled={true}
          />
        </ScrollView>

        <Snackbar
          visible={errorSnackbarVisible}
          onDismiss={() => setErrorSnackbarVisible(false)}
          action={{
            label: 'Dismiss',
            onPress: () => setErrorSnackbarVisible(false),
          }}
          duration={3000}
        >
          {errorMessage}
        </Snackbar>
      </Provider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  listContainer: {
    flex: 1, 
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  loader: {
    marginVertical: 20,
  },
  tableListWrapper: {
    maxHeight: 70,
  },
  tableList: {
    paddingBottom: 10,
  },
  tableButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 10,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    height: 50,
  },
  tableButtonSelected: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  tableText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 16,
  },
  tableTextSelected: {
    color: '#fff',
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingRight: 8,
  },
  itemCard: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemCardSelected: {
    backgroundColor: '#f0e6ff',
    borderWidth: 1,
    borderColor: '#6200ee',
  },
  selectedItemCard: {
    marginBottom: 10,
    backgroundColor: '#f0e6ff',
    flex: 1,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  quantityActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
  quantityBadge: {
    backgroundColor: '#6200ee',
    borderRadius: 20,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quantityBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  noResults: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#666',
  },
  swipeActions: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeAction: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionAdd: {
    backgroundColor: '#4CAF50',
    marginBottom: 10,
  },
  swipeActionRemove: {
    backgroundColor: '#F44336',
    marginBottom: 10,
  },
  swipeActionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalPrice: {
    fontSize: 18,
    color: '#6200ee',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButton: {
    marginTop: 20,
  },
  divider: {
    marginVertical: 10,
  },
  selectedCount: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  unavailableContainer: {
    position: 'relative',
  },
  unavailableCard: {
    opacity: 0.7,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 200, 200, 0.5)',
    borderRadius: 8,
  },
  unavailableBadge: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 16,
  },
  unavailableBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  swipeableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  swipeableChildContainer: {
    flex: 1,
  },
  swipeableOuterContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionContainer: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

});

export default AddOrderScreen;