import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CATEGORY_FILTERS, WASTE_ITEMS, WasteCategory, WasteItem } from '@/constants/waste';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <ThemedText style={active ? styles.chipTextActive : styles.chipText}>{label}</ThemedText>
    </Pressable>
  );
}

export default function WasteListScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<WasteCategory>('hepsi');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const data = useMemo(() => {
    const byCategory = selected === 'hepsi' ? WASTE_ITEMS : WASTE_ITEMS.filter((item) => item.tur === selected);
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((it) => it.malzeme.toLowerCase().includes(q));
  }, [selected, query]);

  function renderItem({ item }: { item: WasteItem }) {
    return (
      <Pressable onPress={() => router.push({ pathname: '/(tabs)/waste/[id]', params: { id: item.id } })}>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">{item.malzeme}</ThemedText>
          <ThemedText>{item.yontem}</ThemedText>
          <ThemedText style={styles.pill}>{item.tur.toUpperCase()}</ThemedText>
        </ThemedView>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={{ marginBottom: 8 }}>Atık Listesi</ThemedText>

        <View style={styles.panel}>
          <Pressable onPress={() => setFiltersOpen((v) => !v)} style={styles.panelHeader}>
            <ThemedText style={styles.panelHeaderText}>
              {filtersOpen ? '▼' : '►'} Arama & Filtreleme
            </ThemedText>
          </Pressable>
          {filtersOpen && (
            <View style={styles.panelBody}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Ara: atık adı"
                style={styles.search}
              />
              <View style={styles.filters}>
                {CATEGORY_FILTERS.map((c) => (
                  <FilterChip
                    key={c.value}
                    label={c.label}
                    active={selected === c.value}
                    onPress={() => setSelected(c.value)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  search: {
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#88b04b',
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: '#88b04b',
  },
  chipText: {
    color: '#88b04b',
  },
  chipTextActive: {
    color: '#fff',
  },
  panel: {
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  panelHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f6f6f6',
  },
  panelHeaderText: {
    fontWeight: '600',
  },
  panelBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 12,
    padding: 12,
  },
  pill: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.7,
  },
});

