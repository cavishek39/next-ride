import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native'
import MapView, {
  Marker,
  Polyline,
  Region,
  PROVIDER_GOOGLE,
} from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions'
import { Ionicons } from '@expo/vector-icons'
import {
  LocationService,
  LocationCoordinates,
  LocationDetails,
} from '@/services/LocationService'
import { NavigationService } from '@/services/NavigationService'

const { width, height } = Dimensions.get('window')

export interface MapComponentProps {
  // Map mode - determines the functionality
  mode: 'booking' | 'tracking' | 'driver_dashboard' | 'navigation'

  // Location props
  pickupLocation?: LocationDetails | null
  destinationLocation?: LocationDetails | null
  driverLocation?: LocationCoordinates | null

  // Event handlers
  onPickupSelect?: (location: LocationDetails) => void
  onDestinationSelect?: (location: LocationDetails) => void
  onLocationUpdate?: (location: LocationCoordinates) => void

  // Style props
  style?: object
  showUserLocation?: boolean
  showTraffic?: boolean

  // Driver specific props
  isDriverMode?: boolean
  rideRoute?: LocationCoordinates[]

  // Navigation props
  showDirections?: boolean
  directionsOrigin?: LocationDetails
  directionsDestination?: LocationDetails
  directionsWaypoints?: LocationDetails[]
  onDirectionsReady?: (result: any) => void
  onDirectionsError?: (error: any) => void
}

