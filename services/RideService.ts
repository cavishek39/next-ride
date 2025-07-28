import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { Ride, RideRequest, RideStatus, Location } from '@/types'

export interface CreateRideRequestData {
  customerId: string
  customerName: string
  pickupLocation: Location
  destination: Location
  vehicleType: 'sedan' | 'suv' | 'hatchback' | 'luxury'
  paymentMethod: string
}

export const RideService = {
  // Create a new ride request
  async createRideRequest(
    rideData: CreateRideRequestData
  ): Promise<string | null> {
    try {
      const {
        customerId,
        customerName,
        pickupLocation,
        destination,
        vehicleType,
        paymentMethod,
      } = rideData

      // Calculate estimated fare and duration (you can integrate with mapping services)
      const estimatedFare = this.calculateFare(
        pickupLocation,
        destination,
        vehicleType
      )
      const estimatedDuration = this.calculateDuration(
        pickupLocation,
        destination
      )

      const rideRequest: Omit<RideRequest, 'id'> = {
        customerId,
        customerName,
        pickupLocation,
        destination,
        fare: estimatedFare,
        estimatedDuration,
        status: 'requested',
        requestedAt: new Date(),
        vehicleType,
        paymentMethod,
      }

      const docRef = await addDoc(collection(db, 'rides'), rideRequest)
      return docRef.id
    } catch (error) {
      console.error('Error creating ride request:', error)
      return null
    }
  },

  // Get ride by ID
  async getRide(rideId: string): Promise<Ride | null> {
    try {
      const rideDoc = await getDoc(doc(db, 'rides', rideId))

      if (rideDoc.exists()) {
        return { id: rideDoc.id, ...rideDoc.data() } as Ride
      }

      return null
    } catch (error) {
      console.error('Error getting ride:', error)
      return null
    }
  },

  // Get available ride requests for drivers
  async getAvailableRides(driverLocation?: {
    latitude: number
    longitude: number
  }): Promise<Ride[]> {
    try {
      const ridesQuery = query(
        collection(db, 'rides'),
        where('status', '==', 'requested'),
        orderBy('requestedAt', 'desc'),
        limit(20)
      )

      const querySnapshot = await getDocs(ridesQuery)
      const rides: Ride[] = []

      querySnapshot.forEach((doc) => {
        rides.push({ id: doc.id, ...doc.data() } as Ride)
      })

      // Here you can sort by distance if driverLocation is provided
      return rides
    } catch (error) {
      console.error('Error getting available rides:', error)
      return []
    }
  },

  // Accept a ride request
  async acceptRide(
    rideId: string,
    driverId: string,
    driverName: string
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        driverId,
        driverName,
        status: 'accepted',
        acceptedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error('Error accepting ride:', error)
      return false
    }
  },

  // Update ride status
  async updateRideStatus(rideId: string, status: RideStatus): Promise<boolean> {
    try {
      const updateData: any = { status }

      if (status === 'in_progress') {
        updateData.startedAt = new Date()
      } else if (status === 'completed') {
        updateData.completedAt = new Date()
      } else if (status === 'cancelled') {
        updateData.cancelledAt = new Date()
      }

      await updateDoc(doc(db, 'rides', rideId), updateData)
      return true
    } catch (error) {
      console.error('Error updating ride status:', error)
      return false
    }
  },

  // Get user's ride history
  async getUserRides(
    userId: string,
    userRole: 'customer' | 'driver'
  ): Promise<Ride[]> {
    try {
      const field = userRole === 'customer' ? 'customerId' : 'driverId'
      const ridesQuery = query(
        collection(db, 'rides'),
        where(field, '==', userId),
        orderBy('requestedAt', 'desc')
      )

      const querySnapshot = await getDocs(ridesQuery)
      const rides: Ride[] = []

      querySnapshot.forEach((doc) => {
        rides.push({ id: doc.id, ...doc.data() } as Ride)
      })

      return rides
    } catch (error) {
      console.error('Error getting user rides:', error)
      return []
    }
  },

  // Rate a completed ride
  async rateRide(
    rideId: string,
    rating: number,
    review?: string
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        rating,
        review: review || '',
      })
      return true
    } catch (error) {
      console.error('Error rating ride:', error)
      return false
    }
  },

  // Calculate fare (basic implementation - you can enhance this)
  calculateFare(
    pickup: Location,
    destination: Location,
    vehicleType: string
  ): number {
    // Basic fare calculation - you can integrate with mapping services for accurate pricing
    const baseRate =
      vehicleType === 'luxury' ? 2.5 : vehicleType === 'suv' ? 2.0 : 1.5
    const distance = this.calculateDistance(pickup, destination)
    const fare = Math.max(5, distance * baseRate) // Minimum fare of $5
    return Math.round(fare * 100) / 100 // Round to 2 decimal places
  },

  // Calculate duration (basic implementation)
  calculateDuration(pickup: Location, destination: Location): number {
    // Basic duration calculation - you can integrate with mapping services
    const distance = this.calculateDistance(pickup, destination)
    const estimatedMinutes = Math.max(5, distance * 2) // Rough estimate
    return Math.round(estimatedMinutes)
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance(point1: Location, point2: Location): number {
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

    return distance
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  },
}
