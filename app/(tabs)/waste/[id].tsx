import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WASTE_ITEMS } from '@/constants/waste';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function WasteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Renkler
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  const item = WASTE_ITEMS.find((it) => it.id === id);

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

  if (!item) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.headerBar, { backgroundColor: primaryColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>Atık Detayı</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={[styles.errorCard, { backgroundColor: cardColor }]}>
            <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
            <ThemedText type="subtitle" style={[styles.errorTitle, { color: textColor }]}>
              Atık Bulunamadı
            </ThemedText>
            <ThemedText style={[styles.errorText, { color: secondaryColor }]}>
              Aradığınız atık bulunamadı. Lütfen tekrar deneyin.
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: primaryColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Atık Detayı</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Atık Bilgi Kartı */}
        <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
          <View style={styles.iconSection}>
            <View style={[styles.largeIconContainer, { backgroundColor: getWasteColor(item.tur) }]}>
              <MaterialIcons 
                name={getWasteIcon(item.tur) as any} 
                size={64} 
                color="#fff" 
              />
            </View>
            <View style={styles.titleSection}>
              <ThemedText type="title" style={[styles.wasteTitle, { color: textColor }]}>
                {item.malzeme}
              </ThemedText>
              <View style={[styles.typeBadge, { backgroundColor: getWasteColor(item.tur) }]}>
                <ThemedText style={styles.typeBadgeText}>
                  {item.tur.toUpperCase()}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Yöntem Kartı */}
        <View style={[styles.detailCard, { backgroundColor: cardColor }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="eco" size={24} color={primaryColor} />
            <ThemedText type="subtitle" style={[styles.cardTitle, { color: textColor }]}>
              Geri Dönüşüm Yöntemi
            </ThemedText>
          </View>
          <ThemedText style={[styles.cardContent, { color: textColor }]}>
            {item.yontem}
          </ThemedText>
        </View>

        {/* Açıklama Kartı */}
        <View style={[styles.detailCard, { backgroundColor: cardColor }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info-outline" size={24} color={primaryColor} />
            <ThemedText type="subtitle" style={[styles.cardTitle, { color: textColor }]}>
              Detaylı Bilgi
            </ThemedText>
          </View>
          <ThemedText style={[styles.cardContent, { color: textColor }]}>
            {item.aciklama}
          </ThemedText>
        </View>

        {/* İpuçları Kartı */}
        <View style={[styles.detailCard, { backgroundColor: cardColor }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="lightbulb-outline" size={24} color={primaryColor} />
            <ThemedText type="subtitle" style={[styles.cardTitle, { color: textColor }]}>
              İpuçları
            </ThemedText>
          </View>
          {Array.isArray((item as any).ipucular) && (item as any).ipucular.length > 0 ? (
            <View>
              {(item as any).ipucular.map((t: string, idx: number) => (
                <ThemedText key={idx} style={[styles.cardContent, { color: textColor }]}>• {t}</ThemedText>
              ))}
            </View>
          ) : (
            <ThemedText style={[styles.cardContent, { color: textColor }]}>
              Atığı geri dönüştürmeden önce temizleyin ve doğru kutuya atın.
            </ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  headerBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 18,
    elevation: 4,
    shadowColor: '#51A646',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  iconSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  largeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  titleSection: {
    flex: 1,
  },
  wasteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  typeBadge: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  cardContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorCard: {
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

