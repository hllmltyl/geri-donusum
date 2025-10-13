import { auth, db } from '@/firebaseConfig';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDay, setBirthDay] = useState(''); // GG
  const [birthMonth, setBirthMonth] = useState(''); // AA
  const [birthYear, setBirthYear] = useState(''); // YYYY
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const monthRef = useRef<any>(null);
  const yearRef = useRef<any>(null);

  async function handleRegister() {
    if (!firstName.trim() || !lastName.trim() || !birthDay.trim() || !birthMonth.trim() || !birthYear.trim() || !email || !password) {
      Alert.alert('Hata', 'Ad, soyad, doğum tarihi (gün/ay/yıl), email ve şifre gerekli.');
      return;
    }
    // Uzunluk ve sadece rakam kontrolü
    if (birthDay.length > 2 || birthMonth.length > 2 || birthYear.length !== 4) {
      Alert.alert('Hata', 'Gün/Ay en fazla 2 basamak, Yıl 4 basamak olmalıdır.');
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
      Alert.alert('Hata', 'Geçerli bir doğum tarihi giriniz.');
      return;
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    try {
      setLoading(true);
      console.log('[Register] start');
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      console.log('[Register] user created', cred.user?.uid);
      await updateProfile(cred.user, { displayName: fullName });
      console.log('[Register] profile updated');
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
      })
        .then(() => console.log('[Register] firestore user doc written'))
        .catch((err) => {
          console.warn('[Register] firestore write skipped:', err.message);
        });
      Alert.alert('Başarılı', 'Kayıt oluşturuldu.');
      // Önce loading'i kapat, sonra navigate et
      setLoading(false);
      router.replace('/(tabs)/homepage');
      return;
    } catch (error: any) {
      console.error('[Register] error', error);
      Alert.alert('Kayıt başarısız', error?.message ?? 'Bilinmeyen hata');
    } finally {
      // Eğer yukarıda başarılı akışta return edildi ise burası double-set yapmasın
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Kayıt Ol</Text>
        <TextInput
          placeholder="Ad"
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
        />
        <TextInput
          placeholder="Soyad"
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
        />
        <View style={styles.dateRow}>
          <TextInput
            placeholder="GG"
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
            style={[styles.input, styles.dateInput]}
          />
          <TextInput
            placeholder="AA"
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
            style={[styles.input, styles.dateInput]}
            ref={monthRef}
          />
          <TextInput
            placeholder="YYYY"
            value={birthYear}
            onChangeText={(t) => setBirthYear(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            style={[styles.input, styles.dateInput, { flexGrow: 1 }]}
            ref={yearRef}
          />
        </View>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <Button title={loading ? 'Bekleyin...' : 'Kayıt Ol'} onPress={handleRegister} disabled={loading} />
        <View style={{ height: 16 }} />
        <Link href="/(auth)/login">Zaten hesabın var mı? Giriş yap</Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateInput: {
    flexBasis: 80,
  },
});

