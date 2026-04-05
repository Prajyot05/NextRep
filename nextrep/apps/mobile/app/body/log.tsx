import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getUserFriendlyErrorMessage } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function BodyLogScreen() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    date:         new Date().toISOString().split('T')[0],
    weightKg:     '',
    bodyFatPct:   '',
    waistCm:      '',
    chestCm:      '',
    hipsCm:       '',
    leftArmCm:    '',
    rightArmCm:   '',
    notes:        '',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (body: any) => api.body.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body'] });
      Alert.alert('Saved!', 'Body measurement recorded.');
      router.back();
    },
    onError: (err: unknown) => Alert.alert('Error', getUserFriendlyErrorMessage(err)),
  });

  function handleSave() {
    const payload: any = { date: form.date };
    if (form.weightKg)     payload.weightKg     = parseFloat(form.weightKg);
    if (form.bodyFatPct)   payload.bodyFatPct   = parseFloat(form.bodyFatPct);
    if (form.waistCm)      payload.waistCm      = parseFloat(form.waistCm);
    if (form.chestCm)      payload.chestCm      = parseFloat(form.chestCm);
    if (form.hipsCm)       payload.hipsCm       = parseFloat(form.hipsCm);
    if (form.leftArmCm)    payload.leftArmCm    = parseFloat(form.leftArmCm);
    if (form.rightArmCm)   payload.rightArmCm   = parseFloat(form.rightArmCm);
    if (form.notes)        payload.notes        = form.notes;
    mutate(payload);
  }

  function field(key: keyof typeof form, label: string, unit?: string) {
    return (
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldInputWrap}>
          <TextInput
            style={styles.fieldInput}
            placeholder="—"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={form[key]}
            onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
          />
          {unit && <Text style={styles.fieldUnit}>{unit}</Text>}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Log Body Measurement</Text>
      <Text style={styles.date}>{form.date}</Text>

      {field('weightKg',     'Weight',       'kg')}
      {field('bodyFatPct',   'Body Fat',     '%')}
      {field('waistCm',      'Waist',        'cm')}
      {field('chestCm',      'Chest',        'cm')}
      {field('hipsCm',       'Hips',         'cm')}
      {field('leftArmCm',    'Left Arm',    'cm')}
      {field('rightArmCm',   'Right Arm',   'cm')}

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          style={[styles.fieldInput, styles.notesInput]}
          placeholder="Optional notes…"
          placeholderTextColor={Colors.textMuted}
          multiline
          value={form.notes}
          onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, isPending && { opacity: 0.6 }]} onPress={handleSave} disabled={isPending}>
        {isPending ? <ActivityIndicator color={Colors.text} /> : <Text style={styles.saveBtnText}>Save Measurement</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.bg },
  content:        { padding: Spacing.lg, paddingBottom: 100 },
  title:          { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.xs },
  date:           { fontSize: FontSize.sm,  color: Colors.textMuted, marginBottom: Spacing.xl },
  fieldRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel:     { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  fieldInputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  fieldInput:     { backgroundColor: Colors.bgCard, borderRadius: Radius.sm, padding: Spacing.sm, color: Colors.text, fontSize: FontSize.sm, minWidth: 80, textAlign: 'right' },
  fieldUnit:      { color: Colors.textMuted, fontSize: FontSize.xs, width: 24 },
  notesInput:     { minHeight: 80, textAlignVertical: 'top' },
  saveBtn:        { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.xl },
  saveBtnText:    { color: Colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
