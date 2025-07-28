import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE, LatLng } from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { AuthService } from '@/services/AuthService'
import { LocationService, LocationDetails } from '@/services/LocationService'
import {
  NavigationService,
  NavigationState,
  RouteInfo,
} from '@/services/NavigationService'
import { RealTimeService } from '@/services/RealTimeService'
import { NotificationService } from '@/services/NotificationService'
import { Ride, RideStatus } from '@/types'

const { width, height } = Dimensions.get('window')

export default function DriverNavigationScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>()
  const router = useRouter()
  const mapRef = useRef<MapView>(null)

  const [ride, setRide] = useState<Ride | null>(null)
  const [currentLocation, setCurrentLocation] =
    useState<LocationDetails | null>(null)
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    currentInstruction: null,
    remainingDistance: 0,
    remainingTime: 0,
    currentPosition: null,
    routeProgress: 0,
  })
  const [destination, setDestination] = useState<LocationDetails | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!rideId) {
      Alert.alert('Error', 'No ride ID provided')
      router.back()
      return
    }

    initializeNavigation()
    return setupRideListener()
  }, [rideId])

  const initializeNavigation = async () => {
    try {
      // Get current location
      const location = await LocationService.getCurrentLocation()
      if (location) {
        // Convert coordinates to full location details
        const locationDetails = await LocationService.getAddressFromCoordinates(
          location
        )
        const fullLocation: LocationDetails = locationDetails || {
          latitude: location.latitude,
          longitude: location.longitude,
          address: 'Current Location',
          city: '',
          state: '',
          zipCode: '',
        }

        setCurrentLocation(fullLocation)
        setNavigationState((prev) => ({
          ...prev,
          currentPosition: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }))
      }

      // Start location tracking
      LocationService.watchLocation(async (newLocation) => {
        // Convert coordinates to full location details
        const locationDetails = await LocationService.getAddressFromCoordinates(
          newLocation
        )
        const fullLocation: LocationDetails = locationDetails || {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          address: 'Current Location',
          city: '',
          state: '',
          zipCode: '',
        }

        setCurrentLocation(fullLocation)
        setNavigationState((prev) => ({
          ...prev,
          currentPosition: {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          },
        }))

        // Update driver location in real-time
        if (rideId) {
          RealTimeService.updateDriverLocation(rideId, {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          })
        }

        // Update navigation state if navigating
        if (navigationState.isNavigating && routeInfo) {
          updateNavigationProgress(fullLocation)
        }
      })

      setIsLoading(false)
    } catch (error) {
      console.error('Error initializing navigation:', error)
      Alert.alert('Error', 'Failed to initialize navigation')
    }
  }

  const setupRideListener = () => {
    return RealTimeService.subscribeToRideUpdates(
      rideId!,
      (updatedRide) => {
        setRide(updatedRide)

        // Determine destination based on ride status
        if (
          updatedRide.status === 'accepted' ||
          updatedRide.status === 'driver_arriving'
        ) {
          setDestination(updatedRide.pickupLocation)
        } else if (updatedRide.status === 'in_progress') {
          setDestination(updatedRide.destination)
        }
      },
      (error) => {
        console.error('Error listening to ride updates:', error)
        Alert.alert('Error', 'Failed to load ride details')
      }
    )
  }

  const updateNavigationProgress = (location: LocationDetails) => {
    if (!routeInfo || !destination) return

    const currentPos: LatLng = {
      latitude: location.latitude,
      longitude: location.longitude,
    }

    // Calculate remaining distance and time
    const remaining = NavigationService.calculateRemainingDistanceAndTime(
      currentPos,
      routeInfo.coordinates,
      routeInfo.instructions
    )

    // Get current instruction
    const currentInstruction = NavigationService.getCurrentInstruction(
      currentPos,
      routeInfo.instructions
    )

    // Calculate route progress
    const progress = NavigationService.calculateRouteProgress(
      currentPos,
      routeInfo.coordinates
    )

    setNavigationState((prev) => ({
      ...prev,
      remainingDistance: remaining.distance,
      remainingTime: remaining.time,
      currentInstruction,
      routeProgress: progress,
    }))

    // Check if arrived at destination
    const distanceToDestination = NavigationService.calculateDistance(
      currentPos,
      { latitude: destination.latitude, longitude: destination.longitude }
    )

    if (distanceToDestination < 0.1) {
      // 100 meters
      handleArrival()
    }
  }

  const startNavigation = async () => {
    if (!currentLocation || !destination) {
      Alert.alert('Error', 'Location data not available')
      return
    }

    try {
      const route = await NavigationService.calculateRoute(
        currentLocation,
        destination
      )

      if (!route) {
        Alert.alert('Error', 'Failed to calculate route')
        return
      }

      setRouteInfo(route)
      setNavigationState((prev) => ({ ...prev, isNavigating: true }))

      // Fit map to route
      const region = NavigationService.getRouteRegion(route.coordinates)
      mapRef.current?.animateToRegion(region, 1000)
    } catch (error) {
      console.error('Error starting navigation:', error)
      Alert.alert('Error', 'Failed to start navigation')
    }
  }

  const stopNavigation = () => {
    setNavigationState((prev) => ({
      ...prev,
      isNavigating: false,
      currentInstruction: null,
    }))
    setRouteInfo(null)
  }

  const handleArrival = async () => {
    if (!ride) return

    try {
      if (ride.status === 'accepted' || ride.status === 'driver_arriving') {
        // Arrived at pickup
        Alert.alert(
          'Arrived at Pickup',
          'You have arrived at the pickup location. Please wait for the customer.',
          [
            {
              text: 'Customer Picked Up',
              onPress: () => updateRideStatus('in_progress'),
            },
          ]
        )
      } else if (ride.status === 'in_progress') {
        // Arrived at destination
        Alert.alert(
          'Trip Completed',
          'You have reached the destination. Complete the ride?',
          [
            {
              text: 'Complete Ride',
              onPress: () => updateRideStatus('completed'),
            },
          ]
        )
      }
    } catch (error) {
      console.error('Error handling arrival:', error)
    }
  }

  const updateRideStatus = async (status: RideStatus) => {
    // This would be implemented in your RideService
    try {
      // Update ride status in Firestore
      // await RideService.updateRideStatus(rideId!, status)

      if (status === 'completed') {
        stopNavigation()
        router.replace('/driver/dashboard' as any)
      } else if (status === 'in_progress') {
        // Switch destination to drop-off location
        setDestination(ride?.destination || null)
        stopNavigation() // Stop current navigation to restart with new destination
      }
    } catch (error) {
      console.error('Error updating ride status:', error)
      Alert.alert('Error', 'Failed to update ride status')
    }
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)

    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`
    }
    return `${km.toFixed(1)}km`
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading navigation...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#fff' />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsTraffic={true}
        initialRegion={{
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}>
        {/* Destination marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={
              ride?.status === 'in_progress' ? 'Destination' : 'Pickup Location'
            }
            description={destination.address}
            pinColor={ride?.status === 'in_progress' ? '#4CAF50' : '#FF9800'}
          />
        )}

        {/* Route directions */}
        {currentLocation && destination && (
          <MapViewDirections
            {...NavigationService.createDirectionsProps(
              currentLocation,
              destination
            )}
            onReady={(result) => {
              setRouteInfo({
                distance: result.distance,
                duration: result.duration,
                coordinates: result.coordinates,
                instructions: [], // Would be populated from Google Directions API
              })
            }}
            onError={(error) => {
              console.error('Directions error:', error)
            }}
          />
        )}
      </MapView>

      {/* Navigation header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color='#000' />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.rideStatusText}>
            {ride?.status === 'in_progress' ? 'To Destination' : 'To Pickup'}
          </Text>
          <Text style={styles.customerNameText}>
            {ride?.customerName || 'Customer'}
          </Text>
        </View>
      </View>

      {/* Navigation instruction panel */}
      {navigationState.isNavigating && navigationState.currentInstruction && (
        <View style={styles.instructionPanel}>
          <View style={styles.instructionContent}>
            <Ionicons name='navigate' size={24} color='#007AFF' />
            <Text style={styles.instructionText}>
              {navigationState.currentInstruction.text}
            </Text>
          </View>
          <Text style={styles.instructionDistance}>
            in {formatDistance(navigationState.currentInstruction.distance)}
          </Text>
        </View>
      )}

      {/* Navigation controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.infoContainer}>
          {destination && (
            <>
              <View style={styles.infoItem}>
                <Ionicons name='time-outline' size={20} color='#666' />
                <Text style={styles.infoText}>
                  {routeInfo ? formatTime(routeInfo.duration) : '--'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name='location-outline' size={20} color='#666' />
                <Text style={styles.infoText}>
                  {routeInfo ? formatDistance(routeInfo.distance) : '--'}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {!navigationState.isNavigating ? (
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={startNavigation}
              disabled={!destination}>
              <Ionicons name='navigate' size={20} color='#fff' />
              <Text style={styles.navigationButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navigationButton, styles.stopButton]}
              onPress={stopNavigation}>
              <Ionicons name='stop' size={20} color='#fff' />
              <Text style={styles.navigationButtonText}>Stop Navigation</Text>
            </TouchableOpacity>
          )}

          {ride?.status === 'driver_arriving' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateRideStatus('in_progress')}>
              <Text style={styles.actionButtonText}>Customer Picked Up</Text>
            </TouchableOpacity>
          )}

          {ride?.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => updateRideStatus('completed')}>
              <Text style={styles.actionButtonText}>Complete Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
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
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  rideStatusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  customerNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  instructionPanel: {
    position: 'absolute',
    top: 130,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  instructionDistance: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  navigationButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
