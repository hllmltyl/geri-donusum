import { ThemedText } from '@/components/ThemedText';
import { RecyclingPoint } from '@/constants/types';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getMarkerColor, WASTE_TYPES } from '@/utils/mapHelpers';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type PointSubmissionModalProps = {
    isModalVisible: boolean;
    setIsModalVisible: (val: boolean) => void;
    editingPoint: RecyclingPoint | null;
    newPointTitle: string;
    setNewPointTitle: (val: string) => void;
    newPointDescription: string;
    setNewPointDescription: (val: string) => void;
    newPointType: RecyclingPoint['type'];
    setNewPointType: (val: RecyclingPoint['type']) => void;
    submitting: boolean;
    handleSubmitPoint: () => void;
};

export function PointSubmissionModal({
    isModalVisible,
    setIsModalVisible,
    editingPoint,
    newPointTitle,
    setNewPointTitle,
    newPointDescription,
    setNewPointDescription,
    newPointType,
    setNewPointType,
    submitting,
    handleSubmitPoint
}: PointSubmissionModalProps) {
    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const inputBackground = useThemeColor({}, 'inputBackground');

    return (
        <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <ThemedText type="subtitle" style={styles.modalTitle}>
                            {editingPoint ? 'Noktayı Düzenle' : 'Yeni Geri Dönüşüm Noktası'}
                        </ThemedText>

                        <ThemedText style={styles.inputLabel}>Başlık</ThemedText>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor: '#ddd', backgroundColor: inputBackground }]}
                            placeholder="Örn: Park Pil Kutusu"
                            placeholderTextColor="#999"
                            value={newPointTitle}
                            onChangeText={setNewPointTitle}
                        />

                        <ThemedText style={styles.inputLabel}>Açıklama</ThemedText>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor: '#ddd', height: 80, backgroundColor: inputBackground }]}
                            placeholder="Detaylı bilgi..."
                            placeholderTextColor="#999"
                            multiline
                            value={newPointDescription}
                            onChangeText={setNewPointDescription}
                        />

                        <ThemedText style={styles.inputLabel}>Atık Türü</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                            {WASTE_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.typeChip,
                                        {
                                            backgroundColor: newPointType === type.value ? getMarkerColor(type.value) : 'transparent',
                                            borderColor: newPointType === type.value ? getMarkerColor(type.value) : '#ddd'
                                        }
                                    ]}
                                    onPress={() => setNewPointType(type.value as any)}
                                >
                                    <ThemedText style={{ color: newPointType === type.value ? 'white' : textColor }}>{type.label}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#ddd' }]}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <ThemedText style={{ color: 'black' }}>İptal</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: primaryColor }]}
                                onPress={handleSubmitPoint}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>
                                        {editingPoint ? 'Güncelle' : 'Gönder'}
                                    </ThemedText>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
});
