import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getLevelAndRankInfo } from '@/utils/points';


type UserScore = {
  id: string;
  displayName: string;
  points: number;
  xp: number;
  level: number;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'weekly' | 'allTime'>('allTime');
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
            displayName: data.displayName || data.name || t('leaderboard.anonymous'),
            points: data.points || 0,
            xp: data.xp || 0,
            level: getLevelAndRankInfo(data.xp || 0).level,
          });
        });
        setUsers(leaderboardData);
      } catch (error) {
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

  const getRankIcon = (level: number) => {
    if (level >= 8) return '🌍';
    if (level >= 7) return '🦅';
    if (level >= 5) return '🌳';
    if (level >= 3) return '🌿';
    return '🌱';
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
          <Text style={[styles.levelText, { color: colors.icon }]}>
            {getRankIcon(item.level)} Lv. {item.level}
          </Text>
        </View>

        <View style={[styles.scoreContainer, { backgroundColor: isTop3 ? rankStyle?.bg : 'rgba(76, 175, 80, 0.1)' }]}>
          <Text style={[styles.scoreText, { color: isTop3 ? rankStyle?.color : '#4CAF50' }]}>{item.points} {t('leaderboard.points')}</Text>
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


      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <MaterialIcons name="chevron-left" size={32} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('leaderboard.title')}</Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>{t('leaderboard.subtitle')}</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'weekly' && { backgroundColor: colors.tint }]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && { color: '#FFF' }]}>Haftalık</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'allTime' && { backgroundColor: colors.tint }]}
            onPress={() => setActiveTab('allTime')}
          >
            <Text style={[styles.tabText, activeTab === 'allTime' && { color: '#FFF' }]}>Tüm Zamanlar</Text>
          </TouchableOpacity>
        </View>
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 16, fontWeight: '500', marginLeft: 52 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  rankContainer: { width: 44, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 20, fontWeight: '800' },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
  avatarText: { fontSize: 18, fontWeight: '800' },
  infoContainer: { flex: 1, justifyContent: 'center' },
  nameText: { fontSize: 17 },
  levelText: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  scoreContainer: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  scoreText: { fontWeight: '800', fontSize: 14 },
  tabContainer: { flexDirection: 'row', marginTop: 20, backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: 20, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  tabText: { fontWeight: '700', fontSize: 14, color: '#888' },
});
