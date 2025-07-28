import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  ImageSourcePropType,
} from 'react-native'

const { width, height } = Dimensions.get('window')

interface OnboardingSlideProps {
  image: ImageSourcePropType
  title: string
  description: string
  backgroundColor: string
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  image,
  title,
  description,
  backgroundColor,
}) => {
  return (
    <View style={[styles.slide, { backgroundColor }]}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode='contain' />
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
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
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
