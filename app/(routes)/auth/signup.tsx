import React, { useState } from 'react'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import AuthService from '@/services/AuthService'
import { UserRole } from '@/types'

const { width, height } = Dimensions.get('window')

const SignupScreen = () => {
  const params = useLocalSearchParams<{ role: UserRole }>()
  const userRole = params.role || 'customer'
  const insets = useSafeAreaInsets()

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
  const [vehicleType, setVehicleType] = useState<
    'sedan' | 'suv' | 'hatchback' | 'luxury'
  >('sedan')

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
      if (
        !licenseNumber ||
        !vehicleMake ||
        !vehicleModel ||
        !vehicleYear ||
        !vehicleColor ||
        !licensePlate
      ) {
        Alert.alert(
          'Error',
          'Please fill in all vehicle information for driver registration'
        )
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
      console.log('Error during signup:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToLogin = () => {
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
            onPress={() => setVehicleType(type)}>
            <Text
              style={[
                styles.vehicleTypeText,
                vehicleType === type && styles.selectedVehicleTypeText,
              ]}>
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}>
              <Ionicons name='arrow-back' size={24} color='#333' />
            </TouchableOpacity>
            <Text style={styles.title}>
              Create {userRole === 'driver' ? 'Driver' : 'Customer'} Account
            </Text>
            <Text style={styles.subtitle}>
              {userRole === 'driver'
                ? 'Join as a driver and start earning'
                : 'Join us and start your journey today'}
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

            {/* Phone Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder='Enter your phone number'
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType='phone-pad'
                  placeholderTextColor='#999'
                />
              </View>
            </View>

            {/* Driver-specific fields */}
            {userRole === 'driver' && (
              <>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>

                {/* License Number */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Driver's License Number</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder='Enter license number'
                      value={licenseNumber}
                      onChangeText={setLicenseNumber}
                      placeholderTextColor='#999'
                    />
                  </View>
                </View>

                {/* Vehicle Make and Model */}
                <View style={styles.nameRow}>
                  <View style={[styles.inputContainer, styles.nameInput]}>
                    <Text style={styles.inputLabel}>Vehicle Make</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder='e.g. Toyota'
                        value={vehicleMake}
                        onChangeText={setVehicleMake}
                        placeholderTextColor='#999'
                      />
                    </View>
                  </View>

                  <View style={[styles.inputContainer, styles.nameInput]}>
                    <Text style={styles.inputLabel}>Vehicle Model</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder='e.g. Camry'
                        value={vehicleModel}
                        onChangeText={setVehicleModel}
                        placeholderTextColor='#999'
                      />
                    </View>
                  </View>
                </View>

                {/* Vehicle Year and Color */}
                <View style={styles.nameRow}>
                  <View style={[styles.inputContainer, styles.nameInput]}>
                    <Text style={styles.inputLabel}>Year</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder='2020'
                        value={vehicleYear}
                        onChangeText={setVehicleYear}
                        keyboardType='numeric'
                        placeholderTextColor='#999'
                      />
                    </View>
                  </View>

                  <View style={[styles.inputContainer, styles.nameInput]}>
                    <Text style={styles.inputLabel}>Color</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder='e.g. Black'
                        value={vehicleColor}
                        onChangeText={setVehicleColor}
                        placeholderTextColor='#999'
                      />
                    </View>
                  </View>
                </View>

                {/* License Plate */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>License Plate</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder='ABC1234'
                      value={licensePlate}
                      onChangeText={setLicensePlate}
                      autoCapitalize='characters'
                      placeholderTextColor='#999'
                    />
                  </View>
                </View>

                {/* Vehicle Type Selector */}
                <VehicleTypeSelector />
              </>
            )}

            {/* Password Inputs */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder='Enter your password'
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor='#999'
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color='#999'
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder='Confirm your password'
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor='#999'
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color='#999'
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
        {/* Footer actions always visible */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 12 },
            isLoading && { opacity: 0.9 },
          ]}>
          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={isLoading}>
            <Text style={styles.signupButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    left: -10,
    top: 0,
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  vehicleTypeContainer: {
    marginBottom: 20,
  },
  vehicleTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  selectedVehicleType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  vehicleTypeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedVehicleTypeText: {
    color: '#fff',
  },
  signupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
})

export default SignupScreen
