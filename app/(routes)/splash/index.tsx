import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import AuthService from '@/services/AuthService'

const { width, height } = Dimensions.get('window')

const SplashScreen = () => {
  useEffect(() => {
    checkAppStatus()
  }, [])

  const checkAppStatus = async () => {
    try {
      // Simulate a short loading time

      // Check if user is authenticated
      const isAuthenticated = await AuthService.isAuthenticated()

      if (isAuthenticated) {
        // User is logged in, go to main app or last intended page
        router.replace('/(tabs)' as any)
        return
      }

      // Check onboarding status for non-authenticated users
      const onboardingCompleted = await AsyncStorage.getItem(
        'onboardingCompleted'
      )

      if (onboardingCompleted === 'true') {
        // User has completed onboarding, go to login
        router.replace('/(routes)/auth/login')
      } else {
        // First time user, show onboarding
        router.replace('/(routes)/onboarding')
      }
    } catch (error) {
      console.error('Error checking app status:', error)
      // Default to onboarding on error
      router.replace('/(routes)/onboarding')
    }
  }

  return (
    <View style={styles.container}>
      {/* App Logo/Icon */}
      <View style={styles.logoContainer}>
        <Ionicons name='car-sport' size={80} color='#007AFF' />
        <Text style={styles.appName}>NextRide</Text>
        <Text style={styles.tagline}>Your ride, your way</Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={styles.loadingText}>Getting ready...</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
})

export default SplashScreen
