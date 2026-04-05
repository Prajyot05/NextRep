import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getUserFriendlyErrorMessage } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';
import { ScreenWrapper, Card, GradientButton, Badge } from '../../src/components/ui';

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

  function field(key: keyof typeof form, label: string, unit?: string, icon?: string) {
    return (
      <View style={styles.fieldRow}>
        <View style={styles.fieldLabelWrap}>
          {icon && <Text style={styles.fieldIcon}>{icon}</Text>}
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
        <View style={styles.fieldInputWrap}>
          <TextInput
            style={styles.fieldInput}
            placeholder="—"
            placeholderTextColor={Colors.textDisabled}
            keyboardType="decimal-pad"
            value={form[key]}
            onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
          />
          {unit && <Badge label={unit} color={Colors.textMuted} bgColor={Colors.bgMuted} />}
        </View>
      </View>
    );
  }

  return (
    <ScreenWrapper edges={['top', 'bottom']}>
      <Text style={styles.title}>Body Measurement</Text>
      <Text style={styles.date}>📅 {form.date}</Text>

      <Card style={styles.formCard}>
        {field('weightKg',   'Weight',   'kg', '⚖️')}
        {field('bodyFatPct', 'Body Fat', '%',  '📊')}
        {field('waistCm',    'Waist',    'cm', '📏')}
        {field('chestCm',    'Chest',    'cm', '💪')}
        {field('hipsCm',     'Hips',     'cm', '🦵')}
        {field('leftArmCm',  'Left Arm', 'cm', '💪')}
        {field('rightArmCm', 'Right Arm','cm', '💪')}
      </Card>

      <Card style={styles.notesCard}>
        <Text style={styles.notesLabel}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Optional notes…"
          placeholderTextColor={Colors.textDisabled}
          multiline
          value={form.notes}
          onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
        />
      </Card>

      <GradientButton
        title="Save Measurement"
        icon="📏"
        onPress={handleSave}
        loading={isPending}
        disabled={isPending}
        variant="primary"
        size="lg"
        style={{ marginTop: Spacing.lg }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title:         {
    fontSize:      FontSize.xxl,
    fontWeight:    FontWeight.extrabold,
    color:         Colors.text,
    letterSpacing: -0.5,
    paddingTop:    Spacing.sm,
  },
  date:          {
    fontSize:     FontSize.sm,
    color:        Colors.textMuted,
    marginTop:    Spacing.xs,
    marginBottom: Spacing.lg,
  },
  formCard:      { padding: 0, overflow: 'hidden' },
  fieldRow:      {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical:   Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  fieldLabelWrap: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    flex:          1,
  },
  fieldIcon:     { fontSize: 16 },
  fieldLabel:    {
    fontSize:   FontSize.sm,
    color:      Colors.text,
    fontWeight: FontWeight.medium,
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  fieldInput:    {
    backgroundColor: Colors.bgMuted,
    borderRadius:    Radius.sm,
    paddingVertical:   Spacing.sm,
    paddingHorizontal: Spacing.md,
    color:           Colors.text,
    fontSize:        FontSize.sm,
    minWidth:        72,
    textAlign:       'right',
    borderWidth:     1,
    borderColor:     Colors.borderSubtle,
  },
  notesCard:     { marginTop: Spacing.md },
  notesLabel:    {
    fontSize:      FontSize.xs,
    color:         Colors.textMuted,
    marginBottom:  Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notesInput:    {
    backgroundColor: Colors.bgMuted,
    borderRadius:    Radius.sm,
    padding:         Spacing.md,
    color:           Colors.text,
    fontSize:        FontSize.sm,
    minHeight:       80,
    textAlignVertical: 'top',
    borderWidth:     1,
    borderColor:     Colors.borderSubtle,
  },
});
