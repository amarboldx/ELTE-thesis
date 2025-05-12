import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Checkbox, Button } from 'react-native-paper';
import api from './config/api';

const ALLERGENS = [
  'HALAL',
  'VEGAN',
  'GLUTEN_FREE',
  'DAIRY_FREE',
  'NUT_FREE',
  'KOSHER',
  'VEGETARIAN',
  'LACTOSE_FREE',
  'KETO_FRIENDLY',
  'SHELL_FISH_FREE',
];

const AddMenuScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState([]);

  const toggleAllergen = (allergen) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen)
        ? prev.filter(item => item !== allergen)
        : [...prev, allergen]
    );
  };

  const handleAddItem = async () => {
    if (!name || !description || !price) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const createItemRequest = {
      name,
      description,
      price: parseFloat(price),
      allergens: selectedAllergens,
    };

    try {
      const response = await api.post('/menu/add', createItemRequest);
      console.log('Item added:', response.data);
      Alert.alert('Success', 'Item added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Error adding item:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to add the item.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add New Menu Item</Text>
      
      <Text style={styles.label}>Item Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Chicken Tikka Masala"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Describe the dish..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Price *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 12.99"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Dietary Information</Text>
      <View style={styles.allergenContainer}>
        {ALLERGENS.map(allergen => (
          <TouchableOpacity 
            key={allergen} 
            style={styles.allergenItem}
            onPress={() => toggleAllergen(allergen)}
          >
            <Checkbox
              status={selectedAllergens.includes(allergen) ? 'checked' : 'unchecked'}
              onPress={() => toggleAllergen(allergen)}
              color="#6200ee"
            />
            <Text style={styles.allergenText}>
              {allergen.split('_').join(' ').toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button 
        mode="contained" 
        onPress={handleAddItem}
        style={styles.submitButton}
        labelStyle={styles.submitButtonText}
      >
        Add Menu Item
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  allergenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  allergenText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
    textTransform: 'capitalize',
  },
  submitButton: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#6200ee',
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default AddMenuScreen;