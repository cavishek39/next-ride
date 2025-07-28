import {
  doc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { LocationCoordinates } from '@/services/LocationService'
import { Ride, RideStatus } from '@/types'
import { NotificationService } from './NotificationService'

export interface RideLocationUpdate {
  rideId: string
  driverLocation: LocationCoordinates
  timestamp: Date
}

export const RealTimeService = {
  // Update driver location for an active ride
  async updateDriverLocation(
    rideId: string,
    location: LocationCoordinates
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        driverCurrentLocation: location,
        lastLocationUpdate: new Date(),
      })
      return true
    } catch (error) {
      console.error('Error updating driver location:', error)
      return false
    }
  },

  // Subscribe to ride updates (for customers tracking their ride)
  subscribeToRideUpdates(
    rideId: string,
    onUpdate: (ride: Ride) => void,
    onError?: (error: Error) => void
  ): () => void {
    let previousStatus: RideStatus | null = null

    const unsubscribe = onSnapshot(
      doc(db, 'rides', rideId),
      async (doc) => {
        if (doc.exists()) {
          const rideData = { id: doc.id, ...doc.data() } as Ride

          // Send notifications on status changes
          if (previousStatus && previousStatus !== rideData.status) {
            await this.handleRideStatusChange(rideData, previousStatus)
          }

          previousStatus = rideData.status
          onUpdate(rideData)
        }
      },
      (error) => {
        console.error('Error listening to ride updates:', error)
        onError?.(error)
      }
    )

    return unsubscribe
  },

  // Handle ride status changes and send appropriate notifications
  async handleRideStatusChange(
    ride: Ride,
    previousStatus: RideStatus
  ): Promise<void> {
    try {
      switch (ride.status) {
        case 'accepted':
          if (previousStatus === 'requested') {
            await NotificationService.notifyCustomer(
              ride.customerId,
              ride.id!,
              'ride_accepted',
              ride.driverName
            )
          }
          break

        case 'driver_arriving':
          if (previousStatus === 'accepted') {
            await NotificationService.notifyCustomer(
              ride.customerId,
              ride.id!,
              'driver_arriving',
              ride.driverName
            )
          }
          break

        case 'in_progress':
          if (previousStatus === 'driver_arriving') {
            await NotificationService.notifyCustomer(
              ride.customerId,
              ride.id!,
              'ride_started'
            )
          }
          break

        case 'completed':
          if (previousStatus === 'in_progress') {
            await NotificationService.notifyCustomer(
              ride.customerId,
              ride.id!,
              'ride_completed'
            )
          }
          break

        case 'cancelled':
          if (ride.driverId && previousStatus !== 'requested') {
            await NotificationService.notifyDriver(
              ride.driverId,
              ride.id!,
              'ride_cancelled',
              ride.customerName
            )
          }
          break
      }
    } catch (error) {
      console.error('Error handling ride status change:', error)
    }
  },

  // Subscribe to available rides for drivers
  subscribeToAvailableRides(
    driverLocation: LocationCoordinates,
    maxDistance: number,
    onUpdate: (rides: Ride[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const ridesQuery = query(
      collection(db, 'rides'),
      where('status', '==', 'requested'),
      orderBy('requestedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      ridesQuery,
      async (querySnapshot) => {
        const rides: Ride[] = []
        const newRides: Ride[] = []

        querySnapshot.forEach((doc) => {
          const ride = { id: doc.id, ...doc.data() } as Ride

          // Filter by distance if driver location is available
          if (driverLocation) {
            const distance = this.calculateDistance(
              driverLocation,
              ride.pickupLocation
            )
            if (distance <= maxDistance) {
              rides.push(ride)

              // Check if this is a new ride (just created)
              const timeDiff = Date.now() - ride.requestedAt.getTime()
              if (timeDiff < 10000) {
                // Less than 10 seconds old
                newRides.push(ride)
              }
            }
          } else {
            rides.push(ride)
          }
        })

        // Send notifications for new ride requests
        for (const ride of newRides) {
          await NotificationService.notifyDriver(
            'all_drivers', // You might want to implement targeted driver notifications
            ride.id!,
            'ride_request',
            ride.customerName,
            ride.pickupLocation.address,
            ride.fare
          )
        }

        onUpdate(rides)
      },
      (error) => {
        console.error('Error listening to available rides:', error)
        onError?.(error)
      }
    )

    return unsubscribe
  },

  // Subscribe to driver's active rides
  subscribeToDriverActiveRides(
    driverId: string,
    onUpdate: (rides: Ride[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const ridesQuery = query(
      collection(db, 'rides'),
      where('driverId', '==', driverId),
      where('status', 'in', ['accepted', 'driver_arriving', 'in_progress']),
      orderBy('acceptedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      ridesQuery,
      (querySnapshot) => {
        const rides: Ride[] = []
        querySnapshot.forEach((doc) => {
          rides.push({ id: doc.id, ...doc.data() } as Ride)
        })
        onUpdate(rides)
      },
      (error) => {
        console.error('Error listening to driver active rides:', error)
        onError?.(error)
      }
    )

    return unsubscribe
  },

  // Subscribe to customer's active rides
  subscribeToCustomerActiveRides(
    customerId: string,
    onUpdate: (rides: Ride[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const ridesQuery = query(
      collection(db, 'rides'),
      where('customerId', '==', customerId),
      where('status', 'in', [
        'requested',
        'accepted',
        'driver_arriving',
        'in_progress',
      ]),
      orderBy('requestedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      ridesQuery,
      (querySnapshot) => {
        const rides: Ride[] = []
        querySnapshot.forEach((doc) => {
          rides.push({ id: doc.id, ...doc.data() } as Ride)
        })
        onUpdate(rides)
      },
      (error) => {
        console.error('Error listening to customer active rides:', error)
        onError?.(error)
      }
    )

    return unsubscribe
  },

  // Create a location tracking session for active rides
  startLocationTracking(
    rideId: string,
    locationCallback: (location: LocationCoordinates) => void,
    interval: number = 5000 // 5 seconds
  ): () => void {
    const locationInterval = setInterval(async () => {
      // Get current location and update Firestore
      try {
        // This would integrate with your LocationService
        // const location = await LocationService.getCurrentLocation()
        // if (location) {
        //   await this.updateDriverLocation(rideId, location)
        //   locationCallback(location)
        // }
      } catch (error) {
        console.error('Error in location tracking:', error)
      }
    }, interval)

    return () => clearInterval(locationInterval)
  },

  // Send real-time notifications using NotificationService
  async sendRideNotification(
    rideId: string,
    userId: string,
    type:
      | 'ride_accepted'
      | 'driver_arriving'
      | 'ride_started'
      | 'ride_completed',
    message: string
  ): Promise<boolean> {
    try {
      // Use the NotificationService for actual notifications
      await NotificationService.sendLocalNotification({
        rideId,
        type,
        title: this.getNotificationTitle(type),
        body: message,
        userId,
      })

      return true
    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  },

  // Get notification title based on type
  getNotificationTitle(type: string): string {
    const titles = {
      ride_accepted: '🚗 Driver Found!',
      driver_arriving: '📍 Driver Arriving',
      ride_started: '🛣️ Ride Started',
      ride_completed: '✅ Ride Completed',
      ride_request: '🚖 New Ride Request',
      ride_cancelled: '❌ Ride Cancelled',
    }
    return titles[type as keyof typeof titles] || 'Ride Update'
  },

  // Helper function to calculate distance (duplicate from LocationService for modularity)
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

    return distance
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  },
}
