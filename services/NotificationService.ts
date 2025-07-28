import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/config/firebase'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export interface PushNotificationData {
  rideId?: string
  type:
    | 'ride_request'
    | 'ride_accepted'
    | 'driver_arriving'
    | 'ride_started'
    | 'ride_completed'
    | 'ride_cancelled'
  title: string
  body: string
  userId: string
}

export const NotificationService = {
  // Initialize notifications and get push token
  async initializeNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices')
        return null
      }

      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!')
        return null
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })

      const token = tokenData.data
      console.log('Push token:', token)

      // Store token locally
      await AsyncStorage.setItem('pushToken', token)

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('ride-updates', {
          name: 'Ride Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
        })

        await Notifications.setNotificationChannelAsync(
          'driver-notifications',
          {
            name: 'Driver Notifications',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4CAF50',
          }
        )
      }

      return token
    } catch (error) {
      console.error('Error initializing notifications:', error)
      return null
    }
  },

  // Store push token in Firestore for the user
  async storePushToken(
    userId: string,
    token: string,
    userRole: 'customer' | 'driver'
  ): Promise<boolean> {
    try {
      await addDoc(collection(db, 'pushTokens'), {
        userId,
        token,
        userRole,
        platform: Platform.OS,
        createdAt: new Date(),
        isActive: true,
      })
      return true
    } catch (error) {
      console.error('Error storing push token:', error)
      return false
    }
  },

  // Send local notification
  async sendLocalNotification(data: PushNotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: {
            rideId: data.rideId,
            type: data.type,
            userId: data.userId,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      })
    } catch (error) {
      console.error('Error sending local notification:', error)
    }
  },

  // Send ride notification to customer
  async notifyCustomer(
    customerId: string,
    rideId: string,
    type:
      | 'ride_accepted'
      | 'driver_arriving'
      | 'ride_started'
      | 'ride_completed',
    driverName?: string
  ): Promise<void> {
    const notifications = {
      ride_accepted: {
        title: '🚗 Driver Found!',
        body: `${driverName || 'Your driver'} is on the way to pick you up`,
      },
      driver_arriving: {
        title: '📍 Driver Arriving',
        body: `${
          driverName || 'Your driver'
        } has arrived at the pickup location`,
      },
      ride_started: {
        title: '🛣️ Ride Started',
        body: 'Your ride has started. Enjoy your trip!',
      },
      ride_completed: {
        title: '✅ Ride Completed',
        body: 'You have reached your destination. Thanks for riding with us!',
      },
    }

    const notification = notifications[type]

    await this.sendLocalNotification({
      rideId,
      type,
      title: notification.title,
      body: notification.body,
      userId: customerId,
    })

    // Store notification in database
    await this.storeNotificationInDB(
      customerId,
      rideId,
      type,
      notification.title,
      notification.body
    )
  },

  // Send ride notification to driver
  async notifyDriver(
    driverId: string,
    rideId: string,
    type: 'ride_request' | 'ride_cancelled',
    customerName?: string,
    pickupLocation?: string,
    fare?: number
  ): Promise<void> {
    const notifications = {
      ride_request: {
        title: '🚖 New Ride Request',
        body: `${customerName || 'Customer'} needs a ride ${
          pickupLocation ? `from ${pickupLocation}` : ''
        } - $${fare?.toFixed(2) || '0.00'}`,
      },
      ride_cancelled: {
        title: '❌ Ride Cancelled',
        body: `${customerName || 'Customer'} has cancelled the ride`,
      },
    }

    const notification = notifications[type]

    await this.sendLocalNotification({
      rideId,
      type,
      title: notification.title,
      body: notification.body,
      userId: driverId,
    })

    // Store notification in database
    await this.storeNotificationInDB(
      driverId,
      rideId,
      type,
      notification.title,
      notification.body
    )
  },

  // Store notification in Firestore
  async storeNotificationInDB(
    userId: string,
    rideId: string,
    type: string,
    title: string,
    body: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        rideId,
        type,
        title,
        body,
        createdAt: new Date(),
        isRead: false,
      })
    } catch (error) {
      console.error('Error storing notification in DB:', error)
    }
  },

  // Handle notification when app is in foreground
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback)
  },

  // Handle notification when user taps on it
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback)
  },

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()
  },

  // Cancel specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  },

  // Get notification permissions status
  async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync()
    return status
  },

  // Badge management
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count)
  },

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0)
  },
}
