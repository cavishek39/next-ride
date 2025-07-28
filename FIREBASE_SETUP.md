# Firebase Setup Instructions for NextRide

## 🔥 Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `nextride-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Add React Native App

1. In Firebase Console, click "Add app" and select the `</>` (Web) icon
2. Register your app with nickname: "NextRide React Native"
3. Copy the Firebase configuration object

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Firebase config values:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

### Step 4: Enable Authentication Methods

1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable the following providers:
   - ✅ **Email/Password** (Required)
   - ✅ **Google** (Optional - for social login)
   - ✅ **Facebook** (Optional - for social login)

### Step 5: Configure Email Templates (Optional)

1. Go to "Authentication" > "Templates"
2. Customize email templates for:
   - Password reset
   - Email verification
   - Email address change

## 🛠 Development Setup

### Test Authentication

1. Run the app: `npm start`
2. Try creating a new account
3. Check Firebase Console > Authentication > Users to see registered users
4. Test login with created credentials
5. Test password reset functionality

### Firebase Security Rules

The app uses Firebase's default security rules. For production, you may want to customize these in:

- Firebase Console > Firestore Database > Rules (if using Firestore)
- Firebase Console > Storage > Rules (if using Storage)

## 🚀 Production Deployment

### iOS Setup (if building for iOS)

1. Add iOS app in Firebase Console
2. Download `GoogleService-Info.plist`
3. Follow Expo documentation for Firebase iOS setup

### Android Setup (if building for Android)

1. Add Android app in Firebase Console
2. Download `google-services.json`
3. Follow Expo documentation for Firebase Android setup

## 📱 Features Implemented

✅ **Email/Password Authentication**

- User registration with email and password
- User login with email and password
- Password reset via email
- Form validation and error handling

✅ **User Session Management**

- Persistent authentication state
- Automatic login on app restart
- Secure logout functionality

✅ **Error Handling**

- User-friendly error messages
- Firebase error code translation
- Network error handling

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` file to version control
2. **API Key Security**: Firebase API keys are safe for client-side use
3. **Security Rules**: Configure Firestore/Storage rules before production
4. **Email Verification**: Consider adding email verification for production

## 🐛 Troubleshooting

### Common Issues:

**"Firebase: Error (auth/configuration-not-found)"**

- Ensure `.env` file exists and contains correct values
- Restart Expo development server after adding `.env`

**"Firebase: Error (auth/invalid-api-key)"**

- Double-check your API key in `.env` file
- Ensure there are no extra spaces or quotes

**"Firebase: Error (auth/project-not-found)"**

- Verify PROJECT_ID in `.env` matches your Firebase project ID

### Testing Without Firebase Setup

The app includes fallback demo values, so it will run even without Firebase configuration. However, authentication will not work until you set up a real Firebase project.

## 📚 Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Expo Firebase Setup Guide](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase](https://rnfirebase.io/) (Alternative library)

## 🆘 Support

If you encounter issues:

1. Check Firebase Console for error logs
2. Verify your `.env` configuration
3. Ensure your Firebase project has Email/Password authentication enabled
4. Check the Expo CLI logs for detailed error messages
