import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Modal, ActivityIndicator, Dimensions, DimensionValue } from 'react-native';
import { router } from 'expo-router';
import { DollarSign, ShoppingBag, Package, AlertTriangle, Trash2, Plus, Edit, X, MapPin, ChevronDown } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import ScreenContainer from '../components/ScreenContainer';

const { width } = Dimensions.get('window');

const categoriesList = ['Gym Equipments', 'Whey Proteins', 'Creatine', 'Protein Bars', 'Pre-workouts', 'Essential Supplements'];

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  countInStock?: number;
  stock?: number;
  description?: string;
  images?: string[];
  image?: string;
}

interface OrderItem {
  name: string;
  price: number;
  qty: number;
  image?: string;
  product?: { images?: string[] };
}

interface Order {
  _id: string;
  createdAt: string;
  totalAmount?: number;
  totalPrice?: number;
  paymentStatus: string;
  cancelReason?: string;
  user?: { email?: string };
  email?: string;
  shippingAddress?: { address?: string; city?: string; postalCode?: string };
  orderItems: OrderItem[];
}

export default function AdminScreen() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setItemsTab] = useState<'overview' | 'products' | 'orders'>('overview');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<{ id: string; current: string } | null>(null);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [productForm, setProductForm] = useState({ _id: '', name: '', price: '', category: '', countInStock: '', description: '', image: '' });

  const adminCancelMessage = "Sorry, unfortunately cancelled by Admin. You can clear the history and order again. This order history can be deleted by Admin whenever, so you might not see it often.";

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.replace('/' as any);
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, isAdmin]);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [prodRes, ordRes] = await Promise.all([
        api.get('/products'),
        api.get('/orders')
      ]);
      setProducts(prodRes.data.products || prodRes.data || []);
      const fetchedOrders = ordRes.data.orders || ordRes.data || [];
      setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to load admin data' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const validOrders = orders.filter(o => o.paymentStatus !== 'Cancelled');
    const totalRev = validOrders.reduce((sum, order) => sum + (order.totalAmount || order.totalPrice || 0), 0);
    const lowStockCount = products.filter(p => (p.stock !== undefined ? p.stock : (p.countInStock || 0)) < 5).length;
    return { revenue: totalRev, orders: orders.length, products: products.length, lowStock: lowStockCount };
  }, [orders, products]);

  const chartData = useMemo(() => {
    if (orders.length === 0) return [];
    
    const categoryStats: Record<string, { count: number, revenue: number }> = {};
    
    orders.forEach(order => {
      if (order.paymentStatus !== 'Cancelled' && order.orderItems) {
        order.orderItems.forEach(item => {
          const product = products.find(p => p.name === item.name);
          const cat = product?.category || 'Uncategorized';
          const lineTotal = item.price * item.qty;
          
          if (!categoryStats[cat]) {
            categoryStats[cat] = { count: 0, revenue: 0 };
          }
          categoryStats[cat].count += item.qty;
          categoryStats[cat].revenue += lineTotal;
        });
      }
    });

    const totalRev = Object.values(categoryStats).reduce((a, b) => a + b.revenue, 0) || 1;
    const colors = ['#e63946', '#2ec4b6', '#e9c46a', '#f4a261', '#e76f51', '#8338ec'];

    return Object.entries(categoryStats).map(([name, stats], index) => {
      return {
        name,
        revenue: stats.revenue,
        percentage: ((stats.revenue / totalRev) * 100).toFixed(1),
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [orders, products]);


  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'product') {
        await api.delete(`/products/${itemToDelete.id}`);
        setProducts(products.filter(p => p._id !== itemToDelete.id));
        Toast.show({ type: 'success', text1: `${itemToDelete.name} deleted successfully!` });
      } else if (itemToDelete.type === 'order-cancel') {
        await api.put(`/orders/${itemToDelete.id}/admin-cancel`);
        fetchDashboardData(true);
        Toast.show({ type: 'success', text1: 'Order cancelled by Admin.' });
      } else if (itemToDelete.type === 'order-delete') {
        await api.delete(`/orders/${itemToDelete.id}`);
        setOrders(orders.filter(o => o._id !== itemToDelete.id));
        Toast.show({ type: 'success', text1: 'Order permanently deleted!' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to complete action.' });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleProductSubmit = async () => {
    if (!productForm.name || !productForm.price || !productForm.category || !productForm.countInStock) {
      Toast.show({ type: 'error', text1: 'Please fill out all required fields!' });
      return;
    }

    setIsSaving(true);
    const formData = new FormData() as any;
    formData.append('name', productForm.name);
    formData.append('price', productForm.price);
    formData.append('countInStock', productForm.countInStock);
    formData.append('stock', productForm.countInStock);
    formData.append('category', productForm.category);
    formData.append('description', productForm.description);
    if (productForm.image) {
      formData.append('image', productForm.image);
    }

    try {
      if (isEditing) {
        await api.put(`/products/${productForm._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        Toast.show({ type: 'success', text1: 'Product updated!' });
      } else {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        Toast.show({ type: 'success', text1: 'Product created!' });
      }
      setShowProductModal(false);
      fetchDashboardData(true);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to save product.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setStatusDropdown(null);
    if (newStatus === 'Cancelled') {
      setItemToDelete({ type: 'order-cancel', id: orderId, name: `Order` });
      return;
    }
    try {
      await api.put(`/orders/${orderId}/status`, { paymentStatus: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, paymentStatus: newStatus } : o));
      Toast.show({ type: 'success', text1: `Order marked as ${newStatus}!` });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to update order status.' });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  const activeOrders = orders.filter(o => o.paymentStatus !== 'Cancelled');
  const customerCancelledOrders = orders.filter(o => o.paymentStatus === 'Cancelled' && o.cancelReason !== adminCancelMessage);
  const adminCancelledOrders = orders.filter(o => o.paymentStatus === 'Cancelled' && o.cancelReason === adminCancelMessage);

  const uncategorizedProducts = products.filter(p => !categoriesList.includes(p.category));

  const renderOrderTable = (title: string, data: Order[], titleColor: string) => (
    <View style={styles.webTableSection}>
      <Text style={[styles.webTableTitle, { color: titleColor }]}>{title} ({data.length})</Text>
      
      <View style={styles.webTableWrapper}>
        {data.length === 0 ? (
          <Text style={styles.emptyTableText}>
            {title.includes('CUSTOMER') ? 'No customer cancellations.' : title.includes('ADMIN') ? 'No admin cancellations.' : 'No active orders.'}
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableInner}>
              
              {/* TABLE HEADER */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 100 }]}>ORDER ID</Text>
                <Text style={[styles.th, { width: 180 }]}>USER EMAIL</Text>
                <Text style={[styles.th, { width: 160 }]}>ADDRESS</Text>
                <Text style={[styles.th, { width: 70 }]}>ITEMS</Text>
                <Text style={[styles.th, { width: 80 }]}>AMOUNT</Text>
                <Text style={[styles.th, { width: 140 }]}>TRACKER STATUS</Text>
                <Text style={[styles.th, { width: 70, textAlign: 'center' }]}>ACTIONS</Text>
              </View>

              {/* TABLE ROWS */}
              {data.map(o => {
                const userEmail = o.user?.email || o.email || 'athlete@gkfitness.com';
                const firstItem = o.orderItems?.[0];
                const itemImage = firstItem?.image || firstItem?.product?.images?.[0] || 'https://via.placeholder.com/50';

                return (
                  <View key={o._id} style={styles.tableRow}>
                    <Text style={[styles.td, { width: 100, color: 'rgba(255,255,255,0.6)' }]}>{o._id.slice(-8).toUpperCase()}</Text>
                    <Text style={[styles.td, { width: 180 }]} numberOfLines={1}>{userEmail}</Text>
                    
                    <View style={[styles.tdView, { width: 160, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                      <MapPin size={12} color={COLORS.accent} />
                      <Text style={styles.addressText} numberOfLines={2}>
                        {o.shippingAddress?.city}{'\n'}
                        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>{o.shippingAddress?.address}, {o.shippingAddress?.postalCode}</Text>
                      </Text>
                    </View>

                    <View style={[styles.tdView, { width: 70 }]}>
                      <Image source={{ uri: itemImage }} style={styles.tdThumb} />
                    </View>

                    <Text style={[styles.td, { width: 80, color: '#2ec4b6', fontWeight: '800' }]}>₹{o.totalAmount || o.totalPrice}</Text>

                    <View style={[styles.tdView, { width: 140 }]}>
                      <TouchableOpacity 
                        style={[styles.dropdownTrigger, o.paymentStatus === 'Cancelled' && { opacity: 0.5 }]} 
                        onPress={() => setStatusDropdown({ id: o._id, current: o.paymentStatus })}
                        disabled={o.paymentStatus === 'Cancelled'}
                      >
                        <Text style={styles.dropdownText}>{o.paymentStatus}</Text>
                        <ChevronDown size={14} color="rgba(255,255,255,0.5)" />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.tdView, { width: 70, alignItems: 'center' }]}>
                      <TouchableOpacity style={styles.actionBtnIcon} onPress={() => setItemToDelete({ type: 'order-delete', id: o._id, name: 'Order' })}>
                        <Trash2 size={16} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );

  const renderProductCard = (p: Product) => {
    const stock = p.stock !== undefined ? p.stock : (p.countInStock || 0);
    return (
      <View key={p._id} style={styles.itemCard}>
        <Image source={{ uri: p.images?.[0] || p.image || 'https://via.placeholder.com/50' }} style={styles.itemThumb} />
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
          <Text style={styles.itemSub}>₹{p.price} | Stock: <Text style={{ color: stock < 5 ? COLORS.accent : COLORS.success }}>{stock}</Text></Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => { 
            setIsEditing(true); 
            setProductForm({ 
              ...p, 
              price: p.price.toString(), 
              countInStock: stock.toString(),
              image: (p.images && p.images[0]) || p.image || ''
            } as any); 
            setShowProductModal(true); 
          }}>
            <Edit size={18} color="#2ec4b6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setItemToDelete({ type: 'product', id: p._id, name: p.name })}>
            <Trash2 size={18} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <Modal visible={statusDropdown !== null} transparent={true} animationType="fade" onRequestClose={() => setStatusDropdown(null)}>
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setStatusDropdown(null)}>
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownModalTitle}>Update Tracker Status</Text>
            {['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
              <TouchableOpacity 
                key={st} 
                style={[styles.dropdownModalOption, statusDropdown?.current === st && styles.dropdownModalOptionActive]}
                onPress={() => statusDropdown && handleUpdateOrderStatus(statusDropdown.id, st)}
              >
                <Text style={[styles.dropdownModalOptionText, statusDropdown?.current === st && styles.dropdownModalOptionTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={itemToDelete !== null} transparent={true} animationType="fade" onRequestClose={() => setItemToDelete(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.customModal}>
            <AlertTriangle size={40} color={COLORS.accent} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Confirm Action</Text>
            <Text style={styles.modalText}>
              {itemToDelete?.type === 'product' ? `Permanently delete ${itemToDelete.name}?` 
                : itemToDelete?.type === 'order-cancel' ? `Cancel order? Stock will be restored.` 
                : `Permanently delete this cancelled order from database?`}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setItemToDelete(null)}>
                <Text style={styles.btnCancelText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={confirmDelete}>
                <Text style={styles.btnConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showProductModal} transparent={true} animationType="slide" onRequestClose={() => setShowProductModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.customModal, { maxWidth: 440, maxHeight: '88%', paddingBottom: SPACING.md }]}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowProductModal(false)}>
              <X size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Product' : 'Add New Product'}</Text>
            
            <ScrollView 
              style={{ flexGrow: 0 }} 
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput 
                  style={styles.input} 
                  value={productForm.name} 
                  onChangeText={(val) => setProductForm({ ...productForm, name: val })} 
                  placeholder="20kg Dumbbell" 
                  placeholderTextColor="rgba(255,255,255,0.3)" 
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Price (₹)</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={productForm.price.toString()} 
                    onChangeText={(val) => setProductForm({ ...productForm, price: val })} 
                    placeholder="2500" 
                    placeholderTextColor="rgba(255,255,255,0.3)" 
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Stock</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={productForm.countInStock.toString()} 
                    onChangeText={(val) => setProductForm({ ...productForm, countInStock: val })} 
                    placeholder="50" 
                    placeholderTextColor="rgba(255,255,255,0.3)" 
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput 
                  style={styles.input} 
                  value={productForm.category} 
                  onChangeText={(val) => setProductForm({ ...productForm, category: val })} 
                  placeholder="Gym Equipments" 
                  placeholderTextColor="rgba(255,255,255,0.3)" 
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Image URL</Text>
                <TextInput 
                  style={styles.input} 
                  value={productForm.image} 
                  onChangeText={(val) => setProductForm({ ...productForm, image: val })} 
                  placeholder="https://example.com/product.jpg" 
                  placeholderTextColor="rgba(255,255,255,0.3)" 
                />
                {productForm.image ? (
                  <View style={{ marginTop: 10 }}>
                    <Image source={{ uri: productForm.image }} style={styles.previewThumb} />
                  </View>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput 
                  style={[styles.input, { height: 90, textAlignVertical: 'top' }]} 
                  multiline 
                  value={productForm.description} 
                  onChangeText={(val) => setProductForm({ ...productForm, description: val })} 
                  placeholder="Product details..." 
                  placeholderTextColor="rgba(255,255,255,0.3)" 
                />
              </View>

              <TouchableOpacity style={[styles.btnConfirm, { marginTop: 16 }]} onPress={handleProductSubmit} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.btnConfirmText}>{isEditing ? 'Save Changes' : 'Create Product'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.mainWrapper}>
        <Text style={styles.headerTitle}>Command Center</Text>

        <View style={styles.tabsRow}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'overview' && styles.activeTab]} onPress={() => setItemsTab('overview')}>
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'products' && styles.activeTab]} onPress={() => setItemsTab('products')}>
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'orders' && styles.activeTab]} onPress={() => setItemsTab('orders')}>
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' && (
          <View style={styles.section}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <DollarSign size={22} color={COLORS.success} />
                <Text style={styles.metricLabel}>Revenue</Text>
                <Text style={styles.metricVal}>₹{metrics.revenue.toLocaleString()}</Text>
              </View>
              <View style={styles.metricCard}>
                <ShoppingBag size={22} color="#3b82f6" />
                <Text style={styles.metricLabel}>Orders</Text>
                <Text style={styles.metricVal}>{metrics.orders}</Text>
              </View>
              <View style={styles.metricCard}>
                <Package size={22} color="#a855f7" />
                <Text style={styles.metricLabel}>Products</Text>
                <Text style={styles.metricVal}>{metrics.products}</Text>
              </View>
              <View style={styles.metricCard}>
                <AlertTriangle size={22} color={COLORS.accent} />
                <Text style={styles.metricLabel}>Low Stock</Text>
                <Text style={styles.metricVal}>{metrics.lowStock}</Text>
              </View>
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Sales by Category</Text>
              {chartData.length > 0 ? (
                <View style={styles.categoryStatsList}>
                  {chartData.map((cat, idx) => (
                    <View key={idx} style={styles.catStatRow}>
                      <View style={styles.catStatHeader}>
                        <Text style={styles.catStatName}>{cat.name}</Text>
                        <Text style={styles.catStatVal}>₹{cat.revenue.toLocaleString()} ({cat.percentage}%)</Text>
                      </View>
                      <View style={styles.catStatBarBg}>
                        <View style={[styles.catStatBarFill, { width: `${cat.percentage}%` as DimensionValue, backgroundColor: cat.color }]} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyChart}>
                  <Text style={styles.emptyText}>No sales data available yet.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'products' && (
          <View style={styles.section}>
            <View style={styles.tableHeader}>
              <Text style={styles.sectionTitle}>Inventory</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => { setIsEditing(false); setProductForm({ _id: '', name: '', price: '', category: '', countInStock: '', description: '', image: '' }); setShowProductModal(true); }}>
                <Plus size={16} color={COLORS.surface} />
                <Text style={styles.addBtnText}>New Product</Text>
              </TouchableOpacity>
            </View>

            {categoriesList.map(category => {
              const categoryProducts = products.filter(p => p.category === category);
              if (categoryProducts.length === 0) return null;
              return (
                <View key={category} style={{ marginBottom: SPACING.lg }}>
                  <Text style={styles.categoryHeader}>{category} ({categoryProducts.length})</Text>
                  {categoryProducts.map(renderProductCard)}
                </View>
              );
            })}

            {uncategorizedProducts.length > 0 && (
              <View style={{ marginBottom: SPACING.lg }}>
                <Text style={[styles.categoryHeader, { color: '#ffb703' }]}>Uncategorized ({uncategorizedProducts.length})</Text>
                {uncategorizedProducts.map(renderProductCard)}
              </View>
            )}
          </View>
        )}

        {activeTab === 'orders' && (
          <View style={styles.section}>
            {renderOrderTable("ACTIVE ORDERS", activeOrders, COLORS.surface)}
            {renderOrderTable("CANCELLED BY CUSTOMER", customerCancelledOrders, COLORS.accent)}
            {renderOrderTable("CANCELLED BY ADMIN", adminCancelledOrders, COLORS.accent)}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16161a' },
  mainWrapper: { flex: 1, padding: SPACING.md, paddingBottom: 100 },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.surface, marginTop: 10, fontSize: 16 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.surface, marginBottom: SPACING.md, textTransform: 'uppercase' },
  tabsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.sm, padding: 4, marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: COLORS.accent },
  tabText: { color: 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  activeTabText: { color: COLORS.surface },
  section: { gap: SPACING.md },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  metricCard: { width: (width - SPACING.md * 2 - SPACING.sm) / 2, backgroundColor: '#18181b', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 6 },
  metricLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  metricVal: { color: COLORS.surface, fontSize: 20, fontWeight: '900' },
  
  chartSection: { backgroundColor: '#18181b', borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: SPACING.sm },
  categoryStatsList: { marginTop: SPACING.md, gap: SPACING.md },
  catStatRow: { width: '100%' },
  catStatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catStatName: { color: COLORS.surface, fontSize: 13, fontWeight: '700' },
  catStatVal: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  catStatBarBg: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  catStatBarFill: { height: '100%', borderRadius: 4 },
  
  webTableSection: { marginBottom: SPACING.xl },
  webTableTitle: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', marginBottom: SPACING.md },
  webTableWrapper: { backgroundColor: '#18181b', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  tableInner: { minWidth: 800 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingVertical: 12, paddingHorizontal: SPACING.md },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, paddingHorizontal: SPACING.md },
  th: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  td: { color: COLORS.surface, fontSize: 13 },
  tdView: { justifyContent: 'center' },
  addressText: { color: COLORS.surface, fontSize: 12, lineHeight: 16 },
  tdThumb: { width: 35, height: 35, borderRadius: 4, backgroundColor: '#fff', resizeMode: 'contain' },
  actionBtnIcon: { width: 32, height: 32, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  emptyTableText: { color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', padding: SPACING.xl, textAlign: 'center' },
  
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.02)' },
  dropdownText: { color: COLORS.surface, fontSize: 12, fontWeight: '600' },
  
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownModal: { width: 200, backgroundColor: '#18181b', borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', ...SHADOWS.md, overflow: 'hidden' },
  dropdownModalTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropdownModalOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropdownModalOptionActive: { backgroundColor: '#2ec4b6' },
  dropdownModalOptionText: { color: COLORS.surface, fontSize: 13, fontWeight: '600' },
  dropdownModalOptionTextActive: { color: '#000', fontWeight: '800' },

  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.surface, textTransform: 'uppercase' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.sm },
  addBtnText: { color: COLORS.surface, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  categoryHeader: { fontSize: 16, fontWeight: '900', color: COLORS.surface, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.sm },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', padding: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: SPACING.sm, gap: SPACING.md },
  itemThumb: { width: 45, height: 45, borderRadius: 6, resizeMode: 'contain', backgroundColor: '#fff' },
  itemName: { fontSize: 14, fontWeight: '800', color: COLORS.surface },
  itemSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: SPACING.md },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  customModal: { backgroundColor: '#18181b', borderRadius: RADIUS.lg, padding: SPACING.xl, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalClose: { position: 'absolute', top: 12, right: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.surface, textAlign: 'center', marginBottom: SPACING.md, textTransform: 'uppercase' },
  modalText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginBottom: SPACING.lg },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
  btnCancel: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: RADIUS.sm, alignItems: 'center' },
  btnCancelText: { color: COLORS.surface, fontWeight: '800', fontSize: 13 },
  btnConfirm: { flex: 1, backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: SPACING.sm },
  btnConfirmText: { color: COLORS.surface, fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  formGroup: { marginBottom: SPACING.sm },
  formRow: { flexDirection: 'row', gap: SPACING.sm },
  label: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.sm, color: COLORS.surface, paddingHorizontal: SPACING.md, height: 44, fontSize: 14 },

  previewThumb: { width: 50, height: 50, borderRadius: 6, resizeMode: 'cover' },
  emptyChart: { height: 100, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontStyle: 'italic' },
});