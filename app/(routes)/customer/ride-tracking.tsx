import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Linking,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import MapComponent from '@/components/MapComponent'
import {
  LocationService,
  LocationCoordinates,
} from '@/services/LocationService'
import { RideService } from '@/services/RideService'
import { Ride, RideStatus } from '@/types'

const RideTrackingScreen = () => {
  const params = useLocalSearchParams<{ rideId: string }>()
  const [ride, setRide] = useState<Ride | null>(null)
  const [driverLocation, setDriverLocation] =
    useState<LocationCoordinates | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [estimatedArrival, setEstimatedArrival] = useState<number>(0)

  useEffect(() => {
    if (params.rideId) {
      loadRideDetails()
      // Set up real-time updates (you can implement WebSocket or Firestore listeners here)
      const interval = setInterval(loadRideDetails, 5000) // Update every 5 seconds

      return () => clearInterval(interval)
    }
  }, [params.rideId])

  const loadRideDetails = async () => {
    if (!params.rideId) return

    try {
      const rideData = await RideService.getRide(params.rideId)
      if (rideData) {
        setRide(rideData)

        // Calculate estimated arrival if driver is assigned
        if (rideData.driverId && driverLocation) {
          const distance = LocationService.calculateDistance(
            driverLocation,
            rideData.pickupLocation
          )
          const eta = LocationService.calculateEstimatedTime(distance)
          setEstimatedArrival(eta)
        }
      }
    } catch (error) {
      console.error('Error loading ride details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDriverLocationUpdate = (location: LocationCoordinates) => {
    setDriverLocation(location)

    // Update estimated arrival time
    if (ride && ride.status === 'accepted') {
      const distance = LocationService.calculateDistance(
        location,
        ride.pickupLocation
      )
      const eta = LocationService.calculateEstimatedTime(distance)
      setEstimatedArrival(eta)
    }
  }

  const handleCancelRide = async () => {
    if (!ride) return

    try {
      const success = await RideService.updateRideStatus(ride.id, 'cancelled')
      if (success) {
        Alert.alert(
          'Ride Cancelled',
          'Your ride has been cancelled successfully.',
          [{ text: 'OK', onPress: () => router.back() }]
        )
      } else {
        Alert.alert('Error', 'Failed to cancel ride. Please try again.')
      }
    } catch (error) {
      console.error('Error cancelling ride:', error)
      Alert.alert('Error', 'Failed to cancel ride. Please try again.')
    }
    setShowCancelModal(false)
  }

  const callDriver = () => {
    if (ride?.driverId) {
      // In a real app, you'd get the driver's phone number from the database
      Linking.openURL('tel:+1234567890') // Replace with actual driver's phone
    }
  }

  const getStatusInfo = () => {
    if (!ride)
      return { text: 'Loading...', color: '#666', icon: 'time-outline' }

    switch (ride.status) {
      case 'requested':
        return {
          text: 'Finding a driver...',
          color: '#FF9800',
          icon: 'search-outline',
          description: "We're looking for the best driver for you",
        }
      case 'accepted':
        return {
          text: `Driver arriving in ${estimatedArrival} min`,
          color: '#4CAF50',
          icon: 'car-outline',
          description: 'Your driver is on the way to pick you up',
        }
      case 'driver_arriving':
        return {
          text: 'Driver has arrived',
          color: '#2196F3',
          icon: 'location-outline',
          description: 'Your driver is waiting at the pickup location',
        }
      case 'in_progress':
        return {
          text: 'On the way to destination',
          color: '#673AB7',
          icon: 'navigate-outline',
          description: 'Enjoy your ride!',
        }
      case 'completed':
        return {
          text: 'Ride completed',
          color: '#4CAF50',
          icon: 'checkmark-circle-outline',
          description: 'Thank you for riding with us',
        }
      case 'cancelled':
        return {
          text: 'Ride cancelled',
          color: '#F44336',
          icon: 'close-circle-outline',
          description: 'This ride has been cancelled',
        }
      default:
        return { text: 'Unknown status', color: '#666', icon: 'help-outline' }
    }
  }

  const statusInfo = getStatusInfo()

  const CancelModal = () => (
    <Modal
      visible={showCancelModal}
      animationType='slide'
      presentationStyle='formSheet'
      transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.cancelModal}>
          <Text style={styles.cancelModalTitle}>Cancel Ride?</Text>
          <Text style={styles.cancelModalText}>
            Are you sure you want to cancel this ride? This action cannot be
            undone.
          </Text>

          <View style={styles.cancelModalButtons}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowCancelModal(false)}>
              <Text style={styles.cancelModalButtonText}>Keep Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelModalButton, styles.confirmCancelButton]}
              onPress={handleCancelRide}>
              <Text
                style={[
                  styles.cancelModalButtonText,
                  styles.confirmCancelButtonText,
                ]}>
                Yes, Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name='alert-circle-outline' size={64} color='#F44336' />
          <Text style={styles.errorText}>Ride not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color='#333' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Ride</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapComponent
          mode='tracking'
          pickupLocation={ride.pickupLocation}
          destinationLocation={ride.destination}
          driverLocation={driverLocation}
          onLocationUpdate={handleDriverLocationUpdate}
          showTraffic={true}
        />
      </View>

      {/* Ride Info Panel */}
      <View style={styles.rideInfoPanel}>
        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusLeft}>
            <Ionicons
              name={statusInfo.icon as any}
              size={24}
              color={statusInfo.color}
            />
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
              {statusInfo.description && (
                <Text style={styles.statusDescription}>
                  {statusInfo.description}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Driver Info (if assigned) */}
        {ride.driverId && (
          <View style={styles.driverInfo}>
            <View style={styles.driverDetails}>
              <View style={styles.driverAvatar}>
                <Ionicons name='person' size={24} color='#007AFF' />
              </View>
              <View style={styles.driverText}>
                <Text style={styles.driverName}>
                  {ride.driverName || 'Driver'}
                </Text>
                <Text style={styles.driverRating}>★ 4.8 • Toyota Camry</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.callButton} onPress={callDriver}>
              <Ionicons name='call' size={20} color='#007AFF' />
            </TouchableOpacity>
          </View>
        )}

        {/* Trip Details */}
        <View style={styles.tripDetails}>
          <View style={styles.locationRow}>
            <Ionicons name='location' size={16} color='#4CAF50' />
            <Text style={styles.locationText} numberOfLines={1}>
              {LocationService.formatAddress(ride.pickupLocation)}
            </Text>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.locationRow}>
            <Ionicons name='flag' size={16} color='#F44336' />
            <Text style={styles.locationText} numberOfLines={1}>
              {LocationService.formatAddress(ride.destination)}
            </Text>
          </View>
        </View>

        {/* Fare Info */}
        <View style={styles.fareContainer}>
          <Text style={styles.fareText}>
            Total Fare: ${ride.fare.toFixed(2)}
          </Text>
          <Text style={styles.paymentMethod}>
            Payment: {ride.paymentMethod}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {(ride.status === 'requested' || ride.status === 'accepted') && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCancelModal(true)}>
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}

          {ride.status === 'completed' && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() =>
                router.push(
                  `/(routes)/customer/rate-ride?rideId=${ride.id}` as any
                )
              }>
              <Text style={styles.rateButtonText}>Rate Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <CancelModal />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
  rideInfoPanel: {
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
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  driverDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverText: {
    marginLeft: 12,
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  driverRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
    height: 16,
    backgroundColor: '#ddd',
    marginLeft: 7,
    marginVertical: 8,
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 20,
  },
  fareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 350,
  },
  cancelModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  cancelModalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  confirmCancelButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  confirmCancelButtonText: {
    color: '#fff',
  },
})

export default RideTrackingScreen
