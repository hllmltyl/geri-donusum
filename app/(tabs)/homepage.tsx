import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CATEGORY_FILTERS } from '@/constants/waste';
import { useUser } from '@/context/UserContext';
import { db } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, TouchableOpacity, View, FlatList } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const windowWidth = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_WIDTH = windowWidth * 0.38; // 2 tam kart ve 1 yarım kart (peek efekti) için hesaplanmış genişlik
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

const QuickAccessCard = memo(({ item, onPress, cardColor, textColor }: any) => {
  return (
    <PressableScale
      style={[styles.quickAccessCard, { backgroundColor: cardColor }]}
      onPress={() => onPress(item)}
    >
      <View style={[styles.categoryIconCircle, { backgroundColor: item.color + '20' }]}>
        <MaterialIcons name={item.icon as any} size={28} color={item.color} />
      </View>
      <ThemedText style={[styles.categoryName, { color: textColor }]}>{item.label}</ThemedText>
    </PressableScale>
  );
});

const WasteCategoryCard = memo(({ item, onPress, cardColor, textColor }: any) => {
  return (
    <PressableScale
      style={[styles.quickAccessCard, { backgroundColor: cardColor }]}
      onPress={() => onPress(item)}
    >
      <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: item.color + '15', borderRadius: 20 }]} />
      <View style={[styles.categoryIconCircle, { backgroundColor: item.color + '25' }]}>
        <MaterialIcons name={item.icon as any} size={28} color={item.color} />
      </View>
      <ThemedText style={[styles.categoryName, { color: textColor }]}>{item.label}</ThemedText>
    </PressableScale>
  );
});

