import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';

const AddShiftScreen = ({ navigation }) => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  });
  const [loading, setLoading] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date'); // 'date' or 'time'
  const [activePicker, setActivePicker] = useState(null); // 'start' or 'end'

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        alert('User is not logged in!');
        return;
      }

      const response = await api.get('/staff', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setStaffList(response.data);
      } else {
        alert('Failed to load staff list');
      }
    } catch (err) {
      console.error('Error fetching staff', err);
      alert('Failed to load staff');
    }
  };

  const handleCreateShift = async () => {
    if (!selectedStaffId) {
      alert('Please select a staff member');
      return;
    }

    if (endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }

    const toLocalISOString = (date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date - offset).toISOString().slice(0, -1);
    };

    const shiftPayload = {
      staffId: selectedStaffId,
      startTime: toLocalISOString(startTime),
      endTime: toLocalISOString(endTime),
    };

    setLoading(true);

    try {
      await api.post('/shift', shiftPayload, {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('jwtToken')}`,
        },
      });
      alert('Shift created successfully!');
      navigation.goBack();
    } catch (err) {
      console.error('Error creating shift:', err);
      alert('Failed to create shift');
    } finally {
      setLoading(false);
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
      setActivePicker(pickerType);
      if (pickerType === 'start') {
        setShowStartPicker(true);
      } else {
        setShowEndPicker(true);
      }
    }
  };

  const onDateTimeChange = (event, selectedDateTime) => {
    if (event.type === 'dismissed') {
      setShowStartPicker(false);
      setShowEndPicker(false);
      setActivePicker(null);
      return;
    }

    if (selectedDateTime) {
      if (Platform.OS === 'android') {
        if (activePicker === 'start') {
          if (pickerMode === 'date') {
            const updatedDate = new Date(selectedDateTime);
            const currentStartTime = new Date(startTime);
            updatedDate.setHours(currentStartTime.getHours());
            updatedDate.setMinutes(currentStartTime.getMinutes());
            setStartTime(updatedDate);
            setPickerMode('time');
            return;
          } else {
            const finalDate = new Date(startTime);
            finalDate.setHours(selectedDateTime.getHours());
            finalDate.setMinutes(selectedDateTime.getMinutes());
            setStartTime(finalDate);
            if (endTime <= finalDate) {
              const newEndTime = new Date(finalDate);
              newEndTime.setHours(newEndTime.getHours() + 1);
              setEndTime(newEndTime);
            }
            setShowStartPicker(false);
            setActivePicker(null);
          }
        } else if (activePicker === 'end') {
          if (pickerMode === 'date') {
            const updatedDate = new Date(selectedDateTime);
            const currentEndTime = new Date(endTime);
            updatedDate.setHours(currentEndTime.getHours());
            updatedDate.setMinutes(currentEndTime.getMinutes());
            setEndTime(updatedDate);
            setPickerMode('time');
            return;
          } else {
            const finalDate = new Date(endTime);
            finalDate.setHours(selectedDateTime.getHours());
            finalDate.setMinutes(selectedDateTime.getMinutes());
            setEndTime(finalDate);
            setShowEndPicker(false);
            setActivePicker(null);
          }
        }
      } else {
        if (activePicker === 'start') {
          setStartTime(selectedDateTime);
          if (endTime <= selectedDateTime) {
            const newEndTime = new Date(selectedDateTime);
            newEndTime.setHours(newEndTime.getHours() + 1);
            setEndTime(newEndTime);
          }
        } else {
          setEndTime(selectedDateTime);
        }
      }
    } else {
      setShowStartPicker(false);
      setShowEndPicker(false);
      setActivePicker(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Select Staff</Text>
      <FlatList
        horizontal
        data={staffList}
        keyExtractor={(item) => item.staffId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tableButton, selectedStaffId === item.staffId && styles.tableButtonSelected]}
            onPress={() => setSelectedStaffId(item.staffId)}
          >
            <Text style={[styles.tableText, selectedStaffId === item.staffId && styles.tableTextSelected]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.tableList}
      />

      <Text style={styles.header}>Shift Start Time</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => showAndroidPicker('start')}>
        <Text>{formatDateTime(startTime)}</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Shift End Time</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => showAndroidPicker('end')}>
        <Text>{formatDateTime(endTime)}</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <>
          {showStartPicker && (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                  <Text style={styles.iosDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={startTime}
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
                value={endTime}
                mode="datetime"
                display="spinner"
                onChange={onDateTimeChange}
                style={styles.iosPicker}
                minimumDate={startTime}
              />
            </View>
          )}
        </>
      ) : (
        <>
          {showStartPicker && (
            <DateTimePicker
              testID="startDateTimePicker"
              value={startTime}
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
              value={endTime}
              mode={pickerMode}
              is24Hour={false}
              display="default"
              onChange={onDateTimeChange}
              minimumDate={pickerMode === 'date' ? startTime : undefined}
            />
          )}
        </>
      )}

      <Button mode="contained" onPress={handleCreateShift} loading={loading} disabled={loading}>
        Create Shift
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tableButton: {
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderRadius: 5,
  },
  tableButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  tableText: {
    color: '#000',
  },
  tableTextSelected: {
    color: '#fff',
  },
  tableList: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dateInput: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },
  iosPickerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  iosPickerHeader: {
    width: '100%',
    alignItems: 'flex-end',
    paddingTop: 20,
    paddingRight: 10,
  },
  iosDoneButton: {
    fontSize: 18,
    color: '#007AFF',
  },
  iosPicker: {
    width: '100%',
    backgroundColor: '#fff',
  },
});

export default AddShiftScreen;
