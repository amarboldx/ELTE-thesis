import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    Animated,
    PanResponder
} from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './config/api';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    isSameDay,
    parseISO,
    getHours,
    getMinutes,
    differenceInMinutes,
    getDay,
    startOfMonth,
    endOfMonth,
    isSameMonth,
    isToday,
    addMonths, 
    subMonths
} from 'date-fns';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const HOUR_HEIGHT = 60;
const TOTAL_DAY_HEIGHT = 24 * HOUR_HEIGHT;
const DAY_HEADER_HEIGHT = 50;
const WEEK_HEADER_HEIGHT = 60;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_COLUMN_WIDTH = (SCREEN_WIDTH - 64) / 7;
const MONTH_VIEW_HEIGHT = 300;

const ShiftsScreen = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState([]);
    const [staffDataCache, setStaffDataCache] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);
    const [userRole, setUserRole] = useState("WAITER");
    const [showMonthView, setShowMonthView] = useState(false);
    const swipeAnim = useRef(new Animated.Value(0)).current;
    const [selectedWeekday, setSelectedWeekday] = useState(getDay(new Date()));
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const weekStartsOn = 1; // Monday
    const currentWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn }), [currentDate]);
    const currentWeekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn }), [currentDate]);
    const daysOfWeek = useMemo(() => eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd }), [currentWeekStart, currentWeekEnd]);

    const navigation = useNavigation();

    const scrollViewRef = useRef(null);
    const monthScrollViewRef = useRef(null);
    const lastSwipeTime = useRef(0);

    const dayPanResponder = useRef(
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: (evt, gestureState) => {
            return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          },
          onPanResponderTerminationRequest: () => false,
          onPanResponderMove: (evt, gestureState) => {
            if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
              swipeAnim.setValue(gestureState.dx);
              if (scrollViewRef.current) {
                scrollViewRef.current.setNativeProps({ scrollEnabled: false });
              }
            }
          },
          onPanResponderRelease: (evt, gestureState) => {
            if (scrollViewRef.current) {
              scrollViewRef.current.setNativeProps({ scrollEnabled: true });
            }
      
            const now = Date.now();
            const swipeThreshold = 50;
            const swipeVelocityThreshold = 0.3;
      
            if (now - lastSwipeTime.current < 300) {
              Animated.spring(swipeAnim, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
              return;
            }
      
            // Check if swipe meets threshold (distance or velocity)
            if (Math.abs(gestureState.dx) > swipeThreshold || Math.abs(gestureState.vx) > swipeVelocityThreshold) {
              lastSwipeTime.current = now;
              if (gestureState.dx > 0 || gestureState.vx > 0) {
                goToPreviousDay();
              } else {
                goToNextDay();
              }
            }
      
            // Always animate back to center
            Animated.spring(swipeAnim, {
              toValue: 0,
              useNativeDriver: true,
              friction: 10,
            }).start();
          },
          onPanResponderTerminate: () => {
            if (scrollViewRef.current) {
              scrollViewRef.current.setNativeProps({ scrollEnabled: true });
            }
            Animated.spring(swipeAnim, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        })
      ).current;

      const weekPanResponder = useRef(
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: (evt, gestureState) => {
            return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          },
          onPanResponderTerminationRequest: () => false,
          onPanResponderMove: (evt, gestureState) => {
            if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
              if (monthScrollViewRef.current) {
                monthScrollViewRef.current.setNativeProps({ scrollEnabled: false });
              }
            }
          },
          onPanResponderRelease: (evt, gestureState) => {
            if (monthScrollViewRef.current) {
              monthScrollViewRef.current.setNativeProps({ scrollEnabled: true });
            }
      
            const now = Date.now();
            const swipeThreshold = 50;
            const swipeVelocityThreshold = 0.3;
      
            if (now - lastSwipeTime.current < 300) {
              return;
            }
      
            // Check if swipe meets threshold (distance or velocity)
            if (Math.abs(gestureState.dx) > swipeThreshold || Math.abs(gestureState.vx) > swipeVelocityThreshold) {
              lastSwipeTime.current = now;
              if (gestureState.dx > 0 || gestureState.vx > 0) {
                goToPreviousWeek();
              } else {
                goToNextWeek();
              }
            }
          },
          onPanResponderTerminate: () => {
            if (monthScrollViewRef.current) {
              monthScrollViewRef.current.setNativeProps({ scrollEnabled: true });
            }
          }
        })
      ).current;

    useEffect(() => {
        checkTokenAndFetchData();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
          fetchShiftsAndStaff();
        }, [])
      );

    const isAdmin = userRole == 'ADMIN';

    const checkTokenAndFetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const storedToken = await AsyncStorage.getItem('jwtToken');
            const storedRole = await AsyncStorage.getItem('role');
            setToken(storedToken);
            if (storedToken) {
                await fetchShiftsAndStaff();
            } else {
                setError('No authentication token found. Please log in again.');
                setLoading(false);
            }
            if (storedRole) {
                setUserRole(storedRole);
            } else {
                setError('No user roles found. Please log in again.');
                setLoading(false);
            }
        } catch {
            setError('Error checking authentication status');
            setLoading(false);
        }
    };

    const fetchShiftsAndStaff = async () => {
        setLoading(true);
        setError(null);
        setShifts([]);
        try {
            const response = await api.get('/shift');
            const fetchedShifts = response.data || [];
            setShifts(fetchedShifts);
            const staffIdsToFetch = [
                ...new Set(fetchedShifts.map(shift => shift.staffId).filter(id => id && !staffDataCache[id]))
            ];
            if (staffIdsToFetch.length > 0) {
                const staffPromises = staffIdsToFetch.map(id =>
                    api.get(`/staff/${id}`)
                        .then(res => ({ id, data: res.data }))
                        .catch(() => ({ id, data: null }))
                );
                const staffResults = await Promise.all(staffPromises);
                const newStaffData = {};
                staffResults.forEach(result => {
                    newStaffData[result.id] = result.data?.name || `Staff ${result.id}`;
                });
                setStaffDataCache(prev => ({ ...prev, ...newStaffData }));
            }
        } catch (err) {
            let errorMessage = 'An error occurred while fetching data.';
            if (err.response) {
                errorMessage = `Failed to load data. Server returned ${err.response.status}`;
                if (err.response.status === 401 || err.response.status === 403) {
                    errorMessage += ' Please check your login status.';
                }
            } else if (err.request) {
                errorMessage = 'Network error. Could not reach the server.';
            }
            setError(errorMessage);
            setShifts([]);
        } finally {
            setLoading(false);
        }
    };

    

    const goToPreviousDay = () => {
        setCurrentDate(prevDate => {
            const prevDay = subDays(prevDate, 1);
            if (!isSameMonth(prevDay, currentMonth)) {
                setCurrentMonth(startOfMonth(prevDay));
            }
            setSelectedWeekday(getDay(prevDay));
            return prevDay;
        });
    };
    
    const goToNextDay = () => {
        setCurrentDate(prevDate => {
            const nextDay = addDays(prevDate, 1);
            if (!isSameMonth(nextDay, currentMonth)) {
                setCurrentMonth(startOfMonth(nextDay));
            }
            setSelectedWeekday(getDay(nextDay));
            return nextDay;
        });
    };

    const goToPreviousWeek = () => {
        setCurrentDate(prevDate => {
            const prevWeekSameDay = subWeeks(prevDate, 1);
            if (!isSameMonth(prevWeekSameDay, currentMonth)) {
                setCurrentMonth(startOfMonth(prevWeekSameDay));
            }
            return prevWeekSameDay;
        });
    };
    
    const goToNextWeek = () => {
        setCurrentDate(prevDate => {
            const nextWeekSameDay = addWeeks(prevDate, 1);
            if (!isSameMonth(nextWeekSameDay, currentMonth)) {
                setCurrentMonth(startOfMonth(nextWeekSameDay));
            }
            return nextWeekSameDay;
        });
    };

    const goToNextMonth = () => {
        const nextMonth = addMonths(currentMonth, 1);
        setCurrentMonth(nextMonth);
    };
    
    const goToPreviousMonth = () => {
        const prevMonth = subMonths(currentMonth, 1);
        setCurrentMonth(prevMonth);
    };

    const handleDayPress = (day) => {
        setCurrentDate(day);
        setSelectedWeekday(getDay(day));
        setShowMonthView(false);
    };

    const toggleMonthView = () => {
        setShowMonthView(prev => !prev);
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedWeekday(getDay(today));
        setCurrentMonth(startOfMonth(today));
        setShowMonthView(false);
    };

    const renderShiftBlock = useCallback((shift, dayDate) => {
        let startTime, endTime;
        try {
            startTime = parseISO(shift.startTime);
            endTime = parseISO(shift.endTime);
        } catch {
            return null;
        }
    
        if (!isSameDay(startTime, dayDate)) return null;
    
        const startHour = getHours(startTime);
        const startMinute = getMinutes(startTime);
        const endHour = getHours(endTime);
        const endMinute = getMinutes(endTime);
    
        const topOffset = (startHour * 60 + startMinute) / 60 * HOUR_HEIGHT;
        let height = (differenceInMinutes(endTime, startTime) / 60) * HOUR_HEIGHT;
        height = Math.max(height, 15);
    
        const staffName = staffDataCache[shift.staffId] || `Staff ${shift.staffId}`;
    
        // Find all shifts that overlap with this one
        const overlappingShifts = shifts.filter(s => {
            try {
                const sStart = parseISO(s.startTime);
                const sEnd = parseISO(s.endTime);
                return isSameDay(sStart, dayDate) && 
                       ((sStart < endTime && sEnd > startTime) || 
                        (s.startTime === shift.startTime && s.endTime === shift.endTime));
            } catch {
                return false;
            }
        });
    
        // Calculate position and width based on overlaps
        const totalOverlaps = overlappingShifts.length;
        const overlapIndex = overlappingShifts.findIndex(s => s.shiftId === shift.shiftId);
        
        // Calculate width and position to use full day column width
        const widthPercentage = 0.9; // Use 90% of available width
        const leftOffsetPercentage = 0.05 + (overlapIndex * (0.9 / totalOverlaps)); // Distribute evenly
        
        return (
            <TouchableOpacity
                key={shift.shiftId}
                style={[
                    styles.shiftBlock,
                    { 
                        top: topOffset, 
                        height,
                        left: `${leftOffsetPercentage * 100}%`,
                        width: `${(widthPercentage / totalOverlaps) * 100}%`,
                    }
                ]}
                onPress={() => navigation.navigate('EditShift', { shiftId: shift.shiftId })}
            >
                <Text style={styles.shiftTextName} numberOfLines={1}>{staffName}</Text>
                <Text style={styles.shiftTextTime}>
                    {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                </Text>
            </TouchableOpacity>
        );
    }, [staffDataCache, shifts, navigation]);

    const renderDayHeaders = () => {
        return (
            <Animated.View 
                style={[
                    styles.dayHeaderContainer, 
                    {
                        opacity: swipeAnim.interpolate({
                            inputRange: [-SCREEN_WIDTH/2, 0, SCREEN_WIDTH/2],
                            outputRange: [0.7, 1, 0.7],
                            extrapolate: 'clamp'
                        }),
                        transform: [{
                            translateX: swipeAnim.interpolate({
                                inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                                outputRange: [-SCREEN_WIDTH/4, 0, SCREEN_WIDTH/4],
                                extrapolate: 'clamp'
                            })
                        }]
                    }
                ]} 
                {...weekPanResponder.panHandlers}
            >
                <View style={styles.hourColumnSpacer} />
                {daysOfWeek.map(day => {
                    const isTodayDay = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, currentDate);
    
                    return (
                        <TouchableOpacity
                            key={format(day, 'yyyy-MM-dd')}
                            style={[
                                styles.dayHeader,
                                isSelected && styles.selectedDayHeader,
                                isSelected && isTodayDay && styles.selectedTodayHeader
                            ]}
                            onPress={() => handleDayPress(day)}
                        >
                            <Text style={[
                                styles.dayHeaderTextShort,
                                isTodayDay && styles.currentDayText,
                                isSelected && styles.selectedDayText,
                            ]}>
                                {format(day, 'EEE')}
                            </Text>
                            <Text style={[
                                styles.dayHeaderTextDate,
                                isTodayDay && styles.currentDayText,
                                isSelected && styles.selectedDayText,
                            ]}>
                                {format(day, 'd')}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </Animated.View>
        );
    };

    const renderDayView = () => {
        const dayShifts = shifts.filter(shift => {
            try {
                return isSameDay(parseISO(shift.startTime), currentDate);
            } catch {
                return false;
            }
        });
    
        return (
            <Animated.View 
                    style={[styles.dayViewContainer, {
                        transform: [{ translateX: swipeAnim.interpolate({
                            inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                            outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                            extrapolate: 'clamp'
                        }) }]
                    }]}
                {...dayPanResponder.panHandlers}
            >
                <View style={styles.hourColumn}>
                    {[...Array(24).keys()].map(hour => (
                        <View key={hour} style={[styles.hourMarker, { height: HOUR_HEIGHT }]}>
                            <Text style={styles.hourMarkerText}>{`${hour}:00`}</Text>
                        </View>
                    ))}
                </View>
                <View style={[styles.dayColumn, { width: SCREEN_WIDTH - 64 }]}>
                    {dayShifts.map(shift => renderShiftBlock(shift, currentDate))}
                </View>
            </Animated.View>
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn });
        const endDate = endOfWeek(monthEnd, { weekStartsOn });
    
        const weeks = [];
        let currentWeekStart = startDate;
    
        while (currentWeekStart <= endDate) {
            const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn });
            weeks.push(eachDayOfInterval({ start: currentWeekStart, end: weekEnd }));
            currentWeekStart = addDays(weekEnd, 1);
        }
    
        return (
            <View style={styles.monthViewContainer}>
                <View style={styles.monthWeekdayHeader}>
                    {daysOfWeek.map((day, index) => (
                        <View key={`weekday-${index}`} style={styles.monthWeekdayHeaderCell}>
                            <Text style={styles.monthWeekdayHeaderText}>
                                {format(day, 'EEE')}
                            </Text>
                        </View>
                    ))}
                </View>
    
                <ScrollView
                    ref={monthScrollViewRef}
                    contentContainerStyle={styles.monthContentContainer}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(event) => {
                        const contentOffsetX = event.nativeEvent.contentOffset.x;
                        if (contentOffsetX >= SCREEN_WIDTH) {
                            goToNextMonth();
                        } else if (contentOffsetX <= -SCREEN_WIDTH) {
                            goToPreviousMonth();
                        }
                    }}
                >
                    <View style={styles.monthContentWrapper}>
                        {weeks.map((week, weekIndex) => (
                            <View key={`week-${weekIndex}`} style={styles.monthWeekRow}>
                                {week.map(day => {
                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                    const isSelected = isSameDay(day, currentDate);
                                    const isToday = isSameDay(day, new Date());
    
                                    return (
                                        <TouchableOpacity
                                            key={format(day, 'yyyy-MM-dd')}
                                            style={[
                                                styles.monthDayCell,
                                                !isCurrentMonth && styles.monthDayCellOtherMonth,
                                                isSelected && styles.monthDayCellSelected,
                                                isToday && !isSelected && styles.monthDayCellToday
                                            ]}
                                            onPress={() => handleDayPress(day)}
                                        >
                                            <Text
                                                style={[
                                                    styles.monthDayText,
                                                    !isCurrentMonth && styles.monthDayTextOtherMonth,
                                                    isSelected && styles.monthDayTextSelected,
                                                    isToday && styles.monthDayTextToday
                                                ]}
                                            >
                                                {format(day, 'd')}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    if (!token && !loading && !error) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    if (!token && error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={showMonthView ? goToPreviousMonth : goToPreviousWeek}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={toggleMonthView} 
                    style={styles.monthToggleButton}
                >
                    <Text style={styles.monthToggleText}>
                        {showMonthView
                            ? format(currentMonth, 'MMMM yyyy')
                            : format(currentDate, 'MMMM yyyy')}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={showMonthView ? goToNextMonth : goToNextWeek}>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {showMonthView ? (
                renderMonthView()
            ) : (
                <>
                    {renderDayHeaders()}
                    <View style={styles.calendarContainer}>
                        <ScrollView 
                            ref={scrollViewRef}
                            style={styles.calendarScrollView} 
                            contentContainerStyle={styles.calendarContentContainer}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={true}
                        >
                            {renderDayView()}
                        </ScrollView>
                    </View>
                </>
            )}

            {loading && (
                <View style={styles.loaderContainerAbsolute}>
                    <ActivityIndicator size="large" color="#6200ee" />
                    <Text style={styles.loaderText}>Loading...</Text>
                </View>
            )}

            {error && !loading && (
                <View style={styles.errorContainerInline}>
                    <Text style={styles.errorText}>{error}</Text>
                    <PaperButton mode="outlined" onPress={checkTokenAndFetchData} style={{ marginTop: 10 }}>
                        Retry
                    </PaperButton>
                </View>
            )}

            <View style={styles.footer}>
                <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
                    <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
            </View>

            {isAdmin && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('AddShift')}
                >
                    <MaterialCommunityIcons name="plus" size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 25,
        height: WEEK_HEADER_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    monthToggleButton: {
        flex: 1,
        alignItems: 'center',
        padding: 8,
    },
    monthToggleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    navButton: {
        padding: 10,
    },
    dayHeaderContainer: {
        flexDirection: 'row',
        height: WEEK_HEADER_HEIGHT,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    hourColumnSpacer: {
        width: 64,
    },
    dayHeader: {
        width: DAY_COLUMN_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    dayHeaderTextShort: {
        fontSize: 12,
        color: '#757575',
    },
    dayHeaderTextDate: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 2,
    },
    currentDayText: {
        color: '#6200ee',
    },
    calendarScrollView: {
        flex: 1,
    },
    calendarContentContainer: {
        flexGrow: 1,
    },
    dayViewContainer: {
        flexDirection: 'row',
        minHeight: TOTAL_DAY_HEIGHT,
        position: 'relative',
        paddingHorizontal: 16,
    },
    hourColumn: {
        width: 48,
    },
    hourMarker: {
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingRight: 4,
    },
    hourMarkerText: {
        fontSize: 11,
        color: '#888',
    },
    dayColumn: {
        width: DAY_COLUMN_WIDTH * 7,
        height: TOTAL_DAY_HEIGHT,
        borderLeftWidth: 1,
        borderLeftColor: '#e0e0e0',
        position: 'relative',
    },
    shiftBlock: {
        position: 'absolute',
        backgroundColor: 'rgba(100, 150, 255, 0.8)',
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: 'rgba(50, 100, 200, 0.9)',
        overflow: 'hidden',
    },
    shiftTextName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    shiftTextTime: {
        fontSize: 10,
        color: '#ffffff',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loaderContainerAbsolute: {
        position: 'absolute',
        top: WEEK_HEADER_HEIGHT + DAY_HEADER_HEIGHT,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loaderText: {
        marginTop: 10,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffebee',
    },
    errorContainerInline: {
        margin: 16,
        padding: 15,
        backgroundColor: '#ffebee',
        borderRadius: 5,
        alignItems: 'center',
    },
    errorText: {
        color: '#c62828',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 5,
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
    todayButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
        backgroundColor: '#6200ee',
        alignSelf: 'center',
        marginBottom: 8,
    },
    todayButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    selectedDayText: {
        color: '#1a237e',
        fontWeight: 'bold',
    },
    selectedDayHeader: {
        backgroundColor: '#6200ee',
        borderRadius: 20,
    },
    selectedTodayHeader: {
        borderWidth: 2,
        borderColor: '#03dac6',
    },
    calendarContainer: {
        flex: 1,
    },
    monthViewContainer: {
        height: MONTH_VIEW_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    monthWeekdayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    monthWeekdayHeaderCell: {
        width: DAY_COLUMN_WIDTH,
        alignItems: 'center',
    },
    monthWeekdayHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#757575',
    },
    monthContentContainer: {
        paddingBottom: 8,
    },
    monthWeekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 4,
    },
    monthDayCell: {
        width: DAY_COLUMN_WIDTH,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    monthDayCellOtherMonth: {
        opacity: 0.3,
    },
    monthDayCellSelected: {
        backgroundColor: '#6200ee',
    },
    monthDayCellToday: {
        borderWidth: 1,
        borderColor: '#6200ee',
    },
    monthDayText: {
        fontSize: 14,
        color: '#000',
    },
    monthDayTextOtherMonth: {
        color: '#888',
    },
    monthDayTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    monthDayTextToday: {
        color: '#6200ee',
        fontWeight: 'bold',
    },
    footer: {
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
});

export default ShiftsScreen;