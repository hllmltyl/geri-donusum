import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/firebaseConfig';
import { Redirect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type UserDoc = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: any;
  createdAt?: any;
  createdAtClient?: any;
};

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(ref);
        if (!mounted) return;
        setUserDoc(snap.exists() ? (snap.data() as UserDoc) : null);
      } catch (e) {
        console.error('[Profile] fetch error', e);
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Profil</ThemedText>
        <View style={{ height: 12 }} />
        {loading ? (
          <ThemedText>Yükleniyor...</ThemedText>
        ) : (
          <View style={styles.card}>
            <Row label="Ad" value={userDoc?.firstName ?? '-'} />
            <Row label="Soyad" value={userDoc?.lastName ?? '-'} />
            <Row label="Doğum Tarihi" value={formatDob(userDoc?.birthDate)} />
            <Row label="Email" value={email} />
            {/* <Row label="UID" value={uid} /> */}
            {/* UID gösterimi kaldırıldı */}
            <Row label="Kayıt Tarihi" value={createdAtText} />
          </View>
        )}
        <View style={{ height: 16 }} />
        <Button title="Çıkış Yap" onPress={handleLogout} />
      </ThemedView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontWeight: '600',
  },
  value: {
    opacity: 0.9,
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

