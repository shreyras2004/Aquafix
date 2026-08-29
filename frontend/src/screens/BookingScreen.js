import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api, { BASE_URL } from '../config/api';
import { colors } from '../theme/colors';

// Embed Leaflet HTML loading OpenStreetMap tiles with a locked crosshair pin
const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; }
    html, body, #map { height: 100%; width: 100vw; }
    .center-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 38px;
      height: 38px;
      margin-top: -38px;
      margin-left: -19px;
      z-index: 1000;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="map" style="height:100vh;"></div>
  <div class="center-marker">
    <svg viewBox="0 0 24 24" width="38" height="38" fill="#ef4444">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  </div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([12.9716, 77.5946], 13);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    function sendCoords() {
      var center = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        lat: center.lat,
        lng: center.lng
      }));
    }

    map.on('moveend', sendCoords);
    sendCoords();
  </script>
</body>
</html>
`;

const BookingScreen = ({ route, navigation }) => {
  const { ownerId, ownerName, pricePerFt } = route.params;

  const [location, setLocation] = useState('');
  const [borewellDetails, setBorewellDetails] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [siteImage, setSiteImage] = useState(null);
  const [siteImageUrl, setSiteImageUrl] = useState('');
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Map Selection States
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCoords, setMapCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  // Catch coordinate messages from WebView
  const handleMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.lat && data.lng) {
        setMapCoords({ lat: data.lat, lng: data.lng });
      }
    } catch (err) {
      console.error('Error parsing map coordinates:', err);
    }
  };

    // Convert coords to street address using free OpenStreetMap Nominatim API
    const confirmMapLocation = async () => {
      setMapVisible(false);
      setResolvingAddress(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapCoords.lat}&lon=${mapCoords.lng}`,
          {
            headers: {
              'User-Agent': 'AquaFixBorewellApp/1.0',
            },
          }
        );
        const data = await response.json();
        if (data && data.display_name) {
          setLocation(data.display_name);
        } else {
          setLocation(`${mapCoords.lat.toFixed(6)}, ${mapCoords.lng.toFixed(6)}`);
        }
      } catch (error) {
        console.error('Reverse geocode error:', error);
        setLocation(`${mapCoords.lat.toFixed(6)}, ${mapCoords.lng.toFixed(6)}`);
      } finally {
        setResolvingAddress(false);
      }
    };

    // Fetch device GPS coordinates and reverse-geocode to address
    const handleUseCurrentLocation = async () => {
      setResolvingAddress(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location access is required to resolve your current site address.');
          setResolvingAddress(false);
          return;
        }

        let locationData = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        const { latitude, longitude } = locationData.coords;

        // Sync coordinates so map opens at current location
        setMapCoords({ lat: latitude, lng: longitude });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'User-Agent': 'AquaFixBorewellApp/1.0',
            },
          }
        );
        const data = await response.json();
        if (data && data.display_name) {
          setLocation(data.display_name);
        } else {
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      } catch (error) {
        console.error('Error getting current location:', error);
        Alert.alert('Error', 'Failed to retrieve current location. Verify device location is switched on.');
      } finally {
        setResolvingAddress(false);
      }
    };

  // Pick image helper
  const handlePickImage = async () => {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      setSiteImage(selectedImage.uri);
      await uploadImage(selectedImage);
    }
  };

  // Upload image to backend
  const uploadImage = async (imageAsset) => {
    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      // Format file details for upload on React Native
      const uriParts = imageAsset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const filename = imageAsset.uri.split('/').pop();

      formData.append('siteImage', {
        uri: Platform.OS === 'ios' ? imageAsset.uri.replace('file://', '') : imageAsset.uri,
        name: filename || `photo-${Date.now()}.${fileType}`,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      });

      const res = await api.post('/bookings/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setSiteImageUrl(res.data.url);
        Alert.alert('Success', 'Site image uploaded successfully!');
      }
    } catch (error) {
      console.error('Image upload failed:', error.response?.data || error.message);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Booking Form
  const handleSubmitBooking = async () => {
    if (!location || !borewellDetails || !preferredDate) {
      Alert.alert('Error', 'Please fill in all details');
      return;
    }

    try {
      const finalLocation = `${location}${manualAddress ? ' | Details: ' + manualAddress : ''}`;
      const payload = {
        ownerId,
        location: finalLocation,
        borewellDetails,
        preferredDate: new Date(preferredDate).toISOString(),
        siteImageUrl,
      };

      const res = await api.post('/bookings', payload);

      if (res.data.success) {
        Alert.alert('Booking Placed!', 'Your drilling request has been sent to the owner.', [
          {
            text: 'Track Order',
            onPress: () =>
              navigation.navigate('BookingStatus', { bookingId: res.data.data._id }),
          },
        ]);
      }
    } catch (error) {
      console.error('Booking creation error:', error.response?.data || error.message);
      Alert.alert(
        'Booking Failed',
        error.response?.data?.message || 'Something went wrong. Verify date format (YYYY-MM-DD).'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Operator Banner */}
          <View style={styles.bannerCard}>
            <Text style={styles.bannerLabel}>Booking Request for</Text>
            <Text style={styles.bannerName}>{ownerName}</Text>
            <Text style={styles.bannerRate}>Drilling Rate: Rs. {pricePerFt} / ft</Text>
          </View>

          {/* Booking Inputs */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Drilling Site Location / Address *</Text>
                {resolvingAddress && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />
                )}
              </View>
              <View style={styles.locationInputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1, height: 60, textAlignVertical: 'top', paddingRight: 75 }]}
                  placeholder="Enter exact address or landmark details..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                  value={location}
                  onChangeText={setLocation}
                />
                <TouchableOpacity
                  style={styles.mapPinButton}
                  onPress={() => setMapVisible(true)}
                >
                  <Text style={styles.mapPinEmoji}>📍</Text>
                  <Text style={styles.mapPinBtnText}>Map</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.currentLocBtn}
                onPress={handleUseCurrentLocation}
                disabled={resolvingAddress}
              >
                <Text style={styles.currentLocBtnText}>🎯 Use My Current Location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>House/Flat No., Building Name & Landmarks (Manual)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Flat 302, Phase 2, Near Hanuman Temple"
                placeholderTextColor={colors.textMuted}
                value={manualAddress}
                onChangeText={setManualAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Borewell Specifications *</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Diameter (e.g. 6.5 inches), Expected depth (e.g. 300 ft), Terrain (clay, boulder, rock)..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={borewellDetails}
                onChangeText={setBorewellDetails}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preferred Drilling Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2026-09-05"
                placeholderTextColor={colors.textMuted}
                value={preferredDate}
                onChangeText={setPreferredDate}
              />
            </View>

            {/* Site Image Attachment */}
            <View style={styles.imageSection}>
              <Text style={styles.label}>Site Image Attachment</Text>
              
              {siteImage ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: siteImage }} style={styles.imagePreview} />
                  {uploadingImage && (
                    <View style={styles.uploadOverlay}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.uploadOverlayText}>Uploading...</Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={styles.imageSelector} onPress={handlePickImage}>
                  <Text style={styles.imageSelectorText}>📷 Select Site Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledBtn]}
              onPress={handleSubmitBooking}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Booking Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Map Location Picker Modal */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        onRequestClose={() => setMapVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <View style={styles.mapModalHeader}>
            <View>
              <Text style={styles.mapModalTitle}>Select Drilling Site</Text>
              <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
                Drag map to align the red pin with your site
              </Text>
            </View>
            <TouchableOpacity
              style={styles.mapModalCloseBtn}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.mapModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapViewWrapper}>
            <WebView
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              onMessage={handleMapMessage}
              style={{ flex: 1 }}
            />
          </View>

          <TouchableOpacity style={styles.mapConfirmBtn} onPress={confirmMapLocation}>
            <Text style={styles.mapConfirmBtnText}>Confirm Location Coordinates</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bannerCard: {
    backgroundColor: colors.primaryBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 16,
  },
  bannerLabel: {
    fontSize: 12,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  bannerName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
  },
  bannerRate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
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
  imageSection: {
    marginBottom: 20,
  },
  imageSelector: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
  },
  imageSelectorText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  imageWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  disabledBtn: {
    backgroundColor: colors.textMuted,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Custom Location Map Styles
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationInputWrapper: {
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
  },
  mapPinButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    bottom: 8,
    backgroundColor: colors.primaryBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  mapPinEmoji: {
    fontSize: 16,
  },
  mapPinBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  // Map Modal Layout
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  mapModalCloseBtn: {
    padding: 6,
  },
  mapModalCloseText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '700',
  },
  mapViewWrapper: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  mapConfirmBtn: {
    backgroundColor: colors.success,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapConfirmBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  currentLocBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  currentLocBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default BookingScreen;
