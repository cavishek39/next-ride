import React, { useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import OnboardingSlideIcon from '@/components/onboarding/OnboardingSlideIcon'
import PaginationDots from '@/components/onboarding/PaginationDots'

const { width } = Dimensions.get('window')

const onboardingData = [
  {
    id: '1',
    icon: 'car-sport',
    title: 'Welcome to NextRide',
    description:
      'Your journey begins here. Experience seamless rides with just a few taps.',
    backgroundColor: '#E8F4FD',
    iconColor: '#007AFF',
  },
  {
    id: '2',
    icon: 'phone-portrait',
    title: 'Easy Booking',
    description:
      'Book your ride instantly with our user-friendly interface. Quick, simple, and reliable.',
    backgroundColor: '#FFF2E8',
    iconColor: '#FF9500',
  },
  {
    id: '3',
    icon: 'shield-checkmark',
    title: 'Safe & Secure',
    description:
      'Travel with confidence. Our drivers are verified and your safety is our priority.',
    backgroundColor: '#E8F8F0',
    iconColor: '#34C759',
  },
]

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollX = useRef(new Animated.Value(0)).current
  const slidesRef = useRef<FlatList>(null)

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index || 0)
  }).current

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  const goToNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 })
    } else {
      finishOnboarding()
    }
  }

  const skip = () => {
    finishOnboarding()
  }

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true')
      router.replace('/(routes)/auth/login' as any)
    } catch (error) {
      console.error('Error saving onboarding state:', error)
      router.replace('/(routes)/auth/login' as any)
    }
  }

  const renderItem = ({ item }: any) => (
    <OnboardingSlideIcon
      icon={item.icon}
      title={item.title}
      description={item.description}
      backgroundColor={item.backgroundColor}
      iconColor={item.iconColor}
    />
  )

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle='dark-content'
        backgroundColor='transparent'
        translucent
      />

      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <PaginationDots
          data={onboardingData}
          scrollX={scrollX}
          activeIndex={currentIndex}
        />

        <TouchableOpacity style={styles.nextButton} onPress={goToNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1
              ? 'Get Started'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default OnboardingScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
})
