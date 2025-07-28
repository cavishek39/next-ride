import React from 'react'
import { View, StyleSheet, Animated } from 'react-native'

interface PaginationDotsProps {
  data: any[]
  scrollX: Animated.Value
  activeIndex: number
}

const PaginationDots: React.FC<PaginationDotsProps> = ({
  data,
  scrollX,
  activeIndex,
}) => {
  return (
    <View style={styles.container}>
      {data.map((_, index) => {
        const inputRange = [(index - 1) * 100, index * 100, (index + 1) * 100]

        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        })

        const dotScale = scrollX.interpolate({
          inputRange,
          outputRange: [0.8, 1.2, 0.8],
          extrapolate: 'clamp',
        })

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: dotOpacity,
                transform: [{ scale: dotScale }],
                backgroundColor: index === activeIndex ? '#007AFF' : '#C7C7CC',
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
})

export default PaginationDots
