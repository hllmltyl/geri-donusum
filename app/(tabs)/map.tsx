
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

import { RecyclingPoint } from '@/constants/types';
import { db } from '@/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

const WASTE_TYPES: { label: string, value: RecyclingPoint['type'] }[] = [
    { label: 'Pil', value: 'pil' },
    { label: 'Cam', value: 'cam' },
    { label: 'Plastik', value: 'plastik' },
    { label: 'Kağıt', value: 'kagit' },
    { label: 'Elektronik', value: 'elektronik' },
    { label: 'Diğer', value: 'diger' },
];

export default function MapScreen() {
    const mapRef = useRef<MapView>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [points, setPoints] = useState<RecyclingPoint[]>([]); // Firestore'dan gelen (Onaylı) ham veriler
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Filtreleme State'leri
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.75)).current; // Başlangıçta ekran dışında

    // Geçici Filtreleme State'leri
    const [tempSearchQuery, setTempSearchQuery] = useState('');
    const [tempSelectedType, setTempSelectedType] = useState<string | null>(null);

    // Renkler
    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');

    useEffect(() => {
        (async () => {
            // 1. Konum izni
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Haritayı kullanmak için konum izni gereklidir.');
                setLoading(false);
                return;
            }

            let userLocation = await Location.getCurrentPositionAsync({});
            setLocation(userLocation);

            // 2. Veritabanından noktaları çek (Canlı Dinleme)
            try {
                const unsubscribe = onSnapshot(collection(db, 'recyclingPoints'), (snapshot: any) => {
                    const pointsData = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data()
                    })) as RecyclingPoint[];

                    // Şimdilik sadece onaylı veya sistem tarafından eklenen noktaları gösterelim
                    const validPoints = pointsData.filter(p => p.verified === true);
                    setPoints(validPoints);
                    setLoading(false);
                }, (error: any) => {
                    console.error("Points listen error:", error);
                    Alert.alert("Hata", "Veri çekilirken bir sorun oluştu: " + error.message);
                    setLoading(false);
                });

                // Cleanup function
                return () => unsubscribe();
            } catch (error: any) {
                console.error("Setup listen error:", error);
                setLoading(false);
            }
        })();
    }, []);

    // Panel Animasyonu
    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isPanelOpen ? 0 : -width * 0.75,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isPanelOpen]);

    const handleAddPoint = () => {
        Alert.alert('Yakında', 'Topluluk özelliği henüz geliştirilme aşamasındadır.');
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
            >
                {/* Filtrelenmiş Noktalar */}
                {filteredPoints.map(point => (
                    <RecyclingMarker key={point.id} point={point} />
                ))}
            </MapView>

            {/* Menü Butonu (Sol Üst) */}
            {!isPanelOpen && (
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

            {/* Yan Menü Paneli - Artık her zaman render ediliyor ama animasyon ile yönetiliyor */}
            {isPanelOpen && (
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setIsPanelOpen(false)}
                />
            )}

            <Animated.View style={[
                styles.sidePanel,
                {
                    backgroundColor: backgroundColor,
                    transform: [{ translateX: slideAnim }]
                }
            ]}>
                <View style={styles.panelHeader}>
                    <ThemedText style={styles.panelTitle}>Filtreleme</ThemedText>
                    <TouchableOpacity onPress={() => setIsPanelOpen(false)}>
                        <MaterialIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ThemedText style={styles.sectionLabel}>Arama</ThemedText>
                <View style={[styles.searchBar, { borderColor: '#ddd' }]}>
                    <MaterialIcons name="search" size={24} color="#666" />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder="Nokta ara..."
                        placeholderTextColor="#999"
                        value={tempSearchQuery}
                        onChangeText={setTempSearchQuery}
                    />
                    {tempSearchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setTempSearchQuery('')}>
                            <MaterialIcons name="close" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                <ThemedText style={styles.sectionLabel}>Kategoriler</ThemedText>
                <ScrollView style={styles.panelFilters} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[
                            styles.sideChip,
                            {
                                backgroundColor: tempSelectedType === null ? primaryColor : 'transparent',
                                borderColor: tempSelectedType === null ? primaryColor : '#ddd'
                            }
                        ]}
                        onPress={() => setTempSelectedType(null)}
                    >
                        <MaterialIcons name="dashboard" size={20} color={tempSelectedType === null ? 'white' : '#666'} />
                        <ThemedText style={{ marginLeft: 10, color: tempSelectedType === null ? 'white' : textColor }}>Tümü</ThemedText>
                    </TouchableOpacity>

                    {WASTE_TYPES.map(type => (
                        <TouchableOpacity
                            key={type.value}
                            style={[
                                styles.sideChip,
                                {
                                    backgroundColor: tempSelectedType === type.value ? primaryColor : 'transparent',
                                    borderColor: tempSelectedType === type.value ? primaryColor : '#ddd'
                                }
                            ]}
                            onPress={() => setTempSelectedType(tempSelectedType === type.value ? null : type.value)}
                        >
                            <MaterialIcons name={getMarkerIcon(type.value) as any} size={20} color={tempSelectedType === type.value ? 'white' : getMarkerColor(type.value)} />
                            <ThemedText style={{ marginLeft: 10, color: tempSelectedType === type.value ? 'white' : textColor }}>{type.label}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Filtreyi Uygula Butonu */}
                <TouchableOpacity
                    style={[styles.applyButton, { backgroundColor: primaryColor }]}
                    onPress={handleApplyFilters}
                >
                    <ThemedText style={styles.applyButtonText}>Filtreyi Uygula</ThemedText>
                    <MaterialIcons name="check" size={20} color="white" />
                </TouchableOpacity>
            </Animated.View>

            {/* Aksiyon Container (3 Butonlu) */}
            <View style={styles.actionContainer}>
                {/* Sol: Konumuna Git */}
                <TouchableOpacity
                    style={[styles.circleButton, { backgroundColor: backgroundColor }]}
                    onPress={handleCenterLocation}
                >
                    <MaterialIcons name="my-location" size={24} color={primaryColor} />
                </TouchableOpacity>

                {/* Orta: Nokta Ekle */}
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: primaryColor }]}
                    onPress={handleAddPoint}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="add-location-alt" size={24} color="white" />
                    <ThemedText style={styles.addButtonText}>Nokta Ekle</ThemedText>
                </TouchableOpacity>

                {/* Sağ: Kuzeye Sabitle */}
                <TouchableOpacity
                    style={[styles.circleButton, { backgroundColor: backgroundColor }]}
                    onPress={handleResetNorth}
                >
                    <MaterialIcons name="explore" size={24} color={primaryColor} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Görsel yardımcılar
