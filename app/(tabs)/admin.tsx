import { CustomAlert } from '@/components/CustomAlert';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RecyclingPoint } from '@/constants/types';
import { useUser } from '@/context/UserContext';
import { db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, TextInput, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressableScale({ onPress, style, children, disabled = false }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function AdminScreen() {
  const { isAdmin } = useUser();

  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const inputBackground = useThemeColor({}, 'inputBackground');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const borderColor = useThemeColor({}, 'border');

  const isDark = backgroundColor === '#000' || backgroundColor.includes('black');
  const subText = isDark ? '#A0A0A0' : '#707070';
  const insets = useSafeAreaInsets();

  const [points, setPoints] = useState<RecyclingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const [editingPoint, setEditingPoint] = useState<RecyclingPoint | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', type: '' });
  const [saving, setSaving] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info', onConfirm: undefined as (() => void) | undefined
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onConfirm?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };
  const hideAlert = () => { setAlertConfig(prev => ({ ...prev, visible: false })); };

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    const unsubscribe = onSnapshot(collection(db, 'recyclingPoints'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecyclingPoint[];
      setPoints(data);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const filteredPoints = points.filter(p => {
    if (activeTab === 'pending') return !p.verified;
    return true;
  }).sort((a, b) => {
    if (activeTab === 'all' && a.verified !== b.verified) return a.verified ? 1 : -1;
    return 0;
  });

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'recyclingPoints', id), { verified: true });
      showAlert("Başarılı", "Nokta onaylandı.", 'success');
    } catch (e) { showAlert("Hata", "Onaylanamadı.", 'error'); }
  };

  const handleDelete = async (id: string) => {
    showAlert("Sil", "Bu noktayı silmek istediğinize emin misiniz?", 'warning', async () => {
      try {
        await deleteDoc(doc(db, 'recyclingPoints', id));
        showAlert("Başarılı", "Nokta başarıyla silindi.", 'success');
      } catch (e) { showAlert("Hata", "Silinemedi.", 'error'); }
    });
  };

  const openEditModal = (point: RecyclingPoint) => {
    setEditingPoint(point);
    setEditForm({ title: point.title, description: point.description, type: point.type });
  };

  const handleSaveEdit = async () => {
    if (!editingPoint) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'recyclingPoints', editingPoint.id), {
        title: editForm.title, description: editForm.description, type: editForm.type
      });
      setEditingPoint(null);
      showAlert("Başarılı", "Nokta güncellendi.", 'success');
    } catch (e: any) {
      showAlert("Hata", e.message, 'error');
    } finally { setSaving(false); }
  };

  const renderItem = ({ item }: { item: RecyclingPoint }) => (
    <View style={[styles.card, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
      <View style={styles.cardHeader}>
        <ThemedText style={[styles.cardTitle, { color: textColor }]}>{item.title}</ThemedText>
        <View style={[styles.badge, !item.verified ? styles.pendingBadge : styles.verifiedBadge]}>
          <ThemedText style={[styles.badgeText, { color: !item.verified ? '#E65100' : '#1B5E20' }]}>
            {!item.verified ? 'ONAY BEKLİYOR' : 'YAYINDA'}
          </ThemedText>
        </View>
      </View>
      <View style={[styles.typeBadge, { backgroundColor: primaryColor + '15' }]}>
        <ThemedText style={[styles.typeText, { color: primaryColor }]}>{item.type.toUpperCase()}</ThemedText>
      </View>
      <ThemedText style={[styles.description, { color: subText }]}>{item.description}</ThemedText>

      <View style={styles.actionButtons}>
        <PressableScale style={[styles.btn, { backgroundColor: '#FF4B4B' + '15' }]} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash" size={18} color="#FF4B4B" />
          <ThemedText style={[styles.btnText, { color: '#FF4B4B' }]}>Sil</ThemedText>
        </PressableScale>

        <PressableScale style={[styles.btn, { backgroundColor: primaryColor + '15' }]} onPress={() => openEditModal(item)}>
          <Ionicons name="create" size={18} color={primaryColor} />
          <ThemedText style={[styles.btnText, { color: primaryColor }]}>Düzenle</ThemedText>
        </PressableScale>

        {!item.verified && (
          <PressableScale style={[styles.btn, { backgroundColor: '#4CAF50' }]} onPress={() => handleApprove(item.id)}>
            <Ionicons name="checkmark-circle" size={18} color="#FFF" />
            <ThemedText style={[styles.btnText, { color: '#FFF' }]}>Onayla</ThemedText>
          </PressableScale>
        )}
      </View>
    </View>
  );

  if (loading) return <View style={[styles.center, { backgroundColor }]}><ActivityIndicator size="large" color={primaryColor} /></View>;
  if (!isAdmin) return <View style={[styles.center, { backgroundColor }]}><ThemedText style={styles.unauthorized}>Yetkisiz erişim.</ThemedText></View>;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.bgBlob, { backgroundColor: primaryColor, opacity: isDark ? 0.15 : 0.08 }]} />
      
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Yönetim Paneli</ThemedText>
      </View>

      <View style={styles.tabs}>
        <PressableScale style={[styles.tab, activeTab === 'pending' && { borderBottomColor: primaryColor }]} onPress={() => setActiveTab('pending')}>
          <ThemedText style={[styles.tabText, { color: activeTab === 'pending' ? primaryColor : subText, fontWeight: activeTab === 'pending' ? '800' : '600' }]}>
            Onay Bekleyenler ({points.filter(p => !p.verified).length})
          </ThemedText>
        </PressableScale>
        <PressableScale style={[styles.tab, activeTab === 'all' && { borderBottomColor: primaryColor }]} onPress={() => setActiveTab('all')}>
          <ThemedText style={[styles.tabText, { color: activeTab === 'all' ? primaryColor : subText, fontWeight: activeTab === 'all' ? '800' : '600' }]}>
            Tüm Noktalar ({points.length})
          </ThemedText>
        </PressableScale>
      </View>

      <FlatList
        data={filteredPoints}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} onConfirm={alertConfig.onConfirm ? () => { alertConfig.onConfirm?.(); hideAlert(); } : undefined} />

      <Modal visible={!!editingPoint} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <ThemedText style={styles.modalTitle}>Noktayı Düzenle</ThemedText>

            <ThemedText style={[styles.label, { color: subText }]}>Başlık</ThemedText>
            <TextInput style={[styles.input, { color: textColor, backgroundColor: inputBackground, borderColor: borderColor }]} value={editForm.title} placeholderTextColor={placeholderColor} onChangeText={t => setEditForm(prev => ({ ...prev, title: t }))} />

            <ThemedText style={[styles.label, { color: subText }]}>Açıklama</ThemedText>
            <TextInput style={[styles.input, styles.inputMulti, { color: textColor, backgroundColor: inputBackground, borderColor: borderColor }]} value={editForm.description} placeholderTextColor={placeholderColor} onChangeText={t => setEditForm(prev => ({ ...prev, description: t }))} multiline />

            <ThemedText style={[styles.label, { color: subText }]}>Atık Türü</ThemedText>
            <View style={[styles.pickerContainer, { borderColor: borderColor, backgroundColor: inputBackground }]}>
              <Picker selectedValue={editForm.type} dropdownIconColor={textColor} style={{ color: textColor }} onValueChange={(itemValue) => setEditForm(prev => ({ ...prev, type: itemValue }))}>
                <Picker.Item label="Plastik" value="plastik" />
                <Picker.Item label="Kağıt" value="kagit" />
                <Picker.Item label="Cam" value="cam" />
                <Picker.Item label="Metal" value="metal" />
                <Picker.Item label="Pil" value="pil" />
                <Picker.Item label="Elektronik" value="elektronik" />
                <Picker.Item label="Diğer" value="diger" />
              </Picker>
            </View>

            <View style={styles.modalActions}>
              <PressableScale style={[styles.modalBtn, { backgroundColor: '#999', flex: 1 }]} onPress={() => setEditingPoint(null)}>
                <ThemedText style={styles.modalBtnText}>İptal</ThemedText>
              </PressableScale>
              <PressableScale style={[styles.modalBtn, { backgroundColor: primaryColor, flex: 1 }]} onPress={handleSaveEdit}>
                {saving ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.modalBtnText}>Kaydet</ThemedText>}
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  bgBlob: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  unauthorized: { fontSize: 18, fontWeight: 'bold' },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 10, gap: 20 },
  tab: { paddingBottom: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 15 },
  list: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pendingBadge: { backgroundColor: '#FFF3E0' },
  verifiedBadge: { backgroundColor: '#E8F5E9' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  typeText: { fontSize: 12, fontWeight: '800' },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
  btnText: { fontSize: 14, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, padding: 24, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 50, fontSize: 16, marginBottom: 16 },
  inputMulti: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
