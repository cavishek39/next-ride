import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import MapComponent from '@/components/MapComponent'
import { LocationService, LocationDetails } from '@/services/LocationService'
import { RideService } from '@/services/RideService'
import AuthService from '@/services/AuthService'

const { width, height } = Dimensions.get('window')

const CustomerBookingScreen = () => {
  const [pickupLocation, setPickupLocation] = useState<LocationDetails | null>(
    null
  )
  const [destinationLocation, setDestinationLocation] =
    useState<LocationDetails | null>(null)
  const [estimatedFare, setEstimatedFare] = useState<number>(0)
  const [estimatedTime, setEstimatedTime] = useState<number>(0)
  const [selectedVehicleType, setSelectedVehicleType] = useState<
    'sedan' | 'suv' | 'hatchback' | 'luxury'
  >('sedan')
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false)
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false)
  const [searchType, setSearchType] = useState<'pickup' | 'destination'>(
    'pickup'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const vehicleTypes = [
    { type: 'sedan' as const, name: 'Sedan', price: '1x', icon: 'car-outline' },
    {
      type: 'suv' as const,
      name: 'SUV',
      price: '1.3x',
      icon: 'car-sport-outline',
    },
    {
      type: 'hatchback' as const,
      name: 'Hatchback',
      price: '0.9x',
      icon: 'car-outline',
    },
    {
      type: 'luxury' as const,
      name: 'Luxury',
      price: '2x',
      icon: 'diamond-outline',
    },
  ]

  // Calculate fare and time when locations change
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      const fare = RideService.calculateFare(
        pickupLocation,
        destinationLocation,
        selectedVehicleType
      )
      const time = RideService.calculateDuration(
        pickupLocation,
        destinationLocation
      )
      setEstimatedFare(fare)
      setEstimatedTime(time)
    }
  }, [pickupLocation, destinationLocation, selectedVehicleType])

  const handlePickupSelect = (location: LocationDetails) => {
    setPickupLocation(location)
  }

  const handleDestinationSelect = (location: LocationDetails) => {
    setDestinationLocation(location)
  }

  const handleBookRide = async () => {
    if (!pickupLocation || !destinationLocation) {
      Alert.alert(
        'Error',
        'Please select both pickup and destination locations'
      )
      return
    }

    const userData = await AuthService.getUserData()
    if (!userData) {
      Alert.alert('Error', 'Please log in to book a ride')
      return
    }

    setIsLoading(true)

    try {
      const rideData = {
        customerId: userData.uid,
        customerName: userData.name,
        pickupLocation,
        destination: destinationLocation,
        vehicleType: selectedVehicleType,
        paymentMethod: 'cash', // You can implement payment method selection
      }

      const rideId = await RideService.createRideRequest(rideData)

      if (rideId) {
        Alert.alert(
          'Ride Booked!',
          "Your ride has been requested. We're finding a driver for you.",
          [
            {
              text: 'Track Ride',
              onPress: () =>
                router.push(
                  `/(routes)/customer/ride-tracking?rideId=${rideId}` as any
                ),
            },
          ]
        )
        setIsBookingModalVisible(false)
      } else {
        Alert.alert('Error', 'Failed to book ride. Please try again.')
      }
    } catch (error) {
      console.error('Error booking ride:', error)
      Alert.alert('Error', 'Failed to book ride. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const openLocationSearch = (type: 'pickup' | 'destination') => {
    setSearchType(type)
    setSearchQuery('')
    setIsSearchModalVisible(true)
  }

  const getCurrentLocationAsPickup = async () => {
    const location = await LocationService.getCurrentLocation()
    if (location) {
      const locationDetails = await LocationService.getAddressFromCoordinates(
        location
      )
      if (locationDetails) {
        setPickupLocation(locationDetails)
      }
    }
  }

  const BookingModal = () => (
    <Modal
      visible={isBookingModalVisible}
      animationType='slide'
      presentationStyle='pageSheet'>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setIsBookingModalVisible(false)}>
            <Ionicons name='close' size={24} color='#333' />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Book Your Ride</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.modalContent}>
          {/* Trip Summary */}
          <View style={styles.tripSummary}>
            <View style={styles.locationRow}>
              <Ionicons name='location' size={20} color='#4CAF50' />
              <Text style={styles.locationText} numberOfLines={2}>
                {pickupLocation
                  ? LocationService.formatAddress(pickupLocation)
                  : 'Select pickup'}
              </Text>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.locationRow}>
              <Ionicons name='flag' size={20} color='#F44336' />
              <Text style={styles.locationText} numberOfLines={2}>
                {destinationLocation
                  ? LocationService.formatAddress(destinationLocation)
                  : 'Select destination'}
              </Text>
            </View>
          </View>

          {/* Vehicle Selection */}
          <Text style={styles.sectionTitle}>Choose Vehicle Type</Text>
          <View style={styles.vehicleOptions}>
            {vehicleTypes.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.type}
                style={[
                  styles.vehicleOption,
                  selectedVehicleType === vehicle.type &&
                    styles.selectedVehicleOption,
                ]}
                onPress={() => setSelectedVehicleType(vehicle.type)}>
                <Ionicons
                  name={vehicle.icon as any}
                  size={24}
                  color={
                    selectedVehicleType === vehicle.type ? '#007AFF' : '#666'
                  }
                />
                <View style={styles.vehicleInfo}>
                  <Text
                    style={[
                      styles.vehicleName,
                      selectedVehicleType === vehicle.type &&
                        styles.selectedVehicleText,
                    ]}>
                    {vehicle.name}
                  </Text>
                  <Text style={styles.vehiclePrice}>{vehicle.price}</Text>
                </View>
                {selectedVehicleType === vehicle.type && (
                  <Ionicons name='checkmark-circle' size={20} color='#007AFF' />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Fare Information */}
          {estimatedFare > 0 && (
            <View style={styles.fareInfo}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Estimated Fare:</Text>
                <Text style={styles.fareAmount}>
                  ${estimatedFare.toFixed(2)}
                </Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Estimated Time:</Text>
                <Text style={styles.fareTime}>{estimatedTime} min</Text>
              </View>
            </View>
          )}

          {/* Book Button */}
          <TouchableOpacity
            style={[styles.bookButton, isLoading && styles.disabledButton]}
            onPress={handleBookRide}
            disabled={isLoading || !pickupLocation || !destinationLocation}>
            <Text style={styles.bookButtonText}>
              {isLoading
                ? 'Booking...'
                : `Book Ride - $${estimatedFare.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color='#333' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book a Ride</Text>
        <TouchableOpacity
          onPress={() => router.push('/(routes)/customer/profile' as any)}>
          <Ionicons name='person-circle-outline' size={24} color='#333' />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapComponent
          mode='booking'
          pickupLocation={pickupLocation}
          destinationLocation={destinationLocation}
          onPickupSelect={handlePickupSelect}
          onDestinationSelect={handleDestinationSelect}
          showTraffic={true}
        />
      </View>

      {/* Location Input Panel */}
      <View style={styles.locationPanel}>
        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => openLocationSearch('pickup')}>
          <Ionicons name='location' size={20} color='#4CAF50' />
          <Text
            style={[
              styles.locationInputText,
              !pickupLocation && styles.placeholderText,
            ]}>
            {pickupLocation
              ? LocationService.formatAddress(pickupLocation)
              : 'Where from?'}
          </Text>
          <TouchableOpacity onPress={getCurrentLocationAsPickup}>
            <Ionicons name='locate' size={20} color='#007AFF' />
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.inputDivider} />

        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => openLocationSearch('destination')}>
          <Ionicons name='flag' size={20} color='#F44336' />
          <Text
            style={[
              styles.locationInputText,
              !destinationLocation && styles.placeholderText,
            ]}>
            {destinationLocation
              ? LocationService.formatAddress(destinationLocation)
              : 'Where to?'}
          </Text>
        </TouchableOpacity>

        {pickupLocation && destinationLocation && (
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={() => setIsBookingModalVisible(true)}>
            <Text style={styles.bookNowButtonText}>Book Now</Text>
            <Ionicons name='arrow-forward' size={20} color='#fff' />
          </TouchableOpacity>
        )}
      </View>

      <BookingModal />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  mapContainer: {
    flex: 1,
  },
  locationPanel: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  locationInputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 32,
  },
  bookNowButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 15,
  },
  bookNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tripSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 9,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  vehicleOptions: {
    gap: 12,
    marginBottom: 20,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    gap: 12,
  },
  selectedVehicleOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedVehicleText: {
    color: '#007AFF',
  },
  vehiclePrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  fareInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  fareTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default CustomerBookingScreen
