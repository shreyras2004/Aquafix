import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo / Branding Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Text style={styles.logoEmoji}>💧</Text>
          </View>
          <Text style={styles.title}>AquaFix</Text>
          <Text style={styles.tagline}>Direct Borewell Drilling Connections</Text>
        </View>

        {/* Informational Widget */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Why AquaFix?</Text>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>✓</Text>
            <Text style={styles.bulletText}>Connect directly with machine owners</Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>✓</Text>
            <Text style={styles.bulletText}>No middleman, broker, or hidden commissions</Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>✓</Text>
            <Text style={styles.bulletText}>Verified rig operators & transparent pricing</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Credits Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Developed by Shrey Gupta</Text>
          <Text style={styles.footerSubText}>Built during internship at Talking Crooks IT Pvt. Ltd.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoBackground: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: colors.textLight,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: width - 48,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bullet: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 14,
    color: colors.textLight,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  footerSubText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
