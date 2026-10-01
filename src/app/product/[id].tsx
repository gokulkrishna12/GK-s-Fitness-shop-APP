import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, ChevronLeft, ChevronRight, Share2, ShoppingCart, Star, Trash2, X, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ProductCard from '../../components/ProductCard';
import ScreenContainer from '../../components/ScreenContainer';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { Product, useShop } from '../../context/ShopContext';
import api from '../../services/api';

const { width } = Dimensions.get('window');

interface Review {
  _id: string;
  user: string;
  name: string;
  rating: number;
  comment: string;
  image?: string;
  createdAt?: string;
}

interface DetailedProduct extends Product {
  description?: string;
  reviews?: Review[];
  numReviews?: number;
  rating?: number;
  stock?: number;
  countInStock?: number;
  images?: string[];
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { addToCart } = useShop();
  const { isAuthenticated, user, isAdmin } = useAuth();

  const [product, setProduct] = useState<DetailedProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);

        const allProdsRes = await api.get('/products');
        const allProds = allProdsRes.data.products || allProdsRes.data || [];

        let related = allProds.filter((p: Product) => (p.category === res.data.category) && (p._id || p.id) !== id).slice(0, 4);
        if (related.length === 0) {
          related = allProds.filter((p: Product) => (p._id || p.id) !== id).slice(0, 4);
        }
        setRelatedProducts(related);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Failed to load product details' });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
      setActiveImageIndex(0);
      setRating(0);
      setComment('');
    }
  }, [id]);

  const handleShare = async () => {
    if (!product) return;
    try {
      const deepLinkUrl = `myapp://product/${id}`;
      await Share.share({
        message: `Check out ${product.name} at GK's Fit Shop! 🚀 Grab it here: ${deepLinkUrl}`,
        url: deepLinkUrl,
        title: product.name
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddToCartClick = () => {
    if (!isAuthenticated) {
      Toast.show({ type: 'error', text1: 'Please login to access this feature!' });
      router.push('/Auth/login' as any);
      return;
    }
    if (product) addToCart(product);
  };

  const handleBuyNowClick = () => {
    if (!isAuthenticated) {
      Toast.show({ type: 'error', text1: 'Please login to access this feature!' });
      router.push('/Auth/login' as any);
      return;
    }
    if (product) {
      router.push({
        pathname: '/checkout' as any,
        params: { directItem: JSON.stringify({ product, qty: 1 }) }
      });
    }
  };

  const handleReviewSubmit = async () => {
    if (!isAuthenticated) {
      Toast.show({ type: 'error', text1: 'Please login to access this feature!' });
      router.push('/Auth/login' as any);
      return;
    }
    if (rating === 0) {
      Toast.show({ type: 'error', text1: 'Please select a star rating!' });
      return;
    }

    const formData = new FormData() as any;
    formData.append('rating', rating.toString());
    formData.append('comment', comment);

    setSubmittingReview(true);
    try {
      await api.post(`/products/${id}/reviews`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Toast.show({ type: 'success', text1: 'Review submitted successfully!' });
      setComment('');
      setRating(0);

      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to submit review' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      await api.delete(`/products/${id}/reviews/${reviewToDelete}`);
      Toast.show({ type: 'success', text1: 'Review removed successfully.' });

      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to delete review' });
    } finally {
      setReviewToDelete(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading Product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Product not found</Text>
      </View>
    );
  }

  const images = product.images?.length ? product.images : [product.image || 'https://via.placeholder.com/800x800?text=No+Image'];
  const stockCount = Number(product?.stock ?? product?.countInStock ?? 0);
  const isOutOfStock = stockCount <= 0;

  const liveNumReviews = product.reviews?.length || 0;
  const liveRating = liveNumReviews > 0
    ? product.reviews!.reduce((acc, item) => item.rating + acc, 0) / liveNumReviews
    : 0;

  return (
    <ScreenContainer>

      <Modal visible={reviewToDelete !== null} transparent={true} animationType="fade" onRequestClose={() => setReviewToDelete(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.customModal}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setReviewToDelete(null)}>
              <X size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            <AlertTriangle size={40} color={COLORS.accent} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Remove Review?</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this review? This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setReviewToDelete(null)}>
                <Text style={styles.btnCancelText}>Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmDelete} onPress={confirmDeleteReview}>
                <Text style={styles.btnConfirmText}>Yes, Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isModalOpen} transparent={true} animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.fullscreenModal} onTouchEnd={() => setIsModalOpen(false)}>
          <TouchableOpacity style={styles.fsClose} onPress={() => setIsModalOpen(false)}>
            <X size={28} color="#fff" />
          </TouchableOpacity>
          {images.length > 1 && (
            <TouchableOpacity style={styles.fsPrev} onPress={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length); }}>
              <ChevronLeft size={36} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.fsImageWrapper}>
            <Image source={{ uri: images[activeImageIndex] }} style={styles.fsImage} resizeMode="contain" />
          </View>
          {images.length > 1 && (
            <TouchableOpacity style={styles.fsNext} onPress={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev + 1) % images.length); }}>
              <ChevronRight size={36} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      <View style={styles.pageContent}>
        <View style={styles.grid}>

          <View style={styles.gallery}>
            <TouchableOpacity style={styles.mainImageContainer} activeOpacity={0.9} onPress={() => setIsModalOpen(true)}>
              <Image source={{ uri: images[activeImageIndex] }} style={styles.mainImage} resizeMode="cover" />
              <Text style={styles.expandHint}>Click to Enlarge</Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnails}>
              {images.map((img, idx) => (
                <TouchableOpacity key={idx} style={[styles.thumbBtn, activeImageIndex === idx && styles.thumbActive]} onPress={() => setActiveImageIndex(idx)}>
                  <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.infoSection}>
            {product.category && (
              <View style={styles.badgeCategory}>
                <Text style={styles.badgeCategoryText}>{product.category}</Text>
              </View>
            )}

            <View style={styles.titleRow}>
              <Text style={styles.productTitle}>{product.name}</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Share2 size={24} color={COLORS.surface} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingRow}>
              <Star size={16} color={COLORS.warning} fill={COLORS.warning} />
              <Text style={styles.ratingText}>{liveRating.toFixed(1)} ({liveNumReviews} reviews)</Text>
            </View>

            <Text style={styles.priceTag}>₹{product.price}</Text>

            <Text style={[styles.stockStatus, isOutOfStock ? styles.outStock : styles.inStock]}>
              {isOutOfStock ? 'Out of Stock' : `In Stock (${stockCount} units available)`}
            </Text>

            <Text style={styles.description}>{product.description}</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.btnCart, isOutOfStock && styles.disabled]} onPress={handleAddToCartClick} disabled={isOutOfStock}>
                <ShoppingCart size={18} color={COLORS.surface} />
                <Text style={styles.btnText}>Add to Cart</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.btnOrder, isOutOfStock && styles.disabled]} onPress={handleBuyNowClick} disabled={isOutOfStock}>
                <Zap size={18} color={COLORS.surface} />
                <Text style={styles.btnText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionHeaderTitle}>Athlete Reviews & Community Photos</Text>

          <View style={styles.reviewCardStyle}>
            <Text style={styles.formTitle}>Leave Your Review</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Rating</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Star size={28} color={rating >= star ? COLORS.warning : 'rgba(255,255,255,0.3)'} fill={rating >= star ? COLORS.warning : 'transparent'} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Your Feedback</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="How did this product impact your training?"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={comment}
                onChangeText={setComment}
              />
            </View>

            <TouchableOpacity style={[styles.submitReviewBtn, submittingReview && styles.disabled]} onPress={handleReviewSubmit} disabled={submittingReview}>
              {submittingReview ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.submitText}>Post Review</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.reviewsList}>
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev, idx) => {
                const isAuthor = user?._id === rev.user;
                const authorName = rev.name || (isAuthor ? user?.name : 'Athlete');

                return (
                  <View key={idx} style={styles.reviewCardStyle}>
                    <View style={styles.reviewHeader}>
                      <View>
                        <Text style={styles.verifiedLabel}>Verified Athlete</Text>
                        <Text style={styles.reviewerName}>{authorName}</Text>
                        <Text style={styles.reviewDate}>
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Just now'}
                        </Text>
                      </View>

                      <View style={styles.reviewActionsCol}>
                        <View style={styles.starsRow}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} color={i < rev.rating ? COLORS.warning : 'rgba(255,255,255,0.2)'} fill={i < rev.rating ? COLORS.warning : 'transparent'} />
                          ))}
                        </View>
                        {(isAuthor || isAdmin) && (
                          <TouchableOpacity style={styles.deleteReviewBtn} onPress={() => setReviewToDelete(rev._id)}>
                            <Trash2 size={13} color={COLORS.accent} />
                            <Text style={styles.deleteReviewText}>Delete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                    {rev.image && (
                      <Image source={{ uri: rev.image }} style={styles.reviewPhotoThumb} />
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.noReviewsBox}>
                <Text style={styles.noReviewsText}>No reviews yet. Be the first athlete to review this product!</Text>
              </View>
            )}
          </View>
        </View>

        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionHeaderTitle}>Related Gear</Text>
            <View style={styles.relatedGrid}>
              {relatedProducts.map(prod => (
                <ProductCard key={prod._id || prod.id} product={prod} />
              ))}
            </View>
          </View>
        )}

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16161a' },
  scrollContent: { paddingBottom: 90, paddingHorizontal: SPACING.md },
  pageContent: { paddingHorizontal: SPACING.md },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.surface, marginTop: 10, "fontSize": 16 },
  grid: { gap: SPACING.xl },
  gallery: { gap: SPACING.md },
  mainImageContainer: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  expandHint: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', "fontSize": 10, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  thumbnails: { gap: SPACING.sm },
  thumbBtn: { width: 70, height: 70, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', padding: 4 },
  thumbActive: { borderColor: COLORS.accent },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  infoSection: { gap: SPACING.md },
  badgeCategory: { backgroundColor: 'rgba(230,57,70,0.15)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.sm, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(230,57,70,0.3)' },
  badgeCategoryText: { color: COLORS.accent, "fontSize": 11, "fontWeight": '800', textTransform: 'uppercase' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  productTitle: { flex: 1, "fontSize": 26, "fontWeight": '900', color: COLORS.surface, lineHeight: 32 },
  shareBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { color: 'rgba(255,255,255,0.7)', "fontSize": 14, "fontWeight": '600' },
  priceTag: { "fontSize": 28, "fontWeight": '900', color: COLORS.surface },
  stockStatus: { "fontSize": 14, "fontWeight": '700' },
  inStock: { color: COLORS.success },
  outStock: { color: COLORS.danger },
  description: { color: 'rgba(255,255,255,0.7)', "fontSize": 15, lineHeight: 24 },
  actionButtons: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  btnCart: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 14, borderRadius: RADIUS.sm, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnOrder: { flex: 1, backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: RADIUS.sm, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...SHADOWS.glow },
  btnText: { color: COLORS.surface, "fontSize": 14, "fontWeight": '800', textTransform: 'uppercase' },
  disabled: { opacity: 0.5 },
  reviewsSection: { marginTop: SPACING.xxl, paddingTop: SPACING.xl, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  sectionHeaderTitle: { "fontSize": 22, "fontWeight": '900', color: COLORS.surface, marginBottom: SPACING.lg },
  reviewCardStyle: { backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.md },
  formTitle: { "fontSize": 18, "fontWeight": '800', color: COLORS.surface, marginBottom: SPACING.md, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  formGroup: { marginBottom: SPACING.md },
  formLabel: { "fontSize": 12, "fontWeight": '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 8 },
  starsContainer: { flexDirection: 'row', gap: 6 },
  textArea: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.sm, color: COLORS.surface, padding: SPACING.md, "fontSize": 15, textAlignVertical: 'top', minHeight: 90 },
  submitReviewBtn: { backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: RADIUS.sm, alignItems: 'center', ...SHADOWS.glow },
  submitText: { color: COLORS.surface, "fontWeight": '900', "fontSize": 14, textTransform: 'uppercase' },
  reviewsList: { gap: SPACING.md, marginTop: SPACING.md },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  verifiedLabel: { "fontSize": 14, "fontWeight": '800', color: COLORS.surface },
  reviewerName: { "fontSize": 13, "fontWeight": '600', color: COLORS.warning, marginTop: 2 },
  reviewDate: { "fontSize": 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  reviewActionsCol: { alignItems: 'flex-end', gap: 6 },
  starsRow: { flexDirection: 'row', gap: 2 },
  deleteReviewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(230,57,70,0.1)', borderWidth: 1, borderColor: 'rgba(230,57,70,0.2)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, gap: 4 },
  deleteReviewText: { color: COLORS.accent, "fontSize": 11, "fontWeight": '700' },
  reviewComment: { color: 'rgba(255,255,255,0.8)', "fontSize": 14, lineHeight: 20 },
  reviewPhotoThumb: { width: 90, height: 90, borderRadius: 8, marginTop: 12, resizeMode: 'cover' },
  noReviewsBox: { padding: SPACING.xl, alignItems: 'center', backgroundColor: '#18181b', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  noReviewsText: { color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', textAlign: 'center' },
  relatedSection: { marginTop: SPACING.xxl, paddingTop: SPACING.xl, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  customModal: { backgroundColor: '#18181b', borderRadius: RADIUS.lg, padding: SPACING.xl, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalCloseBtn: { position: 'absolute', top: 12, right: 12 },
  modalTitle: { "fontSize": 20, "fontWeight": '900', color: COLORS.surface, textAlign: 'center', marginBottom: 8 },
  modalText: { color: 'rgba(255,255,255,0.7)', "fontSize": 14, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
  btnCancel: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: RADIUS.sm, alignItems: 'center' },
  btnCancelText: { color: COLORS.surface, "fontWeight": '800', "fontSize": 14 },
  btnConfirmDelete: { flex: 1, backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: RADIUS.sm, alignItems: 'center' },
  btnConfirmText: { color: COLORS.surface, "fontWeight": '800', "fontSize": 14 },
  fullscreenModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fsClose: { position: 'absolute', top: 40, right: 25, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  fsPrev: { position: 'absolute', left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 25 },
  fsNext: { position: 'absolute', right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 25 },
  fsImageWrapper: { width: width * 0.9, height: width * 0.9, backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, justifyContent: 'center', alignItems: 'center' },
  fsImage: { width: '100%', height: '100%' }
});