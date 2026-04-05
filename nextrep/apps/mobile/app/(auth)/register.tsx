import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { getUserFriendlyErrorMessage } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients } from '../../src/theme';
import { GradientButton } from '../../src/components/ui';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading }       = useAuthStore();

  async function handleRegister() {
    if (!displayName || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Registration failed', getUserFriendlyErrorMessage(err, 'Unable to create account. Please try again.'));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoArea}>
            <LinearGradient
              colors={Gradients.accent}
              style={styles.logoGlow}
            >
              <Text style={styles.logoIcon}>🏋️</Text>
            </LinearGradient>
            <Text style={styles.logo}>Join NextRep</Text>
            <Text style={styles.subtitle}>Your gains start here.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={Colors.textDisabled}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textDisabled}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Min 8 characters"
                  placeholderTextColor={Colors.textDisabled}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={8}
                >
                  <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <GradientButton
              title={isLoading ? 'Creating account…' : 'Create Account'}
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              variant="accent"
              size="lg"
            />
          </View>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>
              Already have an account?{' '}
              <Text style={styles.linkBold}>Log In</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: Colors.bg },
  container:      { flex: 1 },
  inner:          {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.xl,
  },
  logoArea:       { alignItems: 'center', marginBottom: Spacing.xxl },
  logoGlow:       {
    width:           72,
    height:          72,
    borderRadius:    36,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.md,
  },
  logoIcon:       { fontSize: 32 },
  logo:           {
    fontSize:      FontSize.xxxl,
    fontWeight:    FontWeight.black,
    color:         Colors.text,
    letterSpacing: -1,
  },
  subtitle:       { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.sm },
  form:           { gap: Spacing.lg },
  inputGroup:     { gap: Spacing.xs },
  inputLabel:     {
    fontSize:      FontSize.sm,
    color:         Colors.textSecondary,
    fontWeight:    FontWeight.medium,
    letterSpacing: 0.3,
  },
  input:          {
    backgroundColor: Colors.bgCard,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    color:           Colors.text,
    fontSize:        FontSize.md,
  },
  passwordRow:    {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bgCard,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.md,
    paddingLeft:     Spacing.md,
  },
  passwordInput:  {
    flex:            1,
    color:           Colors.text,
    fontSize:        FontSize.md,
    paddingVertical: Spacing.md,
  },
  passwordToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  passwordToggleText: {
    color:      Colors.primary,
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  link:           { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, fontSize: FontSize.sm },
  linkBold:       { color: Colors.primary, fontWeight: FontWeight.semibold },
});
