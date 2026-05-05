import { CustomAlert } from '@/components/CustomAlert';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ActivityIndicator, Animated, Dimensions, Platform, StyleSheet, View, Pressable } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MapView from 'react-native-maps';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useNavigation } from 'expo-router';

const { width } = Dimensions.get('window');

const AnimatedPressable = AnimatedReanimated.createAnimatedComponent(Pressable);

function PressableScale({ onPress, style, children, activeScale = 0.92, activeOpacity = 1 }: any) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
        <AnimatedPressable
            onPressIn={() => { scale.value = withSpring(activeScale, { damping: 15, stiffness: 300 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
            onPress={onPress}
            style={[style, animatedStyle]}
        >
            {children}
        </AnimatedPressable>
    );
}

import { FilterPanel } from '@/components/map/FilterPanel';
import { PointDetailsCard } from '@/components/map/PointDetailsCard';
import { PointSubmissionModal } from '@/components/map/PointSubmissionModal';
import { MapViewer } from '@/components/map/MapViewer';
import { RecyclingPoint } from '@/constants/types';
import { useUser } from '@/context/UserContext';
import { useMapLogic } from '@/hooks/useMapLogic';

export default function MapScreen() {
    const { user, isAdmin } = useUser();
    const mapRef = useRef<MapView>(null);
    const navigation = useNavigation();
    
    // Yeni Nokta Ekleme State'leri
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const [centerCoordinate, setCenterCoordinate] = useState<{ latitude: number, longitude: number } | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Form State'leri
    const [newPointTitle, setNewPointTitle] = useState('');
    const [newPointDescription, setNewPointDescription] = useState('');
    const [newPointType, setNewPointType] = useState<RecyclingPoint['type']>('diger');

    // Filtreleme State'leri
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.75)).current; 

    // Geçici Filtreleme State'leri
    const [tempSearchQuery, setTempSearchQuery] = useState('');
    const [tempSelectedType, setTempSelectedType] = useState<string | null>(null);

    // Seçili Nokta State'i
    const [selectedPoint, setSelectedPoint] = useState<RecyclingPoint | null>(null);
    const [editingPoint, setEditingPoint] = useState<RecyclingPoint | null>(null);
    const [isUiVisible, setIsUiVisible] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        onConfirm: undefined as (() => void) | undefined
    });

    const showAlert = useCallback((title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onConfirm?: () => void) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    }, []);

    // Custom hook kullanımı
    const { 
        location, points, errorMsg, loading, submitting, 
        submitPoint, verifyPoint, deletePoint 
    } = useMapLogic(user, isAdmin, retryCount, showAlert);

    // Renkler
    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const isFocused = useIsFocused();

    // Panel Animasyonu ve Alt Bar Kontrolü
    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isPanelOpen ? 0 : -width * 0.75,
            duration: 300,
            useNativeDriver: true,
        }).start();

        const parent = navigation.getParent();
        if (parent) {
            if (isPanelOpen) {
                parent.setOptions({ tabBarStyle: { display: 'none' } });
            } else {
                parent.setOptions({
                    tabBarStyle: {
                        display: 'flex',
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
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 20,
                        backgroundColor: backgroundColor,
                    }
                });
            }
        }
    }, [isPanelOpen, navigation]);

    const handleRegionChange = useCallback((region: any) => {
        if (isSelectingLocation) {
            setCenterCoordinate({
                latitude: region.latitude,
                longitude: region.longitude
            });
        }
    }, [isSelectingLocation]);

    const handleAddPointStart = useCallback(() => {
        if (!user) {
            showAlert("Giriş Yapmalısınız", "Nokta eklemek için lütfen giriş yapın.", 'warning');
            return;
        }
        setEditingPoint(null);
        setNewPointTitle('');
        setNewPointDescription('');
        setNewPointType('diger');
        setIsSelectingLocation(true);
        setIsPanelOpen(false);

        if (location) {
            setCenterCoordinate({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        }
    }, [user, location, showAlert]);

    const handleConfirmLocation = useCallback(() => {
        if (centerCoordinate) {
            setIsModalVisible(true);
        }
    }, [centerCoordinate]);

    const handleCancelSelection = useCallback(() => {
        setIsSelectingLocation(false);
        setCenterCoordinate(null);
    }, []);

    const handleEditPoint = useCallback((point: RecyclingPoint) => {
        setEditingPoint(point);
        setNewPointTitle(point.title);
        setNewPointDescription(point.description);
        setNewPointType(point.type);
        setCenterCoordinate({ latitude: point.latitude, longitude: point.longitude });
        setIsModalVisible(true);
    }, []);

    const handleSubmitPoint = useCallback(async () => {
        if (!centerCoordinate) return;
        const success = await submitPoint(editingPoint, newPointTitle, newPointDescription, newPointType, centerCoordinate);
        if (success) {
            setIsModalVisible(false);
            setIsSelectingLocation(false);
            setEditingPoint(null);
            setNewPointTitle('');
            setNewPointDescription('');
            setNewPointType('diger');
            if (editingPoint) setSelectedPoint(null);
        }
    }, [submitPoint, editingPoint, newPointTitle, newPointDescription, newPointType, centerCoordinate]);

    const handleCenterLocation = useCallback(() => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0122,
                longitudeDelta: 0.0121,
            });
        }
    }, [location]);

    const handleResetNorth = useCallback(() => {
        if (mapRef.current) {
            mapRef.current.animateCamera({ heading: 0, pitch: 0 });
        }
    }, []);

    const handleVerifyPoint = useCallback(async (id: string) => {
        const success = await verifyPoint(id);
        if (success) setSelectedPoint(null);
    }, [verifyPoint]);

    const handleDeletePoint = useCallback((id: string) => {
        showAlert("Noktayı Sil", "Bu geri dönüşüm noktasını silmek istediğinize emin misiniz?", 'warning', async () => {
            const success = await deletePoint(id);
            if (success) setSelectedPoint(null);
        });
    }, [showAlert, deletePoint]);

    const handleApplyFilters = useCallback(() => {
        setSearchQuery(tempSearchQuery);
        setSelectedType(tempSelectedType);
        setIsPanelOpen(false);

        const resultPoints = points.filter(point => {
            const matchesSearch = point.title.toLowerCase().includes(tempSearchQuery.toLowerCase()) ||
                point.description.toLowerCase().includes(tempSearchQuery.toLowerCase());
            const matchesType = tempSelectedType ? point.type === tempSelectedType : true;
            return matchesSearch && matchesType;
        });

        if (resultPoints.length > 0 && mapRef.current) {
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
    }, [points, tempSearchQuery, tempSelectedType]);

    const filteredPoints = useMemo(() => {
        return points.filter(point => {
            const matchesSearch = point.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                point.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = selectedType ? point.type === selectedType : true;
            return matchesSearch && matchesType;
        });
    }, [points, searchQuery, selectedType]);

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
                <ThemedText style={{ marginTop: 10, textAlign: 'center', marginBottom: 20 }}>{errorMsg}</ThemedText>
                <PressableScale
                    style={[styles.addButton, { backgroundColor: primaryColor }]}
                    onPress={() => setRetryCount(prev => prev + 1)}
                >
                    <MaterialIcons name="refresh" size={24} color="white" />
                    <ThemedText style={styles.addButtonText}>Tekrar Dene</ThemedText>
                </PressableScale>
            </ThemedView>
        );
    }

    return (
        <View style={styles.container}>
            <MapViewer 
                mapRef={mapRef}
                location={location}
                filteredPoints={filteredPoints}
                isFocused={isFocused}
                selectedPoint={selectedPoint}
                setSelectedPoint={setSelectedPoint}
                setIsUiVisible={setIsUiVisible}
                isUiVisible={isUiVisible}
                handleRegionChange={handleRegionChange}
                isSelectingLocation={isSelectingLocation}
            />

            {/* SEÇİM MODU: Merkez Hedef İkonu */}
            {isSelectingLocation && (
                <View style={styles.centerTargetContainer} pointerEvents="none">
                    <MaterialIcons name="add-location" size={48} color={primaryColor} />
                    <View style={styles.targetDot} />
                </View>
            )}

            {/* Menü Butonu (Sol Üst) */}
            {!isPanelOpen && !isSelectingLocation && !selectedPoint && isUiVisible && (
                <PressableScale
                    style={[styles.menuButton, { backgroundColor: backgroundColor }]}
                    onPress={() => {
                        setTempSearchQuery(searchQuery);
                        setTempSelectedType(selectedType);
                        setIsPanelOpen(true);
                    }}
                >
                    <MaterialIcons name="menu" size={28} color={primaryColor} />
                </PressableScale>
            )}

            {/* SEÇİM İPTAL BUTONU (Sol Üst) */}
            {isSelectingLocation && (
                <PressableScale
                    style={[styles.menuButton, { backgroundColor: '#FF5252' }]}
                    onPress={handleCancelSelection}
                >
                    <MaterialIcons name="close" size={28} color="white" />
                </PressableScale>
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
                    <PressableScale
                        style={[styles.circleButton, { backgroundColor: backgroundColor }]}
                        onPress={handleCenterLocation}
                    >
                        <MaterialIcons name="my-location" size={24} color={primaryColor} />
                    </PressableScale>

                    {/* Orta: Nokta Ekle / Konumu Seç */}
                    {isSelectingLocation ? (
                        <PressableScale
                            style={[styles.addButton, { backgroundColor: '#4CAF50' }]}
                            onPress={handleConfirmLocation}
                        >
                            <MaterialIcons name="check" size={24} color="white" />
                            <ThemedText style={styles.addButtonText}>Konumu Seç</ThemedText>
                        </PressableScale>
                    ) : (
                        <PressableScale
                            style={[styles.addButton, { backgroundColor: primaryColor }]}
                            onPress={handleAddPointStart}
                        >
                            <MaterialIcons name="add-location-alt" size={24} color="white" />
                            <ThemedText style={styles.addButtonText}>Nokta Ekle</ThemedText>
                        </PressableScale>
                    )}

                    {/* Sağ: Kuzeye Sabitle */}
                    <PressableScale
                        style={[styles.circleButton, { backgroundColor: backgroundColor }]}
                        onPress={handleResetNorth}
                    >
                        <MaterialIcons name="explore" size={24} color={primaryColor} />
                    </PressableScale>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
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
    actionContainer: {
        position: 'absolute',
        bottom: 110,
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
