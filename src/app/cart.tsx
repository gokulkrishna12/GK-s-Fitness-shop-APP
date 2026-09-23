import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { Trash2, ShoppingBag, Plus, Minus, CreditCard, AlertTriangle, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import ScreenContainer from '../components/ScreenContainer';

export default function CartScreen() {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useShop();
  const { isAuthenticated } = useAuth();

  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Toast.show({ type: 'error', text1: 'Please login to access this feature!' });
      router.push('/Auth/login' as any);
      return;
    }
    router.push('/checkout' as any);
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      removeFromCart(itemToRemove);
      Toast.show({ type: 'success', text1: 'Item removed from cart' });
      setItemToRemove(null);
    }
  };

  const safeCart = cart.filter(item => item && item.product != null);

  if (safeCart.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <ShoppingBag size={64} color={COLORS.accent} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Looks like you haven't added anything to your cart yet.</Text>
            
            <TouchableOpacity 
              style={styles.btnPrimary} 
              onPress={() => router.push('/catalog' as any)}
            >
              <Text style={styles.btnPrimaryText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Modal
        visible={itemToRemove !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setItemToRemove(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setItemToRemove(null)}>
              <X size={22} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>

            <View style={styles.modalIconWrapper}>
              <AlertTriangle size={36} color={COLORS.accent} />
            </View>

            <Text style={styles.modalTitle}>Remove Item?</Text>
            <Text style={styles.modalText}>Are you sure you want to remove this item from your cart?</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setItemToRemove(null)}>
                <Text style={styles.btnCancelText}>Keep Item</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={confirmRemove}>
                <Text style={styles.btnConfirmText}>Yes, Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.contentWrapper}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>

        <View style={styles.cartContainer}>
          <View style={styles.itemsList}>
            {safeCart.map((item) => {
              const itemId = item.product._id || item.product.id || '';
              const itemImage = item.product.images?.[0] || item.product.image || 'https://via.placeholder.com/100';

              return (
                <View key={itemId} style={styles.cartItem}>
                  <Image source={{ uri: itemImage }} style={styles.itemImage} />
                  
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.product.price}</Text>
                  </View>

                  <View style={styles.itemActions}>
                    <View style={styles.qtyContainer}>
                      <TouchableOpacity
                        style={[styles.qtyBtn, item.qty <= 1 && styles.qtyBtnDisabled]}
                        onPress={() => updateQuantity(itemId, item.qty - 1)}
                        disabled={item.qty <= 1}
                      >
                        <Minus size={14} color={COLORS.surface} />
                      </TouchableOpacity>

                      <Text style={styles.qtyText}>{item.qty}</Text>

                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(itemId, item.qty + 1)}
                      >
                        <Plus size={14} color={COLORS.surface} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => setItemToRemove(itemId)}
                    >
                      <Trash2 size={16} color="rgba(255, 255, 255, 0.5)" />
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{getCartTotal().toLocaleString()}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.freeShipping}>Free</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{getCartTotal().toLocaleString()}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              <CreditCard size={18} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    padding: SPACING.md,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
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
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.surface,
    marginBottom: SPACING.lg,
    textTransform: 'uppercase',
  },
  cartContainer: {
    gap: SPACING.lg,
  },
  itemsList: {
    gap: SPACING.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: SPACING.md,
  },
  itemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 4,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.surface,
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.accent,
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.3,
  },
  qtyText: {
    width: 25,
    textAlign: 'center',
    fontWeight: '800',
    color: COLORS.surface,
    fontSize: 14,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: SPACING.sm,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.surface,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '600',
  },
  summaryValue: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  freeShipping: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.lg,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.surface,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.accent,
  },
  checkoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    gap: 10,
    ...SHADOWS.glow,
  },
  checkoutText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 12, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: 'rgba(30, 30, 35, 0.95)',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...SHADOWS.lg,
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  modalIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.surface,
    marginBottom: 8,
  },
  modalText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  btnCancel: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  btnCancelText: {
    color: COLORS.surface,
    fontWeight: '800',
    fontSize: 14,
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: COLORS.surface,
    fontWeight: '800',
    fontSize: 14,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.sm,
    ...SHADOWS.glow,
  },
  btnPrimaryText: {
    color: COLORS.surface,
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'uppercase',
  }
});