import React, { useEffect, useRef } from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions, Modal, StyleSheet, View, Animated, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'xp';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: AlertType;
    onClose: () => void;
    onConfirm?: () => void;
}

// Micro-interaction: Animated Pressable Button
function AlertButton({ onPress, style, children, activeScale = 0.95 }: any) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: activeScale,
            useNativeDriver: true,
            tension: 100,
            friction: 5
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5
        }).start();
    };

    return (
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
                style={style}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

export function CustomAlert({ visible, title, message, type = 'info', onClose, onConfirm }: CustomAlertProps) {
    const isDark = useColorScheme() === 'dark';
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');
    const textColor = useThemeColor({}, 'text');
    const inputBgColor = useThemeColor({}, 'inputBackground');

    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // Trigger scale-spring and opacity animation when visible is true
    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0.85);
            opacityAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 7,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    let iconName: any = 'info';
    let iconColor = primaryColor;
    let buttonColor = primaryColor;

    const goldColor = isDark ? '#FFD700' : '#D49B00';

    switch (type) {
        case 'success':
            iconName = 'check-circle';
            iconColor = '#4CAF50';
            buttonColor = '#4CAF50';
            break;
        case 'error':
            iconName = 'error';
            iconColor = '#F44336';
            buttonColor = '#F44336';
            break;
        case 'warning':
            iconName = 'warning';
            iconColor = '#FF9800';
            buttonColor = '#FF9800';
            break;
        case 'xp':
            iconName = 'stars';
            iconColor = goldColor;
            buttonColor = goldColor;
            break;
        case 'info':
        default:
            iconName = 'info';
            iconColor = '#2196F3';
            buttonColor = '#2196F3';
            break;
    }

    const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    const messageColor = isDark ? '#CCCCCC' : '#555555';

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Immersive Glassmorphic Blur Background */}
                <BlurView 
                    intensity={isDark ? 20 : 15} 
                    tint={isDark ? "dark" : "light"} 
                    style={StyleSheet.absoluteFill} 
                />
                
                <Animated.View style={[
                    styles.alertBox, 
                    { 
                        backgroundColor: cardColor, 
                        borderColor: borderColor,
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim
                    }
                ]}>
                    {/* Glowing circular icon container */}
                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '18', borderColor: iconColor + '30' }]}>
                        <MaterialIcons name={iconName} size={42} color={iconColor} />
                    </View>

                    {/* Gamified style adjustment for XP */}
                    <ThemedText 
                        type="subtitle" 
                        style={[
                            styles.title, 
                            { color: textColor },
                            type === 'xp' && { color: goldColor, fontWeight: '900', letterSpacing: 0.5 }
                        ]}
                    >
                        {title}
                    </ThemedText>

                    <ThemedText style={[styles.message, { color: messageColor }]}>
                        {message}
                    </ThemedText>

                    <View style={styles.buttonContainer}>
                        {onConfirm ? (
                            <>
                                <AlertButton style={[styles.button, styles.cancelButton, { backgroundColor: inputBgColor }]} onPress={onClose}>
                                    <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>İptal</ThemedText>
                                </AlertButton>
                                <AlertButton style={[styles.button, { backgroundColor: buttonColor }]} onPress={onConfirm}>
                                    <ThemedText style={styles.confirmButtonText}>Tamam</ThemedText>
                                </AlertButton>
                            </>
                        ) : (
                            <AlertButton style={[styles.button, { backgroundColor: buttonColor }]} onPress={onClose}>
                                <ThemedText style={styles.confirmButtonText}>Tamam</ThemedText>
                            </AlertButton>
                        )}
                    </View>
                </Animated.View>
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
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    iconContainer: {
        padding: 16,
        borderRadius: 36,
        marginBottom: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 20,
    },
    message: {
        textAlign: 'center',
        marginBottom: 24,
        fontSize: 15,
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    cancelButton: {
        borderWidth: 0,
    },
    cancelButtonText: {
        fontWeight: '700',
        fontSize: 15,
        opacity: 0.8,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
