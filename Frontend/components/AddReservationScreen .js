import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';

const AddReservationScreen = ({ navigation }) => {
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  });
  const [status, setStatus] = useState('PENDING');

  // Date picker visibility states
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  // Track which picker is currently active (needed for Android)
  const [pickerMode, setPickerMode] = useState('date'); // 'date' or 'time'
  const [activePicker, setActivePicker] = useState(null); // 'start' or 'end'

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await api.get('/table');
      setTables(response.data);
    } catch (err) {
      console.error('Error fetching tables', err);
      alert('Failed to load tables');
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Special handling for Android's two-step date+time picker process
  const showAndroidPicker = (pickerType) => {
    if (Platform.OS === 'android') {
      setActivePicker(pickerType);
      setPickerMode('date'); // Start with date picker
      if (pickerType === 'start') {
        setShowStartPicker(true);
      } else {
        setShowEndPicker(true);
      }
    } else {
      // iOS - directly show the relevant picker
      setActivePicker(pickerType);
      if (pickerType === 'start') {
        setShowStartPicker(true);
      } else {
        setShowEndPicker(true);
      }
    }
  };

  const onDateTimeChange = (event, selectedDateTime) => {
    // If user cancels, selectedDateTime will be undefined
    if (event.type === 'dismissed') {
      // Handle Android dismissal
      setShowStartPicker(false);
      setShowEndPicker(false);
      setActivePicker(null);
      return;
    }
    
    if (selectedDateTime) {
      // Handle Android's two-step process
      if (Platform.OS === 'android') {
        if (activePicker === 'start') {
          // On Android, first select date, then time
          if (pickerMode === 'date') {
            // Keep current time from startDate
            const updatedDate = new Date(selectedDateTime);
            const currentStartTime = new Date(startDate);
            updatedDate.setHours(currentStartTime.getHours());
            updatedDate.setMinutes(currentStartTime.getMinutes());
            
            setStartDate(updatedDate);
            // Now show time picker
            setPickerMode('time');
            return; // Don't hide the picker yet
          } else {
            // Time has been selected - finalize
            const finalDate = new Date(startDate);
            finalDate.setHours(selectedDateTime.getHours());
            finalDate.setMinutes(selectedDateTime.getMinutes());
            
            setStartDate(finalDate);
            
            // If end date is now before start, update it
            if (endDate <= finalDate) {
              const newEndDate = new Date(finalDate);
              newEndDate.setHours(newEndDate.getHours() + 1);
              setEndDate(newEndDate);
            }
            
            setShowStartPicker(false);
            setActivePicker(null);
          }
        } else if (activePicker === 'end') {
          // Similar handling for end date
          if (pickerMode === 'date') {
            const updatedDate = new Date(selectedDateTime);
            const currentEndTime = new Date(endDate);
            updatedDate.setHours(currentEndTime.getHours());
            updatedDate.setMinutes(currentEndTime.getMinutes());
            
            setEndDate(updatedDate);
            setPickerMode('time');
            return; // Don't hide yet
          } else {
            const finalDate = new Date(endDate);
            finalDate.setHours(selectedDateTime.getHours());
            finalDate.setMinutes(selectedDateTime.getMinutes());
            
            setEndDate(finalDate);
            setShowEndPicker(false);
            setActivePicker(null);
          }
        }
      } else {
        // iOS handling - simpler since it's a single picker
        if (activePicker === 'start') {
          setStartDate(selectedDateTime);
          
          // If end date is before start date, update it
          if (endDate <= selectedDateTime) {
            const newEndDate = new Date(selectedDateTime);
            newEndDate.setHours(newEndDate.getHours() + 1);
            setEndDate(newEndDate);
          }
        } else {
          setEndDate(selectedDateTime);
        }
      }
    } else {
      // Handle case when picker is dismissed
      setShowStartPicker(false);
      setShowEndPicker(false);
      setActivePicker(null);
    }
  };

  const handleSubmitReservation = async () => {
    if (!selectedTableId || !customerName) {
      alert('Please select a table and enter customer name');
      return;
    }
  
    if (endDate <= startDate) {
      alert('End time must be after start time');
      return;
    }
  
    const toLocalISOString = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date - offset).toISOString().slice(0, -1);
        return localISOTime;
      };
  
    const reservationPayload = {
        tableId: selectedTableId,
        customerName: customerName,
        startTime: toLocalISOString(startDate),
        endTime: toLocalISOString(endDate),
        status: status,
    };
  
    try {
      const response = await api.post('/reservations', reservationPayload);
      alert('Reservation created successfully!');
      navigation.goBack();
    } catch (err) {
      console.error('Error creating reservation:', err);
      alert('Failed to create reservation. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
            <Text style={[
              styles.tableText,
              selectedTableId === item.id && styles.tableTextSelected
            ]}>
              Table #{item.tableNumber}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.tableList}
      />
     
     <KeyboardAvoidingView
                 behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                 style={styles.searchContainer}
               >
      <Text style={styles.header}>Customer Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter customer name"
        value={customerName}
        onChangeText={setCustomerName}
      />
      </KeyboardAvoidingView>

      <Text style={styles.header}>Reservation Start Time</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => showAndroidPicker('start')}
      >
        <Text>{formatDateTime(startDate)}</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Reservation End Time</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => showAndroidPicker('end')}
      >
        <Text>{formatDateTime(endDate)}</Text>
      </TouchableOpacity>

      {/* Cross-platform DatePicker implementation */}
      {Platform.OS === 'ios' ? (
        // iOS implementation
        <>
          {showStartPicker && (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                  <Text style={styles.iosDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="spinner"
                onChange={onDateTimeChange}
                style={styles.iosPicker}
                minimumDate={new Date()}
              />
            </View>
          )}
          
          {showEndPicker && (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                  <Text style={styles.iosDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="spinner"
                onChange={onDateTimeChange}
                style={styles.iosPicker}
                minimumDate={startDate}
              />
            </View>
          )}
        </>
      ) : (
        // Android implementation
        <>
          {showStartPicker && (
            <DateTimePicker
              testID="startDateTimePicker"
              value={startDate}
              mode={pickerMode}
              is24Hour={false}
              display="default"
              onChange={onDateTimeChange}
              minimumDate={pickerMode === 'date' ? new Date() : undefined}
            />
          )}
          
          {showEndPicker && (
            <DateTimePicker
              testID="endDateTimePicker"
              value={endDate}
              mode={pickerMode}
              is24Hour={false}
              display="default"
              onChange={onDateTimeChange}
              minimumDate={pickerMode === 'date' ? startDate : undefined}
            />
          )}
        </>
      )}

      <Button
        mode="contained"
        onPress={handleSubmitReservation}
        style={styles.submitButton}
        labelStyle={styles.buttonText}
      >
        Submit Reservation
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#333',
  },
  tableList: {
    paddingVertical: 8,
  },
  tableButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  tableButtonSelected: {
    backgroundColor: '#6200ee',
  },
  tableText: {
    color: '#000',
  },
  tableTextSelected: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  dateInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6200ee',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // iOS specific styles
  iosPickerContainer: {
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  iosDoneButton: {
    color: '#6200ee',
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
  },
});

export default AddReservationScreen;