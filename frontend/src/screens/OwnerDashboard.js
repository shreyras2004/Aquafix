import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { colors } from '../theme/colors';

const OwnerDashboard = ({ navigation }) => {
  const { user, logout, updateProfile } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, todayEarnings: 0 });
  const [availability, setAvailability] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming', 'ongoing', 'completed'
  
  // Custom Modal States for Complete Drilling Job
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [depthInput, setDepthInput] = useState('');
  const [casingDepthInput, setCasingDepthInput] = useState('80');
  const [casingRateInput, setCasingRateInput] = useState('220');

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch bookings
      const bookingsRes = await api.get('/bookings');
      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.data);
      }

      // 2. Fetch earnings summary
      const earningsRes = await api.get('/payments/owner/summary');
      if (earningsRes.data.success) {
        setEarnings(earningsRes.data.data);
      }

      // 3. Initialize availability switch state from user context
      if (user?.ownerDetails) {
        setAvailability(user.ownerDetails.availability);
      }
    } catch (error) {
      console.error('Error fetching owner dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });
    return unsubscribe;
  }, [navigation, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  // Toggle operator availability online/offline
  const handleToggleAvailability = async (value) => {
    setAvailability(value);
    try {
      const res = await api.put('/owners/profile', { availability: value });
      if (res.data.success) {
        // Sync context
        await updateProfile({ availability: value });
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', 'Failed to toggle availability status');
      setAvailability(!value); // Rollback
    }
  };

  // Update Booking Status API Call
  const handleUpdateStatus = async (bookingId, status, extraData = {}) => {
    try {
      setLoading(true);
      const res = await api.put(`/bookings/${bookingId}/status`, { status, ...extraData });
      if (res.data.success) {
        Alert.alert('Status Updated', `Booking has been moved to ${status}.`);
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update booking status');
    } finally {
      setLoading(false);
    }
  };

  // Custom Modal Submit Handler
  const handleModalSubmit = () => {
    const depth = parseFloat(depthInput);
    const casingDepth = parseFloat(casingDepthInput) || 0;
    const casingRate = parseFloat(casingRateInput) || 0;

    if (isNaN(depth) || depth <= 0) {
      Alert.alert('Invalid Depth', 'Please enter a valid drilling depth number.');
      return;
    }

    const pricePerFt = user?.ownerDetails?.pricePerFt || 75;
    const totalAmount = (depth * pricePerFt) + (casingDepth * casingRate);

    setModalVisible(false);
    handleUpdateStatus(selectedBookingId, 'completed', {
      depth,
      casingDepth,
      casingRate,
      totalAmount,
    });
  };

  // Open Modal to input drilling depth for invoice creation
  const promptCompleteJob = (bookingId) => {
    setSelectedBookingId(bookingId);
    setDepthInput('');
    setCasingDepthInput('80');
    setCasingRateInput('220');
    setModalVisible(true);
  };

  // Filter bookings based on active dashboard tab
  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'incoming':
        return bookings.filter((b) => b.status === 'pending');
      case 'ongoing':
        return bookings.filter((b) => b.status === 'accepted' || b.status === 'in_progress');
      case 'completed':
        return bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
      default:
        return [];
    }
  };

  const renderBookingItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.clientName}>{item.customerId?.name || 'Customer'}</Text>
          <Text style={styles.phoneText}>📞 {item.customerId?.phone}</Text>
        </View>
        
        <Text style={styles.cardLocation}>📍 {item.location}</Text>
        <Text style={styles.cardSpec}>🛠 {item.borewellDetails}</Text>
        <Text style={styles.cardDate}>
          Preferred Date: {new Date(item.preferredDate).toLocaleDateString()}
        </Text>

        <View style={styles.actionRow}>
          {/* Incoming Job Actions */}
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.btn, styles.btnDanger, { flex: 1, marginRight: 8 }]}
                onPress={() => handleUpdateStatus(item._id, 'cancelled')}
              >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSuccess, { flex: 1, marginLeft: 8 }]}
                onPress={() => handleUpdateStatus(item._id, 'accepted')}
              >
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Ongoing Job Actions */}
          {item.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
              onPress={() => handleUpdateStatus(item._id, 'in_progress')}
            >
              <Text style={styles.btnText}>Start Drilling Rig</Text>
            </TouchableOpacity>
          )}

          {item.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
              onPress={() => promptCompleteJob(item._id)}
            >
              <Text style={styles.btnText}>Complete & Generate Invoice</Text>
            </TouchableOpacity>
          )}

          {/* Completed Job Indicator */}
          {item.status === 'completed' && (
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline, { flex: 1 }]}
              onPress={() => navigation.navigate('Invoice', { bookingId: item._id })}
            >
              <Text style={styles.btnOutlineText}>View Invoice & Receipt</Text>
            </TouchableOpacity>
          )}

          {item.status === 'cancelled' && (
            <View style={styles.cancelledLabel}>
              <Text style={styles.cancelledLabelText}>Booking Cancelled</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeLabel}>Operator Dashboard,</Text>
          <Text style={styles.userName}>{user?.name || 'Rig Owner'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Earnings Card */}
        <View style={styles.earningsContainer}>
          <View style={styles.earningsCard}>
            <View style={styles.earningCol}>
              <Text style={styles.earningLabel}>Today's Earnings</Text>
              <Text style={styles.earningVal}>Rs. {earnings.todayEarnings}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.earningCol}>
              <Text style={styles.earningLabel}>Total Revenue</Text>
              <Text style={styles.earningVal}>Rs. {earnings.totalEarnings}</Text>
            </View>
          </View>
        </View>

        {/* Availability Switch */}
        <View style={styles.switchCard}>
          <View>
            <Text style={styles.switchTitle}>Availability Status</Text>
            <Text style={styles.switchSub}>
              {availability ? 'Online - Receiving Customer requests' : 'Offline - Rig Unavailable'}
            </Text>
          </View>
          <Switch
            value={availability}
            onValueChange={handleToggleAvailability}
            trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
            thumbColor={availability ? colors.primary : '#94a3b8'}
          />
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
            onPress={() => setActiveTab('incoming')}
          >
            <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
              Pending Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
            onPress={() => setActiveTab('ongoing')}
          >
            <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
              Active Jobs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bookings List */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={getFilteredBookings()}
            keyExtractor={(item) => item._id}
            renderItem={renderBookingItem}
            scrollEnabled={false} // Nested inside ScrollView
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Bookings</Text>
                <Text style={styles.emptySub}>No jobs present in this category.</Text>
              </View>
            }
          />
        )}
      </ScrollView>

      {/* Cross-Platform Complete Job Input Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Drilling Job</Text>
            <Text style={styles.modalSub}>
              Fill in the actual drilling specifications to generate the final bill:
            </Text>
            
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>1. Final Drilling Depth (feet) *</Text>
              <TextInput
                style={styles.modalInputText}
                placeholder="e.g. 250"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={depthInput}
                onChangeText={setDepthInput}
                autoFocus
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>2. Casing Pipe Installed (feet)</Text>
              <TextInput
                style={styles.modalInputText}
                placeholder="e.g. 80"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={casingDepthInput}
                onChangeText={setCasingDepthInput}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>3. Casing Pipe Rate (Rs. / foot)</Text>
              <TextInput
                style={styles.modalInputText}
                placeholder="e.g. 220"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={casingRateInput}
                onChangeText={setCasingRateInput}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleModalSubmit}
              >
                <Text style={styles.modalBtnSubmitText}>Submit & Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 13,
    color: colors.textLight,
  },
  userName: {
    fontSize: 18,
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
  earningsContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  earningsCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 20,
    elevation: 3,
  },
  earningCol: {
    flex: 1,
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: 11,
    color: '#e0f2fe',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  earningVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  switchSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  phoneText: {
    fontSize: 13,
    color: colors.textLight,
  },
  cardLocation: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 4,
  },
  cardSpec: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
  },
  btn: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
  },
  btnSuccess: {
    backgroundColor: colors.success,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  btnOutlineText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelledLabel: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelledLabelText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 4,
  },
  modalInputText: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f8fafc',
  },
  modalBtnCancelText: {
    color: colors.textLight,
    fontWeight: '700',
    fontSize: 14,
  },
  modalBtnSubmit: {
    backgroundColor: colors.primary,
  },
  modalBtnSubmitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default OwnerDashboard;
