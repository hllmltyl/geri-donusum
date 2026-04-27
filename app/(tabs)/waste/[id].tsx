import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WASTE_ITEMS } from '@/constants/waste';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressableScale({ onPress, style, children }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function WasteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');

  const isDark = backgroundColor === '#000' || backgroundColor.includes('black');
  const subText = isDark ? '#A0A0A0' : '#707070';

  const item = WASTE_ITEMS.find((it) => it.id === id);

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
      case 'boya': return '#3F51B5'; default: return '#51A646';
    }
  };

  if (!item) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.headerBar}>
          <PressableScale onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: cardColor }]}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </PressableScale>
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF4B4B" />
          <ThemedText style={[styles.errorTitle, { color: textColor }]}>Atık Bulunamadı</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const iconColor = getWasteColor(item.tur);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.bgBlob, { backgroundColor: iconColor, opacity: isDark ? 0.15 : 0.08 }]} />

      <View style={styles.headerBar}>
        <PressableScale onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', shadowColor: isDark ? '#000' : '#888' }]}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </PressableScale>
        <ThemedText type="title" style={styles.headerTitle}>Atık Detayı</ThemedText>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.mainVisual}>
          <View style={[styles.largeIconWrapper, { backgroundColor: iconColor + '20' }]}>
            <MaterialIcons name={getWasteIcon(item.tur) as any} size={80} color={iconColor} />
          </View>
          <ThemedText style={[styles.wasteTitle, { color: textColor }]}>{item.malzeme}</ThemedText>
          <View style={[styles.typeBadge, { backgroundColor: iconColor }]}>
            <ThemedText style={styles.typeBadgeText}>{item.tur.toUpperCase()}</ThemedText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: iconColor + '15' }]}>
              <MaterialIcons name="eco" size={24} color={iconColor} />
            </View>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Geri Dönüşüm Yöntemi</ThemedText>
          </View>
          <ThemedText style={[styles.cardContent, { color: subText }]}>{item.yontem}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#FF9800' + '15' }]}>
              <MaterialIcons name="info" size={24} color="#FF9800" />
            </View>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Detaylı Bilgi</ThemedText>
          </View>
          <ThemedText style={[styles.cardContent, { color: subText }]}>{item.aciklama}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#FFC107' + '15' }]}>
              <MaterialIcons name="lightbulb" size={24} color="#F5B041" />
            </View>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>İpuçları</ThemedText>
          </View>
          {Array.isArray((item as any).ipucular) && (item as any).ipucular.length > 0 ? (
            <View style={styles.tipsList}>
              {(item as any).ipucular.map((t: string, idx: number) => (
                <View key={idx} style={styles.tipItem}>
                  <View style={[styles.tipDot, { backgroundColor: iconColor }]} />
                  <ThemedText style={[styles.cardContent, { color: subText, flex: 1 }]}>{t}</ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={[styles.cardContent, { color: subText }]}>Atığı geri dönüştürmeden önce temizleyin ve doğru kutuya atın.</ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  bgBlob: { position: 'absolute', top: 0, left: -50, width: 300, height: 300, borderRadius: 150 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorTitle: { fontSize: 24, fontWeight: '800', marginTop: 16 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  backBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  contentContainer: { flex: 1, paddingHorizontal: 20 },
  mainVisual: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  largeIconWrapper: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  wasteTitle: { fontSize: 32, fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  typeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  typeBadgeText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  card: { borderRadius: 24, padding: 24, marginBottom: 16, elevation: 3, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardContent: { fontSize: 16, lineHeight: 26, fontWeight: '500' },
  tipsList: { gap: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start' },
  tipDot: { width: 8, height: 8, borderRadius: 4, marginTop: 10, marginRight: 12 },
});
