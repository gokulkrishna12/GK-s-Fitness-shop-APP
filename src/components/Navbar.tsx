import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Dumbbell, ShoppingCart, Heart, User, LogOut, Menu, X, LayoutDashboard, ShoppingBag } from 'lucide-react-native';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function Navbar() {
  const { getCartCount, wishlist } = useShop();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = isAuthenticated && typeof getCartCount === 'function' ? getCartCount() : 0;
  const wishlistCount = isAuthenticated && Array.isArray(wishlist) ? wishlist.length : 0;

  const handleNav = (route: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      router.push(route as any);
    }, 150); 
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setTimeout(() => {
      router.replace('/Auth/login' as any);
    }, 150);
  };

  return (
    <View style={styles.navbar}>
      <View style={styles.inner}>
        
        {/* Brand Logo - Fixed Clipping */}
        <TouchableOpacity style={styles.logoContainer} onPress={() => handleNav('/')} activeOpacity={0.8}>
          <View style={styles.iconPaddingWrapper}>
            <Dumbbell size={22} color={COLORS.accent} />
          </View>
          <Text style={styles.logoText}>
            GK'S <Text style={styles.logoBold}>FITNESS SHOP</Text>
          </Text>
        </TouchableOpacity>

        {/* Quick Action Icons & Products Link */}
        <View style={styles.rightActions}>
          {/* 🛍️ Top Header Products Icon Only */}
          <TouchableOpacity 
            style={[styles.productsBtn, pathname === '/catalog' && styles.productsBtnActive]} 
            onPress={() => handleNav('/catalog')}
            activeOpacity={0.8}
          >
            <ShoppingBag size={18} color={pathname === '/catalog' ? COLORS.accent : COLORS.surface} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => handleNav('/wishlist')}>
            <Heart size={20} color={pathname === '/wishlist' ? COLORS.accent : COLORS.surface} />
            {wishlistCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wishlistCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => handleNav('/cart')}>
            <ShoppingCart size={20} color={pathname === '/cart' ? COLORS.accent : COLORS.surface} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.hamburger} onPress={() => setMobileMenuOpen(true)}>
            <Menu size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>

      </View>

      {/* Mobile Drawer */}
      <Modal
        visible={mobileMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMobileMenuOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawerContent}>
            
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Navigation Menu</Text>
              <TouchableOpacity onPress={() => setMobileMenuOpen(false)}>
                <X size={24} color={COLORS.surface} />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerLinks}>
              <TouchableOpacity style={styles.drawerItem} onPress={() => handleNav('/')}>
                <Text style={styles.drawerText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.drawerItem, { backgroundColor: 'rgba(230,57,70,0.1)' }]} onPress={() => handleNav('/catalog')}>
                <Text style={[styles.drawerText, { color: COLORS.accent }]}>Products Catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem} onPress={() => handleNav('/wishlist')}>
                <Text style={styles.drawerText}>Wishlist ({wishlistCount})</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem} onPress={() => handleNav('/cart')}>
                <Text style={styles.drawerText}>Cart ({cartCount})</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem} onPress={() => handleNav('/orders')}>
                <Text style={styles.drawerText}>My Orders</Text>
              </TouchableOpacity>

              {isAdmin && (
                <TouchableOpacity style={styles.drawerItem} onPress={() => handleNav('/admin')}>
                  <LayoutDashboard size={18} color={COLORS.warning} />
                  <Text style={[styles.drawerText, { color: COLORS.warning }]}>Admin Dashboard</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.drawerDivider} />

            {isAuthenticated ? (
              <View style={styles.authSection}>
                <TouchableOpacity style={styles.profileRow} onPress={() => handleNav('/profile')}>
                  <User size={18} color={COLORS.surface} />
                  <Text style={styles.profileName}>{user?.name || 'My Profile'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <LogOut size={16} color={COLORS.surface} />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.guestSection}>
                <TouchableOpacity style={styles.loginBtn} onPress={() => handleNav('/Auth/login')}>
                  <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.signupBtn} onPress={() => handleNav('/Auth/register')}>
                  <Text style={styles.signupText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: { backgroundColor: '#140e0a', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', height: 64, justifyContent: 'center', ...SHADOWS.md },
  inner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconPaddingWrapper: { padding: 4, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 15, fontWeight: '800', color: COLORS.surface, letterSpacing: 0.5 },
  logoBold: { color: COLORS.accent, fontWeight: '900' },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  
  productsBtn: { padding: 6, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  productsBtnActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(230,57,70,0.15)' },

  iconButton: { position: 'relative', padding: 6 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeText: { color: COLORS.surface, fontSize: 10, fontWeight: '800' },
  hamburger: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 10, 12, 0.8)', justifyContent: 'flex-end' },
  drawerContent: { backgroundColor: '#1a120b', borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: SPACING.md },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  drawerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.surface, textTransform: 'uppercase' },
  drawerLinks: { gap: SPACING.sm },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: SPACING.sm, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: RADIUS.sm },
  drawerText: { fontSize: 16, fontWeight: '700', color: COLORS.surface },
  drawerDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginVertical: SPACING.sm },
  authSection: { gap: SPACING.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.surface },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: RADIUS.sm, gap: 8, ...SHADOWS.glow },
  logoutText: { color: COLORS.surface, fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  guestSection: { flexDirection: 'row', gap: SPACING.md },
  loginBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: RADIUS.sm },
  loginText: { color: COLORS.surface, fontWeight: '800', textTransform: 'uppercase' },
  signupBtn: { flex: 1, backgroundColor: COLORS.accent, paddingVertical: 12, alignItems: 'center', borderRadius: RADIUS.sm, ...SHADOWS.glow },
  signupText: { color: COLORS.surface, fontWeight: '800', textTransform: 'uppercase' },
});