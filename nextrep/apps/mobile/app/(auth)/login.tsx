import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading }    = useAuthStore();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login failed', err.message ?? 'Invalid credentials');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
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
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.bg },
  inner:          { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
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
