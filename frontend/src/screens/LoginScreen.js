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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const result = await login(email.trim(), password);
    
    if (result && !result.success) {
      Alert.alert('Login Failed', result.message || 'Check email and password');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Password reset instructions have been simulated. In a production system, this sends a secure token to your email.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerArea}>
            <Text style={styles.headerEmoji}>💧</Text>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtext}>Sign in to search borewell rigs or manage bookings</Text>
          </View>

          <View style={styles.formCard}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="enter email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Registration Footer */}
          <View style={styles.footerLinkArea}>
            <Text style={styles.footerLabel}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerActionText}>Sign Up</Text>
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
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  subtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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

export default LoginScreen;
