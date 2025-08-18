import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WASTE_ITEMS } from '@/constants/waste';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WasteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const item = WASTE_ITEMS.find((it) => it.id === id);

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={styles.container}>
          <ThemedText>Atık bulunamadı.</ThemedText>
          <View style={{ height: 12 }} />
          <Pressable onPress={() => router.back()}>
            <ThemedText type="link">Geri dön</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="link">‹ Geri</ThemedText>
        </Pressable>
        <View style={{ height: 16 }} />
        <ThemedText type="title">{item.malzeme}</ThemedText>
        <View style={{ height: 8 }} />
        <ThemedText>Tür: {item.tur.toUpperCase()}</ThemedText>
        <View style={{ height: 4 }} />
        <ThemedText>Yöntem: {item.yontem}</ThemedText>
        <View style={{ height: 8 }} />
        <ThemedText>{item.aciklama}</ThemedText>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

