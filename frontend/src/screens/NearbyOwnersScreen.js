import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../config/api';
import { colors } from '../theme/colors';

const NearbyOwnersScreen = ({ route, navigation }) => {
  const { autoMatch } = route.params || {};

  const [owners, setOwners] = useState([]);
  const [filteredOwners, setFilteredOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulated Location (Bangalore center)
  const userLat = '12.9716';
  const userLng = '77.5946';

  const fetchNearbyOwners = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/owners/nearby?lat=${userLat}&lng=${userLng}&radius=100`);
      
      if (res.data.success) {
        const ownersList = res.data.data;
        setOwners(ownersList);
        setFilteredOwners(ownersList);

        // Auto-match logic if in emergency mode
        if (autoMatch && ownersList.length > 0) {
          // Find first available verified owner
          const match = ownersList.find((o) => o.availability && o.verified);
          if (match) {
            Alert.alert(
              'Emergency Match Found!',
              `We matched you with ${match.userId.name} who is ${match.distance}km away. Price: Rs.${match.pricePerFt}/ft.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Proceed to Book',
                  onPress: () =>
                    navigation.navigate('Booking', {
                      ownerId: match.userId._id,
                      ownerName: match.userId.name,
                      pricePerFt: match.pricePerFt,
                    }),
                },
              ]
            );
          } else {
            Alert.alert('No Match', 'Sorry, no available operators are nearby right now.');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching owners:', error);
      Alert.alert('Error', 'Failed to fetch nearby machine owners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyOwners();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredOwners(owners);
      return;
    }
    const filtered = owners.filter(
      (owner) =>
        owner.userId?.name?.toLowerCase().includes(text.toLowerCase()) ||
        owner.machineType?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredOwners(filtered);
  };

  const renderOwnerItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('OwnerDetail', {
            ownerId: item.userId._id,
            machineOwnerId: item._id,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.ownerName}>{item.userId?.name || 'Rig Operator'}</Text>
            <Text style={styles.machineType}>⚙ {item.machineType}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {item.rating || '5.0'}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rate per Foot</Text>
            <Text style={styles.detailVal}>Rs. {item.pricePerFt}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Proximity</Text>
            <Text style={styles.detailVal}>{item.distance} km away</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Availability</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.availability ? colors.success : colors.danger },
                ]}
              />
              <Text style={[styles.statusText, { color: item.availability ? colors.success : colors.danger }]}>
                {item.availability ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActionArea}>
          <Text style={styles.actionLinkText}>View Reviews & Book Drilling →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by operator name or rig type..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Searching nearby drilling rigs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOwners}
          keyExtractor={(item) => item._id}
          renderItem={renderOwnerItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Operators Found</Text>
              <Text style={styles.emptySub}>
                Try adjusting search criteria or expand your location range.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBarContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  machineType: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActionArea: {
    alignItems: 'flex-end',
  },
  actionLinkText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});

export default NearbyOwnersScreen;
