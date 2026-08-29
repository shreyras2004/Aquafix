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
  Alert,
} from 'react-native';
import api from '../config/api';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'users', 'bookings'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pendingOwners, setPendingOwners] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const res = await api.get('/admin/owners/pending');
        if (res.data.success) {
          setPendingOwners(res.data.data);
        }
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        if (res.data.success) {
          setAllUsers(res.data.data);
        }
      } else if (activeTab === 'bookings') {
        const res = await api.get('/admin/bookings');
        if (res.data.success) {
          setAllBookings(res.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('Error', 'Failed to retrieve admin records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  }, [activeTab]);

  // Handle owner verification approval
  const handleVerifyOwner = async (ownerUserId) => {
    try {
      setLoading(true);
      const res = await api.put(`/admin/owners/${ownerUserId}/verify`, { verified: true });
      if (res.data.success) {
        Alert.alert('Operator Verified', 'Borewell rig owner has been approved and listed online.');
        fetchAdminData();
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to approve rig operator');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return colors.tagAdmin;
      case 'owner':
        return colors.tagOwner;
      default:
        return colors.tagCustomer;
    }
  };

  const getRoleLabelColor = (role) => {
    switch (role) {
      case 'admin':
        return '#7c3aed';
      case 'owner':
        return colors.secondary;
      default:
        return colors.primary;
    }
  };

  const renderPendingItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.userId?.name || 'Rig Owner'}</Text>
        <Text style={styles.cardSubtitle}>📞 {item.userId?.phone}</Text>
      </View>
      <Text style={styles.cardDetails}>📧 {item.userId?.email}</Text>
      <Text style={styles.cardDetails}>📍 Base: {item.userId?.address || 'N/A'}</Text>
      
      <View style={styles.rigSpecBox}>
        <Text style={styles.specLabel}>Setup Details</Text>
        <Text style={styles.specText}>Machine Type: {item.machineType}</Text>
        <Text style={styles.specText}>Rate: Rs. {item.pricePerFt} / ft</Text>
      </View>

      <TouchableOpacity
        style={styles.verifyBtn}
        onPress={() => handleVerifyOwner(item.userId?._id)}
      >
        <Text style={styles.verifyBtnText}>Approve & Verify Rig</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.userNameText}>{item.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
          <Text style={[styles.roleBadgeText, { color: getRoleLabelColor(item.role) }]}>
            {item.role}
          </Text>
        </View>
      </View>
      <Text style={styles.userSubText}>📧 {item.email}</Text>
      <Text style={styles.userSubText}>📞 {item.phone}</Text>
    </View>
  );

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingTitleText}>Job ID: ...{item._id.slice(-6)}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>● {item.status}</Text>
        </View>
      </View>
      <Text style={styles.bookingSubText}>🧑 Customer: {item.customerId?.name || 'N/A'}</Text>
      <Text style={styles.bookingSubText}>👷 Operator: {item.ownerId?.name || 'N/A'}</Text>
      <Text style={styles.bookingSubText}>📍 Location: {item.location}</Text>
      <Text style={styles.bookingSubText}>
        Date: {new Date(item.preferredDate).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Title Header */}
      <View style={styles.titleHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.adminTitle}>Admin Portal</Text>
          <Text style={styles.adminDesc}>Supervise borewell listings and contracts</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Menu */}
      <View style={styles.tabsMenu}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pending' && styles.activeTabBtn]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'pending' && styles.activeTabBtnText]}>
            Verify Rig ({pendingOwners.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'users' && styles.activeTabBtn]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'users' && styles.activeTabBtnText]}>
            Users List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bookings' && styles.activeTabBtn]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'bookings' && styles.activeTabBtnText]}>
            Drilling Logs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Render */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === 'pending' && (
            <FlatList
              data={pendingOwners}
              keyExtractor={(item) => item._id}
              renderItem={renderPendingItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>All rig owners verified! No approvals pending.</Text>
                </View>
              }
            />
          )}

          {activeTab === 'users' && (
            <FlatList
              data={allUsers}
              keyExtractor={(item) => item._id}
              renderItem={renderUserItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users registered.</Text>
                </View>
              }
            />
          )}

          {activeTab === 'bookings' && (
            <FlatList
              data={allBookings}
              keyExtractor={(item) => item._id}
              renderItem={renderBookingItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No booking logs recorded.</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleHeader: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  adminTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  adminDesc: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  tabsMenu: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabBtn: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabBtnText: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textLight,
  },
  cardDetails: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
    marginTop: 2,
  },
  rigSpecBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginVertical: 12,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  specText: {
    fontSize: 12,
    color: colors.text,
  },
  verifyBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userSubText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  bookingTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: colors.primaryBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  bookingSubText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});

export default AdminDashboard;
