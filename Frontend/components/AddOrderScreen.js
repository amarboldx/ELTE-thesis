import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api'; 

const AddOrderScreen = ({ navigation }) => {
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: quantity }

  useEffect(() => {
    fetchTables();
    fetchItems();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await api.get('/table');
      setTables(response.data);
    } catch (err) {
      console.error('Error fetching tables', err);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/menu/get');
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching items', err);
    }
  };

  const toggleItemSelection = (itemId) => {
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
    setSelectedItems((prev) => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(1, currentQty + delta);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleSubmitOrder = async () => {
    if (!selectedTableId || Object.keys(selectedItems).length === 0) {
      alert('Please select a table and at least one item.');
      return;
    }

    const itemIds = [];
    Object.entries(selectedItems).forEach(([id, qty]) => {
      for (let i = 0; i < qty; i++) {
        itemIds.push(Number(id));
      }
    });

    const staffId = await AsyncStorage.getItem('staffId');

    const orderPayload = {
      tableDataId: selectedTableId,
      date: new Date().toISOString(),
      status: "PENDING",
      staffId: Number(staffId),
      itemIds: itemIds,
      
      

    };

    try {
      const response = await api.post('/order', orderPayload);
      console.log('Order Created:', response.data);
      alert('Order created successfully!');
      navigation.goBack();
    } catch (err) {
      console.error('Error creating order:', err.response?.data || err.message);
      alert('Failed to create order.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Select a Table</Text>
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
            <Text style={styles.tableText}>Table #{item.tableNumber}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.tableList}
      />

      <Text style={styles.header}>Select Menu Items</Text>
      {items.map((item) => {
        const isSelected = selectedItems[item.id] > 0;
        return (
          <Card key={item.id} style={styles.itemCard}>
            <TouchableOpacity onPress={() => toggleItemSelection(item.id)}>
              <Card.Title title={item.name} subtitle={`€${item.price}`} />
            </TouchableOpacity>
            {isSelected && (
              <View style={styles.quantityRow}>
                <Button onPress={() => changeItemQuantity(item.id, -1)}>-</Button>
                <Text style={styles.quantityText}>{selectedItems[item.id]}</Text>
                <Button onPress={() => changeItemQuantity(item.id, 1)}>+</Button>
              </View>
            )}
          </Card>
        );
      })}

      <Button
        mode="contained"
        onPress={handleSubmitOrder}
        style={styles.submitButton}
      >
        Submit Order
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  tableList: {
    marginBottom: 20,
  },
  tableButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  tableButtonSelected: {
    backgroundColor: '#6200ee',
  },
  tableText: {
    color: '#fff',
  },
  itemCard: {
    marginBottom: 10,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 10,
  },
  submitButton: {
    marginTop: 20,
  },
});

export default AddOrderScreen;
