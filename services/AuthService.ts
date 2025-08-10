import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth'
import { auth } from '@/config/firebase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { UserService, CreateUserProfileData } from './UserService'
import { UserRole } from '@/types'

export interface AuthResult {
  success: boolean
  message: string
  user?: User
}

export interface UserData {
  email: string
  name: string
  uid: string
  role?: UserRole
}

export interface RegisterUserData {
  firstName: string
  lastName: string
  email: string
  password: string
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

export const AuthService = {
  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe()
          resolve(!!user)
        })
      })
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser
  },

  // Login user with email and password
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      if (!email || !password) {
        return { success: false, message: 'Please provide email and password' }
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      // Store user data locally for quick access
      await AsyncStorage.setItem('userEmail', user.email || '')
      await AsyncStorage.setItem('userName', user.displayName || 'User')
      await AsyncStorage.setItem('userUid', user.uid)

      return {
        success: true,
        message: 'Login successful',
        user: user,
      }
    } catch (error: any) {
      console.error('Login error:', error)

      let message = 'Login failed'
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email'
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Try again later'
      }

      return { success: false, message }
    }
  },

  // Register user with email and password and role
  async register(userData: RegisterUserData): Promise<AuthResult> {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        role,
        phoneNumber,
        licenseNumber,
        vehicleInfo,
      } = userData

      if (!firstName || !lastName || !email || !password || !role) {
        return { success: false, message: 'Please fill in all required fields' }
      }

      if (password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters',
        }
      }

      // Validate driver-specific fields
      if (role === 'driver') {
        if (!licenseNumber || !vehicleInfo) {
          return {
            success: false,
            message:
              'License number and vehicle information are required for drivers',
          }
        }
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      // Update user profile with display name
      const displayName = `${firstName} ${lastName}`
      await updateProfile(user, { displayName })

      // Create user profile in Firestore
      const profileData: CreateUserProfileData = {
        uid: user.uid,
        email,
        firstName,
        lastName,
        role,
        phoneNumber,
        licenseNumber,
        vehicleInfo,
      }

      const profileCreated = await UserService.createUserProfile(profileData)

      console.log('User profile created:', profileCreated)

      if (!profileCreated) {
        throw new Error('Failed to create user profile')
      }

      // Store user data locally
      await AsyncStorage.setItem('userEmail', email)
      await AsyncStorage.setItem('userName', displayName)
      await AsyncStorage.setItem('userUid', user.uid)
      await AsyncStorage.setItem('userRole', role)

      return {
        success: true,
        message: 'Account created successfully',
        user: user,
      }
    } catch (error: any) {
      console.error('Registration error:', error)

      let message = 'Registration failed'
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak'
      }

      return { success: false, message }
    }
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      // Note: This requires additional setup for Google Sign-In
      // For now, return a message indicating setup is needed
      return {
        success: false,
        message:
          'Google Sign-In requires additional setup. Please use email/password for now.',
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      return { success: false, message: 'Google sign-in failed' }
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth)
      await AsyncStorage.multiRemove(['userEmail', 'userName', 'userUid'])
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  },

  // Send password reset email
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      if (!email) {
        return { success: false, message: 'Please provide an email address' }
      }

      await sendPasswordResetEmail(auth, email)
      return { success: true, message: 'Password reset email sent' }
    } catch (error: any) {
      console.error('Password reset error:', error)

      let message = 'Failed to send password reset email'
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      }

      return { success: false, message }
    }
  },

  // Get user data with role
  async getUserData(): Promise<UserData | null> {
    try {
      const user = auth.currentUser
      if (user) {
        // Get user role from AsyncStorage or Firestore
        const role = (await AsyncStorage.getItem('userRole')) as UserRole
        const userProfile = await UserService.getUserProfile(user.uid)

        return {
          email: user.email || '',
          name: user.displayName || 'User',
          uid: user.uid,
          role: userProfile?.role || role,
        }
      }

      // Fallback to AsyncStorage if Firebase user is not available
      const email = await AsyncStorage.getItem('userEmail')
      const name = await AsyncStorage.getItem('userName')
      const uid = await AsyncStorage.getItem('userUid')
      const role = (await AsyncStorage.getItem('userRole')) as UserRole

      if (email && uid) {
        return { email, name: name || 'User', uid, role }
      }

      return null
    } catch (error) {
      console.error('Error getting user data:', error)
      return null
    }
  },

  // Get user role
  async getUserRole(): Promise<UserRole | null> {
    try {
      const user = auth.currentUser
      if (user) {
        const userProfile = await UserService.getUserProfile(user.uid)
        return userProfile?.role || null
      }

      // Fallback to AsyncStorage
      const role = (await AsyncStorage.getItem('userRole')) as UserRole
      return role || null
    } catch (error) {
      console.error('Error getting user role:', error)
      return null
    }
  },

  // Check if user is a driver
  async isDriver(): Promise<boolean> {
    const role = await this.getUserRole()
    return role === 'driver'
  },

  // Check if user is a customer
  async isCustomer(): Promise<boolean> {
    const role = await this.getUserRole()
    return role === 'customer'
  },

  // Listen to authentication state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  },
}

export default AuthService
