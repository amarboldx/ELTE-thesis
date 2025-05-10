import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal, 
  Pressable,
  Alert,
  ToastAndroid,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Card, Title, Paragraph, Snackbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import api from './config/api';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];

const ReservationsScreen = () => {
  const [allReservations, setAllReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    if (allReservations.length > 0) {
      applyFilters();
    }
  }, [statusFilter, allReservations]);

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
      const response = await api.get('/reservations');
      setAllReservations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.response ? `Failed to load reservations. Server returned ${err.response.status}` : 'An error occurred while fetching reservations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let result = [...allReservations];
    
    if (statusFilter) {
      result = result.filter(reservation => reservation.status === statusFilter);
    }
    
    setFilteredReservations(result);
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING': return 'CONFIRMED';
      case 'CONFIRMED': return 'CANCELLED';
      default: return currentStatus;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'CONFIRMED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#000';
    }
  };

  const getCardBackground = (status) => {
    switch (status) {
      case 'CONFIRMED': return '#e8f5e9';
      case 'CANCELLED': return '#ffebee';
      default: return 'white';
    }
  };

  const changeReservationStatus = async (reservation, newStatus) => {
    const originalReservations = [...allReservations];
    
    try {
      // Optimistic update
      const updatedReservations = allReservations.map(r => 
        r.id === reservation.id ? { ...r, status: newStatus } : r
      );
      setAllReservations(updatedReservations);
      
      if (modalVisible) {
        setModalVisible(false);
      }

      await api.patch(`/reservations/${reservation.id}/status`, null, {
        params: { status: newStatus },
      });

      if (Platform.OS === 'android') {
        ToastAndroid.show(`Reservation #${reservation.id} updated to ${newStatus}`, ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setAllReservations(originalReservations); // Revert on error
      showSnackbar('Failed to update reservation status');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const renderRightActions = (reservation, progress, dragX) => {
    if (reservation.status === 'CANCELLED') return null;
    
    const nextStatus = getNextStatus(reservation.status);
    const bgColor = nextStatus === 'CONFIRMED' ? '#4CAF50' : '#F44336';

    return (
      <RectButton
        style={[styles.actionContainer, { backgroundColor: bgColor }]}
        onPress={() => changeReservationStatus(reservation, nextStatus)}
      >
        <Text style={styles.actionText}>{nextStatus}</Text>
      </RectButton>
    );
  };

  const renderLeftActions = (reservation, progress, dragX) => {
    if (reservation.status === 'CANCELLED') return null;

    return (
      <RectButton
        style={[styles.actionContainer, { backgroundColor: '#F44336' }]}
        onPress={() => {
          Alert.alert(
            'Cancel Reservation',
            'Are you sure you want to cancel this reservation?',
            [
              { text: 'No', style: 'cancel' },
              { text: 'Yes', onPress: () => changeReservationStatus(reservation, 'CANCELLED') }
            ]
          );
        }}
      >
        <Text style={styles.actionText}>CANCEL</Text>
      </RectButton>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.swipeableOuterContainer}>
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(item, progress, dragX)}
        renderLeftActions={(progress, dragX) => renderLeftActions(item, progress, dragX)}
        onSwipeableRightOpen={() => {
          if (item.status !== 'CANCELLED') {
            const nextStatus = getNextStatus(item.status);
            changeReservationStatus(item, nextStatus);
          }
        }}
        onSwipeableLeftOpen={() => {
          if (item.status !== 'CANCELLED') {
            Alert.alert(
              'Cancel Reservation',
              'Are you sure you want to cancel this reservation?',
              [
                { text: 'No', style: 'cancel', onPress: () => {} },
                { text: 'Yes', onPress: () => changeReservationStatus(item, 'CANCELLED') }
              ]
            );
          }
        }}
        friction={2}
        rightThreshold={40}
        leftThreshold={40}
        containerStyle={styles.swipeableContainer}
      >
        <TouchableOpacity 
          onPress={() => {
            setSelectedReservation(item);
            setModalVisible(true);
          }}
          activeOpacity={0.9}
        >
          <Card style={[styles.card, { backgroundColor: getCardBackground(item.status) }]}>
            <Card.Content>
              <Title>{`Reservation #${item.id}`}</Title>
              <Paragraph>{`Customer: ${item.customerName || 'N/A'}`}</Paragraph>
              <Paragraph>{`Table ID: ${item.tableId}`}</Paragraph>
              <Paragraph>{`Start: ${new Date(item.startTime).toLocaleString()}`}</Paragraph>
              <Paragraph>{`End: ${new Date(item.endTime).toLocaleString()}`}</Paragraph>
              <View style={styles.statusRow}>
                <Text>Status: </Text>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Swipeable>
    </View>
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

  const deleteReservation = async (reservationId) => {
    const originalReservations = [...allReservations];
    
    try {
      const updatedReservations = allReservations.filter(r => r.id !== reservationId);
      setAllReservations(updatedReservations);
      setModalVisible(false);
  
      await api.delete(`/reservations/${reservationId}`);
  
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Reservation #${reservationId} deleted`, ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error('Error deleting reservation:', err);
      setAllReservations(originalReservations);
      showSnackbar('Failed to delete reservation');
    }
  };

  if (loading && !refreshing) {
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
      ) : filteredReservations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reservations found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
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

      <TouchableOpacity style={styles.fab} onPress={handleAddReservation}>
        <MaterialCommunityIcons name="plus" size={24} color="white" />
      </TouchableOpacity>

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
                style={[styles.modalButton, { backgroundColor: getStatusColor(status) }]}
                onPress={() => {
                  changeReservationStatus(selectedReservation, status);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>{status}</Text>
              </Pressable>
            ))}

            <Pressable
              style={[styles.modalButton, { backgroundColor: '#d32f2f' }]}
              onPress={() => {
                Alert.alert(
                  'Delete Reservation',
                  'Are you sure you want to permanently delete this reservation?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      onPress: () => deleteReservation(selectedReservation.id),
                      style: 'destructive'
                    }
                  ]
                );
              }}
            >
              <Text style={styles.modalButtonText}>Delete Reservation</Text>
            </Pressable>

            <Pressable
              style={[styles.modalButton, { backgroundColor: '#ccc' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: 'black' }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
    marginBottom: 16,
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
    marginBottom: 0, // Removed margin since swipeable container handles it
    elevation: 2,
    borderRadius: 8,
    width: '100%',
  },
  swipeableOuterContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    height: 'auto'
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    flex: 1,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    padding: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
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
  swipeableContainer: {
    borderRadius: 8,
  },
  actionButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReservationsScreen;