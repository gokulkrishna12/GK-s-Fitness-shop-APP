import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { User, Lock, Mail, Shield, CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import ScreenContainer from '../components/ScreenContainer';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (password && password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'New passwords do not match!' });
      return;
    }

    const updateData: { name: string; password?: string } = { name };
    if (password) {
      updateData.password = password;
    }

    try {
      setLoading(true);
      await api.put('/auth/profile', updateData);

      Toast.show({ type: 'success', text1: 'Profile updated successfully!' });
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const accountType = user?.isAdmin || user?.role === 'admin' ? 'Staff (Admin)' : 'Athlete (Customer)';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScreenContainer>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Update your athlete details and security settings.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <User size={20} color={COLORS.accent} />
              <Text style={styles.cardTitle}>Athlete Details</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Gokul Krishna"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, styles.disabledWrapper]}>
                  <Mail size={16} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={user?.email || ''}
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Type</Text>
                <View style={[styles.inputWrapper, styles.disabledWrapper]}>
                  <Shield size={16} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={accountType}
                    editable={false}
                  />
                </View>
              </View>

              <View style={[styles.cardHeaderRow, styles.securityHeader]}>
                <Lock size={20} color={COLORS.accent} />
                <Text style={styles.cardTitle}>Update Password</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Leave blank to keep current password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
                  </TouchableOpacity>
                </View>
              </View>

              {password.length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Retype your new password"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity style={[styles.submitBtn, loading && styles.btnDisabled]} onPress={handleUpdateProfile} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Save Changes</Text>
                    <CheckCircle size={20} color={COLORS.surface} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16161a' },
  contentWrapper: { padding: SPACING.md },
  header: { alignItems: 'center', marginBottom: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.surface, textTransform: 'uppercase', marginBottom: 6 },
  headerSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.md },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.surface, textTransform: 'uppercase' },
  securityHeader: { marginTop: SPACING.xl, paddingTop: SPACING.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  form: { gap: SPACING.md },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.sm,
    height: 50,
  },
  disabledWrapper: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'transparent' },
  inputIcon: { marginLeft: 16, marginRight: 4 },
  input: { flex: 1, color: COLORS.surface, fontSize: 16, paddingHorizontal: 12 },
  disabledInput: { color: 'rgba(255,255,255,0.4)' },
  eyeBtn: { padding: 16 },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    gap: 10,
    marginTop: SPACING.sm,
    ...SHADOWS.glow,
  },
  btnDisabled: { opacity: 0.7 },
  submitText: { color: COLORS.surface, fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
});