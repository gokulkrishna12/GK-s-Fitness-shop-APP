import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Footer from './Footer';

interface ScreenContainerProps {
  children: React.ReactNode;
}

export default function ScreenContainer({ children }: ScreenContainerProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.content}>
        {children}
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16161a',
  },
  scrollContent: {
    flexGrow: 1, // 🔥 FIX: Removed paddingBottom: 90
  },
  content: {
    flex: 1,
  },
});