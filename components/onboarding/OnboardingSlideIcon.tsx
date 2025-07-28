import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

interface OnboardingSlideProps {
  icon: string
  title: string
  description: string
  backgroundColor: string
  iconColor: string
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  icon,
  title,
  description,
  backgroundColor,
  iconColor,
}) => {
  return (
    <View style={[styles.slide, { backgroundColor }]}>
      <View style={styles.iconContainer}>
        <View
          style={[styles.iconWrapper, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon as any} size={80} color={iconColor} />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 0.4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
})

export default OnboardingSlide
