import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const heroImg = require('../../assets/images/Home.jpg');
const gymEquipmentImg = require('../../assets/images/Gym-Equipments.jpg');
const wheyImg = require('../../assets/images/Whey-Protien.jpg');
const creatineImg = require('../../assets/images/Creatine.jpg');
const proteinBarsImg = require('../../assets/images/Protien-bars.jpg');
const preworkoutImg = require('../../assets/images/Preworkout.jpg');
const essentialSuppsImg = require('../../assets/images/Essantial-Supplements.jpg');

const categories = [
  { name: 'Gym Equipments', image: gymEquipmentImg },
  { name: 'Whey Proteins', image: wheyImg },
  { name: 'Creatine', image: creatineImg },
  { name: 'Protein Bars', image: proteinBarsImg },
  { name: 'Pre workouts', image: preworkoutImg },
  { name: 'Essential Supplements', image: essentialSuppsImg },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      AsyncStorage.multiRemove(['shop_cart', 'shop_wishlist']);
    }
  }, [isAuthenticated]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Refresh local session/storage state
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        <ImageBackground source={heroImg} style={styles.hero} resizeMode="cover">
          <LinearGradient
            colors={['rgba(26, 18, 11, 0.55)', 'rgba(13, 9, 7, 0.85)']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Everything You Need, All in One Place.</Text>
              <Text style={styles.heroSubtitle}>
                Discover our curated collection of premium gym gear and supplements. Shop the best quality to fuel your performance.
              </Text>

              <TouchableOpacity
                style={styles.btnCta}
                activeOpacity={0.8}
                onPress={() => router.push('/catalog' as any)}
              >
                <Text style={styles.btnCtaText}>START SHOPPING</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <Text style={styles.sectionSubtitle}>Browse our premium collection</Text>

          <View style={styles.categoryGrid}>
            {categories.map((cat, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.categoryCard}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/catalog' as any, params: { category: cat.name } })}
              >
                <View style={styles.circle}>
                  <Image source={cat.image} style={styles.categoryImage} />
                </View>
                <Text style={[styles.categoryName, { textAlign: 'center' }]} numberOfLines={2}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { height: 500, width: '100%' },
  heroGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  heroContent: { alignItems: 'center', maxWidth: 600 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: COLORS.surface, textAlign: 'center', marginBottom: SPACING.md, lineHeight: 38 },
  heroSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.85)', textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 24 },
  btnCta: { backgroundColor: COLORS.accent, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.pill, ...SHADOWS.glow },
  btnCtaText: { color: COLORS.surface, fontWeight: '800', fontSize: 16, letterSpacing: 1.5 },
  categoriesSection: { paddingVertical: SPACING.xxl, backgroundColor: COLORS.surface, alignItems: 'center' },
  sectionTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.xs },
  sectionSubtitle: { fontSize: 16, color: COLORS.textMuted, marginBottom: SPACING.xl },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: SPACING.md, gap: SPACING.md },
  categoryCard: { width: (width - (SPACING.md * 4)) / 2, alignItems: 'center', marginBottom: SPACING.md },
  circle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.surfaceAlt, borderWidth: 3, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: SPACING.sm, ...SHADOWS.md },
  categoryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryName: { fontWeight: '700', color: COLORS.primary, fontSize: 14 },
});