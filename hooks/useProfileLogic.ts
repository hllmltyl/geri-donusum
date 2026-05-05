import { useState, useEffect, useCallback, useMemo } from 'react';
import { updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export function useProfileLogic(user: any, userProfile: any) {
  const router = useRouter();
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

  const getInitials = useCallback(() => {
    const f = userProfile?.firstName || user?.displayName?.split(' ')[0] || '';
    const l = userProfile?.lastName || user?.displayName?.split(' ')[1] || '';
    return `${f.charAt(0).toUpperCase()}${l.charAt(0).toUpperCase()}` || 'U';
  }, [userProfile, user]);

  function formatDateTime(date: Date) {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

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
    try { 
      await signOut(auth); 
      router.replace('/(auth)/login'); 
    } catch (e: any) { 
      Alert.alert('Çıkış başarısız', e?.message); 
    }
  }

  return {
    saving,
    editMode, setEditMode,
    showPasswordModal, setShowPasswordModal,
    alertMsg,
    formData, setFormData,
    passwordData, setPasswordData,
    email,
    createdAtText,
    getInitials,
    handleSave,
    handlePasswordChange,
    handleCancel,
    handleLogout
  };
}
