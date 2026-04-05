import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { getUserFriendlyErrorMessage } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading }    = useAuthStore();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Login failed', getUserFriendlyErrorMessage(err, 'Unable to log in. Please try again.'));
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
          <Text style={styles.logo}>NextRep 💪</Text>
          <Text style={styles.subtitle}>Track every rep. Conquer every goal.</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
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

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Logging in…' : 'Log In'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: Colors.bg },
  container:      { flex: 1, backgroundColor: Colors.bg },
  inner:          { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl },
  logo:           { fontSize: FontSize.hero, fontWeight: FontWeight.black, color: Colors.text, textAlign: 'center' },
  subtitle:       { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xxl },
  form:           { gap: Spacing.md },
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
  button:         {
    backgroundColor: Colors.primary,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  link:           { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, fontSize: FontSize.sm },
  linkBold:       { color: Colors.primary, fontWeight: FontWeight.semibold },
});
