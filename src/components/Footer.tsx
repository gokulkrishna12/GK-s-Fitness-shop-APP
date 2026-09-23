import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { Dumbbell, MapPin, Phone, Mail, Globe } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const QUICK_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/catalog' },
  { label: 'Wishlist', path: '/wishlist' },
  { label: 'Cart', path: '/cart' },
  { label: 'Orders', path: '/orders' },
  { label: 'Profile', path: '/profile' },
];

const CATEGORY_LINKS = [
  'Gym Equipments',
  'Whey Proteins',
  'Creatine',
  'Protein Bars',
  'Pre-workouts',
  'Essential Supplements',
];

export default function Footer() {
  const openWebStore = () => Linking.openURL('https://d3tcsjoldbupsr.cloudfront.net/');
  const callUs = () => Linking.openURL('tel:+919876543210');
  const emailUs = () => Linking.openURL('mailto:support@gksfitness.com');

  const goTo = (path: string) => router.push(path as any);
  const goToCategory = (category: string) =>
    router.push({ pathname: '/catalog' as any, params: { category } });

  return (
    <View style={styles.footer}>
      {/* Brand */}
      <View style={styles.brandRow}>
        <View style={styles.iconWrapper}>
          <Dumbbell size={16} color={COLORS.accent} />
        </View>
        <Text style={styles.brandText} numberOfLines={1}>
          GK'S <Text style={styles.brandAccent}>FITNESS SHOP</Text>
        </Text>
      </View>
      <Text style={styles.tagline} numberOfLines={2}>
        Premium gym gear & supplements to fuel your performance.
      </Text>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.chipWrap}>
          {QUICK_LINKS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.chip} onPress={() => goTo(item.path)} activeOpacity={0.7}>
              <Text style={styles.chipText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.chipWrap}>
          {CATEGORY_LINKS.map((cat) => (
            <TouchableOpacity key={cat} style={styles.chip} onPress={() => goToCategory(cat)} activeOpacity={0.7}>
              <Text style={styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.contactWrap}>
          <View style={styles.contactItem}>
            <MapPin size={12} color={COLORS.accent} />
            <Text style={styles.contactText} numberOfLines={1}>Chennai, TN</Text>
          </View>
          <TouchableOpacity style={styles.contactItem} onPress={callUs} activeOpacity={0.7}>
            <Phone size={12} color={COLORS.accent} />
            <Text style={styles.contactText}>+91 98765 43210</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem} onPress={emailUs} activeOpacity={0.7}>
            <Mail size={12} color={COLORS.accent} />
            <Text style={styles.contactText} numberOfLines={1}>support@gksfitness.com</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom bar - SWAPPED ORDER */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.webLinkBtn} onPress={openWebStore} activeOpacity={0.7}>
          <Globe size={11} color={COLORS.surface} />
          <Text style={styles.webLinkText}>Web Store</Text>
        </TouchableOpacity>
        
        <Text style={styles.copyrightText} numberOfLines={1}>
        @ {new Date().getFullYear()} Developed by GokulKrishna
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#140e0a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 14,
    paddingBottom: 28,
    paddingHorizontal: SPACING.md,
    marginTop: 'auto',
    width: '100%',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  iconWrapper: { padding: 2, justifyContent: 'center', alignItems: 'center' },
  brandText: { color: COLORS.surface, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 18 },
  brandAccent: { color: COLORS.accent },
  tagline: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 10, lineHeight: 14, marginBottom: 8 },
  section: { marginBottom: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  sectionTitle: { color: COLORS.accent, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS.pill },
  chipText: { color: 'rgba(255, 255, 255, 0.55)', fontSize: 10, fontWeight: '600' },
  contactWrap: { gap: 6 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)', marginTop: 8 },
  copyrightText: { color: 'rgba(255, 255, 255, 0.3)', fontSize: 10 },
  webLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.accent, paddingVertical: 5, paddingHorizontal: 10, borderRadius: RADIUS.pill },
  webLinkText: { color: COLORS.surface, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
});