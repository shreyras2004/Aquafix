import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';

// Import Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CustomerDashboard from './src/screens/CustomerDashboard';
import NearbyOwnersScreen from './src/screens/NearbyOwnersScreen';
import OwnerDetailScreen from './src/screens/OwnerDetailScreen';
import BookingScreen from './src/screens/BookingScreen';
import BookingStatusScreen from './src/screens/BookingStatusScreen';
import OwnerDashboard from './src/screens/OwnerDashboard';
import InvoiceScreen from './src/screens/InvoiceScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminDashboard from './src/screens/AdminDashboard';

const Stack = createStackNavigator();

// Common navigation header styles
const headerOptions = {
  headerStyle: {
    backgroundColor: colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: '#ffffff',
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 16,
  },
  headerBackTitleVisible: false,
};

function NavigationWrapper() {
  const { user, loading } = useAuth();

  // Show a loading screen while auth verification resolves
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={headerOptions}>
        {user === null ? (
          // Auth Screen Stack (Welcome, Login, Register)
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Sign In' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Create Account' }}
            />
          </>
        ) : user.role === 'owner' ? (
          // Borewell Machine Owner Screen Stack
          <>
            <Stack.Screen
              name="OwnerDashboard"
              component={OwnerDashboard}
              options={{ title: 'Borewell Owner Hub', headerLeft: () => null }}
            />
            <Stack.Screen
              name="Invoice"
              component={InvoiceScreen}
              options={{ title: 'Contract Receipt' }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Operator Profile' }}
            />
          </>
        ) : user.role === 'admin' ? (
          // System Admin Screen Stack
          <>
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboard}
              options={{ title: 'AquaFix Superuser Panel', headerLeft: () => null }}
            />
            <Stack.Screen
              name="BookingStatus"
              component={BookingStatusScreen}
              options={{ title: 'Track Booking' }}
            />
            <Stack.Screen
              name="Invoice"
              component={InvoiceScreen}
              options={{ title: 'System Invoice Ledger' }}
            />
          </>
        ) : (
          // General Customer Screen Stack
          <>
            <Stack.Screen
              name="CustomerDashboard"
              component={CustomerDashboard}
              options={{ title: 'AquaFix Portal', headerLeft: () => null }}
            />
            <Stack.Screen
              name="NearbyOwners"
              component={NearbyOwnersScreen}
              options={{ title: 'Nearby Drilling Rigs' }}
            />
            <Stack.Screen
              name="OwnerDetail"
              component={OwnerDetailScreen}
              options={{ title: 'Operator Rig Profile' }}
            />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{ title: 'Book Drilling Service' }}
            />
            <Stack.Screen
              name="BookingStatus"
              component={BookingStatusScreen}
              options={{ title: 'Drilling Tracker' }}
            />
            <Stack.Screen
              name="Invoice"
              component={InvoiceScreen}
              options={{ title: 'Payment Receipt' }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'My Bookings & Profile' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationWrapper />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
