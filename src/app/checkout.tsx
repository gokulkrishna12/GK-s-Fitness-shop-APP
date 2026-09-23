import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CreditCard, MapPin, Truck } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';
import { useShop, CartItem } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import ScreenContainer from '../components/ScreenContainer';

export default function CheckoutScreen() {
  const { cart, clearCart } = useShop();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    address: '', city: '', postalCode: '', country: 'India', phone: ''
  });

  let directItem: CartItem | null = null;
  if (params.directItem && typeof params.directItem === 'string') {
    try { directItem = JSON.parse(params.directItem); } catch (e) {}
  }

  const checkoutItems: CartItem[] = directItem ? [directItem] : cart;
  const totalAmount = checkoutItems.reduce((total, item) => total + (item.product.price * item.qty), 0);
  const displayTotal = totalAmount.toFixed(2);

  useEffect(() => {
    if (!paymentSuccess && !directItem && (!cart || cart.length === 0)) {
      router.replace('/cart' as any);
    }
  }, [cart, directItem, paymentSuccess]);

  const handleInputChange = (field: string, value: string) => setShippingAddress(prev => ({ ...prev, [field]: value }));

  const handlePayment = async () => {
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.phone) {
      Toast.show({ type: 'error', text1: 'Please fill in all shipping details' });
      return;
    }
    setLoading(true);

    try {
      const formattedOrderItems = checkoutItems.map(item => ({
        product: String(item.product._id || item.product.id),
        name: item.product.name,
        price: Number(item.product.price),
        qty: Number(item.qty),
        image: item.product.image || item.product.images?.[0] || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=200&q=80',
      }));

      // 1. Create the Razorpay Order ID on your EC2 backend
      const { data: orderData } = await api.post('/payment/create-order', {
        orderItems: formattedOrderItems, shippingAddress, totalAmount: Number(totalAmount)
      });

      // 2. Open Real Razorpay UI
      const options = {
        description: "GK's Fitness Order",
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: orderData.currency || 'INR',
        key: 'rzp_test_TWQwCw6M7RKVkV', 
        amount: orderData.amount,
        name: "GK's Fitness",
        order_id: orderData.razorpayOrderId,
        prefill: { email: user?.email || 'athlete@gkfitness.com', contact: shippingAddress.phone, name: user?.name || 'Athlete' },
        theme: { color: COLORS.accent }
      };

      // 3. Trigger Razorpay Native UI
      RazorpayCheckout.open(options).then(async (data: any) => {
        try {
          Toast.show({ type: 'info', text1: 'Verifying payment...' });
          
          // 4. Send signature to backend to verify and save to MongoDB
          const verifyRes = await api.post('/payment/verify-payment', {
            razorpay_order_id: data.razorpay_order_id, 
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature, 
            orderItems: formattedOrderItems, 
            shippingAddress, 
            totalAmount: Number(totalAmount)
          });
          
          if (verifyRes.status === 200) {
            setPaymentSuccess(true);
            Toast.show({ type: 'success', text1: 'Order placed successfully!' });
            if (!directItem) clearCart();
            router.replace('/orders' as any);
          }
        } catch (err: any) {
          Toast.show({ type: 'error', text1: 'Payment verification failed!' });
        }
      }).catch((error: any) => {
        Toast.show({ type: 'error', text1: `Payment cancelled by user` });
      });

    } catch (error: any) {
      console.error("Checkout Error:", error.response?.data || error.message);
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Checkout failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScreenContainer>
        <View style={styles.contentWrapper}>
          <Text style={styles.headerTitle}>Secure Checkout</Text>

          <View style={styles.checkoutContainer}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Truck size={22} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Shipping Details</Text>
              </View>
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Street Address</Text>
                  <TextInput style={styles.input} placeholder="123 Fitness St" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={shippingAddress.address} onChangeText={(val) => handleInputChange('address', val)} />
                </View>
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>City</Text>
                    <TextInput style={styles.input} placeholder="Chennai" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={shippingAddress.city} onChangeText={(val) => handleInputChange('city', val)} />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Postal Code</Text>
                    <TextInput style={styles.input} placeholder="600001" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={shippingAddress.postalCode} onChangeText={(val) => handleInputChange('postalCode', val)} keyboardType="numeric" />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={shippingAddress.phone} onChangeText={(val) => handleInputChange('phone', val)} keyboardType="phone-pad" />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={22} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Order Summary</Text>
              </View>
              <View style={styles.summaryItems}>
                {checkoutItems.map((item, index) => (
                  <View key={index} style={styles.summaryItem}>
                    <Text style={styles.summaryItemText} numberOfLines={1}>{item.qty}x {item.product.name}</Text>
                    <Text style={styles.summaryItemPrice}>₹{(item.product.price * item.qty).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.summaryTotals}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total to Pay</Text>
                  <Text style={styles.totalValue}>₹{displayTotal}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.payBtn, loading && styles.btnDisabled]} onPress={handlePayment} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.surface} size="small" /> : <><Text style={styles.payText}>Pay ₹{displayTotal} Securely</Text><CreditCard size={18} color={COLORS.surface} /></>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16161a' },
  contentWrapper: { padding: SPACING.md },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.surface, marginBottom: SPACING.lg, textTransform: 'uppercase' },
  checkoutContainer: { gap: SPACING.lg },
  section: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', ...SHADOWS.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.surface, textTransform: 'uppercase' },
  form: { gap: SPACING.md },
  formRow: { flexDirection: 'row', gap: SPACING.md },
  formGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: 'rgba(255, 255, 255, 0.8)' },
  input: { width: '100%', height: 50, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', borderRadius: RADIUS.sm, color: COLORS.surface, paddingHorizontal: SPACING.md, fontSize: 16 },
  summaryItems: { gap: SPACING.sm, marginBottom: SPACING.lg },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.md },
  summaryItemText: { flex: 1, color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, fontWeight: '600' },
  summaryItemPrice: { color: COLORS.surface, fontSize: 14, fontWeight: '700' },
  summaryTotals: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: SPACING.md, marginBottom: SPACING.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: '900', color: COLORS.surface },
  totalValue: { fontSize: 18, fontWeight: '900', color: COLORS.accent },
  payBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: RADIUS.sm, gap: 10, ...SHADOWS.glow },
  btnDisabled: { opacity: 0.5 },
  payText: { color: COLORS.surface, fontSize: 16, fontWeight: '900', textTransform: 'uppercase' }
});