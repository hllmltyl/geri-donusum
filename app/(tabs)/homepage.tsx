import { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, FlatList, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { WASTE_ITEMS, CATEGORY_FILTERS } from '@/constants/waste';
import { auth } from '@/firebaseConfig';

const windowWidth = Dimensions.get('window').width;

export default function HomePage() {
  const router = useRouter();
  
  // Renkler
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  
  // State'ler
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userStats, setUserStats] = useState({
    totalWastes: WASTE_ITEMS.length,
    categories: CATEGORY_FILTERS.length - 1, // 'hepsi' hariç
    tips: 15 // Sabit değer
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Firestore'dan veri çekme: KALDIRILDI
      // Sadece oturum bilgisinden gösterim adı üret
      if (auth.currentUser) {
        const display = auth.currentUser.displayName || auth.currentUser.email || '';
        setUserName(display || 'Kullanıcı');
      } else {
        setUserName('Kullanıcı');
      }
    } catch (err) {
      // Sessizce devam et, offline vs. durumlarda UI bozulmasın
      console.warn('User data loading fallback used:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWastePress = (waste: any) => {
    router.push({
      pathname: '/(tabs)/waste/[id]',
      params: { id: waste.id }
    });
  };

  const handleCategoryPress = (category: any) => {
    router.push({
      pathname: '/(tabs)/waste',
      params: { category: category.value }
    });
  };

  const handleRetry = () => {
    loadUserData();
  };

  // Öne çıkan atıklar (rastgele 6 tane)
  const featuredWastes = WASTE_ITEMS.slice(0, 6);

  // Hızlı erişim kategorileri
  const quickAccessCategories = CATEGORY_FILTERS.filter(cat => cat.value !== 'hepsi').slice(0, 6);

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={[styles.loadingText, { color: textColor }]}>Veriler yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.errorContainer, { backgroundColor }]}>
        <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
        <ThemedText style={[styles.errorTitle, { color: textColor }]}>Hata</ThemedText>
        <ThemedText style={[styles.errorText, { color: textColor }]}>{error}</ThemedText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: primaryColor }]} onPress={handleRetry}>
          <ThemedText style={styles.retryButtonText}>Yeniden Dene</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor }]} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: primaryColor }]}>
        <MaterialIcons name="recycling" size={44} color="#fff" style={styles.heroIcon} />
        <ThemedText style={styles.heroTitle}>
          Merhaba {userName}!
        </ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          Sürdürülebilir yaşam için atıklarınızı doğru şekilde yönetin ve çevreye katkıda bulunun.
        </ThemedText>
      </View>

      {/* İstatistikler */}
      <View style={styles.statsSection}>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <MaterialIcons name="delete" size={28} color={primaryColor} style={styles.statIcon} />
          <ThemedText style={[styles.statNumber, { color: primaryColor }]}>
            {userStats.totalWastes}+
          </ThemedText>
          <ThemedText style={[styles.statDescription, { color: textColor }]}>Atık Türü</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <MaterialIcons name="category" size={28} color={secondaryColor} style={styles.statIcon} />
          <ThemedText style={[styles.statNumber, { color: secondaryColor }]}>
            {userStats.categories}+
          </ThemedText>
          <ThemedText style={[styles.statDescription, { color: textColor }]}>Kategori</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <MaterialIcons name="eco" size={28} color="#4CAF50" style={styles.statIcon} />
          <ThemedText style={[styles.statNumber, { color: '#4CAF50' }]}>
            {userStats.tips}+
          </ThemedText>
          <ThemedText style={[styles.statDescription, { color: textColor }]}>Çevre İpucu</ThemedText>
        </View>
      </View>

      {/* Hızlı Erişim */}
      <View style={styles.quickAccessSection}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Hızlı Erişim</ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: secondaryColor }]}>
          Atık türlerine hızlıca göz atın
        </ThemedText>
        
        <View style={styles.quickAccessGrid}>
          {quickAccessCategories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickAccessCard, { backgroundColor: cardColor }]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category.value) }]}>
                <MaterialIcons name={getCategoryIcon(category.value) as any} size={24} color="#fff" />
              </View>
              <ThemedText style={[styles.categoryName, { color: textColor }]}>{category.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Öne Çıkan Atıklar */}
      <View style={styles.featuredSection}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Öne Çıkan Atıklar</ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: secondaryColor }]}>
          En çok merak edilen atık türleri
        </ThemedText>
        
        <FlatList
          data={featuredWastes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.featuredCard, { backgroundColor: cardColor }]}
              onPress={() => handleWastePress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.wasteImageContainer}>
                <View style={[styles.wasteIcon, { backgroundColor: getCategoryColor(item.tur) }]}>
                  <MaterialIcons name={getCategoryIcon(item.tur) as any} size={32} color="#fff" />
                </View>
              </View>
              <View style={styles.wasteContent}>
                <ThemedText style={[styles.wasteTitle, { color: textColor }]} numberOfLines={2}>
                  {item.malzeme}
                </ThemedText>
                <ThemedText style={[styles.wasteType, { color: secondaryColor }]} numberOfLines={1}>
                  {item.tur.charAt(0).toUpperCase() + item.tur.slice(1)}
                </ThemedText>
                <View style={styles.wasteMethod}>
                  <ThemedText style={[styles.wasteMethodText, { color: textColor }]} numberOfLines={2}>
                    {item.yontem}
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  style={[styles.detailButton, { backgroundColor: getCategoryColor(item.tur) }]}
                  onPress={() => handleWastePress(item)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.detailButtonText}>Detayları Gör</ThemedText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.featuredListContainer}
        />
      </View>

      {/* Günün İpucu */}
      <View style={[styles.tipSection, { backgroundColor: cardColor }]}>
        <MaterialIcons name="lightbulb" size={32} color="#FFC107" style={styles.tipIcon} />
        <ThemedText style={[styles.tipTitle, { color: textColor }]}>Günün Çevre İpucu</ThemedText>
        <ThemedText style={[styles.tipText, { color: textColor }]}>
          Plastik şişelerinizi geri dönüşüm kutusuna atmadan önce kapaklarını ayrı toplayın. 
          Kapaklar farklı bir plastik türü olduğu için ayrı işlenmelidir.
        </ThemedText>
      </View>

      {/* Çevre Bilgilendirme */}
      <View style={[styles.infoSection, { backgroundColor: cardColor }]}>
        <MaterialIcons name="eco" size={32} color={primaryColor} style={styles.infoIcon} />
        <ThemedText style={[styles.infoTitle, { color: textColor }]}>Çevre Dostu Yaşam</ThemedText>
        <ThemedText style={[styles.infoText, { color: textColor }]}>
          Doğru geri dönüşüm ile çevreye katkıda bulunun. Her atığın doğru yere atılması, 
          gelecek nesiller için daha temiz bir dünya demektir.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

