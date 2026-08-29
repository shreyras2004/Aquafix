import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../config/api';
import { colors } from '../theme/colors';

const InvoiceScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('UPI');

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments/booking/${bookingId}`);
      if (res.data.success) {
        setPayment(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      Alert.alert('Error', 'Failed to fetch invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [bookingId]);

  const handlePayInvoice = async () => {
    if (!payment) return;

    try {
      setPaying(true);
      const res = await api.put(`/payments/${payment._id}/pay`, { method: selectedMethod });
      
      if (res.data.success) {
        Alert.alert('Payment Confirmed', 'Invoice marked as paid successfully!');
        fetchInvoice();
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to update payment status');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Loading invoice details...</Text>
      </SafeAreaView>
    );
  }

  if (!payment) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Invoice details not found</Text>
      </SafeAreaView>
    );
  }

  const isPaid = payment.status === 'paid';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Invoice Paper Layout */}
        <View style={styles.invoicePaper}>
          {/* Paper Header */}
          <View style={styles.paperHeader}>
            <View>
              <Text style={styles.brandTitle}>AQUAFIX</Text>
              <Text style={styles.brandSub}>Invoice & Receipt</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isPaid ? '#dcfce7' : '#fef3c7' },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: isPaid ? '#15803d' : '#d97706' }]}>
                {isPaid ? 'PAID' : 'PENDING'}
              </Text>
            </View>
          </View>

          <View style={styles.dashedDivider} />

          {/* Invoice Meta */}
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Invoice Number</Text>
              <Text style={styles.metaVal}>{payment.invoiceNumber}</Text>
            </View>
            <View style={{ alignItems: 'end' }}>
              <Text style={styles.metaLabel}>Date Issued</Text>
              <Text style={styles.metaVal}>
                {new Date(payment.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.dashedDivider} />

          {/* Transaction details */}
          <View style={styles.addressSection}>
            <Text style={styles.secTitle}>Billing details</Text>
            <Text style={styles.addrText}>
              <Text style={styles.addrLabel}>Customer ID: </Text>
              {payment.customerId || 'N/A'}
            </Text>
            <Text style={styles.addrText}>
              <Text style={styles.addrLabel}>Drilling Site: </Text>
              {payment.bookingId?.location || 'N/A'}
            </Text>
            <Text style={styles.addrText}>
              <Text style={styles.addrLabel}>Borewell Spec: </Text>
              {payment.bookingId?.borewellDetails || 'N/A'}
            </Text>
          </View>

          <View style={styles.solidDivider} />

          {/* Invoice Items Table */}
          <View style={styles.itemsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, { flex: 2 }]}>Billing Items</Text>
              <Text style={[styles.tableCol, { textAlign: 'right', flex: 1 }]}>Rate/Ft</Text>
              <Text style={[styles.tableCol, { textAlign: 'right', flex: 1 }]}>Total</Text>
            </View>

            {/* Drilling Row */}
            {payment.drillingDepth !== undefined && payment.drillingDepth > 0 ? (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  Borewell Drilling Service{'\n'}
                  <Text style={styles.subCellText}>Depth: {payment.drillingDepth} ft</Text>
                </Text>
                <Text style={[styles.tableCell, { textAlign: 'right', flex: 1 }]}>
                  Rs. {payment.drillingRate || 75}
                </Text>
                <Text style={[styles.tableCell, { textAlign: 'right', flex: 1, fontWeight: '700' }]}>
                  Rs. {payment.drillingDepth * (payment.drillingRate || 75)}
                </Text>
              </View>
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  Borewell Drilling Service{'\n'}
                  <Text style={styles.subCellText}>Calculated per rate/ft of operator rig</Text>
                </Text>
                <Text style={[styles.tableCell, { textAlign: 'right', flex: 1 }]}>
                  -
                </Text>
                <Text style={[styles.tableCell, { textAlign: 'right', flex: 1, fontWeight: '700' }]}>
                  Rs. {payment.amount}
                </Text>
              </View>
            )}

            {/* Casing Row (if casing depth is provided) */}
            {payment.casingDepth !== undefined && payment.casingDepth > 0 ? (
              <View style={[styles.tableRow, { marginTop: 12 }]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  Casing Pipe Installation{'\n'}
                  <Text style={styles.subCellText}>Installed: {payment.casingDepth} ft</Text>
                </Text>
                <Text style={[styles.tableCell, { textAlign: 'right', flex: 1 }]}>
                  Rs. {payment.casingRate}
                </Text>
                <Text style={[styles.tableCell, { textAlign: 'right', flex: 1, fontWeight: '700' }]}>
                  Rs. {payment.casingDepth * payment.casingRate}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.solidDivider} />

          {/* Totals */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total Amount</Text>
            <Text style={styles.totalVal}>Rs. {payment.amount}</Text>
          </View>

          {isPaid && (
            <View style={styles.receiptMark}>
              <Text style={styles.receiptMarkText}>
                Paid on {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}{'\n'}
                Method: {payment.method}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Form (if unpaid) */}
        {!isPaid && (
          <View style={styles.paymentCard}>
            <Text style={styles.cardTitle}>Choose Payment Method</Text>
            
            <View style={styles.methodRow}>
              {['UPI', 'Cash', 'Card', 'Net Banking'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodBtn,
                    selectedMethod === method && styles.activeMethodBtn,
                  ]}
                  onPress={() => setSelectedMethod(method)}
                >
                  <Text
                    style={[
                      styles.methodText,
                      selectedMethod === method && styles.activeMethodText,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.payBtn, paying && styles.disabledPayBtn]}
              onPress={handlePayInvoice}
              disabled={paying}
            >
              {paying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.payBtnText}>Clear Bill & Mark as Paid</Text>
              )}
            </TouchableOpacity>
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
    color: colors.textMuted,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  invoicePaper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    marginBottom: 20,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  solidDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  addressSection: {
    marginVertical: 4,
  },
  secTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  addrText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 6,
  },
  addrLabel: {
    fontWeight: '600',
    color: colors.textLight,
  },
  itemsTable: {
    marginVertical: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  tableCol: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  subCellText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  receiptMark: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  receiptMarkText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  paymentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  methodBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  activeMethodBtn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  methodText: {
    fontSize: 12,
    color: colors.textLight,
  },
  activeMethodText: {
    fontWeight: '700',
    color: colors.primary,
  },
  payBtn: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledPayBtn: {
    backgroundColor: colors.textMuted,
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default InvoiceScreen;
