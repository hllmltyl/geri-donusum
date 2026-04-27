import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('points', 'desc'),
          limit(50)
        );
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
        console.error("Liderlik tablosu çekilirken hata:", error);
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
    if (index === 0) return { backgroundColor: '#FFD700', icon: 'medal.fill', color: '#B8860B' }; // Altın
    if (index === 1) return { backgroundColor: '#C0C0C0', icon: 'medal.fill', color: '#737373' }; // Gümüş
    if (index === 2) return { backgroundColor: '#CD7F32', icon: 'medal.fill', color: '#8B4513' }; // Bronz
    return null;
  };

  const renderItem = ({ item, index }: { item: UserScore; index: number }) => {
    const rankStyle = getRankStyle(index);
    
    return (
      <View style={[styles.itemContainer, { backgroundColor: colors.background }]}>
        <View style={styles.rankContainer}>
          {rankStyle ? (
            <IconSymbol name={rankStyle.icon as any} size={28} color={rankStyle.color} />
          ) : (
            <Text style={[styles.rankText, { color: colors.text }]}>{index + 1}</Text>
          )}
        </View>
        
        <View style={[styles.avatar, { backgroundColor: rankStyle ? rankStyle.backgroundColor : colors.tint }]}>
          <Text style={styles.avatarText}>{getInitials(item.displayName)}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>
            {item.displayName}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.points} Puan</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Liderlik Tablosu</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>En Çok Katkı Sağlayanlar</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
  },
  scoreText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
