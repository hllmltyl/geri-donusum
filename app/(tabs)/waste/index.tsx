import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CATEGORY_FILTERS, WasteCategory, WasteItem } from '@/constants/waste';
import { db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View, ScrollView } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressableScale({ onPress, style, children, activeScale = 0.96 }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(activeScale, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

function FilterChip({ label, active, onPress, primaryColor, isDark }: any) {
  return (
    <PressableScale onPress={onPress} style={[
      styles.chip,
      { backgroundColor: active ? primaryColor : (isDark ? '#2C2C2E' : '#F2F2F7') },
      active && { shadowColor: primaryColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
    ]}>
      <ThemedText style={[styles.chipText, { color: active ? '#FFF' : (isDark ? '#A0A0A0' : '#8E8E93'), fontWeight: active ? '700' : '600' }]}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

export default function WasteListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialCategory = (params.category as WasteCategory) || 'hepsi';

  const [selected, setSelected] = useState<WasteCategory>(initialCategory);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wastes, setWastes] = useState<WasteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useScrollToTop(listRef);

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glassBg = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)';
  const subText = isDark ? '#A0A0A0' : '#707070';

  useEffect(() => { if (params.category) setSelected(params.category as WasteCategory); }, [params.category]);
  useEffect(() => { loadWastes(); }, []);

  const loadWastes = async () => {
    try {
      setLoading(true); setError(null);
      const wastesCollection = collection(db, 'wastes');
      const wastesSnapshot = await getDocs(wastesCollection);
      setWastes(wastesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as WasteItem[]);
    } catch (err: any) {
      setError(err?.message || 'Veriler yüklenirken hata oluştu');
    } finally { setLoading(false); }
  };

  const data = useMemo(() => {
    const byCategory = selected === 'hepsi' ? wastes : wastes.filter((item) => item.tur === selected);
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((it) => it.malzeme.toLowerCase().includes(q));
  }, [selected, query, wastes]);

  const getCategoryLabel = useCallback((value: WasteItem['tur']) => {
    return CATEGORY_FILTERS.find(c => c.value === value)?.label ?? value;
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWastes().finally(() => setRefreshing(false));
  }, []);

  const handleWastePress = useCallback((item: WasteItem) => {
    router.push({ pathname: '/(tabs)/waste/[id]', params: { id: item.id } });
  }, [router]);

  const getWasteIcon = (tur: string) => {
    switch (tur) {
      case 'plastik': return 'local-drink'; case 'cam': return 'wine-bar';
      case 'kagit': return 'description'; case 'metal': return 'build';
      case 'organik': return 'eco'; case 'elektronik': return 'devices';
      case 'ahsap': return 'park'; case 'tekstil': return 'checkroom';
      case 'pil': return 'battery-charging-full'; case 'atik_yag': return 'oil-barrel';
      case 'tibbi': return 'medical-services'; case 'insaat': return 'construction';
      case 'beyazesya': return 'kitchen'; case 'lastik': return 'donut-large';
      case 'mobilya': return 'weekend'; case 'kompozit': return 'category';
      case 'boya': return 'format-color-fill'; default: return 'delete';
    }
  };

  const getWasteColor = (tur: string) => {
    switch (tur) {
      case 'plastik': return '#2196F3'; case 'cam': return '#4CAF50';
      case 'kagit': return '#FF9800'; case 'metal': return '#9E9E9E';
      case 'organik': return '#8BC34A'; case 'elektronik': return '#607D8B';
      case 'ahsap': return '#8D6E63'; case 'tekstil': return '#9C27B0';
      case 'pil': return '#D32F2F'; case 'atik_yag': return '#F57C00';
      case 'tibbi': return '#C2185B'; case 'insaat': return '#795548';
      case 'beyazesya': return '#546E7A'; case 'lastik': return '#424242';
      case 'mobilya': return '#6D4C41'; case 'kompozit': return '#5C6BC0';
      case 'boya': return '#3F51B5'; default: return secondaryColor;
    }
  };

  function renderItem({ item }: { item: WasteItem }) {
    const iconColor = getWasteColor(item.tur);
    return (
      <PressableScale onPress={() => handleWastePress(item)}>
        <View style={[styles.wasteCard, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
              <MaterialIcons name={getWasteIcon(item.tur) as any} size={36} color={iconColor} />
            </View>
            <View style={styles.infoContainer}>
              <ThemedText style={[styles.wasteTitle, { color: textColor }]} numberOfLines={1}>{item.malzeme}</ThemedText>
              <ThemedText style={[styles.wasteMethod, { color: subText }]} numberOfLines={1}>{item.yontem}</ThemedText>
              <View style={styles.detailsRow}>
                <View style={[styles.typeBadge, { backgroundColor: iconColor + '15' }]}>
                  <ThemedText style={[styles.typeBadgeText, { color: iconColor }]}>{getCategoryLabel(item.tur)}</ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <MaterialIcons name="chevron-right" size={24} color={subText} />
            </View>
          </View>
        </View>
      </PressableScale>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.bgBlob, { backgroundColor: primaryColor, opacity: isDark ? 0.15 : 0.08 }]} />

      <View style={styles.headerBar}>
        <View style={[styles.headerIconWrapper, { backgroundColor: primaryColor + '20' }]}>
          <MaterialIcons name="recycling" size={32} color={primaryColor} />
        </View>
        <ThemedText type="title" style={styles.headerTitle}>Atık Rehberi</ThemedText>
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF4B4B" />
          <ThemedText style={[styles.errorText, { color: textColor }]}>{error}</ThemedText>
          <PressableScale style={[styles.retryButton, { backgroundColor: primaryColor }]} onPress={loadWastes}>
            <ThemedText style={styles.retryButtonText}>Yeniden Dene</ThemedText>
          </PressableScale>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.filterSection}>
              <View style={[styles.searchBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', shadowColor: isDark ? '#000' : '#888' }]}>
                <MaterialIcons name="search" size={24} color={subText} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: textColor }]}
                  placeholder="Atık adı ara..."
                  placeholderTextColor={subText}
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {CATEGORY_FILTERS.map((c) => (
                  <FilterChip
                    key={c.value}
                    label={c.label}
                    active={selected === c.value}
                    onPress={() => setSelected(c.value)}
                    primaryColor={primaryColor}
                    isDark={isDark}
                  />
                ))}
              </ScrollView>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  bgBlob: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { marginTop: 16, marginBottom: 24, fontSize: 16, textAlign: 'center' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  headerIconWrapper: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  filterSection: { marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 16, height: 56, elevation: 4, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12, marginBottom: 16 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '500' },
  chipScroll: { paddingRight: 20, gap: 8 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  chipText: { fontSize: 14 },
  wasteCard: { borderRadius: 24, marginBottom: 16, padding: 16, elevation: 3, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  infoContainer: { flex: 1, justifyContent: 'center' },
  wasteTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  wasteMethod: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  detailsRow: { flexDirection: 'row', alignItems: 'center' },
  typeBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  typeBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  arrowContainer: { paddingLeft: 12 },
});
