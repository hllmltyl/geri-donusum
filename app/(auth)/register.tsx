import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDay, setBirthDay] = useState(''); // GG
  const [birthMonth, setBirthMonth] = useState(''); // AA
  const [birthYear, setBirthYear] = useState(''); // YYYY
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const monthRef = useRef<any>(null);
  const yearRef = useRef<any>(null);

  // Renkler
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  async function handleRegister() {
    if (!firstName.trim() || !lastName.trim() || !birthDay.trim() || !birthMonth.trim() || !birthYear.trim() || !email || !password) {
      setError(t('auth.allFieldsRequired'));
      return;
    }
    // Uzunluk ve sadece rakam kontrolü
    if (birthDay.length > 2 || birthMonth.length > 2 || birthYear.length !== 4) {
      setError(t('auth.invalidDateFormat'));
      return;
    }
    const day = parseInt(birthDay, 10);
    const month = parseInt(birthMonth, 10);
    const year = parseInt(birthYear, 10);
    const dob = new Date(year, month - 1, day);
    // Geçersiz tarihleri yakala (örn. 31-02-2020) ve gelecekteki tarihleri reddet
    if (
      dob.getFullYear() !== year ||
      dob.getMonth() !== month - 1 ||
      dob.getDate() !== day ||
      dob.getTime() >= Date.now() ||
      day < 1 || day > 31 ||
      month < 1 || month > 12
    ) {
      setError(t('auth.invalidBirthDate'));
      return;
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    try {
      setLoading(true);
      setError(null);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: fullName });
      // Firestore yazımı: best-effort (await ETME, akışı asla bloklama)
      setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: dob,
        createdAt: serverTimestamp(),
        createdAtClient: new Date(),
      }).catch(() => {
        // Firestore yazma hatası sessizce yoksayılır
      });
      Alert.alert(t('auth.success'), t('auth.accountCreated'));
      // Önce loading'i kapat, sonra navigate et
      setLoading(false);
      router.replace('/(tabs)/homepage');
      return;
    } catch (error: any) {

      // Firebase hata kodlarına göre mesajlar
      const errorCode = error?.code;
      let errorMessage = t('auth.errors.genericError');

      switch (errorCode) {
        case 'auth/email-already-in-use':
          errorMessage = t('auth.errors.emailInUse');
          break;
        case 'auth/invalid-email':
          errorMessage = t('auth.errors.invalidEmail');
          break;
        case 'auth/weak-password':
          errorMessage = t('auth.errors.weakPassword');
          break;
        case 'auth/operation-not-allowed':
          errorMessage = t('auth.errors.operationNotAllowed');
          break;
        case 'auth/network-request-failed':
          errorMessage = t('auth.errors.networkFailed');
          break;
        default:
          errorMessage = error?.message ?? t('auth.errors.registerError');
      }

      setError(errorMessage);
    } finally {
      // Eğer yukarıda başarılı akışta return edildi ise burası double-set yapmasın
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="recycling" size={60} color={primaryColor} />
          <ThemedText type="title" style={[styles.title, { color: primaryColor }]}>
            {t('auth.appTitle')}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: secondaryColor }]}>
            {t('auth.registerSubtitle')}
          </ThemedText>
        </View>

        {/* Form Container */}
        <View style={[styles.formContainer, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.formTitle, { color: textColor }]}>
            {t('auth.register')}
          </ThemedText>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={20} color="#E74C3C" />
              <ThemedText style={styles.error}>{error}</ThemedText>
            </View>
          )}

          {/* Ad Soyad Row */}
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={secondaryColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, {
                  backgroundColor: backgroundColor,
                  borderColor: borderColor,
                  color: textColor
                }]}
                placeholder={t('auth.firstName')}
                placeholderTextColor={secondaryColor}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={secondaryColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, {
                  backgroundColor: backgroundColor,
                  borderColor: borderColor,
                  color: textColor
                }]}
                placeholder={t('auth.lastName')}
                placeholderTextColor={secondaryColor}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Doğum Tarihi */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="calendar-today" size={20} color={secondaryColor} style={styles.inputIcon} />
            <ThemedText style={[styles.dateLabel, { color: textColor }]}>{t('auth.birthDate')}</ThemedText>
            <View style={styles.dateRow}>
              <TextInput
                placeholder={t('auth.day')}
                placeholderTextColor={secondaryColor}
                value={birthDay}
                onChangeText={(t) => {
                  const v = t.replace(/\D/g, '').slice(0, 2);
                  setBirthDay(v);
                  if (v.length === 2) {
                    monthRef.current?.focus();
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
                style={[styles.dateInput, {
                  backgroundColor: backgroundColor,
                  borderColor: borderColor,
                  color: textColor
                }]}
              />
              <TextInput
                placeholder={t('auth.month')}
                placeholderTextColor={secondaryColor}
                value={birthMonth}
                onChangeText={(t) => {
                  const v = t.replace(/\D/g, '').slice(0, 2);
                  setBirthMonth(v);
                  if (v.length === 2) {
                    yearRef.current?.focus();
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
                style={[styles.dateInput, {
                  backgroundColor: backgroundColor,
                  borderColor: borderColor,
                  color: textColor
                }]}
                ref={monthRef}
              />
              <TextInput
                placeholder={t('auth.year')}
                placeholderTextColor={secondaryColor}
                value={birthYear}
                onChangeText={(t) => setBirthYear(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                style={[styles.dateInput, {
                  flexGrow: 1,
                  backgroundColor: backgroundColor,
                  borderColor: borderColor,
                  color: textColor
                }]}
                ref={yearRef}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={secondaryColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, {
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                color: textColor
              }]}
              placeholder={t('auth.email')}
              placeholderTextColor={secondaryColor}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Şifre */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={secondaryColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, {
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                color: textColor
              }]}
              placeholder={t('auth.password')}
              placeholderTextColor={secondaryColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: primaryColor }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                <ThemedText style={styles.submitButtonText}>{t('auth.register')}</ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* Giriş Yap Linki */}
          <View style={styles.linkContainer}>
            <ThemedText style={[styles.linkText, { color: secondaryColor }]}>
              {t('auth.hasAccount')}{' '}
            </ThemedText>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <ThemedText style={[styles.link, { color: primaryColor }]}>
                  {t('auth.login')}
                </ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 0,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 0,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#6C6C74',
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  error: {
    color: '#E74C3C',
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 44,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 44,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 44,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    flexBasis: 80,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

