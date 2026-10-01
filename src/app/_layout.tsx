import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import ChatAssistant from '../components/ChatAssistant';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { ShopProvider } from '../context/ShopContext';

// Removed strict TypeScript return type to allow Expo to infer the version-specific behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export default function RootLayout() {

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('🔥 EXPO PUSH TOKEN:', token);
        // TODO: Once your backend AI finishes the push route, you can send the token here:
        // api.post('/users/push-token', { expoPushToken: token }).catch(console.error);
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ShopProvider>
          <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor="#140e0a" />

            <Navbar />

            <View style={styles.mainContainer}>
              <Slot />
            </View>

            <ChatAssistant />
            <Toast />
          </SafeAreaView>
        </ShopProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Standard Expo Push Notification Generator Function
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E63946',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#140e0a' },
  mainContainer: { flex: 1, backgroundColor: '#16161a' },
});