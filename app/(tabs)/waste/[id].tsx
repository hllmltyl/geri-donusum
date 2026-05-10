import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WASTE_ITEMS } from '@/constants/waste';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handleBack = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
    }
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 25 : 15,
            left: 20,
            right: 20,
            height: Platform.OS === 'ios' ? 88 : 68,
            borderRadius: 35,
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            borderTopWidth: 0,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            backgroundColor: 'transparent',
          }
        });
      }
    };
  }, [navigation]);

  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
          <PressableScale onPress={handleBack} style={[styles.backBtn, { backgroundColor: cardColor }]}>
            <MaterialIcons name="chevron-left" size={28} color={textColor} />
          </PressableScale>
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF4B4B" />
          <ThemedText style={[styles.errorTitle, { color: textColor }]}>{t('guide.notFound')}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const iconColor = getWasteColor(item.tur);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.bgBlob, { backgroundColor: iconColor, opacity: isDark ? 0.15 : 0.08 }]} />

      <View style={styles.headerBar}>
        <PressableScale onPress={handleBack} style={[styles.backBtn, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', shadowColor: isDark ? '#000' : '#888' }]}>
          <MaterialIcons name="chevron-left" size={28} color={textColor} />
        </PressableScale>
        <ThemedText type="title" style={styles.headerTitle}>{t('guide.detailTitle')}</ThemedText>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.mainVisual}>
          <View style={[styles.largeIconWrapper, { backgroundColor: iconColor + '20' }]}>
            <MaterialIcons name={getWasteIcon(item.tur) as any} size={80} color={iconColor} />
          </View>
          <ThemedText style={[styles.wasteTitle, { color: textColor }]}>{item.malzeme}</ThemedText>
          <View style={[styles.typeBadge, { backgroundColor: iconColor }]}>
            <ThemedText style={styles.typeBadgeText}>{t(`wasteTypes.${item.tur}`)}</ThemedText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: iconColor + '15' }]}>
              <MaterialIcons name="eco" size={24} color={iconColor} />
            </View>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>{t('guide.method')}</ThemedText>
          </View>
          <ThemedText style={[styles.cardContent, { color: subText }]}>{item.yontem}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#FF9800' + '15' }]}>
              <MaterialIcons name="info" size={24} color="#FF9800" />
            </View>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>{t('guide.details')}</ThemedText>
          </View>
          <ThemedText style={[styles.cardContent, { color: subText }]}>{item.aciklama}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#FFC107' + '15' }]}>
              <MaterialIcons name="lightbulb" size={24} color="#F5B041" />
            </View>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>{t('guide.tips')}</ThemedText>
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
            <ThemedText style={[styles.cardContent, { color: subText }]}>{t('guide.defaultTip')}</ThemedText>
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
  backBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  contentContainer: { flex: 1, paddingHorizontal: 20 },
  mainVisual: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  largeIconWrapper: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  wasteTitle: { fontSize: 32, fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  typeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  typeBadgeText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  card: { borderRadius: 24, padding: 24, marginBottom: 16, elevation: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardContent: { fontSize: 16, lineHeight: 26, fontWeight: '500' },
  tipsList: { gap: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start' },
  tipDot: { width: 8, height: 8, borderRadius: 4, marginTop: 10, marginRight: 12 },
});
