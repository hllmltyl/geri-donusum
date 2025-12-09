import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// ... imports
// ... imports
import { RecyclingPoint } from '@/constants/types';
import { db } from '@/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

// ...

export default function MapScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [points, setPoints] = useState<RecyclingPoint[]>([]); // Tip güvenliği sağlandı
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Renkler
    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');

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

    const handleAddPoint = () => {
        Alert.alert('Yakında', 'Topluluk özelliği henüz geliştirilme aşamasındadır.');
    };

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
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: location?.coords.latitude || 37.0585,
                    longitude: location?.coords.longitude || 36.2240,
                    latitudeDelta: 0.0122,
                    longitudeDelta: 0.0121,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {/* Geri Dönüşüm Noktaları */}
                {points.map(point => (
                    <Marker
                        key={point.id}
                        coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                        title={point.title}
                        description={point.description}
                    >
                        <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(point.type) }]}>
                            <MaterialIcons name={getMarkerIcon(point.type) as any} size={20} color="white" />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Aksiyon Butonları */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: primaryColor }]}
                    onPress={handleAddPoint}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="add-location-alt" size={24} color="white" />
                    <ThemedText style={styles.addButtonText}>Nokta Ekle</ThemedText>
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
        default: return '#FF9800';
    }
}

function getMarkerIcon(type: string) {
    switch (type) {
        case 'pil': return 'battery-charging-full';
        case 'cam': return 'local-drink';
        case 'plastik': return 'science'; // temporary icon
        default: return 'place';
    }
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
    map: {
        width: width,
        height: height,
    },
    markerContainer: {
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    actionContainer: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
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
    }
});