export default function HomePage() {
  const router = useRouter();
  const { userProfile, user } = useUser();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Renkler
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  // Modern Tema Renkleri
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glassBg = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';
  const subText = isDark ? '#A0A0A0' : '#707070';

  // State'ler
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyTip, setDailyTip] = useState<string>(t('home.loadingTip'));
  const [wasteStats, setWasteStats] = useState({
    totalWastes: 0,
    categories: CATEGORY_FILTERS.length - 1,
    tips: 15
  });

  const userName = userProfile?.firstName || userProfile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || t('home.defaultUser');
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
      setError(err?.message || t('home.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleItemPress = useCallback((item: any) => {
    if (item.params) {
      router.navigate({ pathname: item.route, params: item.params });
    } else {
      router.navigate(item.route);
    }
  }, [router]);

  const navigateToLeaderboard = useCallback(() => router.navigate('/(tabs)/leaderboard'), [router]);
  const navigateToScan = useCallback(() => router.navigate('/(tabs)/scan'), [router]);
  const navigateToWaste = useCallback(() => router.navigate('/(tabs)/waste'), [router]);

  const exploreItems = [
    { label: t('home.exploreItems.map'), icon: 'map', color: '#4CAF50', route: '/(tabs)/map' },
    { label: t('home.exploreItems.guide'), icon: 'menu-book', color: '#00BCD4', route: '/(tabs)/waste' },
    { label: t('home.exploreItems.leaderboard'), icon: 'emoji-events', color: '#FFD700', route: '/(tabs)/leaderboard' },
  ];

  const wasteCategoryItems = useCallback(() => {
    return CATEGORY_FILTERS.filter(cat => cat.value !== 'hepsi').slice(0, 6).map(c => ({
      label: t(`wasteTypes.${c.value}`),
      value: c.value,
      icon: getCategoryIcon(c.value),
      color: getCategoryColor(c.value),
      route: '/(tabs)/waste',
      params: { category: c.value }
    }));
  }, [t]);

  const memoizedWasteCategories = useMemo(() => wasteCategoryItems(), [wasteCategoryItems]);

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={[styles.loadingText, { color: primaryColor }]}>{t('home.loading')}</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.errorContainer, { backgroundColor }]}>
        <MaterialIcons name="error-outline" size={64} color="#FF4B4B" />
        <ThemedText style={[styles.errorTitle, { color: textColor }]}>{t('home.errorTitle')}</ThemedText>
        <ThemedText style={[styles.errorText, { color: subText }]}>{error}</ThemedText>
        <PressableScale style={[styles.retryButton, { backgroundColor: primaryColor }]} onPress={loadData}>
          <ThemedText style={styles.retryButtonText}>{t('home.retry')}</ThemedText>
        </PressableScale>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor, paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
      {/* Dynamic Background Blobs */}
      <View style={[styles.bgBlob, { backgroundColor: primaryColor, opacity: isDark ? 0.15 : 0.08 }]} />
      <View style={[styles.bgBlob2, { backgroundColor: secondaryColor, opacity: isDark ? 0.1 : 0.05 }]} />

      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText style={[styles.greetingText, { color: subText }]}>{t('home.welcome')}</ThemedText>
            <ThemedText style={[styles.userNameText, { color: textColor }]}>{userName} </ThemedText>
          </View>
          <View style={[styles.avatarCircle, { backgroundColor: primaryColor + '20' }]}>
            <ThemedText style={{ color: primaryColor, fontWeight: 'bold', fontSize: 18 }}>
              {userName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Puan ve İlerleme Kartı (Glassmorphism) */}
      <PressableScale onPress={navigateToLeaderboard}>
        <View style={[styles.pointsWrapper, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
          <View style={[styles.pointsCard, { borderColor: glassBorder }]}>
            <View style={styles.pointsInfo}>
              <ThemedText style={[styles.pointsLabel, { color: subText }]}>{t('home.totalPoints')}</ThemedText>
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
          <ThemedText style={[styles.statLabel, { color: subText }]}>{t('home.wasteType')}</ThemedText>
        </PressableScale>

        <PressableScale style={[styles.statCard, { backgroundColor: cardColor }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: '#FF9800' + '15' }]}>
            <MaterialIcons name="category" size={24} color="#FF9800" />
          </View>
          <ThemedText style={[styles.statNum, { color: textColor }]}>{wasteStats.categories}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: subText }]}>{t('home.category')}</ThemedText>
        </PressableScale>
      </View>

      {/* Hızlı Erişim */}
      {/* Keşfet Bölümü */}
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>{t('home.explore')}</ThemedText>
      </View>

      <FlatList
        data={exploreItems}
        horizontal
        showsHorizontalScrollIndicator={true}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        style={styles.quickAccessScroll}
        contentContainerStyle={styles.quickAccessScrollContent}
        keyExtractor={(item, index) => `explore-${index}`}
        renderItem={({ item }) => (
          <QuickAccessCard
            item={item}
            onPress={handleItemPress}
            cardColor={cardColor}
            textColor={textColor}
          />
        )}
        initialNumToRender={5}
        windowSize={5}
        maxToRenderPerBatch={10}
      />

      {/* AI Atık Tarama Banner/Card */}
      <PressableScale
        style={[styles.aiScanCard, { backgroundColor: isDark ? 'rgba(81, 166, 70, 0.15)' : 'rgba(81, 166, 70, 0.1)' }]}
        onPress={navigateToScan}
      >
        <View style={[styles.aiScanIconBox, { backgroundColor: primaryColor }]}>
          <MaterialIcons name="camera-alt" size={24} color="#FFF" />
        </View>
        <View style={styles.aiScanInfo}>
          <ThemedText style={[styles.aiScanTitle, { color: primaryColor }]}>{t('home.aiScan')}</ThemedText>
          <ThemedText style={[styles.aiScanDesc, { color: subText }]}>{t('home.aiScanDesc')}</ThemedText>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={primaryColor} />
      </PressableScale>

      {/* Atık Kategorileri Bölümü */}
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>{t('home.wasteCategories')}</ThemedText>
        <TouchableOpacity onPress={navigateToWaste}>
          <ThemedText style={[styles.seeAllText, { color: primaryColor }]}>{t('home.seeAll')}</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={memoizedWasteCategories}
        horizontal
        showsHorizontalScrollIndicator={true}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        style={styles.quickAccessScroll}
        contentContainerStyle={styles.quickAccessScrollContent}
        keyExtractor={(item, index) => `category-${index}`}
        renderItem={({ item }) => (
          <WasteCategoryCard
            item={item}
            onPress={handleItemPress}
            cardColor={cardColor}
            textColor={textColor}
          />
        )}
        initialNumToRender={5}
        windowSize={5}
        maxToRenderPerBatch={10}
      />

      {/* Günün İpucu - Modern Banner */}
      <View style={[styles.tipWrapper, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <View style={[styles.tipCard, { borderColor: glassBorder }]}>
          <View style={styles.tipHeader}>
            <View style={[styles.tipIconBox, { backgroundColor: '#FFC107' + '20' }]}>
              <MaterialIcons name="lightbulb-outline" size={22} color="#F5B041" />
            </View>
            <ThemedText style={[styles.tipTitle, { color: textColor }]}>{t('home.tipOfTheDay')}</ThemedText>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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
    overflow: 'visible',
  },
  quickAccessScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: CARD_GAP,
  },
  quickAccessCard: {
    width: CARD_WIDTH, // Dinamik hesaplanmış peek genişliği
    aspectRatio: 0.95,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
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
