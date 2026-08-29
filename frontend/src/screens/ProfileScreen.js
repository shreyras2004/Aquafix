import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { colors } from '../theme/colors';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [history, setHistory] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/bookings');
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, []);

  const handleSaveProfile = async () => {
    if (!name || !phone) {
      Alert.alert('Error', 'Name and Phone are required.');
      return;
    }

    try {
      setUpdating(true);
      const result = await updateProfile({ name, phone, address });
      if (result && result.success) {
        Alert.alert('Success', 'Profile details updated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setUpdating(false);
    }
  };

  const renderHistoryItem = ({ item }) => {
    const isCustomer = user?.role === 'customer';
    const partnerName = isCustomer
      ? item.ownerId?.name || 'Rig Operator'
      : item.customerId?.name || 'Client';

    const getStatusStyle = (status) => {
      switch (status) {
        case 'completed':
          return { bg: '#dcfce7', text: '#15803d' };
        case 'cancelled':
          return { bg: '#fee2e2', text: '#b91c1c' };
        default:
          return { bg: '#f1f5f9', text: '#475569' };
      }
    };

    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() =>
          navigation.navigate('BookingStatus', { bookingId: item._id })
        }
      >
        <View style={styles.historyCardHeader}>
          <Text style={styles.partnerName}>{partnerName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.historyLocation} numberOfLines={1}>📍 {item.location}</Text>
        <Text style={styles.historyDate}>
          Date: {new Date(item.preferredDate).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Editing Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Personal Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Contact</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Default Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, updating && styles.disabledBtn]}
            onPress={handleSaveProfile}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* History Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Service History</Text>

          {loadingHistory && history.length === 0 ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>No historical drillings present.</Text>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item._id}
              renderItem={renderHistoryItem}
              scrollEnabled={false} // Nested inside ScrollView
            />
          )}
        </View>

        {/* Logout Area */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout of Account</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginTop: 16,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledBtn: {
    backgroundColor: colors.textMuted,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  historyCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  historyLocation: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 10,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProfileScreen;
