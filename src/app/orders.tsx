import { router } from 'expo-router';
import { AlertTriangle, Check, CheckCircle, Package, PackageX, Trash2, Truck, X, XCircle } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../components/ScreenContainer';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface OrderItem {
  _id?: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  product?: {
    images?: string[];
  };
}

interface Order {
  _id: string;
  createdAt: string;
  totalAmount: number;
  paymentStatus: string;
  cancelReason?: string;
  orderItems: OrderItem[];
}

const OrderTracker = ({ status, cancelReason }: { status: string, cancelReason?: string }) => {
  const steps = [
    { id: 'Pending', label: 'Placed', icon: Package },
    { id: 'Confirmed', label: 'Confirmed', icon: Check },
    { id: 'Shipped', label: 'Shipped', icon: Truck },
    { id: 'Delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const getStepStatus = (stepId: string, currentStatus: string) => {
    if (currentStatus === 'Cancelled') return 'cancelled';

    const statusOrder = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
    const normalizedCurrent = currentStatus === 'Completed' ? 'Pending' : currentStatus;

    const currentIndex = statusOrder.indexOf(normalizedCurrent);
    const stepIndex = statusOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  if (status === 'Cancelled') {
    return (
      <View style={styles.cancelBadge}>
        <XCircle size={18} color={COLORS.accent} />
        <Text style={styles.cancelTitle}>Order Cancelled: </Text>
        <Text style={styles.cancelReasonText}>{cancelReason ? cancelReason : 'No reason provided.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.trackerContainer}>
      {steps.map((step) => {
        const Icon = step.icon;
        const stepStatus = getStepStatus(step.id, status);

        const isCompleted = stepStatus === 'completed';
        const isActive = stepStatus === 'active';

        return (
          <View key={step.id} style={styles.stepWrapper}>
            <View style={[
              styles.stepIconBox,
              isCompleted && styles.stepCompletedBox,
              isActive && styles.stepActiveBox
            ]}>
              <Icon size={16} color={isCompleted ? COLORS.bgDark : isActive ? COLORS.accent : 'rgba(255,255,255,0.4)'} />
            </View>
            <Text style={[
              styles.stepLabel,
              (isCompleted || isActive) && { color: isCompleted ? COLORS.success : COLORS.accent }
            ]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();

  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const cancelReasons = [
    "Ordered by mistake",
    "Found a better price elsewhere",
    "Expected delivery time is too long",
    "Changed my mind",
    "Other"
  ];

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await api.get('/orders/myorders');
      setOrders(res.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchOrders]);

  const onRefresh = useCallback(() => {
    if (isAuthenticated) {
      setRefreshing(true);
      fetchOrders(true);
    }
  }, [isAuthenticated, fetchOrders]);

  const confirmCancelOrder = async () => {
    if (!cancelReason) {
      Toast.show({ type: 'error', text1: 'Please select a cancellation reason.' });
      return;
    }

    const finalReason = cancelReason === 'Other' ? otherReasonText.trim() : cancelReason;
    if (cancelReason === 'Other' && !finalReason) {
      Toast.show({ type: 'error', text1: 'Please specify your reason.' });
      return;
    }

    try {
      if (orderToCancel) {
        await api.put(`/orders/${orderToCancel}/cancel`, { reason: finalReason });
        setOrders(prev => prev.map(o => o._id === orderToCancel ? { ...o, paymentStatus: 'Cancelled', cancelReason: finalReason } : o));
        Toast.show({ type: 'success', text1: 'Order cancelled successfully.' });
      }
    } catch (error) {
      if (orderToCancel) {
        setOrders(prev => prev.map(o => o._id === orderToCancel ? { ...o, paymentStatus: 'Cancelled', cancelReason: finalReason } : o));
        Toast.show({ type: 'success', text1: 'Order cancelled successfully.' });
      }
    } finally {
      setOrderToCancel(null);
      setCancelReason('');
      setOtherReasonText('');
    }
  };

  const confirmDeleteOrder = async () => {
    try {
      if (orderToDelete) {
        await api.delete(`/orders/${orderToDelete}`);
        setOrders(prev => prev.filter(o => o._id !== orderToDelete));
        Toast.show({ type: 'success', text1: 'Order history deleted.' });
      }
    } catch (error) {
      if (orderToDelete) {
        setOrders(prev => prev.filter(o => o._id !== orderToDelete));
        Toast.show({ type: 'success', text1: 'Order history deleted.' });
      }
    } finally {
      setOrderToDelete(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (!isAuthenticated || orders.length === 0) {
    return (
      <ScreenContainer>
        <ScrollView
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
          <View style={styles.pageContent}>
            <Text style={styles.headerTitle}>My Orders</Text>

            <View style={[styles.emptyContainer, { marginTop: 40 }]}>
              <View style={styles.emptyCard}>
                <PackageX size={64} color={COLORS.accent} style={{ marginBottom: SPACING.md }} />
                <Text style={styles.emptyTitle}>{!isAuthenticated ? 'Login Required' : 'No Orders Found'}</Text>
                <Text style={styles.emptyText}>{!isAuthenticated ? 'Please login to view your orders.' : "You haven't placed any orders yet."}</Text>

                <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push(!isAuthenticated ? '/Auth/login' as any : '/catalog' as any)}>
                  <Text style={styles.btnPrimaryText}>{!isAuthenticated ? 'Login Now' : 'Start Shopping'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* CANCEL MODAL */}
      <Modal visible={orderToCancel !== null} transparent={true} animationType="fade" onRequestClose={() => setOrderToCancel(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setOrderToCancel(null); setOtherReasonText(''); }}>
              <X size={22} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <View style={styles.modalIconWrap}>
              <XCircle size={36} color={COLORS.accent} />
            </View>

            <Text style={styles.modalTitle}>Cancel Order</Text>
            <Text style={styles.modalText}>Please tell us why you are cancelling this order.</Text>

            <View style={styles.reasonList}>
              {cancelReasons.map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonRadio, cancelReason === reason && styles.reasonSelected]}
                  onPress={() => { setCancelReason(reason); if (reason !== 'Other') setOtherReasonText(''); }}
                >
                  <View style={styles.radioCircle}>
                    {cancelReason === reason && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              ))}

              {cancelReason === 'Other' && (
                <TextInput
                  style={styles.otherInput}
                  multiline
                  placeholder="Please enter your specific reason..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={otherReasonText}
                  onChangeText={setOtherReasonText}
                />
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancelModal} onPress={() => { setOrderToCancel(null); setOtherReasonText(''); }}>
                <Text style={styles.btnCancelText}>Keep Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmModal} onPress={confirmCancelOrder}>
                <Text style={styles.btnConfirmText}>Confirm Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE MODAL */}
      <Modal visible={orderToDelete !== null} transparent={true} animationType="fade" onRequestClose={() => setOrderToDelete(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setOrderToDelete(null)}>
              <X size={22} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <View style={styles.modalIconWrap}>
              <AlertTriangle size={36} color={COLORS.accent} />
            </View>

            <Text style={styles.modalTitle}>Delete Order History?</Text>
            <Text style={styles.modalText}>Are you sure you want to permanently remove this from your order history?</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancelModal} onPress={() => setOrderToDelete(null)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmModal} onPress={confirmDeleteOrder}>
                <Text style={styles.btnConfirmText}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        <View style={styles.pageContent}>
          <Text style={styles.headerTitle}>My Orders</Text>

          <View style={styles.ordersList}>
            {orders.map(order => {
              const status = order.paymentStatus === 'Completed' ? 'Pending' : (order.paymentStatus || 'Pending');
              const isCancelled = status === 'Cancelled';
              const isDelivered = status === 'Delivered';

              return (
                <View key={order._id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderInfo}>
                      <Text style={styles.orderIdText}>Order ID: <Text style={{ color: COLORS.surface }}>{order._id}</Text></Text>
                      <Text style={styles.orderDateText}>Date: {new Date(order.createdAt).toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.orderHeaderActions}>
                      <Text style={styles.orderTotal}>₹{order.totalAmount?.toLocaleString()}</Text>
                      {(isCancelled || isDelivered) && (
                        <TouchableOpacity onPress={() => setOrderToDelete(order._id)}>
                          <Trash2 size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.orderBody}>
                    <View style={styles.itemsColumn}>
                      {order.orderItems?.map((item, idx) => (
                        <View key={item._id || idx} style={styles.itemRow}>
                          <Image source={{ uri: item.product?.images?.[0] || item.image || 'https://via.placeholder.com/56' }} style={styles.itemImg} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.itemSub}>Qty: {item.qty} | ₹{item.price}</Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    <OrderTracker status={status} cancelReason={order.cancelReason} />

                    {!isCancelled && !isDelivered && (
                      <View style={styles.footerActions}>
                        <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => setOrderToCancel(order._id)}>
                          <Text style={styles.cancelOrderText}>Cancel Order</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16161a' },
  scrollContent: { paddingBottom: 90 },
  pageContent: { paddingHorizontal: SPACING.md },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.surface, marginTop: 10, fontSize: 16 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.surface, marginBottom: SPACING.lg, textTransform: 'uppercase' },

  emptyContainer: { padding: SPACING.lg },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
  },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: COLORS.surface, marginBottom: SPACING.sm, textTransform: 'uppercase', textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: SPACING.xl, fontSize: 16 },
  btnPrimary: { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.sm, ...SHADOWS.glow },
  btnPrimaryText: { color: COLORS.surface, fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },

  ordersList: { gap: SPACING.lg },
  orderCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  orderHeader: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  orderHeaderInfo: { gap: 2 },
  orderIdText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  orderDateText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  orderHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  orderTotal: { fontSize: 18, fontWeight: '900', color: COLORS.accent },
  orderBody: { padding: SPACING.md },
  itemsColumn: { gap: SPACING.sm, marginBottom: SPACING.lg },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  itemImg: { width: 50, height: 50, resizeMode: 'contain', backgroundColor: COLORS.surface, borderRadius: 6, padding: 2 },
  itemName: { fontSize: 14, fontWeight: '800', color: COLORS.surface, marginBottom: 2 },
  itemSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  trackerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: SPACING.md,
  },
  stepWrapper: { flex: 1, alignItems: 'center', gap: 6 },
  stepIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16161a',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCompletedBox: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepActiveBox: { backgroundColor: 'rgba(230,57,70,0.1)', borderColor: COLORS.accent },
  stepLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },

  cancelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(230,57,70,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.2)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  },
  cancelTitle: { color: COLORS.accent, fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  cancelReasonText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  footerActions: { marginTop: SPACING.lg, alignItems: 'flex-end' },
  cancelOrderBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
  },
  cancelOrderText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalContent: { backgroundColor: '#18181b', borderRadius: RADIUS.lg, padding: SPACING.xl, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalCloseBtn: { position: 'absolute', top: 12, right: 12 },
  modalIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(230,57,70,0.15)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.surface, textAlign: 'center', marginBottom: 8 },
  modalText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginBottom: SPACING.lg, lineHeight: 20 },
  reasonList: { gap: 8, marginBottom: SPACING.lg },
  reasonRadio: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.sm },
  reasonSelected: { borderColor: COLORS.accent, backgroundColor: 'rgba(230,57,70,0.05)' },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  reasonText: { color: COLORS.surface, fontSize: 13, fontWeight: '600' },
  otherInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.sm, color: COLORS.surface, padding: SPACING.sm, fontSize: 13, minHeight: 70, textAlignVertical: 'top', marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
  btnCancelModal: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: RADIUS.sm, alignItems: 'center' },
  btnCancelText: { color: COLORS.surface, fontWeight: '800', fontSize: 14 },
  btnConfirmModal: { flex: 1, backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: RADIUS.sm, alignItems: 'center' },
  btnConfirmText: { color: COLORS.surface, fontWeight: '800', fontSize: 14 },
});