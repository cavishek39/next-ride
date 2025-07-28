import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import AuthService from '@/services/AuthService'
import { UserRole } from '@/types'

const { width, height } = Dimensions.get('window')

const SignupScreen = () => {
  const params = useLocalSearchParams<{ role: UserRole }>()
  const userRole = params.role || 'customer'

  // Basic user info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Driver-specific fields
  const [licenseNumber, setLicenseNumber] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleType, setVehicleType] = useState<'sedan' | 'suv' | 'hatchback' | 'luxury'>('sedan')

  const handleSignup = async () => {
    // Basic validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    // Driver-specific validation
    if (userRole === 'driver') {
      if (!licenseNumber || !vehicleMake || !vehicleModel || !vehicleYear || !vehicleColor || !licensePlate) {
        Alert.alert('Error', 'Please fill in all vehicle information for driver registration')
        return
      }
    }

    setIsLoading(true)

    try {
      const registrationData = {
        firstName,
        lastName,
        email,
        password,
        role: userRole,
        phoneNumber: phoneNumber || undefined,
        ...(userRole === 'driver' && {
          licenseNumber,
          vehicleInfo: {
            make: vehicleMake,
            model: vehicleModel,
            year: parseInt(vehicleYear),
            color: vehicleColor,
            licensePlate: licensePlate.toUpperCase(),
            vehicleType,
          },
        }),
      }

      const result = await AuthService.register(registrationData)

      if (result.success) {
        Alert.alert('Success', result.message, [
          { text: 'OK', onPress: () => router.replace('/(tabs)' as any) },
        ])
      } else {
        Alert.alert('Error', result.message)
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToRoleSelection = () => {
    router.back()
  }

  const VehicleTypeSelector = () => (
    <View style={styles.vehicleTypeContainer}>
      <Text style={styles.inputLabel}>Vehicle Type</Text>
      <View style={styles.vehicleTypeOptions}>
        {(['sedan', 'suv', 'hatchback', 'luxury'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.vehicleTypeOption,
              vehicleType === type && styles.selectedVehicleType,
            ]}
            onPress={() => setVehicleType(type)}
          >
            <Text
              style={[
                styles.vehicleTypeText,
                vehicleType === type && styles.selectedVehicleTypeText,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={navigateToRoleSelection}>
              <Ionicons name='arrow-back' size={24} color='#333' />
            </TouchableOpacity>
            <Text style={styles.title}>
              Create {userRole === 'driver' ? 'Driver' : 'Customer'} Account
            </Text>
            <Text style={styles.subtitle}>
              {userRole === 'driver' 
                ? 'Join as a driver and start earning' 
                : 'Join us and start your journey today'
              }
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name Inputs */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder='First name'
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor='#999'
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder='Last name'
                    value={lastName}
                    onChangeText={setLastName}
                    placeholderTextColor='#999'
                  />
                </View>
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name='mail-outline'
                  size={20}
                  color='#666'
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder='Enter your email'
                  value={email}
                  onChangeText={setEmail}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  placeholderTextColor='#999'
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name='lock-closed-outline'
                  size={20}
                  color='#666'
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder='Create a password'
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor='#999'
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color='#666'
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name='lock-closed-outline'
                  size={20}
                  color='#666'
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder='Confirm your password'
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor='#999'
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}>
                  <Ionicons
                    name={
                      showConfirmPassword ? 'eye-outline' : 'eye-off-outline'
                    }
                    size={20}
                    color='#666'
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                isLoading && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={isLoading}>
              <Text style={styles.signupButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Signup Buttons */}
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name='logo-google' size={20} color='#DB4437' />
              <Text style={styles.socialButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.socialButton}>
              <Ionicons name='logo-facebook' size={20} color='#4267B2' />
              <Text style={styles.socialButtonText}>Sign up with Facebook</Text>
            </TouchableOpacity> */}
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    width: '47%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F8F9FA',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  termsContainer: {
    marginBottom: 30,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
  signupButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  signupButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: '#666',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 15,
    backgroundColor: '#F8F9FA',
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
})

export default SignupScreen
