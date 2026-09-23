import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { HeartCrack } from 'lucide-react-native';
import { useShop } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function WishlistScreen() {
  const { wishlist } = useShop();

  const safeWishlist = wishlist.filter(product => product != null);

  return (
    <View style={styles.container}>
      <FlatList
        style={{ flex: 1 }}
        data={safeWishlist}
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.headerTitle}>My Wishlist</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <HeartCrack size={64} color={COLORS.accent} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
              <Text style={styles.emptyText}>Save your favorite gear here to grab them later!</Text>
              
              <TouchableOpacity 
                style={styles.btnPrimary} 
                onPress={() => router.push('/catalog' as any)}
              >
                <Text style={styles.btnPrimaryText}>Explore Gear</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard product={item} />
        )}
        ListFooterComponent={<Footer />}
        ListFooterComponentStyle={{ flex: 1, justifyContent: 'flex-end', marginHorizontal: -16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16161a',
  },
  listContent: {
    paddingTop: SPACING.md, // 🔥 FIX: Zero bottom padding!
    paddingHorizontal: SPACING.md,
    flexGrow: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.surface,
    marginBottom: SPACING.lg,
    textTransform: 'uppercase',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.surface,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontSize: 16,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.sm,
    ...SHADOWS.glow,
  },
  btnPrimaryText: {
    color: COLORS.surface,
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'uppercase',
  },
});