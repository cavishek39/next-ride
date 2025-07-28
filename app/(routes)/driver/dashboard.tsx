import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Switch,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import MapComponent from '@/components/MapComponent'
import {
  LocationService,
  LocationCoordinates,
} from '@/services/LocationService'
import { RideService } from '@/services/RideService'
import { UserService } from '@/services/UserService'
import AuthService from '@/services/AuthService'
import { Ride } from '@/types'

const DriverDashboardScreen = () => {
  const [isOnline, setIsOnline] = useState(false)
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoordinates | null>(null)
  const [availableRides, setAvailableRides] = useState<Ride[]>([])
  const [activeRide, setActiveRide] = useState<Ride | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [earnings, setEarnings] = useState({ today: 0, total: 0 })

  useEffect(() => {
    initializeDriver()

    // Load available rides when online
    if (isOnline) {
      loadAvailableRides()
      const interval = setInterval(loadAvailableRides, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [isOnline])

  const initializeDriver = async () => {
    try {
      const userData = await AuthService.getUserData()
      if (!userData) {
        router.replace('/(routes)/auth/login' as any)
        return
      }

      // Get current location
      const location = await LocationService.getCurrentLocation()
      if (location) {
        setCurrentLocation(location)
      }

      // Load driver's active ride if any
      const rides = await RideService.getUserRides(userData.uid, 'driver')
      const active = rides.find((ride) =>
        ['accepted', 'driver_arriving', 'in_progress'].includes(ride.status)
      )
      setActiveRide(active || null)

      // Calculate earnings (you can implement this in RideService)
      // setEarnings(await RideService.getDriverEarnings(userData.uid))
    } catch (error) {
      console.error('Error initializing driver:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableRides = async () => {
    try {
      const rides = await RideService.getAvailableRides(
        currentLocation || undefined
      )
      setAvailableRides(rides)
    } catch (error) {
      console.error('Error loading available rides:', error)
    }
  }

  const toggleOnlineStatus = async (value: boolean) => {
    const userData = await AuthService.getUserData()
    if (!userData) return

    try {
      const success = await UserService.toggleDriverAvailability(
        userData.uid,
        value
      )
      if (success) {
        setIsOnline(value)
        if (value && currentLocation) {
          // Update driver location when going online
          await UserService.updateDriverLocation(userData.uid, currentLocation)
        }
      } else {
        Alert.alert('Error', 'Failed to update status. Please try again.')
      }
    } catch (error) {
      console.error('Error toggling online status:', error)
      Alert.alert('Error', 'Failed to update status. Please try again.')
    }
  }

  const handleLocationUpdate = async (location: LocationCoordinates) => {
    setCurrentLocation(location)

    if (isOnline) {
      const userData = await AuthService.getUserData()
      if (userData) {
        await UserService.updateDriverLocation(userData.uid, location)
      }
    }
  }

  const acceptRide = async (ride: Ride) => {
    const userData = await AuthService.getUserData()
    if (!userData) return

    try {
      const success = await RideService.acceptRide(
        ride.id,
        userData.uid,
        userData.name
      )
      if (success) {
        setActiveRide(ride)
        setAvailableRides((prev) => prev.filter((r) => r.id !== ride.id))

        // Navigate to the navigation screen
        Alert.alert('Ride Accepted', 'Navigate to pickup location?', [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Navigate',
            onPress: () =>
              router.push(
                `/(routes)/driver/navigation?rideId=${ride.id}` as any
              ),
          },
        ])
      } else {
        Alert.alert(
          'Error',
          'Failed to accept ride. It may have been taken by another driver.'
        )
      }
    } catch (error) {
      console.error('Error accepting ride:', error)
      Alert.alert('Error', 'Failed to accept ride. Please try again.')
    }
  }

  const updateRideStatus = async (
    rideId: string,
    status: 'driver_arriving' | 'in_progress' | 'completed'
  ) => {
    try {
      const success = await RideService.updateRideStatus(rideId, status)
      if (success) {
        if (status === 'completed') {
          setActiveRide(null)
          Alert.alert('Ride Completed', 'Great job! Look for your next ride.')
        } else {
          // Update local state
          setActiveRide((prev) => (prev ? { ...prev, status } : null))
        }
      } else {
        Alert.alert('Error', 'Failed to update ride status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating ride status:', error)
      Alert.alert('Error', 'Failed to update ride status. Please try again.')
    }
  }

  const RideRequestCard = ({ ride }: { ride: Ride }) => {
    const distance = currentLocation
      ? LocationService.calculateDistance(
          currentLocation,
          ride.pickupLocation
        ).toFixed(1)
      : '?'

    return (
      <View style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View>
            <Text style={styles.rideDistance}>{distance} mi away</Text>
            <Text style={styles.rideFare}>${ride.fare.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => acceptRide(ride)}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rideLocations}>
          <View style={styles.locationRow}>
            <Ionicons name='location' size={16} color='#4CAF50' />
            <Text style={styles.locationText} numberOfLines={1}>
              {ride.pickupLocation.address}, {ride.pickupLocation.city}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name='flag' size={16} color='#F44336' />
            <Text style={styles.locationText} numberOfLines={1}>
              {ride.destination.address}, {ride.destination.city}
            </Text>
          </View>
        </View>

        <View style={styles.rideFooter}>
          <Text style={styles.rideTime}>
            {ride.estimatedDuration} min • {ride.vehicleType}
          </Text>
          <Text style={styles.rideCustomer}>{ride.customerName}</Text>
        </View>
      </View>
    )
  }

  const ActiveRidePanel = () => {
    if (!activeRide) return null

    return (
      <View style={styles.activeRidePanel}>
        <Text style={styles.activeRideTitle}>Current Ride</Text>

        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Ionicons name='person' size={24} color='#007AFF' />
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{activeRide.customerName}</Text>
            <Text style={styles.rideFareActive}>
              ${activeRide.fare.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.callCustomerButton}
            onPress={() => {
              /* Implement call customer */
            }}>
            <Ionicons name='call' size={20} color='#007AFF' />
          </TouchableOpacity>
        </View>

        <View style={styles.rideActions}>
          {activeRide.status === 'accepted' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                updateRideStatus(activeRide.id, 'driver_arriving')
              }>
              <Text style={styles.actionButtonText}>Arrived at Pickup</Text>
            </TouchableOpacity>
          )}

          {activeRide.status === 'driver_arriving' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateRideStatus(activeRide.id, 'in_progress')}>
              <Text style={styles.actionButtonText}>Start Ride</Text>
            </TouchableOpacity>
          )}

          {activeRide.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => updateRideStatus(activeRide.id, 'completed')}>
              <Text style={styles.actionButtonText}>Complete Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading driver dashboard...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Driver</Text>
          <Text style={styles.headerSubtitle}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.onlineToggle}>
            <Text style={styles.onlineLabel}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
              thumbColor={isOnline ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(routes)/driver/profile' as any)}>
            <Ionicons name='person-circle-outline' size={28} color='#333' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Earnings Bar */}
      <View style={styles.earningsBar}>
        <View style={styles.earningItem}>
          <Text style={styles.earningAmount}>${earnings.today.toFixed(2)}</Text>
          <Text style={styles.earningLabel}>Today</Text>
        </View>
        <View style={styles.earningDivider} />
        <View style={styles.earningItem}>
          <Text style={styles.earningAmount}>${earnings.total.toFixed(2)}</Text>
          <Text style={styles.earningLabel}>Total</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapComponent
          mode='driver_dashboard'
          pickupLocation={activeRide ? activeRide.pickupLocation : undefined}
          destinationLocation={activeRide ? activeRide.destination : undefined}
          onLocationUpdate={handleLocationUpdate}
          isDriverMode={true}
          showUserLocation={true}
          showTraffic={true}
        />
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {activeRide ? (
          <ActiveRidePanel />
        ) : isOnline ? (
          <View style={styles.availableRidesContainer}>
            <Text style={styles.sectionTitle}>
              Available Rides ({availableRides.length})
            </Text>

            {availableRides.length > 0 ? (
              <FlatList
                data={availableRides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <RideRequestCard ride={item} />}
                showsVerticalScrollIndicator={false}
                style={styles.ridesList}
              />
            ) : (
              <View style={styles.noRidesContainer}>
                <Ionicons name='car-outline' size={48} color='#ccc' />
                <Text style={styles.noRidesText}>No rides available</Text>
                <Text style={styles.noRidesSubtext}>
                  Stay online and we'll notify you when rides are available
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.offlineContainer}>
            <Ionicons name='car-outline' size={48} color='#ccc' />
            <Text style={styles.offlineText}>You're offline</Text>
            <Text style={styles.offlineSubtext}>
              Go online to start receiving ride requests
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  onlineToggle: {
    alignItems: 'center',
    gap: 4,
  },
  onlineLabel: {
    fontSize: 12,
    color: '#666',
  },
  earningsBar: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  earningItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  earningLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  earningDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 20,
  },
  mapContainer: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '50%',
  },

  // Active Ride Panel
  activeRidePanel: {},
  activeRideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rideFareActive: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
  callCustomerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideActions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Available Rides
  availableRidesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  ridesList: {
    flex: 1,
  },
  rideCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideDistance: {
    fontSize: 14,
    color: '#666',
  },
  rideFare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rideLocations: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideTime: {
    fontSize: 12,
    color: '#666',
  },
  rideCustomer: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // No rides / Offline states
  noRidesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRidesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  noRidesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  offlineText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  offlineSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default DriverDashboardScreen
