import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/useColorScheme'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import NotificationSetup from '@/components/NotificationSetup'

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  if (!loaded) {
    // Async font loading only occurs in development.
    return null
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: 'white' }}
        edges={['top', 'left', 'right']}>
        <NotificationSetup>
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
              <Stack.Screen
                name='(routes)/splash/index'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/onboarding'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/onboarding/index'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/auth/role-selection'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/auth/login'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/auth/signup'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/auth/forgot-password'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/customer/booking'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/customer/ride-tracking'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/driver/dashboard'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='(routes)/driver/navigation'
                options={{ headerShown: false }}
              />
              <Stack.Screen name='+not-found' />
            </Stack>
            <StatusBar style='auto' />
          </ThemeProvider>
        </NotificationSetup>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
