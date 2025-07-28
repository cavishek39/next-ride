// User Types
export type UserRole = 'customer' | 'driver'

export interface UserProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phoneNumber?: string
  profileImage?: string
  createdAt: Date
  updatedAt: Date
}

export interface DriverProfile extends UserProfile {
  role: 'driver'
  licenseNumber: string
  vehicleInfo: VehicleInfo
  isAvailable: boolean
  currentLocation?: Location
  rating: number
  totalRides: number
  isVerified: boolean
}

export interface CustomerProfile extends UserProfile {
  role: 'customer'
  savedLocations?: SavedLocation[]
  paymentMethods?: PaymentMethod[]
}

// Location Types
export interface Location {
  latitude: number
  longitude: number
  address: string
  city: string
  state: string
  zipCode: string
}

export interface SavedLocation {
  id: string
  name: string // e.g., "Home", "Work"
  location: Location
}

// Vehicle Types
export interface VehicleInfo {
  make: string
  model: string
  year: number
  color: string
  licensePlate: string
  vehicleType: VehicleType
}

export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'luxury'

// Ride Types
export interface RideRequest {
  id: string
  customerId: string
  customerName: string
  pickupLocation: Location
  destination: Location
  fare: number
  estimatedDuration: number // in minutes
  status: RideStatus
  requestedAt: Date
  vehicleType: VehicleType
  paymentMethod: string
}

export interface Ride extends RideRequest {
  driverId?: string
  driverName?: string
  acceptedAt?: Date
  startedAt?: Date
  completedAt?: Date
  cancelledAt?: Date
  rating?: number
  review?: string
}

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

// Payment Types
export interface PaymentMethod {
  id: string
  type: 'card' | 'cash' | 'wallet'
  last4?: string // for cards
  isDefault: boolean
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: Date
  data?: any
}

export type NotificationType =
  | 'ride_request'
  | 'ride_accepted'
  | 'ride_started'
  | 'ride_completed'
  | 'payment'
  | 'general'
