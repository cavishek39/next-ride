# Google APIs Required for Next Ride App

Based on your navigation and mapping needs, enable these APIs in Google Cloud Console:

## 🗺️ Essential Maps APIs

### 1. **Maps SDK for Android** ⭐ REQUIRED

- **Purpose**: Display maps in your Android app
- **Used for**: All map components, driver navigation, customer booking maps

### 2. **Maps SDK for iOS** ⭐ REQUIRED

- **Purpose**: Display maps in your iOS app
- **Used for**: All map components, driver navigation, customer booking maps

### 3. **Maps JavaScript API** (Optional)

- **Purpose**: If you plan to add web support later
- **Used for**: Web version of your app

## 🧭 Navigation APIs

### 4. **Directions API** ⭐ REQUIRED

- **Purpose**: Calculate routes between pickup and destination
- **Used for**: Turn-by-turn navigation, route optimization, ETA calculations
- **Code usage**: `NavigationService.calculateRoute()`

### 5. **Distance Matrix API** ⭐ RECOMMENDED

- **Purpose**: Calculate travel distances and times for multiple origins/destinations
- **Used for**: Fare calculation, driver matching by proximity

## 📍 Location & Places APIs

### 6. **Places API** ⭐ REQUIRED

- **Purpose**: Address autocomplete, place details, geocoding
- **Used for**: Location search in booking screen, address validation

### 7. **Geocoding API** ⭐ REQUIRED

- **Purpose**: Convert addresses to coordinates and vice versa
- **Used for**: Converting addresses to map coordinates, reverse geocoding

### 8. **Geolocation API** (Optional)

- **Purpose**: Get location from IP address (fallback)
- **Used for**: Approximate location when GPS unavailable

## 🚗 Additional Useful APIs

### 9. **Roads API** (Optional but Recommended)

- **Purpose**: Snap GPS coordinates to roads, get speed limits
- **Used for**: More accurate driver tracking, route following

### 10. **Time Zone API** (Optional)

- **Purpose**: Get time zone for any location
- **Used for**: Accurate scheduling across time zones

## 📊 Priority Setup Order:

### Phase 1 - Core Functionality ⭐

1. **Maps SDK for Android**
2. **Maps SDK for iOS**
3. **Directions API**
4. **Places API**
5. **Geocoding API**

### Phase 2 - Enhanced Features

6. **Distance Matrix API**
7. **Roads API**

### Phase 3 - Advanced Features

8. **Time Zone API**
9. **Maps JavaScript API** (for web)

## 💰 Cost Considerations:

- **Maps SDK**: $7 per 1,000 map loads
- **Directions API**: $5 per 1,000 requests
- **Places API**: $17 per 1,000 requests (Autocomplete)
- **Geocoding API**: $5 per 1,000 requests

## 🔧 Setup Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Search for and enable each API listed above
5. Go to "Credentials" > "Create Credentials" > "API Key"
6. Restrict your API key to only the enabled APIs
7. Add application restrictions (Android/iOS bundle IDs)

## 🔐 Security Best Practices:

- **Restrict API Key**: Limit to specific APIs and applications
- **Set quotas**: Prevent unexpected charges
- **Use environment variables**: Never hardcode API keys
- **Monitor usage**: Set up billing alerts

## 🚀 For Your Current Implementation:

Based on your NotificationService and NavigationService, you minimally need:

```bash
✅ Maps SDK for Android
✅ Maps SDK for iOS
✅ Directions API
✅ Places API
✅ Geocoding API
```

Start with these 5 APIs to get your core ride booking and navigation features working!
