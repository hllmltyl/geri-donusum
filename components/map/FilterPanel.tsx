import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getMarkerColor, getMarkerIcon, WASTE_TYPES } from '@/utils/mapHelpers';
import { MaterialIcons } from '@expo/vector-icons';
import { Animated, Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

type FilterPanelProps = {
    isPanelOpen: boolean;
    setIsPanelOpen: (val: boolean) => void;
    slideAnim: Animated.Value;
    tempSearchQuery: string;
    setTempSearchQuery: (val: string) => void;
    tempSelectedType: string | null;
    setTempSelectedType: (val: string | null) => void;
    handleApplyFilters: () => void;
};

export function FilterPanel({
    isPanelOpen,
    setIsPanelOpen,
    slideAnim,
    tempSearchQuery,
    setTempSearchQuery,
    tempSelectedType,
    setTempSelectedType,
    handleApplyFilters
}: FilterPanelProps) {
    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const inputBackground = useThemeColor({}, 'inputBackground');
    const placeholderColor = useThemeColor({}, 'placeholder');

    return (
        <>
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
                <View style={[styles.searchBar, { backgroundColor: inputBackground, borderColor: '#ddd' }]}>
                    <MaterialIcons name="search" size={24} color={textColor} />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder="Nokta ara..."
                        placeholderTextColor={placeholderColor}
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
        </>
    );
}

const styles = StyleSheet.create({
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
        width: '75%',
        padding: 20,
        paddingTop: 60,
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
});
