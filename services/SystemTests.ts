import { NavigationService } from './NavigationService'

// Test Google Maps API configuration
export const testGoogleMapsSetup = async () => {
  console.log('🧪 Testing Google Maps API Setup...')

  // 1. Check API Key
  const apiKey = NavigationService.getGoogleMapsApiKey()
  console.log('✅ API Key loaded:', apiKey.substring(0, 20) + '...')

  // 2. Test Directions API with a simple route
  const testOrigin = {
    latitude: 37.7749,
    longitude: -122.4194,
    address: 'San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
  }

  const testDestination = {
    latitude: 37.7849,
    longitude: -122.4094,
    address: 'San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
  }

  try {
    console.log('🗺️ Testing route calculation...')
    const route = await NavigationService.calculateRoute(
      testOrigin,
      testDestination
    )

    if (route) {
      console.log('✅ Directions API working!')
      console.log(`📍 Distance: ${route.distance.toFixed(2)}km`)
      console.log(`⏱️ Duration: ${route.duration.toFixed(1)} minutes`)
      console.log(`🛣️ Route points: ${route.coordinates.length}`)
      console.log(`📋 Instructions: ${route.instructions.length}`)
      return true
    } else {
      console.log('❌ Directions API failed - no route returned')
      return false
    }
  } catch (error) {
    console.log('❌ Directions API error:', error)
    return false
  }
}

// Test notification setup
export const testNotificationSetup = async () => {
  console.log('🔔 Testing Notification Setup...')

  try {
    const { NotificationService } = await import('./NotificationService')

    // Check permissions
    const status = await NotificationService.getPermissionStatus()
    console.log('🔐 Notification permission status:', status)

    // Test local notification
    await NotificationService.sendLocalNotification({
      title: '🧪 Test Notification',
      body: 'Your notification system is working!',
      type: 'ride_accepted',
      userId: 'test-user',
      rideId: 'test-ride',
    })

    console.log('✅ Test notification sent!')
    return true
  } catch (error) {
    console.log('❌ Notification setup error:', error)
    return false
  }
}

// Run all tests
export const runSystemTests = async () => {
  console.log('🚀 Running Next Ride System Tests...\n')

  const mapsTest = await testGoogleMapsSetup()
  console.log('')
  const notificationTest = await testNotificationSetup()

  console.log('\n📊 Test Results:')
  console.log(`🗺️ Google Maps API: ${mapsTest ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`🔔 Notifications: ${notificationTest ? '✅ PASS' : '❌ FAIL'}`)

  if (mapsTest && notificationTest) {
    console.log(
      '\n🎉 All systems ready! Your Next Ride app is configured correctly.'
    )
  } else {
    console.log('\n⚠️ Some systems need attention. Check the logs above.')
  }

  return { mapsTest, notificationTest }
}
