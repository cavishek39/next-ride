import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { UserRole } from '@/types'

const { width, height } = Dimensions.get('window')

const RoleSelectionScreen = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  const handleContinue = () => {
    if (!selectedRole) {
      Alert.alert(
        'Please select a role',
        'Choose whether you want to be a customer or driver'
      )
      return
    }

    // Navigate to signup with role
    router.push({
      pathname: '/(routes)/auth/signup',
      params: { role: selectedRole },
    })
  }

  const RoleCard = ({
    role,
    title,
    description,
    icon,
    isSelected,
  }: {
    role: UserRole
    title: string
    description: string
    icon: keyof typeof Ionicons.glyphMap
    isSelected: boolean
  }) => (
    <TouchableOpacity
      style={[styles.roleCard, isSelected && styles.selectedCard]}
      onPress={() => setSelectedRole(role)}>
      <View
        style={[
          styles.iconContainer,
          isSelected && styles.selectedIconContainer,
        ]}>
        <Ionicons
          name={icon}
          size={40}
          color={isSelected ? '#fff' : '#007AFF'}
        />
      </View>
      <Text style={[styles.roleTitle, isSelected && styles.selectedText]}>
        {title}
      </Text>
      <Text
        style={[
          styles.roleDescription,
          isSelected && styles.selectedDescription,
        ]}>
        {description}
      </Text>
      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name='checkmark-circle' size={24} color='#4CAF50' />
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color='#333' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Role</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>How do you want to use NextRide?</Text>
        <Text style={styles.subtitle}>
          Select your primary role to get started with the app
        </Text>

        <View style={styles.rolesContainer}>
          <RoleCard
            role='customer'
            title="I'm a Customer"
            description='Book rides and travel safely to your destination'
            icon='person-outline'
            isSelected={selectedRole === 'customer'}
          />

          <RoleCard
            role='driver'
            title="I'm a Driver"
            description='Earn money by providing rides to customers'
            icon='car-outline'
            isSelected={selectedRole === 'driver'}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}>
          <Text
            style={[
              styles.continueButtonText,
              !selectedRole && styles.disabledButtonText,
            ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  rolesContainer: {
    gap: 20,
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  selectedText: {
    color: '#fff',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#888',
  },
})

export default RoleSelectionScreen
