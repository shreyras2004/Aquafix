import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState('customer'); // 'customer' or 'owner'
  
  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Owner Specific Fields
  const [machineType, setMachineType] = useState('DTH Borewell Rig');
  const [pricePerFt, setPricePerFt] = useState('');
  const [lat, setLat] = useState('12.9716'); // Default Bangalore Lat
  const [lng, setLng] = useState('77.5946'); // Default Bangalore Lng

  const { register, loading } = useAuth();

  const handleRegister = async () => {
    // Basic verification
    if (!name || !email || !password || !phone) {
      Alert.alert('Error', 'Please fill in all mandatory fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    let payload = {
      name,
      email: email.trim(),
      password,
      phone,
      role,
      address,
    };

    if (role === 'owner') {
      if (!machineType || !pricePerFt || !lat || !lng) {
        Alert.alert('Error', 'Please fill in all machine and location fields');
        return;
      }
      
      const parsedPrice = parseFloat(pricePerFt);
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      if (isNaN(parsedPrice) || isNaN(parsedLat) || isNaN(parsedLng)) {
        Alert.alert('Error', 'Price, Lat, and Lng must be valid numbers');
        return;
      }

      payload = {
        ...payload,
        machineType,
        pricePerFt: parsedPrice,
        lat: parsedLat,
        lng: parsedLng,
      };
    }

    const result = await register(payload);
    
    if (result && !result.success) {
      Alert.alert('Registration Failed', result.message || 'Check connection and credentials');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerArea}>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtext}>Join AquaFix to connect directly with borewell services</Text>
          </View>

          {/* Role Selection Tabs */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleTab, role === 'customer' && styles.activeRoleTab]}
              onPress={() => setRole('customer')}
            >
              <Text style={[styles.roleText, role === 'customer' && styles.activeRoleText]}>
                I am a Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleTab, role === 'owner' && styles.activeRoleTab]}
              onPress={() => setRole('owner')}
            >
              <Text style={[styles.roleText, role === 'owner' && styles.activeRoleText]}>
                Rig Operator
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Vishal Mishra"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="ramesh@gmail.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password (min 6 chars) *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Base Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Whitefield, Bangalore"
                placeholderTextColor={colors.textMuted}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Owner Specific Custom Fields */}
            {role === 'owner' && (
              <View style={styles.ownerSection}>
                <Text style={styles.sectionDivider}>Rig Setup Details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Machine / Rig Type *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. DTH High-Pressure Rig"
                    placeholderTextColor={colors.textMuted}
                    value={machineType}
                    onChangeText={setMachineType}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Drilling Cost (Rs. / ft) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 75"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={pricePerFt}
                    onChangeText={setPricePerFt}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Rig Lat *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Latitude"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={lat}
                      onChangeText={setLat}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Rig Lng *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Longitude"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={lng}
                      onChangeText={setLng}
                    />
                  </View>
                </View>
                <Text style={styles.tipText}>
                  Note: Defaults set to Bangalore center. These coordinates are used to calculate proximity to customer sites.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledBtn]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerLinkArea}>
            <Text style={styles.footerLabel}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerActionText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  subtext: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 6,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeRoleTab: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeRoleText: {
    color: colors.primary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputGroup: {
    marginBottom: 14,
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
  ownerSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  sectionDivider: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 14,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  tipText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
  },
  disabledBtn: {
    backgroundColor: colors.textMuted,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerLinkArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  footerActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default RegisterScreen;
