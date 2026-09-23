import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Product } from '../context/ShopContext';

const CATEGORIES = [
  'ALL',
  'GYM EQUIPMENTS',
  'WHEY PROTEINS',
  'CREATINE',
  'PROTEIN BARS',
  'PRE-WORKOUTS',
  'ESSENTIAL SUPPLEMENTS'
];

export default function CatalogScreen() {
  const params = useLocalSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (params.category && typeof params.category === 'string') {
      setSelectedCategory(params.category.toUpperCase());
    }
  }, [params.category]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/products');
        const fetchedProducts = res.data.products || res.data || [];
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' ||
      (p.category && p.category.trim().toUpperCase() === selectedCategory.trim().toUpperCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {selectedCategory === 'ALL' ? 'All Gear' : selectedCategory}
        </Text>
      </View>

      {/* 🔍 Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* 🏷️ Website-style Horizontal Category Chips */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No products found in this category.</Text>
          }
          ListFooterComponent={<Footer />}
          ListFooterComponentStyle={styles.footerContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16161a' },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.surface, textTransform: 'uppercase' },
  searchRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  searchBar: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: RADIUS.md, 
    paddingHorizontal: SPACING.md, 
    height: 44, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  searchInput: { flex: 1, marginLeft: SPACING.sm, color: COLORS.surface },
  
  categoryScrollContainer: { marginBottom: SPACING.md },
  categoryContent: { paddingHorizontal: SPACING.md, gap: 8, alignItems: 'center' },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  categoryChipTextActive: {
    color: COLORS.surface,
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  list: { paddingHorizontal: SPACING.md, flexGrow: 1 },
  row: { justifyContent: 'space-between' },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: SPACING.xl, fontSize: 16 },
  footerContainer: { marginTop: SPACING.xl, marginHorizontal: -SPACING.md },
});