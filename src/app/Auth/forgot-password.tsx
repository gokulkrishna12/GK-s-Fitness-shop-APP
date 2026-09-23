import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Mail, KeyRound, Lock, ArrowRight, CheckCircle, CheckCircle2, Circle, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const heroImg = require('../../../assets/images/Home.jpg');

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validations = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword)
  };

  const allValid = Object.values(validations).every(Boolean);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSendOtp = async () => {
    const formattedEmail = email.trim().toLowerCase(); // 🔥 THE FIX
    if (!formattedEmail) {
      Toast.show({ type: 'error', text1: 'Please enter your email' });
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/forgot-password', { email: formattedEmail });
      Toast.show({ type: 'success', text1: 'OTP sent to your email!' });
      setStep(2);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const formattedEmail = email.trim().toLowerCase();
    if (!otp.trim() || otp.trim().length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit OTP' });
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/verify-otp', { email: formattedEmail, otp: otp.trim() });
      Toast.show({ type: 'success', text1: 'OTP Verified! Set your new password.' });
      setStep(3);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Invalid or expired OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const formattedEmail = email.trim().toLowerCase();
    if (!newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    if (!allValid) {
      Toast.show({ type: 'error', text1: "Password doesn't meet security rules" });
      return;
    }
    if (!passwordsMatch) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/reset-password', { email: formattedEmail, otp: otp.trim(), newPassword });
      Toast.show({ type: 'success', text1: 'Password Reset Successful! Please login.' });
      router.replace('/Auth/login' as any);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to reset password' });
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean, text: string }) => (
    <View style={styles.validationItem}>
      {isValid ? (
        <CheckCircle2 size={14} color={COLORS.success} />
      ) : (
        <Circle size={14} color="rgba(255, 255, 255, 0.4)" />
      )}
      <Text style={[styles.validationText, isValid && styles.validationTextValid]}>
        {text}
      </Text>
    </View>
  );

  const stepTitles: Record<number, string> = {
    1: 'Reset Password',
    2: 'Verify OTP',
    3: 'Set New Password'
  };

  const stepSubtitles: Record<number, string> = {
    1: "Enter your email and we'll send you a 6-digit code.",
    2: `We sent a code to ${email}`,
    3: "Your OTP is verified. Choose a new password."
  };

  return (
    <ImageBackground source={heroImg} style={styles.backgroundImage}>
      <LinearGradient colors={['rgba(14, 10, 7, 0.78)', 'rgba(10, 7, 5, 0.92)']} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>{stepTitles[step]}</Text>
                <Text style={styles.quote}>{stepSubtitles[step]}</Text>
              </View>

              <View style={styles.form}>
                
                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email Address</Text>
                      <View style={styles.inputWrapper}>
                        <Mail color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="athlete@gmail.com"
                          placeholderTextColor="rgba(255, 255, 255, 0.25)"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <TouchableOpacity style={[styles.btnAuth, isLoading && styles.btnDisabled]} onPress={handleSendOtp} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator color={COLORS.surface} /> : (
                        <>
                          <Text style={styles.btnText}>Send Recovery Code</Text>
                          <ArrowRight color={COLORS.surface} size={18} />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>6-Digit OTP</Text>
                      <View style={styles.inputWrapper}>
                        <KeyRound color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="123456"
                          placeholderTextColor="rgba(255, 255, 255, 0.25)"
                          maxLength={6}
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>

                    <TouchableOpacity style={[styles.btnAuth, (isLoading || otp.length !== 6) && styles.btnDisabled]} onPress={handleVerifyOtp} disabled={isLoading || otp.length !== 6}>
                      {isLoading ? <ActivityIndicator color={COLORS.surface} /> : (
                        <>
                          <Text style={styles.btnText}>Verify OTP</Text>
                          <ShieldCheck color={COLORS.surface} size={18} />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>New Password</Text>
                      <View style={styles.inputWrapper}>
                        <Lock color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter new secure password"
                          placeholderTextColor="rgba(255, 255, 255, 0.25)"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff color="rgba(255, 255, 255, 0.4)" size={18} /> : <Eye color="rgba(255, 255, 255, 0.4)" size={18} />}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Confirm Password</Text>
                      <View style={styles.inputWrapper}>
                        <Lock color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Re-enter your new password"
                          placeholderTextColor="rgba(255, 255, 255, 0.25)"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <EyeOff color="rgba(255, 255, 255, 0.4)" size={18} /> : <Eye color="rgba(255, 255, 255, 0.4)" size={18} />}
                        </TouchableOpacity>
                      </View>
                      {confirmPassword.length > 0 && (
                        <Text style={[styles.matchHint, passwordsMatch ? styles.matchHintValid : styles.matchHintInvalid]}>
                          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </Text>
                      )}
                    </View>

                    <View style={styles.checklist}>
                      <ValidationItem isValid={validations.length} text="8+ characters" />
                      <ValidationItem isValid={validations.upper} text="Uppercase letter" />
                      <ValidationItem isValid={validations.lower} text="Lowercase letter" />
                      <ValidationItem isValid={validations.number} text="Number" />
                      <ValidationItem isValid={validations.special} text="Special symbol" />
                    </View>

                    <TouchableOpacity style={[styles.btnAuth, (isLoading || !allValid || !passwordsMatch) && styles.btnDisabled]} onPress={handleResetPassword} disabled={isLoading || !allValid || !passwordsMatch}>
                      {isLoading ? <ActivityIndicator color={COLORS.surface} /> : (
                        <>
                          <Text style={styles.btnText}>Update Password</Text>
                          <CheckCircle color={COLORS.surface} size={18} />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}

              </View>

              <View style={styles.footer}>
                <TouchableOpacity onPress={() => router.push('/Auth/login' as any)}>
                  <Text style={styles.footerLink}>Back to Login</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%' },
  gradient: { flex: 1, justifyContent: 'center' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  card: {
    backgroundColor: 'rgba(22, 15, 11, 0.88)',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.2)',
  },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.surface, marginBottom: 8, textAlign: 'center', textTransform: 'uppercase' },
  quote: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic', textAlign: 'center', lineHeight: 20, marginBottom: 10 },
  form: { gap: SPACING.lg },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.85)' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', borderRadius: RADIUS.sm, height: 50 },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, color: COLORS.surface, fontSize: 16, paddingHorizontal: 12 },
  eyeBtn: { padding: 16 },
  matchHint: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  matchHintValid: { color: COLORS.success },
  matchHintInvalid: { color: COLORS.danger },
  btnAuth: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: RADIUS.sm, gap: 8, marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.surface, fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  checklist: { backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: 16, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', gap: 6, marginTop: -4, marginBottom: 8 },
  validationItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  validationText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' },
  validationTextValid: { color: COLORS.success },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: 20 },
  footerLink: { color: COLORS.accent, fontSize: 14, fontWeight: '700' }
});