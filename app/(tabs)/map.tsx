
import { CustomAlert } from '@/components/CustomAlert';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

import { FilterPanel } from '@/components/map/FilterPanel';
import { PointDetailsCard } from '@/components/map/PointDetailsCard';
import { PointSubmissionModal } from '@/components/map/PointSubmissionModal';
import { getMarkerColor, getMarkerIcon } from '@/utils/mapHelpers';
import { RecyclingPoint } from '@/constants/types';
import { useUser } from '@/context/UserContext';
import { db } from '@/firebaseConfig';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';



export default function MapScreen() {
    const { user, isAdmin } = useUser();
    const mapRef = useRef<MapView>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [points, setPoints] = useState<RecyclingPoint[]>([]); // Firestore'dan gelen (Onaylı) ham veriler
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Yeni Nokta Ekleme State'leri
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const [centerCoordinate, setCenterCoordinate] = useState<{ latitude: number, longitude: number } | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Form State'leri
    const [newPointTitle, setNewPointTitle] = useState('');
    const [newPointDescription, setNewPointDescription] = useState('');
    const [newPointType, setNewPointType] = useState<RecyclingPoint['type']>('diger');
    const [submitting, setSubmitting] = useState(false);

    // Filtreleme State'leri
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.75)).current; // Başlangıçta ekran dışında

    // Geçici Filtreleme State'leri
    const [tempSearchQuery, setTempSearchQuery] = useState('');
    const [tempSelectedType, setTempSelectedType] = useState<string | null>(null);

    // Seçili Nokta State'i
    const [selectedPoint, setSelectedPoint] = useState<RecyclingPoint | null>(null);
    const [editingPoint, setEditingPoint] = useState<RecyclingPoint | null>(null);
    const [isUiVisible, setIsUiVisible] = useState(true);

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

    // Renkler
    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const cardColor = useThemeColor({}, 'card');
    const inputBackground = useThemeColor({}, 'inputBackground');
    const placeholderColor = useThemeColor({}, 'placeholder');

    useEffect(() => {
        let unsubscribe: any;

        (async () => {
            // 1. Konum izni
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Haritayı kullanmak için konum izni gereklidir.');
                showAlert('İzin Gerekli', 'Haritayı kullanmak için konum izni gereklidir.', 'error');
                setLoading(false);
                return;
            }

            let userLocation = await Location.getCurrentPositionAsync({});
            setLocation(userLocation);

            // 2. Veritabanından noktaları çek (Canlı Dinleme)
            try {
                unsubscribe = onSnapshot(collection(db, 'recyclingPoints'), (snapshot: any) => {
                    const pointsData = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data()
                    })) as RecyclingPoint[];

                    // Kural: Admin her şeyi görür. Kullanıcı onaylıları ve kendi eklediklerini görür.
                    const validPoints = pointsData.filter(p => {
                        if (isAdmin) return true;
                        if (p.verified) return true;
                        if (user && p.createdBy === user.uid) return true;
                        return false;
                    });

                    setPoints(validPoints);
                    setLoading(false);
                }, (error: any) => {
                    console.error("Points listen error:", error);
                    showAlert("Hata", "Veri çekilirken bir sorun oluştu: " + error.message, 'error');
                    setLoading(false);
                });

            } catch (error: any) {
                console.error("Setup listen error:", error);
                setLoading(false);
            }
        })();

        // Cleanup: Component unmount olduğunda veya user değiştiğinde dinlemeyi bırak
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]); // User değişince (giriş/çıkış) liste güncellenmeli

    // Panel Animasyonu
    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isPanelOpen ? 0 : -width * 0.75,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isPanelOpen]);

    // Harita her hareket ettiğinde merkez koordinatı güncelle
    const handleRegionChange = (region: any) => {
        if (isSelectingLocation) {
            setCenterCoordinate({
                latitude: region.latitude,
                longitude: region.longitude
            });
        }
    };

    const handleAddPointStart = () => {
        if (!user) {
            showAlert("Giriş Yapmalısınız", "Nokta eklemek için lütfen giriş yapın.", 'warning');
            return;
        }
        setEditingPoint(null); // Düzenleme modunu sıfırla
        setNewPointTitle('');
        setNewPointDescription('');
        setNewPointType('diger');
        setIsSelectingLocation(true);
        setIsPanelOpen(false); // Varsa paneli kapat

        // Başlangıçta mevcut konumu merkez al
        if (location) {
            setCenterCoordinate({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        }
    };

    const handleConfirmLocation = () => {
        if (centerCoordinate) {
            setIsModalVisible(true);
        }
    };

    const handleCancelSelection = () => {
        setIsSelectingLocation(false);
        setCenterCoordinate(null);
    };

    const handleEditPoint = (point: RecyclingPoint) => {
        setEditingPoint(point);
        setNewPointTitle(point.title);
        setNewPointDescription(point.description);
        setNewPointType(point.type);
        setCenterCoordinate({ latitude: point.latitude, longitude: point.longitude }); // Mevcut konumu set et
        setIsModalVisible(true);
    };

    const handleSubmitPoint = async () => {
        if (!newPointTitle || !newPointType || !centerCoordinate || !user) {
            showAlert("Eksik Bilgi", "Lütfen başlık ve kategori seçiniz.", 'warning');
            return;
        }

        setSubmitting(true);
        try {
            if (editingPoint) {
                // GÜNCELLEME İŞLEMİ
                await updateDoc(doc(db, 'recyclingPoints', editingPoint.id), {
                    title: newPointTitle,
                    description: newPointDescription,
                    type: newPointType,
                    // Konum güncellenmiyor, sadece bilgiler
                    updatedAt: serverTimestamp(),
                });
                showAlert("Başarılı", "Nokta bilgileri güncellendi.", 'success');
                setSelectedPoint(null); // Kartı kapat
            } else {
                // YENİ KAYIT İŞLEMİ
                await addDoc(collection(db, 'recyclingPoints'), {
                    title: newPointTitle,
                    description: newPointDescription,
                    type: newPointType,
                    latitude: centerCoordinate.latitude,
                    longitude: centerCoordinate.longitude,
                    verified: false, // Onay bekliyor
                    createdBy: user.uid,
                    createdAt: serverTimestamp(),
                });
                showAlert("Başarılı", "Geri dönüşüm noktası onaya gönderildi! Teşekkür ederiz.", 'success');
            }

            // Sıfırla
            setIsModalVisible(false);
            setIsSelectingLocation(false);
            setEditingPoint(null);
            setNewPointTitle('');
            setNewPointDescription('');
            setNewPointType('diger');

        } catch (error: any) {
            console.error("Submit point error:", error);
            showAlert("Hata", "İşlem sırasında bir sorun oluştu.", 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCenterLocation = () => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0122,
                longitudeDelta: 0.0121,
            });
        }
    };

    const handleResetNorth = () => {
        if (mapRef.current) {
            mapRef.current.animateCamera({ heading: 0, pitch: 0 });
        }
    };

    const handleVerifyPoint = async (id: string) => {
        if (!isAdmin) return;
        try {
            await updateDoc(doc(db, 'recyclingPoints', id), {
                verified: true,
                updatedAt: serverTimestamp(),
            });
            showAlert("Başarılı", "Nokta onaylandı.", 'success');
            setSelectedPoint(null);
        } catch (error) {
            console.error("Verify error:", error);
            showAlert("Hata", "Onaylama işlemi başarısız.", 'error');
        }
    };

    const handleDeletePoint = async (id: string) => {
        if (!isAdmin) return;
        showAlert("Noktayı Sil", "Bu geri dönüşüm noktasını silmek istediğinize emin misiniz?", 'warning', async () => {
            try {
                await deleteDoc(doc(db, 'recyclingPoints', id));
                setSelectedPoint(null); // Silince seçimi kaldır
                showAlert("Başarılı", "Nokta başarıyla silindi.", 'success');
            } catch (error) {
                console.error("Delete error:", error);
                showAlert("Hata", "Silme işlemi başarısız.", 'error');
            }
        });
    };

    const handleApplyFilters = () => {
        setSearchQuery(tempSearchQuery);
        setSelectedType(tempSelectedType);
        setIsPanelOpen(false);

        // Filtreleme sonucunu hesapla ve zoom yap
        const resultPoints = points.filter(point => {
            const matchesSearch = point.title.toLowerCase().includes(tempSearchQuery.toLowerCase()) ||
                point.description.toLowerCase().includes(tempSearchQuery.toLowerCase());
            const matchesType = tempSelectedType ? point.type === tempSelectedType : true;
            return matchesSearch && matchesType;
        });

        if (resultPoints.length > 0 && mapRef.current) {
            // Biraz gecikme ile zoom yap ki harita güncellensin
            setTimeout(() => {
                const coordinates = resultPoints.map(p => ({
                    latitude: p.latitude,
                    longitude: p.longitude
                }));

                mapRef.current?.fitToCoordinates(coordinates, {
                    edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
                    animated: true
                });
            }, 100);
        }
    };

    // Filtreleme Mantığı
    const filteredPoints = points.filter(point => {
        const matchesSearch = point.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            point.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType ? point.type === selectedType : true;
        return matchesSearch && matchesType;
    });



    if (loading) {
        return (
            <ThemedView style={[styles.container, styles.center, { backgroundColor }]}>
                <ActivityIndicator size="large" color={primaryColor} />
                <ThemedText style={{ marginTop: 10 }}>Harita yükleniyor...</ThemedText>
            </ThemedView>
        );
    }

    if (errorMsg) {
        return (
            <ThemedView style={[styles.container, styles.center, { backgroundColor }]}>
                <MaterialIcons name="location-off" size={48} color="#FF5252" />
                <ThemedText style={{ marginTop: 10, textAlign: 'center' }}>{errorMsg}</ThemedText>
            </ThemedView>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: location?.coords.latitude || 37.0585,
                    longitude: location?.coords.longitude || 36.2240,
                    latitudeDelta: 0.0122,
                    longitudeDelta: 0.0121,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                toolbarEnabled={false}
                onRegionChangeComplete={handleRegionChange}
                onPress={() => {
                    if (selectedPoint) {
                        setSelectedPoint(null);
                        setIsUiVisible(true); // Kart kapanınca UI geri gelsin
                    } else {
                        setIsUiVisible(!isUiVisible);
                    }
                }}
            >
                {/* Filtrelenmiş Noktalar */}
                {filteredPoints.map(point => (
                    <RecyclingMarker
                        key={point.id}
                        point={point}
                        onSelect={setSelectedPoint}
                    />
                ))}
            </MapView>

            {/* SEÇİM MODU: Merkez Hedef İkonu */}
            {isSelectingLocation && (
                <View style={styles.centerTargetContainer} pointerEvents="none">
                    <MaterialIcons name="add-location" size={48} color={primaryColor} />
                    <View style={styles.targetDot} />
                </View>
            )}

            {/* Menü Butonu (Sol Üst) */}
            {!isPanelOpen && !isSelectingLocation && !selectedPoint && isUiVisible && (
                <TouchableOpacity
                    style={[styles.menuButton, { backgroundColor: backgroundColor }]}
                    onPress={() => {
                        setTempSearchQuery(searchQuery);
                        setTempSelectedType(selectedType);
                        setIsPanelOpen(true);
                    }}
                >
                    <MaterialIcons name="menu" size={28} color={primaryColor} />
                </TouchableOpacity>
            )}

            {/* SEÇİM İPTAL BUTONU (Sol Üst) */}
            {isSelectingLocation && (
                <TouchableOpacity
                    style={[styles.menuButton, { backgroundColor: '#FF5252' }]}
                    onPress={handleCancelSelection}
                >
                    <MaterialIcons name="close" size={28} color="white" />
                </TouchableOpacity>
            )}

            {/* Yan Menü Paneli */}
            <FilterPanel
                isPanelOpen={isPanelOpen}
                setIsPanelOpen={setIsPanelOpen}
                slideAnim={slideAnim}
                tempSearchQuery={tempSearchQuery}
                setTempSearchQuery={setTempSearchQuery}
                tempSelectedType={tempSelectedType}
                setTempSelectedType={setTempSelectedType}
                handleApplyFilters={handleApplyFilters}
            />

            {/* Aksiyon Container (3 Butonlu) */}
            {!selectedPoint && isUiVisible && (
                <View style={styles.actionContainer}>
                    {/* Sol: Konumuna Git */}
                    <TouchableOpacity
                        style={[styles.circleButton, { backgroundColor: backgroundColor }]}
                        onPress={handleCenterLocation}
                    >
                        <MaterialIcons name="my-location" size={24} color={primaryColor} />
                    </TouchableOpacity>

                    {/* Orta: Nokta Ekle / Konumu Seç */}
                    {isSelectingLocation ? (
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: '#4CAF50' }]}
                            onPress={handleConfirmLocation}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="check" size={24} color="white" />
                            <ThemedText style={styles.addButtonText}>Konumu Seç</ThemedText>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: primaryColor }]}
                            onPress={handleAddPointStart}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="add-location-alt" size={24} color="white" />
                            <ThemedText style={styles.addButtonText}>Nokta Ekle</ThemedText>
                        </TouchableOpacity>
                    )}

                    {/* Sağ: Kuzeye Sabitle */}
                    <TouchableOpacity
                        style={[styles.circleButton, { backgroundColor: backgroundColor }]}
                        onPress={handleResetNorth}
                    >
                        <MaterialIcons name="explore" size={24} color={primaryColor} />
                    </TouchableOpacity>
                </View>
            )}

            {/* SEÇİLİ NOKTA DETAY KARTI */}
            {selectedPoint && (
                <PointDetailsCard
                    selectedPoint={selectedPoint}
                    setSelectedPoint={setSelectedPoint}
                    isAdmin={isAdmin}
                    handleVerifyPoint={handleVerifyPoint}
                    handleEditPoint={handleEditPoint}
                    handleDeletePoint={handleDeletePoint}
                    mapRef={mapRef}
                />
            )}

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

            {/* MODAL: Nokta Detay Formu */}
            <PointSubmissionModal
                isModalVisible={isModalVisible}
                setIsModalVisible={setIsModalVisible}
                editingPoint={editingPoint}
                newPointTitle={newPointTitle}
                setNewPointTitle={setNewPointTitle}
                newPointDescription={newPointDescription}
                setNewPointDescription={setNewPointDescription}
                newPointType={newPointType}
                setNewPointType={setNewPointType}
                submitting={submitting}
                handleSubmitPoint={handleSubmitPoint}
            />

        </View>
    );
}



