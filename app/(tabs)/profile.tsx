import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, loading: contextLoading, isAdmin } = useUser();
  const { themeMode, setThemeMode } = useTheme();

  // Local states
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form data initiation
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    displayName: ''
  });

  // Password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Renkler
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  // Update form data when userProfile changes
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
    // Client-side timestamp'i context'te tutmuyorsak userDoc'taki gibi kontrol edebiliriz
    // Ama şimdilik basitçe auth creationTime'a fallback yapalım
    try {
      if (ts?.toDate) {
        const d = ts.toDate();
        return formatDateTime(d);
      }
      const authCreated = user?.metadata?.creationTime;
      if (authCreated) {
        const d = new Date(authCreated);
        if (!Number.isNaN(d.getTime())) return formatDateTime(d);
      }
      return '-';
    } catch {
      return '-';
    }
  }, [userProfile?.createdAt, user?.metadata?.creationTime]);

  // Kullanıcının baş harflerini al
  const getInitials = () => {
    const firstName = userProfile?.firstName || user?.displayName?.split(' ')[0] || '';
    const lastName = userProfile?.lastName || user?.displayName?.split(' ')[1] || '';
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}` || 'U';
  };

  // Form validasyonu
  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setAlert({ type: 'error', message: 'Ad, soyad ve e-posta alanları zorunludur.' });
      return false;
    }

    // Email validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setAlert({ type: 'error', message: 'Geçerli bir e-posta adresi giriniz.' });
      return false;
    }

    return true;
  };

  // Profil güncelleme işlemi
  const handleSave = async () => {
    if (!user) {
      setAlert({ type: 'error', message: 'Kullanıcı oturumu bulunamadı' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setAlert(null);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      // Tüm kaydetme işlemlerini bir fonksiyonda topla
      const performSave = async () => {
        // 1) Auth profilini güncelle
        if (user.displayName !== fullName) {
          await updateProfile(user, { displayName: fullName });
        }

        // 2) Eğer e-posta değiştiyse önce auth tarafını güncelle (bazı durumlarda reauth gerekebilir)
        if (formData.email.trim() !== (user.email ?? '').trim()) {
          await updateEmail(user, formData.email.trim());
        }

        // 3) Firestore dokümanını güncelle
        // Context onSnapshot ile dinlediği için burası güncellendiğinde context otomatik yenilenir
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          displayName: fullName,
          updatedAt: new Date(),
        });
      };

      // Bazı ağ/transport hatalarında Promise tamamlanmayabilir — UI'nın takılmaması için timeout ile yarıştır
      const SAVE_TIMEOUT_MS = 10000; // 10 saniye
      try {
        await Promise.race([
          performSave(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), SAVE_TIMEOUT_MS)),
        ]);

        // Eğer performSave zamanında tamamlandıysa normal akış
        setAlert({ type: 'success', message: 'Profil başarıyla güncellendi!' });
        setEditMode(false);
        setTimeout(() => setAlert(null), 3000);
      } catch (raceErr: any) {
        if (raceErr?.message === 'timeout') {
          // Zaman aşımı
          setAlert({ type: 'success', message: 'İşlem arka planda tamamlanacak.' });
          setEditMode(false);
          setTimeout(() => setAlert(null), 4000);
        } else {
          // Gerçek bir hata
          setAlert({ type: 'error', message: raceErr?.message || 'Profil güncellenirken bir hata oluştu' });
        }
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Profil güncellenirken bir hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  // Şifre değiştirme işlemi
  const handlePasswordChange = async () => {
    if (!user) {
      setAlert({ type: 'error', message: 'Kullanıcı oturumu bulunamadı' });
      return;
    }

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setAlert({ type: 'error', message: 'Tüm şifre alanları zorunludur.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({ type: 'error', message: 'Yeni şifreler eşleşmiyor.' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setAlert({ type: 'error', message: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      // Mevcut şifreyi doğrula
      const credential = EmailAuthProvider.credential(user.email!, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Şifreyi güncelle
      await updatePassword(user, passwordData.newPassword);

      setAlert({ type: 'success', message: 'Şifre başarıyla değiştirildi!' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Success mesajını 3 saniye sonra temizle
      setTimeout(() => {
        setAlert(null);
      }, 3000);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Şifre değiştirilirken bir hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Form'u orijinal verilerle resetle
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || user?.email || '',
        displayName: userProfile.displayName || user?.displayName || ''
      });
    }
    setEditMode(false);
    setAlert(null);
  };

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (e: any) {
      Alert.alert('Çıkış başarısız', e?.message ?? 'Bilinmeyen hata');
    }
  }

  // Helper for date formatting
  function formatDateTime(date: Date) {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  if (!user && !contextLoading) {
    return <Redirect href="/(auth)/login" />;
  }

  if (contextLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>Yükleniyor...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Bilgi kutuları için veri
  const infoData = [
    { label: 'Ad', value: userProfile?.firstName || user?.displayName?.split(' ')[0] || '-', editable: true, key: 'firstName', icon: 'person' },
    { label: 'Soyad', value: userProfile?.lastName || user?.displayName?.split(' ')[1] || '-', editable: true, key: 'lastName', icon: 'person' },
    { label: 'E-posta', value: email, editable: true, key: 'email', icon: 'email' },
    { label: 'Kayıt Tarihi', value: createdAtText, editable: false, icon: 'event' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <ThemedView style={styles.content}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: '#fff' }]}>
              <ThemedText style={[styles.avatarText, { color: primaryColor }]}>{getInitials()}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.title}>
            {userProfile?.firstName || user?.displayName?.split(' ')[0] || 'Kullanıcı'} {userProfile?.lastName || user?.displayName?.split(' ')[1] || ''}
          </ThemedText>
          {/* Level and Points Display can be added here later */}
          <ThemedText style={styles.subtitle}>
            Seviye {userProfile?.level || 1} • {userProfile?.points || 0} Puan
          </ThemedText>
        </View>

        {/* Alert Messages */}
        {alert && (
          <View style={[styles.alertContainer, alert.type === 'success' ? styles.alertSuccess : styles.alertError]}>
            <MaterialIcons name={alert.type === 'success' ? 'check-circle' : 'error'} size={20} color={alert.type === 'success' ? '#155724' : '#721c24'} />
            <ThemedText style={styles.alertText}>{alert.message}</ThemedText>
          </View>
        )}

        {/* Profile Content */}
        <View style={styles.profileContent}>
          {editMode ? (
            <View style={styles.editSection}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="edit" size={24} color={primaryColor} />
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Profili Düzenle</ThemedText>
              </View>

              <View style={styles.formGrid}>
                {infoData.filter(item => item.editable).map((item, i) => (
                  <View key={i} style={styles.formGroup}>
                    <View style={styles.formLabel}>
                      <MaterialIcons name={item.icon as any} size={16} color={primaryColor} />
                      <ThemedText style={[styles.labelText, { color: textColor }]}>{item.label}</ThemedText>
                    </View>
                    <TextInput
                      style={[styles.formInput, {
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        color: textColor
                      }]}
                      value={formData[item.key as keyof typeof formData] as string}
                      onChangeText={v => setFormData(f => ({ ...f, [item.key as keyof typeof formData]: v }))}
                      placeholder={`${item.label} giriniz`}
                      placeholderTextColor={secondaryColor}
                      keyboardType={item.key === 'email' ? 'email-address' : 'default'}
                      editable={!saving}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, { backgroundColor: primaryColor }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="save" size={20} color="#fff" />
                  )}
                  <ThemedText style={styles.btnText}>
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <MaterialIcons name="cancel" size={20} color="#fff" />
                  <ThemedText style={styles.btnText}>İptal</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.viewSection}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="list" size={24} color={primaryColor} />
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Profil Bilgileri</ThemedText>
              </View>

              <View style={styles.infoGrid}>
                {infoData.map((item, i) => (
                  <View key={i} style={[styles.infoCard, { backgroundColor: cardColor }]}>
                    <MaterialIcons
                      name={item.icon as any}
                      size={24}
                      color={primaryColor}
                      style={styles.infoIcon}
                    />
                    <View style={styles.infoContent}>
                      <ThemedText style={[styles.infoLabel, { color: secondaryColor }]}>{item.label}</ThemedText>
                      <ThemedText style={[styles.infoValue, { color: textColor }]}>
                        {item.value || 'Belirtilmemiş'}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, styles.btnLarge, { backgroundColor: primaryColor }]}
                  onPress={() => setEditMode(true)}
                >
                  <MaterialIcons name="edit" size={20} color="#fff" />
                  <ThemedText style={styles.btnText}>Profili Düzenle</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary, styles.btnLarge]}
                  onPress={() => setShowPasswordModal(true)}
                >
                  <MaterialIcons name="lock" size={20} color="#fff" />
                  <ThemedText style={styles.btnText}>Şifre Değiştir</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                <MaterialIcons name="brightness-6" size={24} color={primaryColor} />
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Görünüm</ThemedText>
              </View>

              <View style={styles.themeSelector}>
                {(['system', 'light', 'dark'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.themeOption,
                      themeMode === mode ? { backgroundColor: primaryColor } : { backgroundColor: cardColor, borderWidth: 1, borderColor: borderColor }
                    ]}
                    onPress={() => setThemeMode(mode)}
                  >
                    <ThemedText style={[
                      styles.themeText,
                      themeMode === mode ? { color: 'white', fontWeight: 'bold' } : { color: textColor }
                    ]}>
                      {mode === 'system' ? 'Sistem' : mode === 'light' ? 'Açık' : 'Koyu'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#fff" />
            <ThemedText style={styles.logoutButtonText}>Çıkış Yap</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>Şifre Değiştir</ThemedText>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.labelText, { color: textColor }]}>Mevcut Şifre</ThemedText>
                <TextInput
                  style={[styles.formInput, {
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    color: textColor
                  }]}
                  value={passwordData.currentPassword}
                  onChangeText={v => setPasswordData(f => ({ ...f, currentPassword: v }))}
                  placeholder="Mevcut şifrenizi giriniz"
                  placeholderTextColor={secondaryColor}
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.labelText, { color: textColor }]}>Yeni Şifre</ThemedText>
                <TextInput
                  style={[styles.formInput, {
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    color: textColor
                  }]}
                  value={passwordData.newPassword}
                  onChangeText={v => setPasswordData(f => ({ ...f, newPassword: v }))}
                  placeholder="Yeni şifrenizi giriniz"
                  placeholderTextColor={secondaryColor}
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.labelText, { color: textColor }]}>Yeni Şifre Tekrar</ThemedText>
                <TextInput
                  style={[styles.formInput, {
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    color: textColor
                  }]}
                  value={passwordData.confirmPassword}
                  onChangeText={v => setPasswordData(f => ({ ...f, confirmPassword: v }))}
                  placeholder="Yeni şifrenizi tekrar giriniz"
                  placeholderTextColor={secondaryColor}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => setShowPasswordModal(false)}
                disabled={saving}
              >
                <ThemedText style={styles.btnText}>İptal</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, { backgroundColor: primaryColor }]}
                onPress={handlePasswordChange}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="lock" size={20} color="#fff" />
                )}
                <ThemedText style={styles.btnText}>
                  {saving ? 'Değiştiriliyor...' : 'Şifre Değiştir'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    backgroundColor: '#51A646',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 4,
    shadowColor: '#51A646',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '300',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  alertSuccess: {
    backgroundColor: '#d4edda',
    borderLeftColor: '#28a745',
  },
  alertError: {
    backgroundColor: '#f8d7da',
    borderLeftColor: '#dc3545',
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  profileContent: {
    padding: 24,
  },
  editSection: {
    marginBottom: 24,
  },
  viewSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formGrid: {
    gap: 16,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  infoGrid: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#51A646',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileActions: {
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 48,
  },
  btnPrimary: {
    backgroundColor: '#51A646',
  },
  btnSecondary: {
    backgroundColor: '#6c757d',
  },
  btnLarge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutSection: {
    padding: 24,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  themeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
