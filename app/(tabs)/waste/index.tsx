import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CATEGORY_FILTERS, WasteCategory, WasteItem } from '@/constants/waste';
import { db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <ThemedText style={active ? styles.chipTextActive : styles.chipText}>{label}</ThemedText>
    </Pressable>
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


  // Renkler
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  // Parametre değiştiğinde kategoriyi güncelle
  useEffect(() => {
    if (params.category) {
      setSelected(params.category as WasteCategory);
    }
  }, [params.category]);

  // Firestore'dan verileri çek
  useEffect(() => {
    loadWastes();
  }, []);

  const loadWastes = async () => {
    try {
      setLoading(true);
      setError(null);

      const wastesCollection = collection(db, 'wastes');
      const wastesSnapshot = await getDocs(wastesCollection);
      const wastesData = wastesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as WasteItem[];

      setWastes(wastesData);
    } catch (err: any) {
      setError(err?.message || 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const data = useMemo(() => {
    const byCategory = selected === 'hepsi' ? wastes : wastes.filter((item) => item.tur === selected);
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((it) => it.malzeme.toLowerCase().includes(q));
  }, [selected, query, wastes]);

  // Kategori görünen adını döndür
  const getCategoryLabel = useCallback((value: WasteItem['tur']) => {
    const found = CATEGORY_FILTERS.find(c => c.value === value);
    return found?.label ?? value;
  }, []);

  // Pull-to-refresh fonksiyonu
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWastes().finally(() => setRefreshing(false));
  }, []);

  // Atık detayına gitme fonksiyonu
  const handleWastePress = useCallback((item: WasteItem) => {
    router.push({ pathname: '/(tabs)/waste/[id]', params: { id: item.id } });
  }, [router]);

  // Atık türüne göre ikon döndüren fonksiyon
  const getWasteIcon = (tur: string) => {
    switch (tur) {
      case 'plastik': return 'local-drink';
      case 'cam': return 'local-drink';
      case 'kagit': return 'description';
      case 'metal': return 'build';
      case 'organik': return 'eco';
      case 'elektronik': return 'devices';
      case 'ahsap': return 'park';
      case 'tekstil': return 'checkroom';
      case 'pil': return 'battery-charging-full';
      case 'atik_yag': return 'oil-barrel';
      case 'tibbi': return 'medical-services';
      case 'insaat': return 'construction';
      case 'beyazesya': return 'kitchen';
      case 'lastik': return 'donut-large';
      case 'mobilya': return 'weekend';
      case 'kompozit': return 'category';
      case 'boya': return 'format-color-fill';
      default: return 'delete';
    }
  };

  // Atık türüne göre renk döndüren fonksiyon
  const getWasteColor = (tur: string) => {
    switch (tur) {
      case 'plastik': return '#2196F3';
      case 'cam': return '#4CAF50';
      case 'kagit': return '#FF9800';
      case 'metal': return '#9E9E9E';
      case 'organik': return '#8BC34A';
      case 'elektronik': return '#607D8B';
      case 'ahsap': return '#8D6E63';
      case 'tekstil': return '#9C27B0';
      case 'pil': return '#D32F2F';
      case 'atik_yag': return '#F57C00';
      case 'tibbi': return '#C2185B';
      case 'insaat': return '#795548';
      case 'beyazesya': return '#546E7A';
      case 'lastik': return '#424242';
      case 'mobilya': return '#6D4C41';
      case 'kompozit': return '#5C6BC0';
      case 'boya': return '#3F51B5';
      default: return secondaryColor;
    }
  };

  function renderItem({ item }: { item: WasteItem }) {
    return (
      <TouchableOpacity
        onPress={() => handleWastePress(item)}
        activeOpacity={0.7}
        style={{ marginBottom: 8 }}
      >
        <View style={[styles.wasteCard, { backgroundColor: cardColor }]}>
          <View style={styles.row}>
            <View style={styles.imageContainer}>
              <View style={[styles.iconContainer, { backgroundColor: getWasteColor(item.tur) }]}>
                <MaterialIcons
                  name={getWasteIcon(item.tur) as any}
                  size={32}
                  color="#fff"
                />
              </View>
            </View>
            <View style={styles.infoContainer}>
              <ThemedText type="subtitle" style={[styles.wasteTitle, { color: textColor }]}>
                {item.malzeme}
              </ThemedText>
              <ThemedText style={[styles.wasteMethod, { color: secondaryColor }]}>
                {item.yontem}
              </ThemedText>

              {/* Detaylar */}
              <View style={styles.detailsRow}>
                <MaterialIcons name="category" size={14} color={secondaryColor} style={{ marginRight: 2 }} />
                <ThemedText style={[styles.detail, { color: textColor }]}>
                  {getCategoryLabel(item.tur)}
                </ThemedText>
                <View style={[styles.typeBadge, { backgroundColor: getWasteColor(item.tur) }]}>
                  <ThemedText style={styles.typeBadgeText}>
                    {getCategoryLabel(item.tur)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: primaryColor }]}>
        <MaterialIcons name="recycling" size={36} color="#fff" style={{ marginRight: 12 }} />
        <ThemedText type="title" style={styles.headerTitle}>Atık Listesi</ThemedText>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>Atıklar yükleniyor...</ThemedText>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <ThemedText style={[styles.errorText, { color: textColor }]}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: primaryColor }]}
            onPress={loadWastes}
          >
            <ThemedText style={styles.retryButtonText}>Yeniden Dene</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Açılır/kapanır filtre paneli */}
          <Collapsible title="Atıkları Filtrele">
            <View style={{ paddingHorizontal: 16 }}>
              <TextInput
                style={[styles.searchInput, {
                  backgroundColor: backgroundColor,
                  borderColor: borderColor,
                  color: textColor
                }]}
                placeholder="Atık adı ara..."
                placeholderTextColor={secondaryColor}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.filters}>
                {CATEGORY_FILTERS.map((c) => (
                  <FilterChip
                    key={c.value}
                    label={c.label}
                    active={selected === c.value}
                    onPress={() => setSelected(c.value)}
                  />
                ))}
              </View>
            </View>
          </Collapsible>

          {/* Atıklar listesi */}
          <FlatList
            data={data}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={5}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 18,
    elevation: 4,
    shadowColor: '#51A646',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    marginTop: 8,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#51A646',
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: '#51A646',
  },
  chipText: {
    color: '#51A646',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  wasteCard: {
    flexDirection: 'row',
    borderRadius: 18,
    marginVertical: 8,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  imageContainer: {
    width: 80,
    height: 80,
    marginRight: 16,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  wasteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wasteMethod: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  detail: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
    alignSelf: 'center',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
});
