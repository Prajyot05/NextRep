import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
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
    } catch (err: any) {
      Alert.alert('Registration failed', err.message ?? 'Something went wrong');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Join NextRep 💪</Text>
        <Text style={styles.subtitle}>Your gains start here.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            placeholderTextColor={Colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />
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
            placeholder="Password (min 8 chars)"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.bg },
  inner:          { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  logo:           { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.text, textAlign: 'center' },
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
