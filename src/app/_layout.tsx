import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../context/AuthContext';
import { ShopProvider } from '../context/ShopContext';
import Navbar from '../components/Navbar';
import ChatAssistant from '../components/ChatAssistant';

export default function RootLayout() {
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#140e0a' },
  mainContainer: { flex: 1, backgroundColor: '#16161a' },
});