// Kategori renk fonksiyonu
function getCategoryColor(category: string): string {
  switch (category) {
    case 'plastik': return '#2196F3';
    case 'cam': return '#4CAF50';
    case 'kagit': return '#FF9800';
    case 'metal': return '#9E9E9E';
    case 'organik': return '#8BC34A';
    case 'elektronik': return '#607D8B';
    default: return '#51A646';
  }
}

// Kategori ikon fonksiyonu
function getCategoryIcon(category: string): string {
  switch (category) {
    case 'plastik': return 'local-drink';
    case 'cam': return 'local-drink';
    case 'kagit': return 'description';
    case 'metal': return 'build';
    case 'organik': return 'eco';
    case 'elektronik': return 'devices';
    default: return 'delete';
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#51A646',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#51A646',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroSection: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
    backgroundColor: '#51A646',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 4,
    shadowColor: '#51A646',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  heroIcon: {
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    color: '#fff',
    paddingHorizontal: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e0f2e9',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    padding: 16,
    elevation: 2,
    shadowColor: '#51A646',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statIcon: {
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickAccessSection: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAccessCard: {
    width: (windowWidth - 56) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#51A646',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    padding: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuredSection: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featuredListContainer: {
    paddingHorizontal: 8,
  },
  featuredCard: {
    width: windowWidth * 0.45,
    borderRadius: 16,
    marginRight: 16,
    elevation: 3,
    shadowColor: '#51A646',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  wasteImageContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  wasteIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wasteContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  wasteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 20,
  },
  wasteType: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wasteMethod: {
    flex: 1,
    marginBottom: 12,
  },
  wasteMethodText: {
    fontSize: 12,
    lineHeight: 16,
  },
  detailButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tipSection: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#51A646',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    alignItems: 'center',
  },
  tipIcon: {
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSection: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#51A646',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    alignItems: 'center',
  },
  infoIcon: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

