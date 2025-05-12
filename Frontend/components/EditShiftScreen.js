import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from './config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO, isBefore, addHours } from 'date-fns';

const EditShiftScreen = ({ route, navigation }) => {
    const { shiftId } = route.params;
    const [shift, setShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [currentPicker, setCurrentPicker] = useState(null);
    const [pickerMode, setPickerMode] = useState('date');

    useEffect(() => {
        fetchShift();
    }, []);

    const fetchShift = async () => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            const response = await api.get(`/shift/${shiftId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const shiftData = response.data;
            setShift(shiftData);
            
            // Fix the timezone issue by parsing the ISO string correctly
            const parsedStart = new Date(shiftData.startTime);
            const parsedEnd = new Date(shiftData.endTime);
            
            setStartDate(parsedStart);
            setEndDate(parsedEnd);
        } catch (err) {
            setError('Failed to load shift data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!isBefore(startDate, endDate)) {
            Alert.alert('Invalid Time', 'Start time must be before end time');
            return;
        }

        if ((endDate.getTime() - startDate.getTime()) < (60 * 60 * 1000)) {
            Alert.alert('Invalid Duration', 'Shift must be at least 1 hour long');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('jwtToken');
            
            const startTime = toLocalISOString(startDate);
            const endTime = toLocalISOString(endDate);
            
            await api.patch(`/shift/${shiftId}`, null, {
                params: {
                    newStartTime: startTime,
                    newEndTime: endTime,
                },
                headers: { Authorization: `Bearer ${token}` },
            });
            
            Alert.alert('Success', 'Shift updated successfully');
            navigation.goBack();
        } catch (err) {
            let errorMessage = 'Failed to update shift';
            if (err.response) {
                if (err.response.status === 400) {
                    errorMessage = err.response.data.message || 'Invalid shift data';
                } else if (err.response.status === 409) {
                    errorMessage = 'Shift conflicts with existing shifts';
                }
            }
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDateChange = (selectedDate) => {
        if (currentPicker === 'start') {
            setStartDate(selectedDate);
            if (!isBefore(selectedDate, endDate)) {
                setEndDate(addHours(selectedDate, 1));
            }
        } else {
            if (isBefore(selectedDate, addHours(startDate, 1))) {
                Alert.alert('Invalid Time', 'Shift must be at least 1 hour long');
                setEndDate(addHours(startDate, 1));
            } else {
                setEndDate(selectedDate);
            }
        }
    };

    const handleDelete = async () => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            await api.delete(`/shift/${shiftId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Success', 'Shift deleted successfully');
            navigation.goBack();
        } catch (err) {
            setError('Failed to delete shift');
            console.error(err);
        }
    };

    const showDatePicker = (type) => {
        setCurrentPicker(type);
        setPickerMode('date');
        setShowPicker(true);
    };

    const showTimePicker = (type) => {
        setCurrentPicker(type);
        setPickerMode('time');
        setShowPicker(true);
    };

    const toLocalISOString = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date - offset).toISOString().slice(0, -1);
        return localISOTime;
    };

    const onChange = (event, selectedDate) => {
        if (event.type === 'dismissed') {
            setShowPicker(false);
            return;
        }

        if (selectedDate) {
            if (pickerMode === 'date') {
                const updatedDate = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    currentPicker === 'start' ? startDate.getHours() : endDate.getHours(),
                    currentPicker === 'start' ? startDate.getMinutes() : endDate.getMinutes()
                );
                handleDateChange(updatedDate);
                if (Platform.OS === 'android') {
                    setPickerMode('time');
                }
            } else {
                const updatedDate = new Date(
                    currentPicker === 'start' ? startDate : endDate
                );
                updatedDate.setHours(selectedDate.getHours());
                updatedDate.setMinutes(selectedDate.getMinutes());
                handleDateChange(updatedDate);
                setShowPicker(false);
            }
        }
    };

    const renderPicker = () => {
        if (Platform.OS === 'ios') {
            return (
                <DateTimePicker
                    mode="datetime"
                    display="spinner"
                    value={currentPicker === 'start' ? startDate : endDate}
                    onChange={onChange}
                    style={{ backgroundColor: 'white' }}
                    minimumDate={currentPicker === 'end' ? addHours(startDate, 1) : undefined}
                />
            );
        }

        if (showPicker && Platform.OS === 'android') {
            return (
                <DateTimePicker
                    mode={pickerMode}
                    display="default"
                    value={currentPicker === 'start' ? startDate : endDate}
                    onChange={onChange}
                    minimumDate={pickerMode === 'date' && currentPicker === 'end' ? startDate : undefined}
                />
            );
        }

        return null;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
                <PaperButton onPress={fetchShift}>Retry</PaperButton>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Edit Shift</Text>

            <Text style={styles.label}>Staff ID: {shift?.staffId}</Text>

            <Text style={styles.label}>Start Time:</Text>
            <View style={styles.timeRow}>
                <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => showDatePicker('start')}
                >
                    <Text>{format(startDate, 'MMM d, yyyy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.dateInput, { marginLeft: 10 }]}
                    onPress={() => showTimePicker('start')}
                >
                    <Text>{format(startDate, 'HH:mm')}</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>End Time:</Text>
            <View style={styles.timeRow}>
                <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => showDatePicker('end')}
                >
                    <Text>{format(endDate, 'MMM d, yyyy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.dateInput, { marginLeft: 10 }]}
                    onPress={() => showTimePicker('end')}
                >
                    <Text>{format(endDate, 'HH:mm')}</Text>
                </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' && renderPicker()}
            {Platform.OS === 'android' && showPicker && renderPicker()}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <PaperButton 
                mode="contained" 
                onPress={handleUpdate} 
                style={styles.button}
                disabled={loading}
            >
                {loading ? 'Updating...' : 'Update Shift'}
            </PaperButton>

            <PaperButton
                mode="contained"
                onPress={handleDelete}
                style={[styles.button, styles.deleteButton]}
            >
                Delete Shift
            </PaperButton>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginTop: 10,
        fontWeight: 'bold',
    },
    dateInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
    },
    timeRow: {
        flexDirection: 'row',
        marginVertical: 10,
    },
    button: {
        marginTop: 20,
    },
    errorText: {
        color: 'red',
        marginVertical: 10,
        textAlign: 'center',
    },
    deleteButton: {
        backgroundColor: 'red',
    },
});

export default EditShiftScreen;