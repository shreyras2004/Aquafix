import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const CustomerDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveBookings = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.data.success) {
        // Filter out completed and cancelled bookings to show active ones
        const active = res.data.data.filter(
          (b) => b.status !== 'completed' && b.status !== 'cancelled'
        );
        setActiveBookings(active);
      }
    } catch (error) {
      console.error('Error fetching dashboard bookings:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchActiveBookings();
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Refresh dashboard when screen is refocused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchActiveBookings();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveBookings();
    setRefreshing(false);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'accepted':
        return colors.info;
      case 'in_progress':
        return colors.secondary;
      default:
        return colors.textLight;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Owner Review';
      case 'accepted':
        return 'Booking Accepted';
      case 'in_progress':
        return 'Drilling in Progress';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeLabel}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Active Booking Tracker Widget */}
        {activeBookings.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Active Jobs Tracker</Text>
            {activeBookings.map((booking) => (
              <TouchableOpacity
                key={booking._id}
                style={styles.activeCard}
                onPress={() => navigation.navigate('BookingStatus', { bookingId: booking._id })}
              >
                <View style={styles.activeCardHeader}>
                  <Text style={styles.activeOwnerName}>
                    {booking.ownerId?.name || 'Rig Operator'}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(booking.status) + '15' },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(booking.status) }]}>
                      ● {getStatusLabel(booking.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activeCardLocation} numberOfLines={1}>
                  📍 {booking.location}
                </Text>
                <Text style={styles.activeCardDate}>
                  Scheduled: {new Date(booking.preferredDate).toLocaleDateString()}
                </Text>
                <Text style={styles.tapToViewText}>Tap to track progress & view invoice →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Dashboard Grid Menu */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Service Dashboard</Text>
          
          <View style={styles.grid}>
            {/* Find Rig Operators */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('NearbyOwners')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#e0f2fe' }]}>
                <Text style={styles.cardEmoji}>🔍</Text>
              </View>
              <Text style={styles.cardTitle}>Search Services</Text>
              <Text style={styles.cardDesc}>Browse rigs & filter by availability</Text>
            </TouchableOpacity>

            {/* Emergency Match */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => {
                // Instantly query nearby list, and book the first available one
                navigation.navigate('NearbyOwners', { autoMatch: true });
              }}
            >
              <View style={[styles.iconBg, { backgroundColor: '#fee2e2' }]}>
                <Text style={styles.cardEmoji}>⚡</Text>
              </View>
              <Text style={styles.cardTitle}>Emergency Booking</Text>
              <Text style={styles.cardDesc}>Instantly match with closest operator</Text>
            </TouchableOpacity>

            {/* History */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#e2e8f0' }]}>
                <Text style={styles.cardEmoji}>📋</Text>
              </View>
              <Text style={styles.cardTitle}>Booking History</Text>
              <Text style={styles.cardDesc}>View your past drilling receipts</Text>
            </TouchableOpacity>

            {/* Edit Profile */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#ccfbf1' }]}>
                <Text style={styles.cardEmoji}>👤</Text>
              </View>
              <Text style={styles.cardTitle}>My Profile</Text>
              <Text style={styles.cardDesc}>Edit contact numbers & address</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Rig Categories</Text>
          <View style={styles.categoryCard}>
            <Text style={styles.categoryName}>1. DTH High-Pressure Rig</Text>
            <Text style={styles.categoryText}>Used for hard rocky terrains and deep agricultural borewells.</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.categoryName}>2. Rotary Drilling Rig</Text>
            <Text style={styles.categoryText}>Used for soft soils, silt, clay, and coastal borewells.</Text>
          </View>
        </View>

        {/* Brand Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>💧 AquaFix</Text>
          <Text style={styles.footerText}>Developed by Shrey Gupta</Text>
          <Text style={styles.footerSubText}>Built during internship at Talking Crooks IT Pvt. Ltd.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  welcomeLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  activeCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  activeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeOwnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeCardLocation: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 4,
  },
  activeCardDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  tapToViewText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridCard: {
    backgroundColor: colors.card,
    width: (width - 48 - 16) / 2,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 14,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerLogo: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  footerSubText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default CustomerDashboard;
