import { ThemedText } from '@/components/ThemedText';
import { RecyclingPoint } from '@/constants/types';
import { useThemeColor } from '@/hooks/useThemeColor';
import { WASTE_TYPES } from '@/utils/mapHelpers';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView from 'react-native-maps';

type PointDetailsCardProps = {
    selectedPoint: RecyclingPoint;
    setSelectedPoint: (point: RecyclingPoint | null) => void;
    isAdmin: boolean;
    handleVerifyPoint: (id: string) => void;
    handleEditPoint: (point: RecyclingPoint) => void;
    handleDeletePoint: (id: string) => void;
    mapRef: React.RefObject<MapView>;
};

export function PointDetailsCard({
    selectedPoint,
    setSelectedPoint,
    isAdmin,
    handleVerifyPoint,
    handleEditPoint,
    handleDeletePoint,
    mapRef
}: PointDetailsCardProps) {
    const cardColor = useThemeColor({}, 'card');
    const textColor = useThemeColor({}, 'text');

    return (
        <TouchableOpacity
            style={[styles.detailCard, { backgroundColor: cardColor }]}
            activeOpacity={1}
            onPress={() => {
                mapRef.current?.animateToRegion({
                    latitude: selectedPoint.latitude,
                    longitude: selectedPoint.longitude,
                    latitudeDelta: 0.0122,
                    longitudeDelta: 0.0121,
                });
            }}
        >
            <View style={styles.detailHeader}>
                <View>
                    <ThemedText type="subtitle" style={{ color: textColor }}>{selectedPoint.title}</ThemedText>
                    <ThemedText style={[styles.detailType, { color: textColor }]}>
                        {WASTE_TYPES.find(t => t.value === selectedPoint.type)?.label || selectedPoint.type.toUpperCase()}
                    </ThemedText>
                </View>
                <TouchableOpacity onPress={() => setSelectedPoint(null)} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
            </View>

            <ThemedText style={[styles.detailDesc, { color: textColor }]}>{selectedPoint.description}</ThemedText>
            {!selectedPoint.verified && (
                <View style={styles.pendingTag}>
                    <MaterialIcons name="hourglass-empty" size={14} color="#F57C00" />
                    <ThemedText style={styles.pendingText}>Onay Bekliyor</ThemedText>
                </View>
            )}

            {isAdmin && (
                <View style={styles.adminActions}>
                    {!selectedPoint.verified && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#4CAF50', marginRight: 10 }]}
                            onPress={() => handleVerifyPoint(selectedPoint.id)}
                        >
                            <MaterialIcons name="check-circle" size={18} color="white" />
                            <ThemedText style={styles.actionBtnText}>ONAYLA</ThemedText>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#2196F3', marginRight: 10 }]}
                        onPress={() => handleEditPoint(selectedPoint)}
                    >
                        <MaterialIcons name="edit" size={18} color="white" />
                        <ThemedText style={styles.actionBtnText}>DÜZENLE</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#F44336' }]}
                        onPress={() => {
                            handleDeletePoint(selectedPoint.id);
                            setSelectedPoint(null);
                        }}
                    >
                        <MaterialIcons name="delete" size={18} color="white" />
                        <ThemedText style={styles.actionBtnText}>SİL</ThemedText>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    detailCard: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
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
    detailType: {
        fontSize: 12,
        marginTop: 2,
    },
    detailDesc: {
        fontSize: 14,
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
});
