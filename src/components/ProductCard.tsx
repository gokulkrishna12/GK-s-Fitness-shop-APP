import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ShoppingCart, Heart, Zap, Eye, Star } from 'lucide-react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useShop, Product } from '../context/ShopContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const { isAuthenticated } = useAuth();

  if (!product) return null;

  const pid = product?._id || product?.id || '';
  const isWishlisted = isInWishlist ? isInWishlist(pid as string) : false;

  const mainImage = (Array.isArray(product?.images) && product.images.length > 0 && product.images[0]) || product?.image || 'https://via.placeholder.com/300x300?text=No+Image';
  const stockCount = Number(product?.stock ?? product?.countInStock ?? 0);
  const isOutOfStock = stockCount <= 0;

  let displayReviews = product?.numReviews || 0;
  let displayRating = Number(product?.rating || 0);

  if (product?.reviews && product.reviews.length > 0) {
    displayReviews = product.reviews.length;
    displayRating = product.reviews.reduce((acc: number, item: any) => acc + Number(item.rating || 0), 0) / displayReviews;
  }

  const handleCardClick = () => {
    if (pid) {
      router.push(`/product/${pid}`);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      Toast.show({ type: 'error', text1: 'Please login to access this feature!' });
      router.push('/Auth/login' as any);
      return;
    }
    if (toggleWishlist) toggleWishlist(product);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      Toast.show({ type: 'error', text1: 'Please login to access this feature!' });
      router.push('/Auth/login' as any);
      return;
    }
    if (addToCart) addToCart(product);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      Toast.show({ type: 'error', text1: 'Please login to access this feature!' });
      router.push('/Auth/login' as any);
      return;
    }
    if (pid) {
      router.push({
        pathname: '/checkout' as any,
        params: { directItem: JSON.stringify({ product, qty: 1 }) }
      });
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleCardClick} style={{ flex: 1 }}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: mainImage }} style={styles.image} />
          {product?.category ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{product.category}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{product?.category || 'Gear'}</Text>
          <Text style={styles.title} numberOfLines={2}>{product?.name || 'Unnamed Product'}</Text>
          <View style={styles.ratingRow}>
            <Star size={14} color={COLORS.warning} fill={displayRating > 0 ? COLORS.warning : 'transparent'} />
            <Text style={styles.ratingText}>{Number(displayRating).toFixed(1)} ({displayReviews} reviews)</Text>
          </View>
          <Text style={[styles.stock, isOutOfStock ? styles.outOfStock : styles.inStock]}>
            {isOutOfStock ? 'Out of Stock' : `In Stock (${stockCount})`}
          </Text>
          <Text style={styles.price}>₹{product?.price || 0}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.wishlistBtn} onPress={handleWishlist} activeOpacity={0.7}>
          <Heart size={14} color={isWishlisted ? COLORS.accent : COLORS.surface} fill={isWishlisted ? COLORS.accent : 'transparent'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnAdd, isOutOfStock && styles.btnDisabled]} onPress={handleAddToCart} disabled={isOutOfStock}>
          <ShoppingCart size={14} color={COLORS.surface} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.btn, styles.btnView]} onPress={handleCardClick}>
          <Eye size={11} color={COLORS.surface} />
          <Text style={styles.btnText} numberOfLines={1} adjustsFontSizeToFit>VIEW</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnBuy, isOutOfStock && styles.btnDisabled]} onPress={handleBuyNow} disabled={isOutOfStock}>
          <Zap size={11} color={COLORS.surface} />
          <Text style={styles.btnText} numberOfLines={1} adjustsFontSizeToFit>ORDER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', backgroundColor: '#140e0a', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden', marginBottom: SPACING.md, ...SHADOWS.md },
  imageWrapper: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  image: { width: '80%', height: '80%', resizeMode: 'contain' },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(230, 57, 70, 0.85)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS.sm },
  badgeText: { color: COLORS.surface, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  content: { padding: SPACING.sm, flex: 1 },
  category: { fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '800', color: COLORS.surface, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  ratingText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' },
  stock: { fontSize: 11, fontWeight: '600', marginBottom: 12 },
  inStock: { color: COLORS.success },
  outOfStock: { color: COLORS.danger },
  price: { fontSize: 18, fontWeight: '900', color: COLORS.surface, marginBottom: 12 },
  
  actionGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: 10, paddingHorizontal: 6, paddingBottom: 10, gap: 4 },
  wishlistBtn: { width: 28, height: 28, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center' },
  btn: { height: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.sm, gap: 2, paddingHorizontal: 4 },
  btnAdd: { width: 28, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  btnView: { flex: 1, backgroundColor: COLORS.primary, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  btnBuy: { flex: 1, backgroundColor: COLORS.accent },
  btnText: { color: COLORS.surface, fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  btnDisabled: { opacity: 0.5 }
});