import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

type UserScore = {
  id: string;
  displayName: string;
  points: number;
};

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const glassBg = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const leaderboardData: UserScore[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          leaderboardData.push({
            id: doc.id,
            displayName: data.displayName || data.name || 'İsimsiz Kullanıcı',
            points: data.points || 0,
          });
        });
        setUsers(leaderboardData);
      } catch (error) {
        // console.error("Liderlik tablosu çekilirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return { bg: 'rgba(255, 215, 0, 0.2)', icon: 'medal.fill', color: '#B8860B' }; // Altın
    if (index === 1) return { bg: 'rgba(192, 192, 192, 0.2)', icon: 'medal.fill', color: '#737373' }; // Gümüş
    if (index === 2) return { bg: 'rgba(205, 127, 50, 0.2)', icon: 'medal.fill', color: '#8B4513' }; // Bronz
    return null;
  };

  const renderItem = ({ item, index }: { item: UserScore; index: number }) => {
    const rankStyle = getRankStyle(index);
    const isTop3 = index < 3;
    
    return (
      <View style={[styles.itemContainer, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#888' }]}>
        <View style={styles.rankContainer}>
          {rankStyle ? (
            <IconSymbol name={rankStyle.icon as any} size={32} color={rankStyle.color} />
          ) : (
            <Text style={[styles.rankText, { color: colors.text }]}>{index + 1}</Text>
          )}
        </View>
        
        <View style={[styles.avatar, { backgroundColor: rankStyle ? rankStyle.bg : colors.tint + '15' }]}>
          <Text style={[styles.avatarText, { color: rankStyle ? rankStyle.color : colors.tint }]}>{getInitials(item.displayName)}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.nameText, { color: colors.text, fontWeight: isTop3 ? '800' : '600' }]} numberOfLines={1}>
            {item.displayName}
          </Text>
        </View>

        <View style={[styles.scoreContainer, { backgroundColor: isTop3 ? rankStyle?.bg : 'rgba(76, 175, 80, 0.1)' }]}>
          <Text style={[styles.scoreText, { color: isTop3 ? rankStyle?.color : '#4CAF50' }]}>{item.points} Puan</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Background Decor */}
      <View style={[styles.bgBlob, { backgroundColor: colors.tint, opacity: isDark ? 0.15 : 0.08 }]} />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Liderlik Tablosu</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>En Çok Katkı Sağlayanlar</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgBlob: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 16, marginTop: 6, fontWeight: '500' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 24,
    elevation: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  rankContainer: { width: 44, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 20, fontWeight: '800' },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
  avatarText: { fontSize: 18, fontWeight: '800' },
  infoContainer: { flex: 1, justifyContent: 'center' },
  nameText: { fontSize: 17 },
  scoreContainer: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  scoreText: { fontWeight: '800', fontSize: 14 },
});