function getMarkerColor(type: string) {
    switch (type) {
        case 'pil': return '#F44336';
        case 'cam': return '#4CAF50';
        case 'plastik': return '#2196F3';
        case 'kagit': return '#795548';
        case 'elektronik': return '#607D8B';
        default: return '#FF9800';
    }
}

function getMarkerIcon(type: string) {
    switch (type) {
        case 'pil': return 'battery-charging-full';
        case 'cam': return 'local-drink';
        case 'plastik': return 'science';
        case 'kagit': return 'description'; // 'article' yerine 'description'
        case 'elektronik': return 'devices'; // 'memory' yerine 'devices'
        default: return 'place';
    }
}

// Performanslı Marker Bileşeni
const RecyclingMarker = ({ point }: { point: RecyclingPoint }) => {
    const [tracksViewChanges, setTracksViewChanges] = useState(true);
    const primaryColor = useThemeColor({}, 'primary'); // Hooks sadece component içinde kullanılır

    useEffect(() => {
        // İkon yüklendikten sonra render'ı dondur (Titremeyi önler, görünürlüğü sağlar)
        const timer = setTimeout(() => {
            setTracksViewChanges(false);
        }, 500); // 500ms render için süre tanı
        return () => clearTimeout(timer);
    }, []);

    // Point değişirse tekrar render et
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
            title={point.title}
            description={point.description || 'Açıklama yok'}
            tracksViewChanges={tracksViewChanges}
        >
            <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(point.type) }]}>
                <MaterialIcons name={getMarkerIcon(point.type) as any} size={20} color="white" />
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
    markerContainer: {
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: 'blue', // Default fallback
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16
    },
    circleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    calloutContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        width: 150,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    calloutTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: 'black',
        marginBottom: 4,
    },
    calloutDescription: {
        fontSize: 12,
        color: '#666',
    }
});