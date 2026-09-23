import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, User, UserPlus, CheckCircle2, Circle, KeyRound, Clock, Send, Eye, EyeOff } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const heroImg = require('../../../assets/images/Home.jpg');

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      Toast.show({ type: 'error', text1: 'OTP expired. Please request a new one.' });
      setTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const validations = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const allValid = Object.values(validations).every(Boolean);

  const handleSendOtp = async () => {
    const formattedEmail = email.trim().toLowerCase(); // 🔥 THE FIX
    if (!name.trim() || !formattedEmail) {
      Toast.show({ type: 'error', text1: 'Please enter your full name and email' });
      return;
    }
    try {
      setIsLoading(true);
      await api.post('/auth/send-otp', { email: formattedEmail }); 
      Toast.show({ type: 'success', text1: `6-digit OTP sent to ${formattedEmail}` });
      setTimeLeft(300);
      setTimerActive(true);
      setStep(2);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to send OTP.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const formattedEmail = email.trim().toLowerCase();
    if (!otp.trim() || otp.trim().length < 4) {
      Toast.show({ type: 'error', text1: 'Please enter a valid OTP' });
      return;
    }
    try {
      setIsLoading(true);
      await api.post('/auth/verify-otp', { email: formattedEmail, otp: otp.trim() });
      setTimerActive(false);
      setStep(3);
      Toast.show({ type: 'success', text1: 'Email verified! Set your password.' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Invalid or expired OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const formattedEmail = email.trim().toLowerCase();
    if (!allValid) {
      Toast.show({ type: 'error', text1: 'Please ensure your password meets all rules' });
      return;
    }
    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', { name: name.trim(), email: formattedEmail, password, role: 'customer' });
      const { user, token } = response.data;
      await login(user, token);
      Toast.show({ type: 'success', text1: 'Welcome Athlete!' });
      router.replace('/' as any);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean, text: string }) => (
    <View style={styles.validationItem}>
      {isValid ? <CheckCircle2 size={14} color={COLORS.success} /> : <Circle size={14} color="rgba(255, 255, 255, 0.4)" />}
      <Text style={[styles.validationText, isValid && styles.validationTextValid]}>{text}</Text>
    </View>
  );

  return (
    <ImageBackground source={heroImg} style={styles.backgroundImage}>
      <LinearGradient colors={['rgba(14, 10, 7, 0.78)', 'rgba(10, 7, 5, 0.92)']} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.brandTitle}>GK's Fitness</Text>
                <Text style={styles.title}>Welcome Athlete</Text>
                <Text style={styles.quote}>"Your body can stand almost anything. It’s your mind that you have to convince."</Text>
              </View>

              <View style={styles.form}>
                {step === 1 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Full Name</Text>
                      <View style={styles.inputWrapper}>
                        <User color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Gokul Krishna" placeholderTextColor="rgba(255, 255, 255, 0.25)" value={name} onChangeText={setName} />
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email Address</Text>
                      <View style={styles.inputWrapper}>
                        <Mail color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="you@gmail.com" placeholderTextColor="rgba(255, 255, 255, 0.25)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                      </View>
                    </View>
                    <TouchableOpacity style={[styles.btnAuth, isLoading && styles.btnDisabled]} onPress={handleSendOtp} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator color={COLORS.surface} /> : (
                        <><Send color={COLORS.surface} size={18} /><Text style={styles.btnText}>Send OTP</Text></>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {step === 2 && (
                  <>
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>Enter 6-Digit OTP</Text>
                        <View style={styles.timerBadge}>
                          <Clock size={12} color={COLORS.accent} />
                          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                        </View>
                      </View>
                      <View style={styles.inputWrapper}>
                        <KeyRound color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Enter OTP" placeholderTextColor="rgba(255, 255, 255, 0.25)" maxLength={6} value={otp} onChangeText={setOtp} keyboardType="number-pad" />
                      </View>
                    </View>
                    <TouchableOpacity style={[styles.btnVerify, isLoading && styles.btnDisabled]} onPress={handleVerifyOtp} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator color={COLORS.surface} /> : (
                        <><CheckCircle2 color={COLORS.surface} size={18} /><Text style={styles.btnText}>Verify OTP</Text></>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnResend} onPress={handleSendOtp} disabled={timeLeft > 240 || isLoading}>
                      <Text style={[styles.btnText, { color: COLORS.surface }]}>Resend OTP</Text>
                    </TouchableOpacity>
                  </>
                )}

                {step === 3 && (
                  <>
                    <View style={styles.verifiedBadge}>
                      <CheckCircle2 color={COLORS.success} size={16} />
                      <Text style={styles.verifiedText}>Email Verified ({email.trim().toLowerCase()})</Text>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Set Secure Password</Text>
                      <View style={styles.inputWrapper}>
                        <Lock color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="rgba(255, 255, 255, 0.25)" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff color="rgba(255, 255, 255, 0.4)" size={18} /> : <Eye color="rgba(255, 255, 255, 0.4)" size={18} />}
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.checklist}>
                      <ValidationItem isValid={validations.length} text="8+ characters" />
                      <ValidationItem isValid={validations.upper} text="Uppercase letter" />
                      <ValidationItem isValid={validations.lower} text="Lowercase letter" />
                      <ValidationItem isValid={validations.number} text="Number" />
                      <ValidationItem isValid={validations.special} text="Special symbol" />
                    </View>
                    <TouchableOpacity style={[styles.btnAuth, (!allValid || isLoading) && styles.btnDisabled]} onPress={handleRegister} disabled={!allValid || isLoading}>
                      {isLoading ? <ActivityIndicator color={COLORS.surface} /> : (
                        <><UserPlus color={COLORS.surface} size={18} /><Text style={styles.btnText}>Complete Registration</Text></>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/Auth/login' as any)}>
                  <Text style={styles.footerLink}>Log in here</Text>
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
  card: { backgroundColor: 'rgba(22, 15, 11, 0.88)', borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: 'rgba(230, 57, 70, 0.2)' },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  brandTitle: { fontSize: 14, fontWeight: '800', color: COLORS.accent, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.surface, marginBottom: 8 },
  quote: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  form: { gap: SPACING.lg },
  inputGroup: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.85)' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(230, 57, 70, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  timerText: { color: COLORS.accent, fontSize: 12, fontWeight: '700' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', borderRadius: RADIUS.sm, height: 50 },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, color: COLORS.surface, fontSize: 16, paddingHorizontal: 12 },
  eyeBtn: { padding: 16 },
  btnAuth: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: RADIUS.sm, gap: 8, marginTop: 8 },
  btnVerify: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.success, paddingVertical: 14, borderRadius: RADIUS.sm, gap: 8, marginTop: 8 },
  btnResend: { paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: RADIUS.sm, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.surface, fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(74, 222, 128, 0.1)', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)', borderRadius: RADIUS.sm, marginBottom: 8 },
  verifiedText: { color: COLORS.success, fontSize: 14, fontWeight: '600' },
  checklist: { backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: 16, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', gap: 6 },
  validationItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  validationText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' },
  validationTextValid: { color: COLORS.success },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: 'rgba(255, 255, 255, 0.55)', fontSize: 14 },
  footerLink: { color: COLORS.accent, fontSize: 14, fontWeight: '700' }
});