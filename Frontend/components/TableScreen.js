import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import {Button, Snackbar, RadioButton} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  GestureHandlerRootView,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';

const TableScreen = ({navigation}) => {
  const GRID_CELL_SIZE = 50;
  const [gridDimensions, setGridDimensions] = useState({
    width: 1000,
    height: 1000,
  });

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floors, setFloors] = useState([1]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [role, setRole] = useState('WAITER');

  // Editor mode states
  const [editorMode, setEditorMode] = useState(false);
  const [selectedShape, setSelectedShape] = useState('SQUARE');
  const [shapeModalVisible, setShapeModalVisible] = useState(false);
  const [newTable, setNewTable] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tablePropertiesModalVisible, setTablePropertiesModalVisible] =
    useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [customFloor, setCustomFloor] = useState('1');
  const [floorInputModalVisible, setFloorInputModalVisible] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showEditorControls, setShowEditorControls] = useState(false);
  const [confirmMove, setConfirmMove] = useState(false);

  const [isTableActionModalVisible, setIsTableActionModalVisible] =
    useState(false);
  const [selectedTableForAction, setSelectedTableForAction] = useState(null);

  const scrollViewRef = useRef(null);
  const contentOffset = useRef({x: 0, y: 0});
  const startGesture = useRef({x: 0, y: 0});
  const longPressRef = useRef(null);

  const [tableNumberError, setTableNumberError] = useState('');
  const [floorNumberError, setFloorNumberError] = useState('');
  const [widthError, setWidthError] = useState('');
  const [heightError, setHeightError] = useState('');
  const [radiusError, setRadiusError] = useState('');

  useEffect(() => {
    updateGridDimensions();
  }, [tables, currentFloor]);

  const updateGridDimensions = () => {
    if (tables.length > 0) {
      const floorTables = tables.filter(table => table.floor === currentFloor);
      if (floorTables.length > 0) {
        const maxX = Math.max(
          ...floorTables.map(
            table => table.x + (table.width || table.radius * 2 || 100),
          ),
        );
        const maxY = Math.max(
          ...floorTables.map(
            table => table.y + (table.height || table.radius * 2 || 100),
          ),
        );

        const gridWidth = Math.max(
          1000,
          Math.ceil((maxX + 200) / GRID_CELL_SIZE) * GRID_CELL_SIZE,
        );
        const gridHeight = Math.max(
          1000,
          Math.ceil((maxY + 200) / GRID_CELL_SIZE) * GRID_CELL_SIZE,
        );

        setGridDimensions({width: gridWidth, height: gridHeight});
      } else {
        setGridDimensions({width: 1000, height: 1000});
      }
    } else {
      setGridDimensions({width: 1000, height: 1000});
    }
  };

  useEffect(() => {
    fetchTables();
    getRole();
  }, []);

  

  const getRole = async () => {
    try {
      const roleString = await AsyncStorage.getItem('role');
      setRole(roleString || '[]');
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  };

  const createDefaultTable = (shape, x, y) => {
    let tableObj = {
      tableNumber: 0,
      tableStatus: 'AVAILABLE',
      orderStatus: 'NONE',
      shape: shape,
      x: x,
      y: y,
      floor: currentFloor,
    };

    if (shape === 'SQUARE') {
      tableObj.width = 100;
      tableObj.height = 100;
    } else if (shape === 'RECTANGLE') {
      tableObj.width = 150;
      tableObj.height = 100;
    } else if (shape === 'CIRCLE') {
      tableObj.radius = 50;
    }

    return tableObj;
  };

  const saveNewTable = async () => {
    if (!newTable) {
      showSnackbar('Something went wrong with the table data.');
      return;
    }

    const tableToSave = {
      ...newTable,
      floor: parseInt(customFloor),
      tableNumber: parseInt(tableNumber),
    };

    try {
      if (newTable.id) {
        await api.put(`/table/${newTable.id}`, tableToSave);
        showSnackbar('Table updated successfully');
      } else if (tableNumber) {
        await api.post('/table', tableToSave);
        showSnackbar('Table created successfully');
      } else {
        showSnackbar('Please set a table number');
        return;
      }

      cancelEditing();
      setTablePropertiesModalVisible(false);
      fetchTables();
    } catch (err) {
      console.error('Error saving table:', err);
      showSnackbar('Failed to save table');
    }
  };

  const cancelEditing = () => {
    setEditorMode(false);
    setConfirmMove(false);
    setNewTable(null);
    setTableNumber('');
    setIsPlacing(false);
    setIsResizing(false);
    setIsDragging(false);
    setSelectedTableId(null);
    setConfirmMove(false); // Reset confirm move
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/table');

      const floorNumbers = response.data.map(table => table.floor);
      const maxFloor = floorNumbers.length > 0 ? Math.max(...floorNumbers) : 0;
      const updatedFloors = Array.from({ length: maxFloor + 1 }, (_, i) => i + 1);

      setFloors(updatedFloors);

      if (maxFloor > 0) {
        setCurrentFloor(1);
      }

      setTables(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Failed to load tables. Please try again.');
      showSnackbar('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = message => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleGridPress = event => {
    if (!editorMode || !isPlacing || !selectedShape) return;
  
    const {locationX, locationY} = event.nativeEvent;
    const scrollX = contentOffset.current.x;
    const scrollY = contentOffset.current.y;

    const absoluteX = locationX + scrollX;
    const absoluteY = locationY + scrollY;

    const snappedX = Math.round(absoluteX / GRID_CELL_SIZE) * GRID_CELL_SIZE;
    const snappedY = Math.round(absoluteY / GRID_CELL_SIZE) * GRID_CELL_SIZE;
  
    const baseTable = createDefaultTable(selectedShape, 0, 0);
    let tableX = snappedX;
    let tableY = gridDimensions.height - snappedY; 

    if (baseTable.shape === 'CIRCLE') {
      tableX -= baseTable.radius;
      tableY -= baseTable.radius;
    } else {
      const width = baseTable.width || 100;
      const height = baseTable.height || 100;
      tableX -= width / 2;
      tableY -= height / 2;
    }

    tableX = Math.max(0, tableX);
    tableY = Math.max(0, tableY);
  
    const newTableObj = {...baseTable, x: tableX, y: tableY};
    setNewTable(newTableObj);
    setIsPlacing(false);
    setTablePropertiesModalVisible(true);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !(isDragging || isResizing),
      onMoveShouldSetPanResponder: () => !(isDragging || isResizing),
      onPanResponderGrant: (_, gestureState) => {
        startGesture.current = {
          x: contentOffset.current.x,
          y: contentOffset.current.y,
        };
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isDragging || isResizing) return;
        const newX = startGesture.current.x - gestureState.dx;
        const newY = startGesture.current.y - gestureState.dy;

        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({x: newX, y: newY, animated: false});
        }
      },
      onPanResponderRelease: () => {
        contentOffset.current = {
          x: scrollViewRef.current?.contentOffset?.x || 0,
          y: scrollViewRef.current?.contentOffset?.y || 0,
        };
      },
    }),
  ).current;

  const handleScroll = event => {
    contentOffset.current = {
      x: event.nativeEvent.contentOffset.x,
      y: event.nativeEvent.contentOffset.y,
    };
  };

  const changeFloor = direction => {
    const currentIndex = floors.indexOf(currentFloor);
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < floors.length) {
      setCurrentFloor(floors[newIndex]);
      scrollViewRef.current?.scrollTo({x: 0, y: 0, animated: true});
      contentOffset.current = {x: 0, y: 0};

      if (editorMode) {
        cancelEditing();
      }
    }
  };

  const toggleEditorMode = () => {
    if (editorMode) {
      setEditorMode(false);
      setConfirmMove(false);
      setShowEditorControls(false);
      setSelectedTableId(null);
      setNewTable(null);
    } else {
      setEditorMode(true);
      setShowEditorControls(true);
    }
  };

  const selectShape = shape => {
    setSelectedShape(shape);
    setShapeModalVisible(false);
    setFloorInputModalVisible(true);
  };

  const confirmFloor = () => {
    setFloorInputModalVisible(false);
    setIsPlacing(true);
  };

  const renderGridLines = () => {
    const verticalLines = [];
    const horizontalLines = [];

    for (let x = 0; x <= gridDimensions.width; x += GRID_CELL_SIZE) {
      verticalLines.push(
        <View
          key={`v-${x}`}
          style={[
            styles.gridLine,
            {
              left: x,
              height: gridDimensions.height,
              width: 1,
            },
          ]}
        />,
      );
    }

    for (let y = 0; y <= gridDimensions.height; y += GRID_CELL_SIZE) {
      horizontalLines.push(
        <View
          key={`h-${y}`}
          style={[
            styles.gridLine,
            {
              top: y,
              width: gridDimensions.width,
              height: 1,
            },
          ]}
        />,
      );
    }

    return (
      <View style={styles.gridContainer}>
        {verticalLines}
        {horizontalLines}

        {verticalLines.map((_, index) => (
          <Text
            key={`label-x-${index}`}
            style={[
              styles.coordinateLabel,
              {left: index * GRID_CELL_SIZE + 2},
            ]}>
            {index * GRID_CELL_SIZE}
          </Text>
        ))}

        {horizontalLines.map((_, index) => (
          <Text
            key={`label-y-${index}`}
            style={[
              styles.coordinateLabel,
              {
                top: index * GRID_CELL_SIZE - 12,
                left: 2,
              },
            ]}>
            {index * GRID_CELL_SIZE}
          </Text>
        ))}
      </View>
    );
  };

  const moveTable = direction => {
    if (!newTable) return;

    let newX = newTable.x;
    let newY = newTable.y;
    const tableWidth = newTable.width || newTable.radius * 2 || 100;
    const tableHeight = newTable.height || newTable.radius * 2 || 100;

    switch (direction) {
      case 'left':
        newX = Math.max(0, newTable.x - GRID_CELL_SIZE);
        break;
      case 'right':
        newX = Math.min(
          gridDimensions.width - tableWidth,
          newTable.x + GRID_CELL_SIZE,
        );
        break;
      case 'up':
        newY = Math.max(tableHeight, newTable.y - GRID_CELL_SIZE);
        break;
      case 'down':
        newY = Math.max(0, newTable.y + GRID_CELL_SIZE);
        break;
    }

    setNewTable({...newTable, x: newX, y: newY});
    setConfirmMove(true);
  };

  const renderTable = table => {
    const tableWidth =
      table.width || (table.shape === 'CIRCLE' ? table.radius * 2 : 100);
    const tableHeight =
      table.height || (table.shape === 'CIRCLE' ? table.radius * 2 : 100);

    const isSelected = selectedTableId === table.id;

    const screenX = table.x;
    const screenY = table.y - tableHeight;

    const tableStyles = {
      position: 'absolute',
      left: screenX,
      top: screenY,
      width: tableWidth,
      height: tableHeight,
      borderRadius: table.shape === 'CIRCLE' ? tableWidth / 2 : 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: getTableColor(table),
      elevation: 3,
      borderColor: isSelected ? '#6200ee' : '#fff',
      borderWidth: isSelected ? 3 : 2,
      zIndex: isSelected ? 10 : 1,
    };

    return (
      <LongPressGestureHandler
        key={table.id}
        ref={longPressRef}
        onHandlerStateChange={({nativeEvent}) => {
          if (nativeEvent.state === State.ACTIVE) {
            setSelectedTableForAction(table);
            setIsTableActionModalVisible(true);
          }
        }}
        minDurationMs={600}>
        <View style={tableStyles}>
          <TouchableOpacity
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
            onPress={() => handleTablePress(table)}
            activeOpacity={0.8}>
            <Text style={styles.tableNumber}>{table.tableNumber}</Text>
            <Text style={styles.tableStatus}>{table.tableStatus}</Text>
          </TouchableOpacity>
        </View>
      </LongPressGestureHandler>
    );
  };

  const renderNewTable = () => {
    if (!newTable) return null;

    const tableWidth =
      newTable.width ||
      (newTable.shape === 'CIRCLE' ? newTable.radius * 2 : 100);
    const tableHeight =
      newTable.height ||
      (newTable.shape === 'CIRCLE' ? newTable.radius * 2 : 100);

    const screenX = newTable.x;
    const screenY = gridDimensions.height - newTable.y - tableHeight;

    const tableStyles = {
      position: 'absolute',
      left: screenX,
      top: screenY,
      width: tableWidth,
      height: tableHeight,
      borderRadius: newTable.shape === 'CIRCLE' ? tableWidth / 2 : 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(76, 175, 80, 0.7)',
      borderWidth: 2,
      borderColor: '#4CAF50',
      borderStyle: 'dashed',
      elevation: 3,
      zIndex: 100,
    };

    const arrowButtonSize = 20;
    const arrowButtonStyles = {
      position: 'absolute',
      width: arrowButtonSize,
      height: arrowButtonSize,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: arrowButtonSize / 2,
    };

    const leftArrow = {
      ...arrowButtonStyles,
      left: -arrowButtonSize / 2,
      top: tableHeight / 2 - arrowButtonSize / 2,
    };

    const rightArrow = {
      ...arrowButtonStyles,
      right: -arrowButtonSize / 2,
      top: tableHeight / 2 - arrowButtonSize / 2,
    };

    const upArrow = {
      ...arrowButtonStyles,
      top: -arrowButtonSize / 2,
      left: tableWidth / 2 - arrowButtonSize / 2,
    };

    const downArrow = {
      ...arrowButtonStyles,
      bottom: -arrowButtonSize / 2,
      left: tableWidth / 2 - arrowButtonSize / 2,
    };

    return (
      <View style={tableStyles}>
        <Text style={styles.tableNumber}>{tableNumber || '?'}</Text>
        <Text style={styles.tableHint}>Tap arrows to move</Text>

        {editorMode && (
          <>
            <TouchableOpacity
              style={leftArrow}
              onPress={() => moveTable('left')}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={16}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={rightArrow}
              onPress={() => moveTable('right')}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity style={upArrow} onPress={() => moveTable('up')}>
              <MaterialCommunityIcons name="arrow-up" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={downArrow}
              onPress={() => moveTable('down')}>
              <MaterialCommunityIcons
                name="arrow-down"
                size={16}
                color="white"
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const getTableColor = table => {
    if (table.orderStatus === 'IN_PROGRESS') return '#FF9800';
    if (table.tableStatus === 'OCCUPIED') return '#F44336';
    if (table.tableStatus === 'RESERVED') return '#2196F3';
    return '#4CAF50';
  };

  const handleTablePress = table => {
    if (editorMode) {
      if (selectedTableId === table.id) {
        setNewTable(table);
        setTableNumber(table.tableNumber);
        setCustomFloor(table.floor);
        setTablePropertiesModalVisible(true);
      } else {
        setSelectedTableId(table.id);
        setNewTable(table);
        setTableNumber(table.tableNumber);
      }
    } else {
      Alert.alert(
        `Table ${table.tableNumber}`,
        `Status: ${table.tableStatus}\nOrder Status: ${table.orderStatus}`,
        [
          {text: 'View Orders', onPress: () => viewTableOrders(table)},
          {text: 'Cancel', style: 'cancel'},
        ],
      );
    }
  };

  const viewTableOrders = table => {
    navigation.navigate('OrderScreen', {tableId: table.id});
  };

  const validateInput = () => {
    let isValid = true;
    setTableNumberError('');
    setFloorNumberError('');
    setWidthError('');
    setHeightError('');
    setRadiusError('');

    if (!tableNumber || parseInt(tableNumber, 10) === 0) {
      setTableNumberError('Table number must be greater than 0');
      isValid = false;
    }
    if (!customFloor || parseInt(customFloor, 10) === 0) {
      setFloorNumberError('Floor number must be greater than 0');
      isValid = false;
    }
    if (newTable.shape === 'RECTANGLE') {
      if (!newTable.width || parseInt(newTable.width, 10) === 0) {
        setWidthError('Width must be greater than 0');
        isValid = false;
      }
      if (!newTable.height || parseInt(newTable.height, 10) === 0) {
        setHeightError('Height must be greater than 0');
        isValid = false;
      }
    } else if (newTable.shape === 'CIRCLE') {
      if (!newTable.radius || parseInt(newTable.radius, 10) === 0) {
        setRadiusError('Radius must be greater than 0');
        isValid = false;
      }
    } else if (newTable.shape === 'SQUARE') {
      if (!newTable.width || parseInt(newTable.width, 10) === 0) {
        setWidthError('Width/Height must be greater than 0');
        isValid = false;
      }
    }
    return isValid;
  };

  const handleSaveTableProperties = () => {
    if (validateInput()) {
      saveNewTable();
      setTablePropertiesModalVisible(false);
    }
  };

  const renderMeasurementInput = (label, value, onChange, errorMessage) => {
    return (
      <View>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.measurementInputContainer}>
          <TouchableOpacity
            style={styles.measurementButton}
            onPress={() => onChange(Math.max(0, (value || 0) - 50))}>
            <MaterialCommunityIcons name="minus" size={20} color="#333" />
          </TouchableOpacity>
          <TextInput
            style={styles.measurementInput}
            keyboardType="numeric"
            onChangeText={text => {
              const num = parseInt(text, 10) || 0;
              onChange(num);
            }}
            value={value ? value.toString() : '0'}
          />
          <TouchableOpacity
            style={styles.measurementButton}
            onPress={() => onChange((value || 0) + 50)}>
            <MaterialCommunityIcons name="plus" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loaderText}>Loading tables...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchTables}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Floor {currentFloor}</Text>
      </View>

      <View style={styles.scrollContainer} {...panResponder.panHandlers}>
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            width: gridDimensions.width,
            height: gridDimensions.height,
          }}
          showsHorizontalScrollIndicator={false}>
          <ScrollView
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              width: gridDimensions.width,
              height: gridDimensions.height,
            }}>
            <TouchableWithoutFeedback onPress={handleGridPress}>
              <View style={{width: '100%', height: '100%'}}>
                {renderGridLines()}

                {tables
                  .filter(table => table.floor === currentFloor)
                  .map(renderTable)}

                {editorMode && renderNewTable()}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </ScrollView>
      </View>

      <View style={styles.floorNavigation}>
        <TouchableOpacity
          style={styles.floorButton}
          onPress={() => changeFloor(-1)}
          disabled={currentFloor === floors[0]}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={currentFloor === floors[0] ? '#ccc' : '#6200ee'}
          />
        </TouchableOpacity>

        <Text style={styles.floorText}>Floor {currentFloor}</Text>

        <TouchableOpacity
          style={styles.floorButton}
          onPress={() => changeFloor(1)}
          disabled={currentFloor === floors[floors.length - 1]}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={
              currentFloor === floors[floors.length - 1] ? '#ccc' : '#6200ee'
            }
          />
        </TouchableOpacity>
      </View>

      {confirmMove && (
        <TouchableOpacity style={styles.confirmButton} onPress={saveNewTable}>
          <Text style={styles.confirmButtonText}>Confirm Move</Text>
        </TouchableOpacity>
      )}

      {role === 'ADMIN' && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={toggleEditorMode}>
          <MaterialCommunityIcons
            name={
              editorMode
                ? showEditorControls
                  ? 'close'
                  : 'pencil-off'
                : 'pencil'
            }
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
      )}

      {editorMode && showEditorControls && (
        <TouchableOpacity
          style={[styles.floatingButton, styles.createButton]}
          onPress={() => {
            setShapeModalVisible(true);
            setSelectedTableId(null);
          }}>
          <MaterialCommunityIcons name="table-plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Shape selection modal */}
      <Modal
        visible={shapeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShapeModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Table Shape</Text>

            <RadioButton.Group
              onValueChange={selectShape}
              value={selectedShape}>
              <View style={styles.radioItem}>
                <RadioButton value="SQUARE" />
                <Text style={styles.radioLabel}>Square</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="RECTANGLE" />
                <Text style={styles.radioLabel}>Rectangle</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="CIRCLE" />
                <Text style={styles.radioLabel}>Circle</Text>
              </View>
            </RadioButton.Group>

            <Button
              mode="contained"
              onPress={() => setShapeModalVisible(false)}
              style={styles.modalButton}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={floorInputModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFloorInputModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Floor</Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              onChangeText={setCustomFloor}
              value={currentFloor}
              placeholder="Enter Floor Number"
            />

            <Button
              mode="contained"
              onPress={confirmFloor}
              style={styles.modalButton}>
              Confirm
            </Button>
            <Button
              mode="outlined"
              onPress={() => setFloorInputModalVisible(false)}
              style={styles.modalButton}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={tablePropertiesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTablePropertiesModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Table Properties</Text>

            <Text style={styles.inputLabel}>Table Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              onChangeText={setTableNumber}
              value={tableNumber || (newTable?.tableNumber?.toString() || '')}
              placeholder="Table Number"
            />
            {tableNumberError && (
              <Text style={styles.errorText}>{tableNumberError}</Text>
            )}

            <Text style={styles.inputLabel}>Floor Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              onChangeText={setCustomFloor}
              value={customFloor || (newTable?.floor?.toString() || '')}
              placeholder="Floor Number"
            />
            {floorNumberError && (
              <Text style={styles.errorText}>{floorNumberError}</Text>
            )}

            {newTable && newTable.shape === 'RECTANGLE' && (
              <>
                {renderMeasurementInput(
                  'Width',
                  newTable.width,
                  width => setNewTable({...newTable, width}),
                  widthError,
                )}
                {renderMeasurementInput(
                  'Height',
                  newTable.height,
                  height => setNewTable({...newTable, height}),
                  heightError,
                )}
              </>
            )}

            {newTable &&
              newTable.shape === 'CIRCLE' &&
              renderMeasurementInput(
                'Radius',
                newTable.radius,
                radius => setNewTable({...newTable, radius}),
                radiusError,
              )}

            {newTable &&
              newTable.shape === 'SQUARE' &&
              renderMeasurementInput(
                'Width/Height',
                newTable.width,
                size => setNewTable({...newTable, width: size, height: size}),
                widthError,
              )}

            <Button
              mode="contained"
              onPress={handleSaveTableProperties}
              style={styles.modalButton}>
              Save
            </Button>
            <Button
              mode="outlined"
              onPress={() => setTablePropertiesModalVisible(false)}
              style={styles.modalButton}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isTableActionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTableActionModalVisible(false)}>
        <TouchableWithoutFeedback
          onPress={() => setIsTableActionModalVisible(false)}>
          <View style={styles.actionModalContainer}>
            <View style={styles.actionModalContent}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setIsTableActionModalVisible(false);
                  setSelectedTableId(selectedTableForAction.id);
                  setNewTable({...selectedTableForAction});
                  setTableNumber(selectedTableForAction.tableNumber);
                  setCustomFloor(selectedTableForAction.floor);
                  setTablePropertiesModalVisible(true);
                }}>
                <Text style={styles.actionButtonText}>Edit Table</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={async () => {
                  setIsTableActionModalVisible(false);
                  Alert.alert(
                    'Delete Table',
                    'Are you sure you want to delete this table?',
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {
                        text: 'Delete',
                        onPress: async () => {
                          try {
                            await api.delete(
                              `/table/${selectedTableForAction.id}`,
                            );
                            showSnackbar('Table deleted successfully');
                            fetchTables();
                          } catch (err) {
                            console.error('Error deleting table:', err);
                            showSnackbar('Failed to delete table');
                          }
                        },
                      },
                    ],
                    {cancelable: false},
                  );
                }}>
                <Text
                  style={[styles.actionButtonText, styles.deleteButtonText]}>
                  Delete Table
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}>
        {snackbarMessage}
      </Snackbar>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  gridLine: {
    backgroundColor: '#e0e0e0',
    position: 'absolute',
  },
  coordinateLabel: {
    position: 'absolute',
    fontSize: 8,
    color: '#999',
  },
  table: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    elevation: 3,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tableStatus: {
    fontSize: 12,
    color: '#eee',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    backgroundColor: '#6200ee',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  createButton: {
    bottom: 150,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    color: '#333',
  },
  modalButton: {
    marginTop: 10,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  floorNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  floorButton: {
    padding: 8,
  },
  floorText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  tableHint: {
    fontSize: 10,
    color: '#eee',
  },
  bottomRightHandle: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 100,
  },
  bottomLeftHandle: {
    position: 'absolute',
    left: -8,
    bottom: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 100,
  },
  topRightHandle: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 100,
  },
  topLeftHandle: {
    position: 'absolute',
    left: -8,
    top: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 100,
  },
  confirmButton: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 200,
    overflow: 'hidden',
  },
  actionButton: {
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#ffeeee',
  },
  deleteButtonText: {
    color: '#d32f2f',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  bottomRightHandle: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 100,
  },
  bottomLeftHandle: {
    position: 'absolute',
    left: -8,
    bottom: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 100,
  },
  topRightHandle: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 100,
  },
  topLeftHandle: {
    position: 'absolute',
    left: -8,
    top: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 100,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  measurementInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  measurementButton: {
    backgroundColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  measurementButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  measurementInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
});
export default TableScreen;
