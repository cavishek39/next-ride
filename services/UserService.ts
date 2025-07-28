import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { UserProfile, DriverProfile, CustomerProfile, UserRole } from '@/types'

export interface CreateUserProfileData {
  uid: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phoneNumber?: string
  // Driver-specific fields
  licenseNumber?: string
  vehicleInfo?: {
    make: string
    model: string
    year: number
    color: string
    licensePlate: string
    vehicleType: 'sedan' | 'suv' | 'hatchback' | 'luxury'
  }
}

export const UserService = {
  // Create user profile in Firestore
  async createUserProfile(userData: CreateUserProfileData): Promise<boolean> {
    try {
      const {
        uid,
        email,
        firstName,
        lastName,
        role,
        phoneNumber,
        licenseNumber,
        vehicleInfo,
      } = userData

      const baseProfile = {
        uid,
        email,
        firstName,
        lastName,
        role,
        phoneNumber: phoneNumber || '',
        profileImage: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      let userProfile: UserProfile

      if (role === 'driver') {
        if (!licenseNumber || !vehicleInfo) {
          throw new Error(
            'License number and vehicle info are required for drivers'
          )
        }

        userProfile = {
          ...baseProfile,
          role: 'driver',
          licenseNumber,
          vehicleInfo,
          isAvailable: false,
          rating: 5.0,
          totalRides: 0,
          isVerified: false,
        } as DriverProfile
      } else {
        userProfile = {
          ...baseProfile,
          role: 'customer',
          savedLocations: [],
          paymentMethods: [],
        } as CustomerProfile
      }

      await setDoc(doc(db, 'users', uid), userProfile)
      return true
    } catch (error) {
      console.error('Error creating user profile:', error)
      return false
    }
  },

  // Get user profile by UID
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile
      }

      return null
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  },

  // Update user profile
  async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error('Error updating user profile:', error)
      return false
    }
  },

  // Get available drivers near location
  async getAvailableDrivers(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<DriverProfile[]> {
    try {
      const driversQuery = query(
        collection(db, 'users'),
        where('role', '==', 'driver'),
        where('isAvailable', '==', true),
        where('isVerified', '==', true)
      )

      const querySnapshot = await getDocs(driversQuery)
      const drivers: DriverProfile[] = []

      querySnapshot.forEach((doc) => {
        const driver = doc.data() as DriverProfile

        // Here you would implement location-based filtering
        // For now, we'll return all available drivers
        // You can integrate with a location service to filter by distance
        drivers.push(driver)
      })

      return drivers
    } catch (error) {
      console.error('Error getting available drivers:', error)
      return []
    }
  },

  // Toggle driver availability
  async toggleDriverAvailability(
    uid: string,
    isAvailable: boolean
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        isAvailable,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error('Error toggling driver availability:', error)
      return false
    }
  },

  // Update driver location
  async updateDriverLocation(
    uid: string,
    location: { latitude: number; longitude: number }
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        currentLocation: location,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error('Error updating driver location:', error)
      return false
    }
  },
}
