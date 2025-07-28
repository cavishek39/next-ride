# Navigation and Push Notifications Setup Guide

This guide explains how to set up and configure the navigation and push notification features in your Next Ride app.

## 🗺️ Navigation Integration

### Google Maps API Setup

1. **Get Google Maps API Key:**

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable these APIs:
     - Maps SDK for Android
     - Maps SDK for iOS
     - Directions API
     - Places API (for address search)
   - Create credentials (API Key)
   - Restrict the API key to your app's bundle identifiers

2. **Configure API Key:**

   - Add to your environment variables:

   ```bash
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

   - Or update the `NavigationService.ts` file directly (not recommended for production)

3. **iOS Configuration:**
   Add to your `app.json` or `app.config.js`:

   ```json
   {
     "expo": {
       "ios": {
         "config": {
           "googleMapsApiKey": "your_google_maps_api_key_here"
         }
       }
     }
   }
   ```

4. **Android Configuration:**
   Add to your `app.json` or `app.config.js`:
   ```json
   {
     "expo": {
       "android": {
         "config": {
           "googleMaps": {
             "apiKey": "your_google_maps_api_key_here"
           }
         }
       }
     }
   }
   ```

### Navigation Features

- **Turn-by-turn directions**: Real-time route calculation using Google Directions API
- **Voice guidance**: Integration with device navigation capabilities
- **Traffic-aware routing**: Routes consider current traffic conditions
- **Route optimization**: Automatic waypoint optimization for efficiency
- **Real-time location tracking**: Continuous driver location updates
- **Arrival detection**: Automatic detection when driver reaches pickup/destination

## 🔔 Push Notifications

### Expo Notifications Setup

1. **Development Setup:**

   ```bash
   # Install required packages (already done)
   npm install expo-notifications expo-device expo-constants
   ```

2. **Production Setup (EAS Build):**

   - Set up EAS credentials for push notifications
   - Configure APNs (iOS) and FCM (Android) certificates

3. **Configure Notification Channels (Android):**
   The app automatically sets up these channels:
   - `ride-updates`: For customer ride status notifications
   - `driver-notifications`: For driver ride request notifications

### Notification Types

#### Customer Notifications:

- **🚗 Driver Found**: When a driver accepts the ride
- **📍 Driver Arriving**: When driver is approaching pickup location
- **🛣️ Ride Started**: When the ride begins
- **✅ Ride Completed**: When the ride reaches destination

#### Driver Notifications:

- **🚖 New Ride Request**: When a new ride is available nearby
- **❌ Ride Cancelled**: When customer cancels an accepted ride

### Notification Features

- **Real-time delivery**: Instant notifications for ride status changes
- **Deep linking**: Tap notifications to open relevant app screens
- **Badge management**: Automatic badge count updates
- **Permission handling**: Automatic permission requests with user-friendly prompts
- **Notification history**: All notifications stored in Firestore for reference

## 🚀 Usage Examples

### 1. Driver Navigation

```typescript
// Navigate to pickup location
router.push(`/(routes)/driver/navigation?rideId=${rideId}`)

// The navigation screen automatically:
// - Shows turn-by-turn directions
// - Tracks driver location in real-time
// - Provides voice guidance
// - Detects arrival at pickup/destination
```

### 2. Send Custom Notifications

```typescript
import { NotificationService } from '@/services/NotificationService'

// Send notification to customer
await NotificationService.notifyCustomer(
  customerId,
  rideId,
  'driver_arriving',
  'John (Toyota Camry)'
)

// Send notification to driver
await NotificationService.notifyDriver(
  driverId,
  rideId,
  'ride_request',
  'Sarah',
  '123 Main St',
  15.5
)
```

### 3. Handle Notification Taps

```typescript
// In NotificationSetup component
const handleNotificationTap = (data: any) => {
  const { type, rideId } = data

  switch (type) {
    case 'ride_accepted':
      router.push(`/customer/ride-tracking?rideId=${rideId}`)
      break
    case 'ride_request':
      router.push('/driver/dashboard')
      break
  }
}
```

## 🔧 Services Overview

### NavigationService

- **Route calculation**: Calculate optimal routes between points
- **Turn-by-turn instructions**: Detailed navigation instructions
- **Progress tracking**: Monitor route progress and remaining distance/time
- **Polyline decoding**: Handle Google's encoded polylines
- **Region calculation**: Optimal map regions for route display

### NotificationService

- **Initialization**: Set up push notifications and get device tokens
- **Permission management**: Handle notification permissions
- **Local notifications**: Send immediate local notifications
- **Database integration**: Store notifications in Firestore
- **Badge management**: Handle app badge counts

### RealTimeService (Enhanced)

- **Status change detection**: Monitor ride status changes
- **Automatic notifications**: Send notifications based on ride events
- **Location updates**: Real-time driver location tracking
- **Ride subscriptions**: Live updates for both customers and drivers

## 📱 Screen Integration

### Driver Navigation Screen

- **Full-screen map**: Optimized for driving with large, clear interface
- **Real-time directions**: Turn-by-turn navigation with voice guidance
- **Status updates**: Easy buttons to update ride status
- **Arrival detection**: Automatic prompts when reaching destinations

### Enhanced Map Component

- **Direction overlay**: Visual route display on maps
- **Multiple modes**: Support for booking, tracking, and navigation
- **Marker customization**: Different markers for pickup, destination, and driver
- **Traffic integration**: Real-time traffic data display

## 🔐 Permissions Required

### Location (Always Required)

```typescript
// Automatically requested by LocationService
const permission = await Location.requestForegroundPermissionsAsync()
```

### Notifications (Automatically Requested)

```typescript
// Automatically requested by NotificationService
const permission = await Notifications.requestPermissionsAsync()
```

## 🐛 Troubleshooting

### Common Issues:

1. **Navigation not working:**

   - Check Google Maps API key is correctly configured
   - Ensure Directions API is enabled in Google Cloud Console
   - Verify internet connection

2. **Notifications not received:**

   - Check notification permissions in device settings
   - Verify Expo project configuration for push notifications
   - Test on physical device (notifications don't work in simulator)

3. **Map not loading:**
   - Verify Google Maps API key has Maps SDK enabled
   - Check network connectivity
   - Ensure location permissions are granted

## 🚀 Deployment Notes

### Before Production:

1. Set up proper environment variables for API keys
2. Configure EAS Build for push notifications
3. Test on physical devices
4. Set up monitoring for notification delivery
5. Configure proper error handling and fallbacks

### Security Considerations:

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Implement proper user authentication before sending notifications
- Validate all location data before processing

## 📈 Future Enhancements

### Potential Improvements:

- **Offline navigation**: Cache routes for offline use
- **Voice commands**: Voice-controlled navigation
- **Multi-language support**: Localized navigation instructions
- **Advanced notifications**: Rich notifications with images and actions
- **Analytics integration**: Track navigation and notification metrics
- **Custom routing**: Alternative route suggestions
- **Geofencing**: Location-based automatic actions

This completes the comprehensive navigation and notification system for your Next Ride app! 🎉
