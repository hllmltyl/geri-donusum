import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

const { width } = Dimensions.get('window');

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: AlertType;
    onClose: () => void;
    onConfirm?: () => void; // If provided, shows a confirmation button alongside cancel
}

export function CustomAlert({ visible, title, message, type = 'info', onClose, onConfirm }: CustomAlertProps) {
    const backgroundColor = useThemeColor({}, 'background');
    const primaryColor = useThemeColor({}, 'primary');

    if (!visible) return null;

    let iconName: any = 'info';
    let iconColor = primaryColor;

    switch (type) {
        case 'success':
            iconName = 'check-circle';
            iconColor = '#4CAF50';
            break;
        case 'error':
            iconName = 'error';
            iconColor = '#F44336';
            break;
        case 'warning':
            iconName = 'warning';
            iconColor = '#FF9800';
            break;
        case 'info':
        default:
            iconName = 'info';
            iconColor = '#2196F3';
            break;
    }

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.alertBox, { backgroundColor }]}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                        <MaterialIcons name={iconName} size={40} color={iconColor} />
                    </View>

                    <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
                    <ThemedText style={styles.message}>{message}</ThemedText>

                    <View style={styles.buttonContainer}>
                        {onConfirm ? (
                            <>
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                                    <ThemedText style={styles.cancelButtonText}>İptal</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, { backgroundColor: iconColor }]} onPress={onConfirm}>
                                    <ThemedText style={styles.confirmButtonText}>Tamam</ThemedText>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity style={[styles.button, { backgroundColor: iconColor }]} onPress={onClose}>
                                <ThemedText style={styles.confirmButtonText}>Tamam</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertBox: {
        width: width * 0.85,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        padding: 15,
        borderRadius: 50,
        marginBottom: 16,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 20,
    },
    message: {
        textAlign: 'center',
        marginBottom: 24,
        color: '#666',
        fontSize: 16,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
