# NextRide Mobile App - Onboarding & Authentication

This React Native app built with Expo Router includes a complete onboarding flow and authentication system.

## Features

### 🎯 Onboarding Flow

- **Swipable Onboarding Screens**: Three beautiful onboarding slides with smooth animations
- **Skip Functionality**: Users can skip onboarding at any time
- **Persistence**: Onboarding status is saved to prevent showing it again
- **Custom Icons**: Each slide features relevant icons with color themes

### 🔐 Authentication System

- **Login Screen**: Clean login interface with email/password
- **Signup Screen**: Registration with form validation
- **Password Visibility Toggle**: Eye icon to show/hide passwords
- **Social Login UI**: Google and Facebook login buttons (UI only)
- **Form Validation**: Real-time validation with error messages
- **Loading States**: Visual feedback during authentication

### 🚀 App Flow

1. **Splash Screen**: Checks authentication and onboarding status
2. **First Time Users**: Onboarding → Login/Signup
3. **Returning Users**: Direct to main app if authenticated
4. **Completed Onboarding**: Direct to login if not authenticated

## Screen Structure

```
app/
├── _layout.tsx                 # Root navigation layout
├── (tabs)/
│   ├── index.tsx              # Redirects to splash or main app
│   └── explore.tsx            # Main app screen
├── (routes)/
│   ├── splash/
│   │   └── index.tsx          # Initial splash screen
│   ├── onboarding/
│   │   └── index.tsx          # Onboarding flow
│   └── auth/
│       ├── login.tsx          # Login screen
│       └── signup.tsx         # Signup screen
└── screen.tsx/
    └── OnboardingScreen.tsx   # Main onboarding component
```

## Components

### Onboarding Components

- `OnboardingSlideIcon.tsx`: Individual slide with icon and content
- `PaginationDots.tsx`: Animated pagination indicators

### Services

- `AuthService.ts`: Handles authentication logic and storage

## Key Dependencies

- `@react-native-async-storage/async-storage`: Persistent storage
- `react-native-reanimated`: Smooth animations
- `react-native-gesture-handler`: Touch gestures
- `@expo/vector-icons`: Icon library

## Usage

### Running the App

```bash
npm start
# or
expo start
```

### Testing the Flow

1. First launch shows splash screen
2. New users see onboarding slides
3. Swipe through or skip onboarding
4. Login or create account
5. Subsequent launches skip onboarding

### Customization

#### Onboarding Content

Edit `onboardingData` in `OnboardingScreen.tsx`:

```javascript
const onboardingData = [
  {
    id: '1',
    icon: 'car-sport',
    title: 'Your Title',
    description: 'Your description',
    backgroundColor: '#E8F4FD',
    iconColor: '#007AFF',
  },
  // Add more slides...
]
```

#### Color Themes

Update colors in the StyleSheet sections of each component.

#### Authentication Logic

Modify `AuthService.ts` to integrate with your backend API.

## Future Enhancements

- [ ] Social authentication integration
- [ ] Biometric authentication
- [ ] Password reset functionality
- [ ] Email verification
- [ ] User profile management
- [ ] Remember me functionality

## Notes

- All navigation uses type-safe routing with Expo Router
- Authentication state is persisted across app restarts
- Responsive design adapts to different screen sizes
- iOS and Android compatible styling
