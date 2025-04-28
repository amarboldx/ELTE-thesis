import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';
import { useNavigation } from '@react-navigation/native';

const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];

const ReservationsScreen = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    checkToken();
  }, [statusFilter]);

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwtToken');
      setToken(storedToken);

      if (storedToken) {
        fetchReservations();
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

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reservations/status?status=${statusFilter}`);
      setReservations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      if (err.response) {
        setError(`Failed to load reservations. Server returned ${err.response.status}`);
      } else {
        setError('An error occurred while fetching reservations');
      }
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (reservation) => {
    setSelectedReservation(reservation);
    setModalVisible(true);
  };

  const changeReservationStatus = async (newStatus) => {
    if (!selectedReservation) return;

    try {
      await api.patch(`/reservations/${selectedReservation.id}/status`, null, {
        params: { status: newStatus }
      });
      setModalVisible(false);
      fetchReservations(); // Refresh reservations after status change
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setModalVisible(false);
      alert('Failed to update status.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openStatusModal(item)}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{`Reservation #${item.id}`}</Title>
          <Paragraph>{`Customer: ${item.customerName || 'N/A'}`}</Paragraph>
          <Paragraph>{`Table ID: ${item.tableId}`}</Paragraph>
          <Paragraph>{`Start: ${new Date(item.startTime).toLocaleString()}`}</Paragraph>
          <Paragraph>{`End: ${new Date(item.endTime).toLocaleString()}`}</Paragraph>
          <Paragraph>{`Status: ${item.status}`}</Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderStatusButton = (label) => (
    <TouchableOpacity
      key={label}
      style={[styles.filterButton, statusFilter === label && styles.filterButtonActive]}
      onPress={() => setStatusFilter(label)}
    >
      <Text style={[styles.filterText, statusFilter === label && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const handleAddReservation = () => {
    navigation.navigate('AddReservation');
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loaderText}>Loading reservations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reservations</Text>

      <View style={styles.statusFilterContainer}>
        {statuses.map((status) => renderStatusButton(status))}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : reservations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reservations found</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleAddReservation}
      >
        <MaterialCommunityIcons name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal for changing reservation status */}
      <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Reservation Status</Text>
            {statuses.map((status) => (
              <Pressable
                key={status}
                style={styles.modalButton}
                onPress={() => changeReservationStatus(status)}
              >
                <Text style={styles.modalButtonText}>{status}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.modalButton, { backgroundColor: '#ccc' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: 'black' }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  statusFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ReservationsScreen;