// Performanslı Marker Bileşeni
const RecyclingMarker = ({ point, onSelect }: { point: RecyclingPoint, onSelect: (point: RecyclingPoint) => void }) => {
    const [tracksViewChanges, setTracksViewChanges] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTracksViewChanges(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setTracksViewChanges(true);
        const timer = setTimeout(() => {
            setTracksViewChanges(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [point]);

    return (
        <Marker
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            tracksViewChanges={tracksViewChanges}
            opacity={!point.verified ? 0.6 : 1.0}
            onPress={() => onSelect(point)}
            anchor={{ x: 0.5, y: 0.5 }}
        >
            <View style={styles.markerWrapper}>
                <View style={[
                    styles.markerContainer,
                    {
                        backgroundColor: !point.verified ? '#9E9E9E' : getMarkerColor(point.type),
                        borderColor: 'white'
                    }
                ]}>
                    <MaterialIcons name={getMarkerIcon(point.type) as any} size={20} color="white" />
                </View>
            </View>
        </Marker>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    map: {
        width: width,
        height: height,
    },
    // Menü Butonu
    menuButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        padding: 10,
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    // Yan Panel
    overlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 10,
    },
    sidePanel: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: '75%', // Ekranın %75'ini kapla
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        zIndex: 11,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    panelTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 10,
        color: '#666'
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        paddingVertical: 5,
    },
    panelFilters: {
        marginTop: 10,
    },
    sideChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    applyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20
    },
    applyButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10
    },

    // Diğer stiller
    markerWrapper: {
        padding: 5, // Gölge ve kenar kesilmelerini önlemek için alan bırakıyoruz
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: 'blue', // Default fallback
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    actionContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 5,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
    circleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },

    // MODAL STİLLERİ
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
        fontSize: 18,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginTop: 10,
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    typeChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 5,
    },

    // DETAY KARTI STİLLERİ
    detailCard: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        zIndex: 100,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    detailType: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    detailDesc: {
        fontSize: 14,
        color: '#444',
        marginBottom: 10,
        lineHeight: 20,
    },
    closeBtn: {
        padding: 5,
    },
    pendingTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    pendingText: {
        fontSize: 12,
        color: '#F57C00',
        marginLeft: 4,
        fontWeight: 'bold',
    },
    adminActions: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 5,
    },
    calloutContainer: {
        width: 200,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
    },
    calloutTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 5,
    },
    calloutDescription: {
        fontSize: 12,
    },
    // SEÇİM MODU STİLLERİ
    centerTargetContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -24,
        marginTop: -48,
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    targetDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'black',
        marginTop: -10,
    },
});
