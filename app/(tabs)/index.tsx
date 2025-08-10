import { StyleSheet } from 'react-native'
import { Redirect } from 'expo-router'
import { useState, useEffect } from 'react'
import AuthService from '@/services/AuthService'

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<'customer' | 'driver' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const isAuth = await AuthService.isAuthenticated()
      if (isAuth) {
        const role = await AuthService.getUserRole()
        console.log('User role:', role)
        setIsLoggedIn(true)
        setUserRole(role)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return null // Or a loading screen
  }

  if (!isLoggedIn) {
    return <Redirect href='/(routes)/splash' />
  }

  // Redirect based on user role
  if (userRole === 'driver') {
    return <Redirect href='/(routes)/driver/dashboard' />
  } else if (userRole === 'customer') {
    return <Redirect href='/(routes)/customer/booking' />
  }

  // Fallback
  return <Redirect href='/(routes)/splash' />
}

const styles = StyleSheet.create({})
