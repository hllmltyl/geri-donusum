import { CustomAlert } from '@/components/CustomAlert';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RecyclingPoint } from '@/constants/types';
import { useUser } from '@/context/UserContext';
import { db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // You might need to install this package
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminScreen() {
    const { isAdmin } = useUser();

    // Theme Colors
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const textColor = useThemeColor({}, 'text');
    const inputBackground = useThemeColor({}, 'inputBackground');
    const placeholderColor = useThemeColor({}, 'placeholder');

    const [points, setPoints] = useState<RecyclingPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

    // Edit Modal State
    const [editingPoint, setEditingPoint] = useState<RecyclingPoint | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', type: '' });
    const [saving, setSaving] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        onConfirm: undefined as (() => void) | undefined
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onConfirm?: () => void) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(collection(db, 'recyclingPoints'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RecyclingPoint[];
            setPoints(data);
            setLoading(false);
        }, (error) => {
            console.error(error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    const filteredPoints = points.filter(p => {
        if (activeTab === 'pending') return !p.verified;
        return true; // Show all (maybe filter approved only? User asked for "All")
    }).sort((a, b) => {
        // Sort by creation time if available, or just put pending on top for 'All' view
        if (activeTab === 'all' && a.verified !== b.verified) {
            return a.verified ? 1 : -1;
        }
        return 0;
    });

    const handleApprove = async (id: string) => {
        try {
            await updateDoc(doc(db, 'recyclingPoints', id), { verified: true });
            showAlert("Başarılı", "Nokta onaylandı.", 'success');
        } catch (e) {
            console.error(e);
            showAlert("Hata", "Onaylanamadı.", 'error');
        }
    };

    const handleDelete = async (id: string) => {
        showAlert("Sil", "Bu noktayı silmek istediğinize emin misiniz?", 'warning', async () => {
            try {
                await deleteDoc(doc(db, 'recyclingPoints', id));
                showAlert("Başarılı", "Nokta başarıyla silindi.", 'success');
            } catch (e) {
                console.error(e);
                showAlert("Hata", "Silinemedi.", 'error');
            }
        });
    };

    const openEditModal = (point: RecyclingPoint) => {
        setEditingPoint(point);
        setEditForm({
            title: point.title,
            description: point.description,
            type: point.type
        });
    };

    const handleSaveEdit = async () => {
        if (!editingPoint) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'recyclingPoints', editingPoint.id), {
                title: editForm.title,
                description: editForm.description,
                type: editForm.type
            });
            setEditingPoint(null);
            showAlert("Başarılı", "Nokta güncellendi.", 'success');
        } catch (e: any) {
            showAlert("Hata", e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const renderItem = ({ item }: { item: RecyclingPoint }) => (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
            <View style={styles.cardHeader}>
                <ThemedText type="subtitle" style={{ color: textColor }}>{item.title}</ThemedText>
            </View>
            <ThemedText style={[styles.typeText, { color: textColor }]}>Tür: {item.type.toUpperCase()}</ThemedText>
            <ThemedText style={[styles.description, { color: textColor }]}>{item.description}</ThemedText>

            <View style={styles.cardFooter}>
                <View style={[styles.badge, !item.verified ? styles.pendingBadge : styles.verifiedBadge]}>
                    <ThemedText style={styles.badgeText}>
                        {!item.verified ? 'ONAY BEKLİYOR' : 'YAYINDA'}
                    </ThemedText>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <ThemedText style={styles.btnText}>Sil</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.btn, styles.btnEdit]} onPress={() => openEditModal(item)}>
                        <Ionicons name="create-outline" size={18} color="#fff" />
                        <ThemedText style={styles.btnText}>Düzenle</ThemedText>
                    </TouchableOpacity>

                    {!item.verified && (
                        <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => handleApprove(item.id)}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                            <ThemedText style={styles.btnText}>Onayla</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    if (!isAdmin) return <View style={styles.center}><ThemedText>Yetkisiz erişim.</ThemedText></View>;

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { backgroundColor: backgroundColor }]}>
                <ThemedText type="title">Yönetim Paneli</ThemedText>
            </View>

            <View style={[styles.tabs, { backgroundColor: backgroundColor }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <ThemedText style={[styles.tabText, { color: textColor }, activeTab === 'pending' && styles.activeTabText]}>
                        Onay Bekleyenler ({points.filter(p => !p.verified).length})
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                >
                    <ThemedText style={[styles.tabText, { color: textColor }, activeTab === 'all' && styles.activeTabText]}>
                        Tüm Noktalar ({points.length})
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredPoints}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />

            {/* Edit Modal */}
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={hideAlert}
                onConfirm={alertConfig.onConfirm ? () => {
                    alertConfig.onConfirm?.();
                    hideAlert();
                } : undefined}
            />

            <Modal visible={!!editingPoint} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                        <ThemedText type="subtitle">Noktayı Düzenle</ThemedText>

                        <ThemedText style={[styles.label, { color: textColor }]}>Başlık</ThemedText>
                        <TextInput
                            style={[styles.input, { color: textColor, backgroundColor: inputBackground, borderColor: '#ddd' }]}
                            value={editForm.title}
                            placeholderTextColor={placeholderColor}
                            onChangeText={t => setEditForm(prev => ({ ...prev, title: t }))}
                        />

                        <ThemedText style={[styles.label, { color: textColor }]}>Açıklama</ThemedText>
                        <TextInput
                            style={[styles.input, { color: textColor, backgroundColor: inputBackground, borderColor: '#ddd' }]}
                            value={editForm.description}
                            placeholderTextColor={placeholderColor}
                            onChangeText={t => setEditForm(prev => ({ ...prev, description: t }))}
                            multiline
                        />

                        <ThemedText style={[styles.label, { color: textColor }]}>Atık Türü</ThemedText>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={editForm.type}
                                dropdownIconColor={textColor}
                                style={{ color: textColor }}
                                onValueChange={(itemValue) => setEditForm(prev => ({ ...prev, type: itemValue }))}>
                                <Picker.Item label="Plastik" value="plastik" />
                                <Picker.Item label="Kağıt" value="kagit" />
                                <Picker.Item label="Cam" value="cam" />
                                <Picker.Item label="Metal" value="metal" />
                                <Picker.Item label="Pil" value="pil" />
                                <Picker.Item label="Elektronik" value="elektronik" />
                                <Picker.Item label="Mavi Kapak" value="mavi_kapak" />
                                <Picker.Item label="Yağ" value="yag" />
                                <Picker.Item label="Tekstil" value="tekstil" />
                                <Picker.Item label="Organik" value="organik" />
                                <Picker.Item label="Ahşap" value="ahsap" />
                                <Picker.Item label="Tıbbi" value="tibbi" />
                                <Picker.Item label="İnşaat" value="insaat" />
                                <Picker.Item label="Beyaz Eşya" value="beyazesya" />
                                <Picker.Item label="Lastik" value="lastik" />
                                <Picker.Item label="Mobilya" value="mobilya" />
                                <Picker.Item label="Kompozit" value="kompozit" />
                                <Picker.Item label="Boya" value="boya" />
                                <Picker.Item label="Diğer" value="diger" />
                            </Picker>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setEditingPoint(null)}>
                                <ThemedText style={{ color: 'white' }}>İptal</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSaveEdit}>
                                {saving ? <ActivityIndicator color="white" /> : <ThemedText style={{ color: 'white' }}>Kaydet</ThemedText>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#fff' },
    tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 10 },
    tab: { marginRight: 20, paddingBottom: 8 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#4CAF50' },
    tabText: { fontSize: 16, color: '#666' },
    activeTabText: { color: '#4CAF50', fontWeight: 'bold' },
    list: { padding: 20 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    pendingBadge: { backgroundColor: '#FFF3E0' },
    verifiedBadge: { backgroundColor: '#E8F5E9' },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    typeText: { fontSize: 12, color: '#888', marginBottom: 5 },
    description: { fontSize: 14, color: '#444', marginBottom: 15 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionButtons: { flexDirection: 'row', gap: 10 },
    btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
    btnDelete: { backgroundColor: '#F44336' },
    btnEdit: { backgroundColor: '#2196F3' },
    btnApprove: { backgroundColor: '#4CAF50' },
    btnText: { color: 'white', fontSize: 12, marginLeft: 4, fontWeight: 'bold' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20 },
    label: { marginTop: 15, marginBottom: 5, fontSize: 14, fontWeight: 'bold', color: '#555' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16 },
    pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
    modalActions: { flexDirection: 'row', marginTop: 20, justifyContent: 'flex-end', gap: 10 },
    modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    modalBtnCancel: { backgroundColor: '#999' },
    modalBtnSave: { backgroundColor: '#4CAF50' }
});
