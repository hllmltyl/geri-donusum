import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CATEGORY_FILTERS, type WasteItem } from '@/constants/waste';
import { useUser } from '@/context/UserContext';
import { db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, getCountFromServer, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const windowWidth = Dimensions.get('window').width;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Animasyonlu Buton/Kart Bileşeni
function PressableScale({ onPress, style, children, activeScale = 0.96, disabled = false }: any) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => {
        scale.value = withTiming(activeScale, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { userProfile, user } = useUser();
  const insets = useSafeAreaInsets();

  // Renkler
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  // Modern Tema Renkleri
  const isDark = backgroundColor === '#000' || backgroundColor.includes('black');
  const glassBg = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';
  const subText = isDark ? '#A0A0A0' : '#707070';

  // State'ler
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyTip, setDailyTip] = useState<string>('Çevre ipucu yükleniyor...');
  const [wasteStats, setWasteStats] = useState({
    totalWastes: 0,
    categories: CATEGORY_FILTERS.length - 1,
    tips: 15
  });

  const userName = userProfile?.firstName || userProfile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Kullanıcı';
  const userPoints = userProfile?.points || 0;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const wastesCollection = collection(db, 'wastes');
      const countSnapshot = await getCountFromServer(wastesCollection);
      const totalWastesCount = countSnapshot.data().count;

      setWasteStats(prev => ({
        ...prev,
        totalWastes: totalWastesCount
      }));

      const tipsCollection = collection(db, 'tips');
      const activeTipsQuery = query(tipsCollection, where('active', '==', true));
      const tipsSnapshot = await getDocs(activeTipsQuery);
      const tipsData = tipsSnapshot.docs.map(doc => doc.data());

      if (tipsData.length > 0) {
        const randomTip = tipsData[Math.floor(Math.random() * tipsData.length)];
        setDailyTip(randomTip.text);
      }
    } catch (err: any) {
      setError(err?.message || 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleItemPress = (item: any) => {
    if (item.params) {
      router.push({ pathname: item.route, params: item.params });
    } else {
      router.push(item.route);
    }
  };

  const exploreItems = [
    { label: 'Harita', icon: 'map', color: '#4CAF50', route: '/(tabs)/map' },
    { label: 'Atık Rehberi', icon: 'menu-book', color: '#00BCD4', route: '/(tabs)/waste' },
    { label: 'Puan Durumu', icon: 'emoji-events', color: '#FFD700', route: '/(tabs)/leaderboard' },
  ];

  const wasteCategoryItems = useCallback(() => {
    return CATEGORY_FILTERS.filter(cat => cat.value !== 'hepsi').slice(0, 6).map(c => ({
      label: c.label,
      value: c.value,
      icon: getCategoryIcon(c.value),
      color: getCategoryColor(c.value),
      route: '/(tabs)/waste',
      params: { category: c.value }
    }));
  }, []);

  const memoizedWasteCategories = useMemo(() => wasteCategoryItems(), [wasteCategoryItems]);

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={[styles.loadingText, { color: primaryColor }]}>Veriler hazırlanıyor...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.errorContainer, { backgroundColor }]}>
        <MaterialIcons name="error-outline" size={64} color="#FF4B4B" />
        <ThemedText style={[styles.errorTitle, { color: textColor }]}>Bir Sorun Oluştu</ThemedText>
        <ThemedText style={[styles.errorText, { color: subText }]}>{error}</ThemedText>
        <PressableScale style={[styles.retryButton, { backgroundColor: primaryColor }]} onPress={loadData}>
          <ThemedText style={styles.retryButtonText}>Yeniden Dene</ThemedText>
        </PressableScale>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor, paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>


      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText style={[styles.greetingText, { color: subText }]}>Hoş Geldin,</ThemedText>
            <ThemedText style={[styles.userNameText, { color: textColor }]}>{userName} 👋</ThemedText>
          </View>
          <View style={[styles.avatarCircle, { backgroundColor: primaryColor + '20' }]}>
            <ThemedText style={{ color: primaryColor, fontWeight: 'bold', fontSize: 18 }}>
              {userName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Puan ve İlerleme Kartı (Glassmorphism) */}
      <PressableScale onPress={() => router.push('/(tabs)/leaderboard')}>
        <View style={styles.pointsWrapper}>
        <View style={[styles.pointsCard, { backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)', borderColor: glassBorder }]}>
            <View style={styles.pointsInfo}>
              <ThemedText style={[styles.pointsLabel, { color: subText }]}>Toplam Çevre Puanın</ThemedText>
              <View style={styles.pointsRow}>
                <MaterialIcons name="eco" size={32} color={primaryColor} />
                <ThemedText style={[styles.pointsValue, { color: textColor }]}>{userPoints}</ThemedText>
              </View>
            </View>
            {/* Simple Circular Progress Fake */}
            <View style={styles.progressCircle}>
              <View style={[styles.progressInner, { borderColor: primaryColor }]} />
              <MaterialIcons name="stars" size={24} color={primaryColor} style={{ position: 'absolute' }} />
            </View>
          </View>
        </View>
      </PressableScale>

      {/* İstatistikler */}
      <View style={styles.statsRow}>
        <PressableScale style={[styles.statCard, { backgroundColor: cardColor }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: primaryColor + '15' }]}>
            <MaterialIcons name="delete-outline" size={24} color={primaryColor} />
          </View>
          <ThemedText style={[styles.statNum, { color: textColor }]}>{wasteStats.totalWastes}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: subText }]}>Atık Türü</ThemedText>
        </PressableScale>
        
        <PressableScale style={[styles.statCard, { backgroundColor: cardColor }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: '#FF9800' + '15' }]}>
            <MaterialIcons name="category" size={24} color="#FF9800" />
          </View>
          <ThemedText style={[styles.statNum, { color: textColor }]}>{wasteStats.categories}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: subText }]}>Kategori</ThemedText>
        </PressableScale>
      </View>

      {/* Hızlı Erişim */}
      {/* Keşfet Bölümü */}
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Keşfet</ThemedText>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.quickAccessScroll}
        contentContainerStyle={styles.quickAccessScrollContent}
      >
        {exploreItems.map((item, index) => (
          <PressableScale
            key={`explore-${index}`}
            style={[styles.quickAccessCard, { backgroundColor: cardColor }]}
            onPress={() => handleItemPress(item)}
          >
            <View style={[styles.categoryIconCircle, { backgroundColor: item.color + '20' }]}>
              <MaterialIcons name={item.icon as any} size={28} color={item.color} />
            </View>
            <ThemedText style={[styles.categoryName, { color: textColor }]}>{item.label}</ThemedText>
          </PressableScale>
        ))}
      </ScrollView>

      {/* AI Atık Tarama Banner/Card */}
      <PressableScale 
        style={[styles.aiScanCard, { backgroundColor: isDark ? 'rgba(81, 166, 70, 0.15)' : 'rgba(81, 166, 70, 0.1)' }]}
        onPress={() => router.push('/(tabs)/scan')}
      >
        <View style={[styles.aiScanIconBox, { backgroundColor: primaryColor }]}>
          <MaterialIcons name="camera-alt" size={24} color="#FFF" />
        </View>
        <View style={styles.aiScanInfo}>
          <ThemedText style={[styles.aiScanTitle, { color: primaryColor }]}>Yapay Zeka Atık Taraması</ThemedText>
          <ThemedText style={[styles.aiScanDesc, { color: subText }]}>Kameranızı kullanarak atıklarınızı anında analiz edin</ThemedText>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={primaryColor} />
      </PressableScale>

      {/* Atık Kategorileri Bölümü */}
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Atık Kategorileri</ThemedText>
        <TouchableOpacity onPress={() => router.push('/(tabs)/waste')}>
          <ThemedText style={[styles.seeAllText, { color: primaryColor }]}>Tümünü Gör</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.quickAccessScroll}
        contentContainerStyle={styles.quickAccessScrollContent}
      >
        {memoizedWasteCategories.map((item: any, index: number) => (
          <PressableScale
            key={`category-${index}`}
            style={[styles.quickAccessCard, { backgroundColor: item.color + '15' }]}
            onPress={() => handleItemPress(item)}
          >
            <View style={[styles.categoryIconCircle, { backgroundColor: item.color + '25' }]}>
              <MaterialIcons name={item.icon as any} size={28} color={item.color} />
            </View>
            <ThemedText style={[styles.categoryName, { color: textColor }]}>{item.label}</ThemedText>
          </PressableScale>
        ))}
      </ScrollView>

      {/* Günün İpucu - Modern Banner */}
      <View style={styles.tipWrapper}>
        <View style={[styles.tipCard, { backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)', borderColor: glassBorder }]}>
          <View style={styles.tipHeader}>
            <View style={[styles.tipIconBox, { backgroundColor: '#FFC107' + '20' }]}>
              <MaterialIcons name="lightbulb-outline" size={22} color="#F5B041" />
            </View>
            <ThemedText style={[styles.tipTitle, { color: textColor }]}>Günün İpucu</ThemedText>
          </View>
          <ThemedText style={[styles.tipText, { color: subText }]}>
            {dailyTip}
          </ThemedText>
        </View>
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
    case 'cam': return 'wine-bar';
    case 'kagit': return 'description';
    case 'metal': return 'build';
    case 'organik': return 'eco';
    case 'elektronik': return 'devices';
    default: return 'delete';
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: '100%',
  },
  bgBlob: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  bgBlob2: {
    position: 'absolute',
    top: 200,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSection: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderWidth: 1,
    borderRadius: 24,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statNum: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  quickAccessScroll: {
    marginBottom: 32,
    marginHorizontal: -20, // container padding'i aşarak ekranın kenarlarına kadar scroll yapılabilmesi için
  },
  quickAccessScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickAccessCard: {
    width: 120, // Ekranda yaklaşık 2.5 - 3 eleman görünecek, kaydırılabilir hissiyatı verecek
    aspectRatio: 0.95,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  aiScanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(81, 166, 70, 0.3)',
  },
  aiScanIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiScanInfo: {
    flex: 1,
  },
  aiScanTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  aiScanDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  tipWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  tipCard: {
    padding: 24,
    borderWidth: 1,
    borderRadius: 24,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  tipText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
});