const MapComponent: React.FC<MapComponentProps> = ({
  mode,
  pickupLocation,
  destinationLocation,
  driverLocation,
  onPickupSelect,
  onDestinationSelect,
  onLocationUpdate,
  style,
  showUserLocation = true,
  showTraffic = false,
  isDriverMode = false,
  rideRoute = [],
  showDirections = false,
  directionsOrigin,
  directionsDestination,
  directionsWaypoints,
  onDirectionsReady,
  onDirectionsError,
}) => {
  const mapRef = useRef<MapView>(null)
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoordinates | null>(null)
  const [region, setRegion] = useState<Region | null>(null)
  const [isSelectingPickup, setIsSelectingPickup] = useState(false)
  const [isSelectingDestination, setIsSelectingDestination] = useState(false)
  const [locationSubscription, setLocationSubscription] = useState<any>(null)

  // Initialize current location
  useEffect(() => {
    initializeLocation()

    // Cleanup location subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [])

  // Start real-time location tracking for drivers or during rides
  useEffect(() => {
    if (mode === 'tracking' || (mode === 'driver_dashboard' && isDriverMode)) {
      startLocationTracking()
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [mode, isDriverMode])

  // Update map region when locations change
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      // Show both pickup and destination
      const newRegion = LocationService.getRegionForTwoPoints(
        pickupLocation,
        destinationLocation
      )
      setRegion(newRegion as Region)
      mapRef.current?.animateToRegion(newRegion as Region, 1000)
    } else if (pickupLocation) {
      // Show pickup location
      const newRegion = LocationService.getMapRegion(pickupLocation)
      setRegion(newRegion as Region)
      mapRef.current?.animateToRegion(newRegion as Region, 1000)
    } else if (currentLocation) {
      // Show current location
      const newRegion = LocationService.getMapRegion(currentLocation)
      setRegion(newRegion as Region)
    }
  }, [pickupLocation, destinationLocation, currentLocation])

  const initializeLocation = async () => {
    const location = await LocationService.getCurrentLocation()
    if (location) {
      setCurrentLocation(location)
      const initialRegion = LocationService.getMapRegion(location)
      setRegion(initialRegion as Region)
    }
  }

  const startLocationTracking = async () => {
    const subscription = await LocationService.watchLocation(
      (location) => {
        setCurrentLocation(location)
        onLocationUpdate?.(location)
      },
      {
        timeInterval: 3000, // Update every 3 seconds
        distanceInterval: 5, // Update every 5 meters
      }
    )

    if (subscription) {
      setLocationSubscription(subscription)
    }
  }

  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate

    if (mode === 'booking') {
      if (isSelectingPickup) {
        const locationDetails = await LocationService.getAddressFromCoordinates(
          coordinate
        )
        if (locationDetails) {
          onPickupSelect?.(locationDetails)
          setIsSelectingPickup(false)
        }
      } else if (isSelectingDestination) {
        const locationDetails = await LocationService.getAddressFromCoordinates(
          coordinate
        )
        if (locationDetails) {
          onDestinationSelect?.(locationDetails)
          setIsSelectingDestination(false)
        }
      }
    }
  }

  const centerOnUserLocation = async () => {
    const location = await LocationService.getCurrentLocation()
    if (location && mapRef.current) {
      const newRegion = LocationService.getMapRegion(location)
      mapRef.current.animateToRegion(newRegion as Region, 1000)
      setCurrentLocation(location)
    }
  }

  const renderMarkers = () => {
    const markers = []

    // User's current location marker
    if (currentLocation && showUserLocation) {
      markers.push(
        <Marker
          key='current-location'
          coordinate={currentLocation}
          title='Your Location'
          pinColor='blue'>
          <View style={styles.currentLocationMarker}>
            <View style={styles.currentLocationDot} />
          </View>
        </Marker>
      )
    }

    // Pickup location marker
    if (pickupLocation) {
      markers.push(
        <Marker
          key='pickup'
          coordinate={pickupLocation}
          title='Pickup Location'
          description={LocationService.formatAddress(pickupLocation)}
          pinColor='green'>
          <View style={styles.pickupMarker}>
            <Ionicons name='location' size={30} color='#4CAF50' />
          </View>
        </Marker>
      )
    }

    // Destination location marker
    if (destinationLocation) {
      markers.push(
        <Marker
          key='destination'
          coordinate={destinationLocation}
          title='Destination'
          description={LocationService.formatAddress(destinationLocation)}
          pinColor='red'>
          <View style={styles.destinationMarker}>
            <Ionicons name='flag' size={30} color='#F44336' />
          </View>
        </Marker>
      )
    }

    // Driver location marker (for customers tracking driver)
    if (driverLocation && mode === 'tracking') {
      markers.push(
        <Marker
          key='driver'
          coordinate={driverLocation}
          title='Driver Location'
          pinColor='orange'>
          <View style={styles.driverMarker}>
            <Ionicons name='car' size={30} color='#FF9800' />
          </View>
        </Marker>
      )
    }

    return markers
  }

  const renderRoute = () => {
    if (rideRoute.length > 1) {
      return (
        <Polyline
          coordinates={rideRoute}
          strokeColor='#007AFF'
          strokeWidth={4}
          lineDashPattern={[5, 5]}
        />
      )
    }

    // Simple line between pickup and destination
    if (pickupLocation && destinationLocation) {
      return (
        <Polyline
          coordinates={[pickupLocation, destinationLocation]}
          strokeColor='#007AFF'
          strokeWidth={3}
        />
      )
    }

    return null
  }

  const renderDirections = () => {
    if (!showDirections || !directionsOrigin || !directionsDestination) {
      return null
    }

    return (
      <MapViewDirections
        {...NavigationService.createDirectionsProps(
          directionsOrigin,
          directionsDestination,
          directionsWaypoints
        )}
        onReady={(result) => {
          // Fit map to route
          if (mapRef.current && result.coordinates.length > 0) {
            const region = NavigationService.getRouteRegion(result.coordinates)
            mapRef.current.animateToRegion(region, 1000)
          }
          onDirectionsReady?.(result)
        }}
        onError={(error) => {
          console.error('Directions error:', error)
          onDirectionsError?.(error)
        }}
      />
    )
  }

  if (!region) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsTraffic={showTraffic}
        showsBuildings={true}
        showsIndoors={true}
        mapType='standard'>
        {renderMarkers()}
        {renderRoute()}
        {renderDirections()}
      </MapView>

      {/* Map controls */}
      <View style={styles.mapControls}>
        {/* Center on user location button */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={centerOnUserLocation}>
          <Ionicons name='locate' size={24} color='#007AFF' />
        </TouchableOpacity>

        {/* Location selection buttons (booking mode only) */}
        {mode === 'booking' && (
          <View style={styles.selectionButtons}>
            <TouchableOpacity
              style={[
                styles.selectionButton,
                isSelectingPickup && styles.activeSelectionButton,
              ]}
              onPress={() => {
                setIsSelectingPickup(true)
                setIsSelectingDestination(false)
              }}>
              <Ionicons
                name='location'
                size={20}
                color={isSelectingPickup ? '#fff' : '#4CAF50'}
              />
              <Text
                style={[
                  styles.selectionButtonText,
                  isSelectingPickup && styles.activeSelectionButtonText,
                ]}>
                Pickup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.selectionButton,
                isSelectingDestination && styles.activeSelectionButton,
              ]}
              onPress={() => {
                setIsSelectingDestination(true)
                setIsSelectingPickup(false)
              }}>
              <Ionicons
                name='flag'
                size={20}
                color={isSelectingDestination ? '#fff' : '#F44336'}
              />
              <Text
                style={[
                  styles.selectionButtonText,
                  isSelectingDestination && styles.activeSelectionButtonText,
                ]}>
                Destination
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Selection instructions */}
      {(isSelectingPickup || isSelectingDestination) && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            {isSelectingPickup
              ? 'Tap on the map to set pickup location'
              : 'Tap on the map to set destination'}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'flex-end',
  },
  locationButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
  },
  selectionButtons: {
    gap: 8,
  },
  selectionButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activeSelectionButton: {
    backgroundColor: '#007AFF',
  },
  selectionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  activeSelectionButtonText: {
    color: '#fff',
  },
  instructionContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
  },
  instructionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  // Marker styles
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  currentLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 3,
    left: 3,
  },
  pickupMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  destinationMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
})

export default MapComponent
