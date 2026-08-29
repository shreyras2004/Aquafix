import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import api from '../config/api';
import { colors } from '../theme/colors';

const OwnerDetailScreen = ({ route, navigation }) => {
  const { ownerId } = route.params; // Expects owner's user account ID

  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      // Fetch profile
      const ownerRes = await api.get(`/owners/${ownerId}`);
      if (ownerRes.data.success) {
        setOwner(ownerRes.data.data);
      }

      // Fetch reviews
      const reviewsRes = await api.get(`/reviews/owner/${ownerId}`);
      if (reviewsRes.data.success) {
        setReviews(reviewsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      Alert.alert('Error', 'Failed to fetch rig details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [ownerId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Loading operator profile...</Text>
      </SafeAreaView>
    );
  }

  if (!owner) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Rig Operator profile not found</Text>
      </SafeAreaView>
    );
  }

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.customerId?.name || 'Customer'}</Text>
        <Text style={styles.reviewRating}>⭐ {item.rating}</Text>
      </View>
      <Text style={styles.reviewComment}>"{item.comment}"</Text>
      <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👷</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{owner.userId?.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View
                  style={[
                    styles.verifyBadge,
                    { backgroundColor: owner.verified ? '#dcfce7' : '#fee2e2' },
                  ]}
                >
                  <Text style={[styles.verifyText, { color: owner.verified ? '#15803d' : '#b91c1c' }]}>
                    {owner.verified ? '✓ Verified' : '⚠ Pending Verification'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Rig details */}
          <Text style={styles.infoTitle}>Rig Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Machine Type</Text>
              <Text style={styles.infoVal}>{owner.machineType}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Cost / Foot</Text>
              <Text style={styles.infoVal}>Rs. {owner.pricePerFt}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Phone Contact</Text>
              <Text style={styles.infoVal}>{owner.userId?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Operation Base</Text>
              <Text style={styles.infoVal}>{owner.userId?.address || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionHeader}>Customer Reviews ({reviews.length})</Text>

          {reviews.length === 0 ? (
            <View style={styles.noReviewsBox}>
              <Text style={styles.noReviewsText}>No reviews left for this operator yet.</Text>
            </View>
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={(item) => item._id}
              renderItem={renderReviewItem}
              scrollEnabled={false} // Nested inside ScrollView
            />
          )}
        </View>
      </ScrollView>

      {/* Floating CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.bookButton, !owner.availability && styles.disabledBook]}
          disabled={!owner.availability}
          onPress={() =>
            navigation.navigate('Booking', {
              ownerId: owner.userId._id,
              ownerName: owner.userId.name,
              pricePerFt: owner.pricePerFt,
            })
          }
        >
          <Text style={styles.bookButtonText}>
            {owner.availability ? 'Book Drilling Rig Now' : 'Rig Operator Currently Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loaderText: {
    marginTop: 10,
    color: colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textLight,
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Cushion for bottom CTA
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  verifyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  reviewsSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  reviewRating: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewComment: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 16,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  noReviewsBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noReviewsText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  disabledBook: {
    backgroundColor: colors.textMuted,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OwnerDetailScreen;
