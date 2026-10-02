import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Eye, EyeOff, Fingerprint, Globe, Lock, LogIn, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

WebBrowser.maybeCompleteAuthSession();
const heroImg = require('../../../assets/images/Home.jpg');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const { login } = useAuth();

  // Handle Deep Linking callback for Google OAuth token synchronization
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      let data = Linking.parse(event.url);
      if (data.queryParams) {
        const { token, user: userStr } = data.queryParams;
        if (token && typeof token === 'string') {
          try {
            let userData = userStr ? JSON.parse(decodeURIComponent(userStr as string)) : null;
            if (!userData) {
              // Fallback fetch profile if user object isn't parsed correctly
              api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              const profileRes = await api.get('/auth/profile');
              userData = profileRes.data;
            }

            await login(userData, token);
            Toast.show({ type: 'success', text1: 'Google Login Successful!' });
            router.replace('/' as any);
          } catch (err) {
            console.error('OAuth token parse error:', err);
            Toast.show({ type: 'error', text1: 'Google Authentication Failed' });
          }
        }
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL if app was opened via deep link from cold start
    Linking.getInitialURL().then(async (url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      sub.remove();
    };
  }, []);

  // Check biometric support
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) setIsBiometricSupported(true);
    })();
  }, []);

  const handleLogin = async () => {
    const formattedEmail = email.trim().toLowerCase();
    if (!formattedEmail || !password) {
      Toast.show({ type: 'error', text1: 'Please enter both email and password' });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', { email: formattedEmail, password });
      const { user, token } = response.data;

      await login(user, token);
      Toast.show({ type: 'success', text1: 'Welcome back Athlete!' });
      router.replace('/' as any);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Invalid email or password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Google OAuth WebBrowser flow
  const handleGoogleLogin = async () => {
    try {
      const redirectUri = Linking.createURL('/Auth/login');
      const authUrl = `https://your-backend-api.com/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type === 'success' && result.url) {
        // Deep link listener will catch the URL payload
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      Toast.show({ type: 'error', text1: 'Could not launch Google Login' });
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock GK's Fitness",
        fallbackLabel: "Use Password",
      });

      if (result.success) {
        setIsLoading(true);
        const savedToken = await AsyncStorage.getItem('token');
        const savedUserStr = await AsyncStorage.getItem('user');

        if (savedToken && savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          await login(savedUser, savedToken);
          Toast.show({ type: 'success', text1: 'Biometric Login Successful!' });
          router.replace('/' as any);
        } else {
          Toast.show({ type: 'error', text1: 'No saved session found. Please login via password first.' });
        }
      }
    } catch (error) {
      console.error('Biometric error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground source={heroImg} style={styles.backgroundImage}>
      <LinearGradient colors={['rgba(14, 10, 7, 0.78)', 'rgba(10, 7, 5, 0.92)']} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.brandTitle}>GK's Fitness</Text>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.quote}>"Pain is weakness leaving the body. Log in and get to work."</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Mail color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@gmail.com"
                      placeholderTextColor="rgba(255, 255, 255, 0.25)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity onPress={() => router.push('/Auth/forgot-password' as any)}>
                      <Text style={styles.forgotLink}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Lock color="rgba(255, 255, 255, 0.4)" size={18} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255, 255, 255, 0.25)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff color="rgba(255, 255, 255, 0.4)" size={18} /> : <Eye color="rgba(255, 255, 255, 0.4)" size={18} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={[styles.btnAuth, isLoading && styles.btnDisabled]} onPress={handleLogin} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color={COLORS.surface} size="small" /> : (
                    <>
                      <LogIn color={COLORS.surface} size={18} />
                      <Text style={styles.btnText}>Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Google OAuth Button */}
                <TouchableOpacity style={styles.btnGoogle} onPress={handleGoogleLogin}>
                  <Globe color={COLORS.surface} size={18} />
                  <Text style={styles.btnText}>Continue with Google</Text>
                </TouchableOpacity>

                {isBiometricSupported && (
                  <TouchableOpacity style={styles.btnBiometric} onPress={handleBiometricLogin}>
                    <Fingerprint color={COLORS.surface} size={20} />
                    <Text style={styles.btnBiometricText}>Login with Biometrics</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>New to the gym? </Text>
                <TouchableOpacity onPress={() => router.push('/Auth/register' as any)}>
                  <Text style={styles.footerLink}>Create Athlete Account</Text>
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
  brandTitle: { fontSize: 14, fontWeight: '800', color: COLORS.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.surface, marginBottom: 8 },
  quote: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  form: { gap: SPACING.md },
  inputGroup: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.85)' },
  forgotLink: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', borderRadius: RADIUS.sm, height: 50 },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, color: COLORS.surface, fontSize: 16, paddingHorizontal: 12 },
  eyeBtn: { padding: 16 },
  btnAuth: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: RADIUS.sm, gap: 8, marginTop: 8, ...SHADOWS.glow },
  btnGoogle: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4285F4', paddingVertical: 14, borderRadius: RADIUS.sm, gap: 8 },
  btnBiometric: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 14, borderRadius: RADIUS.sm, gap: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.surface, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  btnBiometricText: { color: COLORS.surface, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: 'rgba(255, 255, 255, 0.55)', fontSize: 14 },
  footerLink: { color: COLORS.accent, fontSize: 14, fontWeight: '700' }
});