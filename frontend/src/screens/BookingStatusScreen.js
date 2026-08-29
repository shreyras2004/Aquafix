import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import api, { BASE_URL } from '../config/api';
import { colors } from '../theme/colors';

const BookingStatusScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Review Form States
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const fetchBookingStatus = async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      if (res.data.success) {
        setBooking(res.data.data);
        setPayment(res.data.payment);

        // Check if user has already reviewed
        if (res.data.data.status === 'completed') {
          checkReviewStatus();
        }
      }
    } catch (error) {
      console.error('Error fetching booking status:', error);
      Alert.alert('Error', 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const checkReviewStatus = async () => {
    if (!booking) return;
    try {
      const res = await api.get(`/reviews/owner/${booking.ownerId._id || booking.ownerId}`);
      if (res.data.success) {
        const hasReviewed = res.data.data.some((r) => r.bookingId === bookingId);
        if (hasReviewed) {
          setReviewSubmitted(true);
        }
      }
    } catch (err) {
      console.error('Error checking review status:', err);
    }
  };

  useEffect(() => {
    fetchBookingStatus();
  }, [bookingId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookingStatus();
    setRefreshing(false);
  }, [bookingId]);

  const submitReview = async () => {
    if (!comment) {
      Alert.alert('Error', 'Please add a comment');
      return;
    }

    try {
      setReviewSubmitting(true);
      const res = await api.post('/reviews', {
        bookingId,
        rating: parseInt(rating),
        comment,
      });

      if (res.data.success) {
        Alert.alert('Review Added', 'Thank you for your feedback!');
        setReviewSubmitted(true);
      }
    } catch (error) {
      console.error('Review submit error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Fetching job status timeline...</Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Booking details not found</Text>
      </SafeAreaView>
    );
  }

  // Get index of the current state for Stepper progress
  const getStepIndex = (status) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'accepted':
        return 1;
      case 'in_progress':
        return 2;
      case 'completed':
        return payment?.status === 'paid' ? 4 : 3;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(booking.status);

  const steps = [
    { title: 'Booking Placed', desc: 'Awaiting rig operator review' },
    { title: 'Request Approved', desc: 'Rig operator accepted the booking' },
    { title: 'Drilling in Progress', desc: 'Borewell rig setup and active digging' },
    { title: 'Drilling Completed', desc: 'Services rendered, invoice generated' },
    { title: 'Payment Completed', desc: 'Bill paid and closed' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Stepper Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Progress Timeline</Text>
          <Text style={styles.refreshHint}>Swipe down to refresh status</Text>

          {booking.status === 'cancelled' ? (
            <View style={styles.cancelBox}>
              <Text style={styles.cancelText}>🚫 This booking has been cancelled.</Text>
            </View>
          ) : (
            <View style={styles.stepperContainer}>
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepIndicatorCol}>
                      <View
                        style={[
                          styles.stepIndicatorDot,
                          isPassed && styles.stepIndicatorDotActive,
                          isCurrent && styles.stepIndicatorDotCurrent,
                        ]}
                      >
                        {isPassed && !isCurrent ? (
                          <Text style={styles.checkmark}>✓</Text>
                        ) : isCurrent ? (
                          <View style={styles.currentDotInner} />
                        ) : null}
                      </View>
                      {idx < steps.length - 1 && (
                        <View
                          style={[
                            styles.stepConnectorLine,
                            idx < currentStep && styles.stepConnectorLineActive,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.stepTextCol}>
                      <Text
                        style={[
                          styles.stepTitle,
                          isPassed && styles.stepTitleActive,
                          isCurrent && styles.stepTitleCurrent,
                        ]}
                      >
                        {step.title}
                      </Text>
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Site Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Drilling Details</Text>
          <View style={styles.detailsList}>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Rig Owner: </Text>
              {booking.ownerId?.name || 'Rig Operator'}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Owner Phone: </Text>
              {booking.ownerId?.phone || 'N/A'}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Site Location: </Text>
              {booking.location}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Borewell Description: </Text>
              {booking.borewellDetails}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Preferred Date: </Text>
              {new Date(booking.preferredDate).toLocaleDateString()}
            </Text>

            {booking.siteImageUrl ? (
              <View style={styles.imageBox}>
                <Text style={styles.detailLabel}>Attached Site Image:</Text>
                <Image
                  source={{ uri: `${BASE_URL}${booking.siteImageUrl}` }}
                  style={styles.siteImage}
                />
              </View>
            ) : null}
          </View>
        </View>

        {/* CTA Panel for Invoice */}
        {booking.status === 'completed' && payment && (
          <View style={[styles.invoiceCtaBox, payment.status === 'paid' && styles.invoicePaidBg]}>
            <Text style={styles.invoiceCtaTitle}>
              {payment.status === 'paid' ? 'Receipt Cleared' : 'Invoice Generated'}
            </Text>
            <Text style={styles.invoiceCtaAmt}>Amount Due: Rs. {payment.amount}</Text>
            <TouchableOpacity
              style={styles.invoiceCtaBtn}
              onPress={() => navigation.navigate('Invoice', { bookingId: booking._id })}
            >
              <Text style={styles.invoiceCtaBtnText}>
                {payment.status === 'paid' ? 'View Payment Receipt' : 'Open Invoice & Pay Now'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback Section (Reviews) */}
        {booking.status === 'completed' && payment?.status === 'paid' && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Leave Operator Feedback</Text>
            {reviewSubmitted ? (
              <View style={styles.successReviewBox}>
                <Text style={styles.successReviewText}>⭐ Thank you! You have reviewed this service.</Text>
              </View>
            ) : (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewLabel}>Rating stars (1 to 5):</Text>
                <View style={styles.ratingSelectRow}>
                  {['1', '2', '3', '4', '5'].map((star) => (
                    <TouchableOpacity
                      key={star}
                      style={[styles.starBtn, rating === star && styles.activeStarBtn]}
                      onPress={() => setRating(star)}
                    >
                      <Text style={[styles.starBtnText, rating === star && styles.activeStarBtnText]}>
                        ⭐ {star}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.reviewInput}
                  placeholder="Enter comments about drilling depth, water pressure, operator behavior..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={comment}
                  onChangeText={setComment}
                />

                <TouchableOpacity
                  style={[styles.submitReviewBtn, reviewSubmitting && styles.disabledReviewBtn]}
                  onPress={submitReview}
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitReviewBtnText}>Submit Operator Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  refreshHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 16,
  },
  cancelBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 14,
    borderRadius: 10,
  },
  cancelText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepperContainer: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepIndicatorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepIndicatorDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepIndicatorDotCurrent: {
    borderColor: colors.primary,
    backgroundColor: '#ffffff',
  },
  currentDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#cbd5e1',
    position: 'absolute',
    top: 24,
    bottom: -20,
    zIndex: 1,
  },
  stepConnectorLineActive: {
    backgroundColor: colors.primary,
  },
  stepTextCol: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepTitleActive: {
    color: colors.text,
  },
  stepTitleCurrent: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  detailsList: {
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  detailLabel: {
    fontWeight: '700',
    color: colors.textLight,
  },
  imageBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  siteImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginTop: 8,
    resizeMode: 'cover',
  },
  invoiceCtaBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    marginBottom: 16,
  },
  invoicePaidBg: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  invoiceCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  invoiceCtaAmt: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
    marginVertical: 8,
  },
  invoiceCtaBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  invoiceCtaBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  reviewForm: {
    marginTop: 8,
  },
  reviewLabel: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 6,
  },
  ratingSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  starBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  activeStarBtn: {
    borderColor: colors.warning,
    backgroundColor: '#fffbeb',
  },
  starBtnText: {
    fontSize: 12,
    color: colors.textLight,
  },
  activeStarBtnText: {
    fontWeight: '700',
    color: colors.text,
  },
  reviewInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  submitReviewBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledReviewBtn: {
    backgroundColor: colors.textMuted,
  },
  submitReviewBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  successReviewBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  successReviewText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default BookingStatusScreen;
