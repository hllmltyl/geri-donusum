import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/firebaseConfig';
import { Redirect, useRouter } from 'expo-router';
import { signOut, updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

type UserDoc = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: any;
  createdAt?: any;
  createdAtClient?: any;
  photoURL?: string | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Form data
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

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        // Firestore'dan kullanıcı okunur; offline ise sessizce auth verisine düş
        let userData: UserDoc | null = null;
        try {
          const ref = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            userData = snap.data() as UserDoc;
          }
        } catch (innerErr) {
          // offline veya erişim hatasında devam et
        }
        if (!mounted) return;
        setUserDoc(userData);

        // Form verilerini güncelle (offline durumda auth'tan doldur)
        if (userData) {
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || currentUser.email || '',
            displayName: userData.displayName || currentUser.displayName || ''
          });
        } else {
          setFormData({
            firstName: '',
            lastName: '',
            email: currentUser.email || '',
            displayName: currentUser.displayName || ''
          });
        }
      } catch (e) {
        // Tamamen sessiz bir fallback; UI'yi kilitleme
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [currentUser?.uid]);

  const email = userDoc?.email ?? currentUser?.email ?? '-';
  const uid = currentUser?.uid ?? '-';
  const createdAtText = useMemo(() => {
    const ts: any = userDoc?.createdAt;
    const clientTs: any = userDoc?.createdAtClient;
    try {
      if (ts?.toDate) {
        const d = ts.toDate();
        return formatDateTime(d);
      }
      if (clientTs) {
        const d = clientTs?.toDate ? clientTs.toDate() : new Date(clientTs);
        if (!Number.isNaN(d.getTime())) return formatDateTime(d);
      }
      const authCreated = auth.currentUser?.metadata?.creationTime;
      if (authCreated) {
        const d = new Date(authCreated);
        if (!Number.isNaN(d.getTime())) return formatDateTime(d);
      }
      if (typeof ts === 'string') return ts;
      return '-';
    } catch {
      return '-';
    }
  }, [userDoc?.createdAt, userDoc?.createdAtClient]);

  // Kullanıcının baş harflerini al
  const getInitials = () => {
    const firstName = userDoc?.firstName || currentUser?.displayName?.split(' ')[0] || '';
    const lastName = userDoc?.lastName || currentUser?.displayName?.split(' ')[1] || '';
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
    if (!currentUser) {
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
      
      // Firebase Auth profilini güncelle
      await updateProfile(currentUser, {
        displayName: fullName,
      });

      // Firestore'da kullanıcı dokümanını güncelle
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        displayName: fullName,
        updatedAt: new Date(),
      });

      // Email değiştirildiyse güncelle
      if (formData.email !== currentUser.email) {
        await updateEmail(currentUser, formData.email.trim());
      }

      setAlert({ type: 'success', message: 'Profil başarıyla güncellendi!' });
      setEditMode(false);
      
      // Success mesajını 3 saniye sonra temizle
      setTimeout(() => {
        setAlert(null);
      }, 3000);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Profil güncellenirken bir hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  // Şifre değiştirme işlemi
  const handlePasswordChange = async () => {
    if (!currentUser) {
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
      const credential = EmailAuthProvider.credential(currentUser.email!, passwordData.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Şifreyi güncelle
      await updatePassword(currentUser, passwordData.newPassword);

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
    if (userDoc) {
      setFormData({
        firstName: userDoc.firstName || '',
        lastName: userDoc.lastName || '',
        email: userDoc.email || currentUser?.email || '',
        displayName: userDoc.displayName || currentUser?.displayName || ''
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

  if (!currentUser && !loading) {
    return <Redirect href="/(auth)/login" />;
  }

  if (loading) {
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
    { label: 'Ad', value: userDoc?.firstName || currentUser?.displayName?.split(' ')[0] || '-', editable: true, key: 'firstName', icon: 'person' },
    { label: 'Soyad', value: userDoc?.lastName || currentUser?.displayName?.split(' ')[1] || '-', editable: true, key: 'lastName', icon: 'person' },
    { label: 'E-posta', value: email, editable: true, key: 'email', icon: 'email' },
    { label: 'Doğum Tarihi', value: formatDob(userDoc?.birthDate), editable: false, icon: 'cake' },
    { label: 'Kayıt Tarihi', value: createdAtText, editable: false, icon: 'event' },
    { label: 'Kullanıcı ID', value: uid.substring(0, 8) + '...', editable: false, icon: 'fingerprint' },
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
            {userDoc?.firstName || currentUser?.displayName?.split(' ')[0] || 'Kullanıcı'} {userDoc?.lastName || currentUser?.displayName?.split(' ')[1] || ''}
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
    marginBottom: 8,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
});

function formatDob(dob: any): string {
  try {
    if (!dob) return '-';
    if (dob?.toDate) {
      const d = dob.toDate();
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    }
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  } catch {
    return '-';
  }
}

function formatDateTime(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(
    d.getHours()
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

