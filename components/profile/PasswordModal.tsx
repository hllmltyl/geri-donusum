import React from 'react';
import { View, Modal, StyleSheet, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedText } from '@/components/ThemedText';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
function PressableScale({ onPress, style, children, disabled = false }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

interface PasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  setPasswordData: (updater: any) => void;
  isDark: boolean;
  cardColor: string;
  textColor: string;
  subText: string;
  primaryColor: string;
  secondaryColor: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  visible, onClose, onSave, setPasswordData, isDark, cardColor, textColor, subText, primaryColor, secondaryColor
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
          <ThemedText style={styles.modalTitle}>Şifre Değiştir</ThemedText>
          <View style={styles.formGroup}>
            <TextInput style={[styles.formInput, { backgroundColor: isDark ? '#222' : '#F5F7FA', color: textColor }]} secureTextEntry placeholder="Mevcut Şifre" placeholderTextColor={subText} onChangeText={v => setPasswordData((f: any) => ({ ...f, currentPassword: v }))} />
          </View>
          <View style={styles.formGroup}>
            <TextInput style={[styles.formInput, { backgroundColor: isDark ? '#222' : '#F5F7FA', color: textColor }]} secureTextEntry placeholder="Yeni Şifre" placeholderTextColor={subText} onChangeText={v => setPasswordData((f: any) => ({ ...f, newPassword: v }))} />
          </View>
          <View style={styles.formGroup}>
            <TextInput style={[styles.formInput, { backgroundColor: isDark ? '#222' : '#F5F7FA', color: textColor }]} secureTextEntry placeholder="Yeni Şifre Tekrar" placeholderTextColor={subText} onChangeText={v => setPasswordData((f: any) => ({ ...f, confirmPassword: v }))} />
          </View>
          <View style={styles.modalActions}>
            <PressableScale style={[styles.btn, { backgroundColor: secondaryColor, flex: 1 }]} onPress={onClose}>
              <ThemedText style={styles.btnText}>İptal</ThemedText>
            </PressableScale>
            <PressableScale style={[styles.btn, { backgroundColor: primaryColor, flex: 1 }]} onPress={onSave}>
              <ThemedText style={styles.btnText}>Kaydet</ThemedText>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 360, borderRadius: 28, padding: 24, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  formGroup: { marginBottom: 16 },
  formInput: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 54, fontSize: 16, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btn: { alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16, paddingHorizontal: 24 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
