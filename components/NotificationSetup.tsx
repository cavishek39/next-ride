import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'

import { NotificationService } from '@/services/NotificationService'
import { AuthService } from '@/services/AuthService'

interface NotificationSetupProps {
  children: React.ReactNode
}

export default function NotificationSetup({
  children,
}: NotificationSetupProps) {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    initializeNotifications()
    setupNotificationListeners()
  }, [])

  const initializeNotifications = async () => {
    try {
      // Initialize notification service
      const token = await NotificationService.initializeNotifications()

      if (token) {
        // Store token for current user if logged in
        const currentUser = await AuthService.getCurrentUser()
        if (currentUser) {
          const userRole = await AuthService.getUserRole()
          if (userRole) {
            await NotificationService.storePushToken(
              currentUser.uid,
              token,
              userRole as 'customer' | 'driver'
            )
          }
        }
      }

      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing notifications:', error)
      setIsInitialized(true) // Still render the app even if notifications fail
    }
  }

  const setupNotificationListeners = () => {
    // Handle notifications when app is in foreground
    const foregroundSubscription =
      NotificationService.addNotificationReceivedListener((notification) => {
        console.log('Notification received in foreground:', notification)
        // You can show a custom in-app notification here
      })

    // Handle notification taps
    const responseSubscription =
      NotificationService.addNotificationResponseReceivedListener(
        (response) => {
          console.log('Notification tapped:', response)
          handleNotificationTap(response.notification.request.content.data)
        }
      )

    // Cleanup listeners on unmount
    return () => {
      foregroundSubscription.remove()
      responseSubscription.remove()
    }
  }

  const handleNotificationTap = (data: any) => {
    try {
      const { type, rideId, userId } = data

      switch (type) {
        case 'ride_request':
          router.push('/driver/dashboard' as any)
          break

        case 'ride_accepted':
        case 'driver_arriving':
        case 'ride_started':
          if (rideId) {
            router.push(`/customer/ride-tracking?rideId=${rideId}` as any)
          }
          break

        case 'ride_completed':
          router.push('/customer/booking' as any)
          break

        case 'ride_cancelled':
          router.push('/driver/dashboard' as any)
          break

        default:
          console.log('Unknown notification type:', type)
      }
    } catch (error) {
      console.error('Error handling notification tap:', error)
    }
  }

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing notifications...</Text>
      </View>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
})
