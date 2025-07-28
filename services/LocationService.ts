import * as Location from 'expo-location'
import { Alert } from 'react-native'

export interface LocationCoordinates {
  latitude: number
  longitude: number
}

export interface LocationDetails extends LocationCoordinates {
  address: string
  city: string
  state: string
  zipCode: string
  country?: string
}

export interface PlaceAutocomplete {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
}

export const LocationService = {
  // Request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use the map features.',
          [{ text: 'OK' }]
        )
        return false
      }

      return true
    } catch (error) {
      console.error('Error requesting location permission:', error)
      return false
    }
  },

  // Get current location
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const hasPermission = await this.requestLocationPermission()
      if (!hasPermission) return null

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      })

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      Alert.alert(
        'Error',
        'Unable to get your current location. Please try again.'
      )
      return null
    }
  },

  // Watch location changes (for real-time tracking)
  async watchLocation(
    callback: (location: LocationCoordinates) => void,
    options?: {
      accuracy?: Location.Accuracy
      timeInterval?: number
      distanceInterval?: number
    }
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestLocationPermission()
      if (!hasPermission) return null

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          timeInterval: options?.timeInterval || 3000, // Update every 3 seconds
          distanceInterval: options?.distanceInterval || 5, // Update every 5 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          })
        }
      )

      return subscription
    } catch (error) {
      console.error('Error watching location:', error)
      return null
    }
  },

  // Reverse geocoding - get address from coordinates
  async getAddressFromCoordinates(
    coordinates: LocationCoordinates
  ): Promise<LocationDetails | null> {
    try {
      const result = await Location.reverseGeocodeAsync(coordinates)

      if (result.length > 0) {
        const address = result[0]
        return {
          ...coordinates,
          address: `${address.street || ''} ${
            address.streetNumber || ''
          }`.trim(),
          city: address.city || '',
          state: address.region || '',
          zipCode: address.postalCode || '',
          country: address.country || '',
        }
      }

      return null
    } catch (error) {
      console.error('Error reverse geocoding:', error)
      return null
    }
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    point1: LocationCoordinates,
    point2: LocationCoordinates
  ): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(point2.latitude - point1.latitude)
    const dLon = this.toRadians(point2.longitude - point1.longitude)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 100) / 100 // Round to 2 decimal places
  },

  // Calculate estimated travel time (basic implementation)
  calculateEstimatedTime(
    distance: number,
    trafficFactor: number = 1.2
  ): number {
    // Assuming average speed of 25 mph in city with traffic factor
    const averageSpeed = 25 * trafficFactor
    const timeInHours = distance / averageSpeed
    const timeInMinutes = timeInHours * 60

    return Math.max(5, Math.round(timeInMinutes)) // Minimum 5 minutes
  },

  // Get map region from coordinates
  getMapRegion(
    coordinates: LocationCoordinates,
    delta: number = 0.0922
  ): object {
    return {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    }
  },

  // Get region that includes both pickup and destination
  getRegionForTwoPoints(
    pickup: LocationCoordinates,
    destination: LocationCoordinates,
    padding: number = 0.02
  ): object {
    const minLat = Math.min(pickup.latitude, destination.latitude) - padding
    const maxLat = Math.max(pickup.latitude, destination.latitude) + padding
    const minLng = Math.min(pickup.longitude, destination.longitude) - padding
    const maxLng = Math.max(pickup.longitude, destination.longitude) + padding

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.abs(maxLat - minLat),
      longitudeDelta: Math.abs(maxLng - minLng),
    }
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  },

  // Format address for display
  formatAddress(locationDetails: LocationDetails): string {
    const parts = [
      locationDetails.address,
      locationDetails.city,
      locationDetails.state,
    ].filter(Boolean)

    return parts.join(', ')
  },

  // Check if location services are enabled
  async isLocationServicesEnabled(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync()
      return enabled
    } catch (error) {
      console.error('Error checking location services:', error)
      return false
    }
  },
}
