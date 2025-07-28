import MapViewDirections from 'react-native-maps-directions'
import { Region, LatLng } from 'react-native-maps'
import { LocationDetails } from './LocationService'
import * as Location from 'expo-location'

export interface RouteInfo {
  distance: number // in kilometers
  duration: number // in minutes
  coordinates: LatLng[]
  instructions: NavigationInstruction[]
}

export interface NavigationInstruction {
  text: string
  distance: number
  duration: number
  maneuver: string
  coordinates: LatLng
}

export interface NavigationState {
  isNavigating: boolean
  currentInstruction: NavigationInstruction | null
  remainingDistance: number
  remainingTime: number
  currentPosition: LatLng | null
  routeProgress: number // 0-100
}

export const NavigationService = {
  // Get Google Maps API key (ensure it's configured in your environment)
  getGoogleMapsApiKey(): string {
    // You should store this in your environment variables or Constants.expoConfig
    const apiKey =
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'

    if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.warn(
        'Google Maps API key not configured. Navigation features may not work.'
      )
    }

    return apiKey
  },

  // Calculate route between two points
  async calculateRoute(
    origin: LocationDetails,
    destination: LocationDetails,
    waypoints?: LocationDetails[]
  ): Promise<RouteInfo | null> {
    try {
      const apiKey = this.getGoogleMapsApiKey()

      // Prepare waypoints string
      const waypointsStr = waypoints
        ? waypoints.map((wp) => `${wp.latitude},${wp.longitude}`).join('|')
        : ''

      // Build Google Directions API URL
      const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json'
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        key: apiKey,
        mode: 'driving',
        traffic_model: 'best_guess',
        departure_time: 'now',
      })

      if (waypointsStr) {
        params.append('waypoints', waypointsStr)
      }

      const response = await fetch(`${baseUrl}?${params}`)
      const data = await response.json()

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        console.error('Directions API error:', data.status, data.error_message)
        return null
      }

      const route = data.routes[0]
      const leg = route.legs[0]

      // Extract coordinates from the route
      const coordinates: LatLng[] = []
      route.legs.forEach((leg: any) => {
        leg.steps.forEach((step: any) => {
          const decoded = this.decodePolyline(step.polyline.points)
          coordinates.push(...decoded)
        })
      })

      // Extract turn-by-turn instructions
      const instructions: NavigationInstruction[] = []
      route.legs.forEach((leg: any) => {
        leg.steps.forEach((step: any) => {
          instructions.push({
            text: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            distance: step.distance.value / 1000, // Convert to km
            duration: step.duration.value / 60, // Convert to minutes
            maneuver: step.maneuver || 'straight',
            coordinates: {
              latitude: step.start_location.lat,
              longitude: step.start_location.lng,
            },
          })
        })
      })

      return {
        distance: leg.distance.value / 1000, // Convert to km
        duration: leg.duration.value / 60, // Convert to minutes
        coordinates,
        instructions,
      }
    } catch (error) {
      console.error('Error calculating route:', error)
      return null
    }
  },

  // Decode Google's encoded polyline
  decodePolyline(encoded: string): LatLng[] {
    const coordinates: LatLng[] = []
    let index = 0
    let lat = 0
    let lng = 0

    while (index < encoded.length) {
      let shift = 0
      let result = 0
      let byte: number

      do {
        byte = encoded.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)

      const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
      lat += deltaLat

      shift = 0
      result = 0

      do {
        byte = encoded.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)

      const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
      lng += deltaLng

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      })
    }

    return coordinates
  },

  // Get optimal region to display route
  getRouteRegion(coordinates: LatLng[], padding: number = 0.02): Region {
    if (coordinates.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    }

    const latitudes = coordinates.map((coord) => coord.latitude)
    const longitudes = coordinates.map((coord) => coord.longitude)

    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)

    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2

    const latDelta = Math.max(maxLat - minLat + padding, 0.01)
    const lngDelta = Math.max(maxLng - minLng + padding, 0.01)

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    }
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(point2.latitude - point1.latitude)
    const dLng = this.toRadians(point2.longitude - point1.longitude)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  // Convert degrees to radians
  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  },

  // Find nearest point on route to current position
  findNearestPointOnRoute(
    currentPosition: LatLng,
    routeCoordinates: LatLng[]
  ): { index: number; distance: number } | null {
    if (routeCoordinates.length === 0) return null

    let nearestIndex = 0
    let minDistance = this.calculateDistance(
      currentPosition,
      routeCoordinates[0]
    )

    for (let i = 1; i < routeCoordinates.length; i++) {
      const distance = this.calculateDistance(
        currentPosition,
        routeCoordinates[i]
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    return { index: nearestIndex, distance: minDistance }
  },

  // Calculate route progress based on current position
  calculateRouteProgress(
    currentPosition: LatLng,
    routeCoordinates: LatLng[]
  ): number {
    const nearest = this.findNearestPointOnRoute(
      currentPosition,
      routeCoordinates
    )
    if (!nearest) return 0

    return (nearest.index / (routeCoordinates.length - 1)) * 100
  },

  // Get current navigation instruction based on position
  getCurrentInstruction(
    currentPosition: LatLng,
    instructions: NavigationInstruction[]
  ): NavigationInstruction | null {
    if (instructions.length === 0) return null

    // Find the nearest instruction point
    let nearestIndex = 0
    let minDistance = this.calculateDistance(
      currentPosition,
      instructions[0].coordinates
    )

    for (let i = 1; i < instructions.length; i++) {
      const distance = this.calculateDistance(
        currentPosition,
        instructions[i].coordinates
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    // Return the next instruction if we're close to the current one
    if (minDistance < 0.05 && nearestIndex < instructions.length - 1) {
      // 50 meters
      return instructions[nearestIndex + 1]
    }

    return instructions[nearestIndex]
  },

  // Calculate remaining distance and time
  calculateRemainingDistanceAndTime(
    currentPosition: LatLng,
    routeCoordinates: LatLng[],
    instructions: NavigationInstruction[]
  ): { distance: number; time: number } {
    const nearest = this.findNearestPointOnRoute(
      currentPosition,
      routeCoordinates
    )
    if (!nearest) return { distance: 0, time: 0 }

    // Calculate remaining distance from current position to end
    let remainingDistance = 0
    for (let i = nearest.index; i < routeCoordinates.length - 1; i++) {
      remainingDistance += this.calculateDistance(
        routeCoordinates[i],
        routeCoordinates[i + 1]
      )
    }

    // Estimate remaining time based on average speed (assume 30 km/h in city)
    const averageSpeed = 30 // km/h
    const remainingTime = (remainingDistance / averageSpeed) * 60 // minutes

    return {
      distance: remainingDistance,
      time: remainingTime,
    }
  },

  // Create MapViewDirections component props
  createDirectionsProps(
    origin: LocationDetails,
    destination: LocationDetails,
    waypoints?: LocationDetails[]
  ) {
    return {
      origin: {
        latitude: origin.latitude,
        longitude: origin.longitude,
      },
      destination: {
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
      waypoints: waypoints?.map((wp) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
      })),
      apikey: this.getGoogleMapsApiKey(),
      strokeWidth: 4,
      strokeColor: '#007AFF',
      optimizeWaypoints: true,
      mode: 'DRIVING' as const,
      precision: 'high' as const,
      timePrecision: 'now' as const,
    }
  },
}
