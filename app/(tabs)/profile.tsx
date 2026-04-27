import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, loading: contextLoading, isAdmin } = useUser();
  const { themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', displayName: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  const isDark = backgroundColor === '#000' || backgroundColor.includes('black');
  const glassBg = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';
  const subText = isDark ? '#A0A0A0' : '#707070';

  useEffect(() => {
    if (userProfile || user) {
      const authDisplay = user?.displayName ?? '';
      const nameParts = authDisplay.trim() ? authDisplay.trim().split(/\s+/) : [];
      const authFirst = nameParts[0] ?? '';
      const authLast = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      setFormData({
        firstName: userProfile?.firstName || authFirst || '',
        lastName: userProfile?.lastName || authLast || '',
        email: userProfile?.email || user?.email || '',
        displayName: userProfile?.displayName || user?.displayName || '',
      });
    }
  }, [userProfile, user]);

  const email = userProfile?.email ?? user?.email ?? '-';
  const createdAtText = useMemo(() => {
    const ts: any = userProfile?.createdAt;
    try {
      if (ts?.toDate) return formatDateTime(ts.toDate());
      const authCreated = user?.metadata?.creationTime;
      if (authCreated) {
        const d = new Date(authCreated);
        if (!Number.isNaN(d.getTime())) return formatDateTime(d);
      }
      return '-';
    } catch { return '-'; }
  }, [userProfile?.createdAt, user?.metadata?.creationTime]);

  const getInitials = () => {
    const f = userProfile?.firstName || user?.displayName?.split(' ')[0] || '';
    const l = userProfile?.lastName || user?.displayName?.split(' ')[1] || '';
    return `${f.charAt(0).toUpperCase()}${l.charAt(0).toUpperCase()}` || 'U';
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setAlertMsg({ type: 'error', message: 'Ad, soyad ve e-posta zorunludur.' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setAlertMsg({ type: 'error', message: 'Geçerli e-posta giriniz.' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validateForm()) return;
    setSaving(true);
    setAlertMsg(null);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const performSave = async () => {
        if (user.displayName !== fullName) await updateProfile(user, { displayName: fullName });
        if (formData.email.trim() !== (user.email ?? '').trim()) await updateEmail(user, formData.email.trim());
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          displayName: fullName,
          updatedAt: new Date(),
        });
      };
      await Promise.race([
        performSave(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ]);
      setAlertMsg({ type: 'success', message: 'Profil güncellendi!' });
      setEditMode(false);
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err: any) {
      if (err?.message === 'timeout') {
        setAlertMsg({ type: 'success', message: 'İşlem arka planda tamamlanacak.' });
        setEditMode(false);
      } else {
        setAlertMsg({ type: 'error', message: err.message || 'Hata oluştu' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setAlertMsg({ type: 'error', message: 'Tüm alanlar zorunludur.' }); return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlertMsg({ type: 'error', message: 'Şifreler eşleşmiyor.' }); return;
    }
    if (passwordData.newPassword.length < 6) {
      setAlertMsg({ type: 'error', message: 'En az 6 karakter.' }); return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      setAlertMsg({ type: 'success', message: 'Şifre değiştirildi!' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err: any) {
      setAlertMsg({ type: 'error', message: err.message || 'Hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || user?.email || '',
        displayName: userProfile.displayName || user?.displayName || ''
      });
    }
    setEditMode(false);
    setAlertMsg(null);
  };

  async function handleLogout() {
    try { await signOut(auth); router.replace('/(auth)/login'); } 
    catch (e: any) { Alert.alert('Çıkış başarısız', e?.message); }
  }

  function formatDateTime(date: Date) {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  if (!user && !contextLoading) return <Redirect href="/(auth)/login" />;
  if (contextLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  const infoData = [
    { label: 'Ad', value: formData.firstName || '-', editable: true, key: 'firstName', icon: 'person' },
    { label: 'Soyad', value: formData.lastName || '-', editable: true, key: 'lastName', icon: 'person' },
    { label: 'E-posta', value: email, editable: true, key: 'email', icon: 'email' },
    { label: 'Kayıt Tarihi', value: createdAtText, editable: false, icon: 'event' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
      {/* Dynamic Background Blob */}
      <View style={[styles.bgBlob, { backgroundColor: primaryColor, opacity: isDark ? 0.2 : 0.1 }]} />

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.avatarGlass}>
            <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.avatarText}>{getInitials()}</ThemedText>
            </View>
          </BlurView>
        </View>
        <ThemedText style={styles.title}>
          {formData.firstName || 'Kullanıcı'} {formData.lastName || ''}
        </ThemedText>
        <View style={[styles.levelBadge, { backgroundColor: primaryColor + '20' }]}>
          <MaterialIcons name="military-tech" size={18} color={primaryColor} />
          <ThemedText style={[styles.levelText, { color: primaryColor }]}>
            Seviye {userProfile?.level || 1} • {userProfile?.points || 0} Puan
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {alertMsg && (
          <View style={[styles.alertContainer, alertMsg.type === 'success' ? styles.alertSuccess : styles.alertError]}>
            <MaterialIcons name={alertMsg.type === 'success' ? 'check-circle' : 'error'} size={20} color={alertMsg.type === 'success' ? '#155724' : '#721c24'} />
            <ThemedText style={styles.alertText}>{alertMsg.message}</ThemedText>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Profil Bilgileri</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
          {editMode ? (
            <View style={styles.formGrid}>
              {infoData.filter(item => item.editable).map((item, i) => (
                <View key={i} style={styles.formGroup}>
                  <ThemedText style={[styles.labelText, { color: subText }]}>{item.label}</ThemedText>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: isDark ? '#222' : '#F5F7FA', borderColor: borderColor, color: textColor }]}
                    value={formData[item.key as keyof typeof formData] as string}
                    onChangeText={v => setFormData(f => ({ ...f, [item.key as keyof typeof formData]: v }))}
                    placeholder={`${item.label} giriniz`}
                    placeholderTextColor={subText}
                    keyboardType={item.key === 'email' ? 'email-address' : 'default'}
                    editable={!saving}
                  />
                </View>
              ))}
              <View style={styles.formActions}>
                <PressableScale style={[styles.btn, { backgroundColor: primaryColor, flex: 1 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={styles.btnText}>Kaydet</ThemedText>}
                </PressableScale>
                <PressableScale style={[styles.btn, { backgroundColor: secondaryColor }]} onPress={handleCancel} disabled={saving}>
                  <ThemedText style={styles.btnText}>İptal</ThemedText>
                </PressableScale>
              </View>
            </View>
          ) : (
            <View style={styles.infoGrid}>
              {infoData.map((item, i) => (
                <View key={i} style={styles.infoRow}>
                  <View style={[styles.infoIconBox, { backgroundColor: primaryColor + '15' }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={primaryColor} />
                  </View>
                  <View style={styles.infoContent}>
                    <ThemedText style={[styles.infoLabel, { color: subText }]}>{item.label}</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: textColor }]}>{item.value}</ThemedText>
                  </View>
                </View>
              ))}
              <View style={styles.actionButtons}>
                <PressableScale style={[styles.btnOutline, { borderColor: primaryColor }]} onPress={() => setEditMode(true)}>
                  <MaterialIcons name="edit" size={18} color={primaryColor} />
                  <ThemedText style={[styles.btnOutlineText, { color: primaryColor }]}>Düzenle</ThemedText>
                </PressableScale>
                <PressableScale style={[styles.btnOutline, { borderColor: subText }]} onPress={() => setShowPasswordModal(true)}>
                  <MaterialIcons name="lock" size={18} color={subText} />
                  <ThemedText style={[styles.btnOutlineText, { color: subText }]}>Şifre</ThemedText>
                </PressableScale>
              </View>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Uygulama Görünümü</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, padding: 16, flexDirection: 'row', justifyContent: 'space-between', shadowColor: isDark ? '#000' : '#888' }]}>
          {(['system', 'light', 'dark'] as const).map((mode) => {
            const isActive = themeMode === mode;
            return (
              <PressableScale
                key={mode}
                style={[
                  styles.themeOption,
                  { backgroundColor: isActive ? primaryColor : (isDark ? '#222' : '#F5F7FA') }
                ]}
                onPress={() => setThemeMode(mode)}
              >
                <MaterialIcons name={mode === 'light' ? 'light-mode' : mode === 'dark' ? 'dark-mode' : 'settings-system-daydream'} size={20} color={isActive ? '#FFF' : subText} />
                <ThemedText style={[styles.themeText, { color: isActive ? '#FFF' : subText, fontWeight: isActive ? '700' : '500' }]}>
                  {mode === 'system' ? 'Sistem' : mode === 'light' ? 'Açık' : 'Koyu'}
                </ThemedText>
              </PressableScale>
            );
          })}
        </View>

        {isAdmin && (
          <PressableScale style={[styles.logoutBtn, { backgroundColor: primaryColor + '15', marginBottom: 16 }]} onPress={() => router.push('/(tabs)/admin')}>
            <MaterialIcons name="admin-panel-settings" size={22} color={primaryColor} />
            <ThemedText style={[styles.logoutText, { color: primaryColor }]}>Admin Paneli</ThemedText>
          </PressableScale>
        )}

        <PressableScale style={[styles.logoutBtn, { backgroundColor: '#FF4B4B' + '15' }]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color="#FF4B4B" />
          <ThemedText style={[styles.logoutText, { color: '#FF4B4B' }]}>Hesaptan Çıkış Yap</ThemedText>
        </PressableScale>
      </View>

      {/* Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <ThemedText style={styles.modalTitle}>Şifre Değiştir</ThemedText>
            <View style={styles.formGroup}>
              <TextInput style={[styles.formInput, { backgroundColor: isDark ? '#222' : '#F5F7FA', color: textColor }]} secureTextEntry placeholder="Mevcut Şifre" placeholderTextColor={subText} onChangeText={v => setPasswordData(f => ({ ...f, currentPassword: v }))} />
            </View>
            <View style={styles.formGroup}>
              <TextInput style={[styles.formInput, { backgroundColor: isDark ? '#222' : '#F5F7FA', color: textColor }]} secureTextEntry placeholder="Yeni Şifre" placeholderTextColor={subText} onChangeText={v => setPasswordData(f => ({ ...f, newPassword: v }))} />
            </View>
            <View style={styles.formGroup}>
              <TextInput style={[styles.formInput, { backgroundColor: isDark ? '#222' : '#F5F7FA', color: textColor }]} secureTextEntry placeholder="Yeni Şifre Tekrar" placeholderTextColor={subText} onChangeText={v => setPasswordData(f => ({ ...f, confirmPassword: v }))} />
            </View>
            <View style={styles.modalActions}>
              <PressableScale style={[styles.btn, { backgroundColor: secondaryColor, flex: 1 }]} onPress={() => setShowPasswordModal(false)}><ThemedText style={styles.btnText}>İptal</ThemedText></PressableScale>
              <PressableScale style={[styles.btn, { backgroundColor: primaryColor, flex: 1 }]} onPress={handlePasswordChange}><ThemedText style={styles.btnText}>Kaydet</ThemedText></PressableScale>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  bgBlob: { position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  avatarContainer: { marginBottom: 16, borderRadius: 50, overflow: 'hidden' },
  avatarGlass: { padding: 8, borderRadius: 60 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, gap: 6 },
  levelText: { fontSize: 14, fontWeight: '700' },
  content: { paddingHorizontal: 20 },
  sectionHeader: { marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  card: { borderRadius: 24, padding: 24, marginBottom: 24, elevation: 4, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  infoIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, gap: 8 },
  btnOutlineText: { fontSize: 15, fontWeight: '700' },
  infoGrid: { gap: 16 },
  formGrid: { gap: 16 },
  formGroup: { marginBottom: 16 },
  labelText: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  formInput: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 54, fontSize: 16, fontWeight: '500' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16, paddingHorizontal: 24 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  themeOption: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, marginHorizontal: 4, gap: 8 },
  themeText: { fontSize: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, marginTop: 10, gap: 10 },
  logoutText: { fontSize: 16, fontWeight: '800' },
  alertContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 24, gap: 10 },
  alertSuccess: { backgroundColor: '#d4edda' },
  alertError: { backgroundColor: '#f8d7da' },
  alertText: { fontSize: 14, fontWeight: '600', color: '#333' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 360, borderRadius: 28, padding: 24, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 }
});
