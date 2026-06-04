import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { db } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getLevelAndRankInfo } from '@/utils/points';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, InteractionManager, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';


type UserScore = {
  id: string;
  displayName: string;
  xp: number;
  level: number;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { t } = useTranslation(); // Çoklu dil çeviri kancası
  const { userProfile } = useUser();
  const weeklyTasks = userProfile?.weeklyTasks;

  // Liderlik tablosundaki kullanıcı listesi state'i
  const [users, setUsers] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true); // Yüklenme durumu
  const [activeTab, setActiveTab] = useState<'weekly' | 'allTime' | 'tasks'>('allTime'); // Aktif sekme ('haftalık' veya 'tüm zamanlar' veya 'görevler')

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets(); // iOS/Android ekran güvenli alan boşlukları

  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const glassBg = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';

  // Ekran her odağa geldiğinde veya sekme değiştiğinde tetiklenen odaklanma etkisi
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      // Firestore veritabanından en yüksek XP'ye sahip ilk 50 kullanıcıyı çeken işlev
      const fetchLeaderboard = async () => {
        if (activeTab === 'tasks') {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        try {
          const orderField = activeTab === 'weekly' ? 'weeklyXp' : 'xp';
          const q = query(collection(db, 'users'), orderBy(orderField, 'desc'), limit(50));
          const querySnapshot = await getDocs(q);
          const leaderboardData: UserScore[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            leaderboardData.push({
              id: doc.id,
              displayName: data.displayName || data.name || t('leaderboard.anonymous'),
              xp: data[orderField] || 0,
              level: getLevelAndRankInfo(data.xp || 0).level,
            });
          });

          if (isMounted) {
            setUsers(leaderboardData);
          }
        } catch (error) {
          console.error("Leaderboard fetch error:", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      // Sayfa geçiş animasyonlarının takılmaması için asenkron kuyrukta çalıştır
      const interactionPromise = InteractionManager.runAfterInteractions(() => {
        fetchLeaderboard();
      });

      return () => {
        isMounted = false;
        interactionPromise.cancel();
      };
    }, [activeTab])
  );

  // Kalan gün sayısını hesaplayan yardımcı işlev (Gelecek Pazartesi'ye kalan gün)
  const getRemainingDays = () => {
    const now = new Date();
    const day = now.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
    // Gelecek Pazartesi'ye olan uzaklık
    const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
    return daysUntilNextMonday;
  };

  const tasksData = [
    {
      id: 'plastic_scan',
      title: t('leaderboard.tasksList.plastic_scan.title'),
      desc: t('leaderboard.tasksList.plastic_scan.desc'),
      current: weeklyTasks?.plastic_count ?? 0,
      target: 10,
      claimed: weeklyTasks?.isPlasticsClaimed ?? false,
      xp: 50,
      icon: 'local-drink',
      color: '#2196F3',
    },
    {
      id: 'paper_scan',
      title: t('leaderboard.tasksList.paper_scan.title'),
      desc: t('leaderboard.tasksList.paper_scan.desc'),
      current: weeklyTasks?.paper_count ?? 0,
      target: 10,
      claimed: weeklyTasks?.isPaperClaimed ?? false,
      xp: 50,
      icon: 'description',
      color: '#FF9800',
    },
    {
      id: 'point_added',
      title: t('leaderboard.tasksList.point_added.title'),
      desc: t('leaderboard.tasksList.point_added.desc'),
      current: weeklyTasks?.points_added ?? 0,
      target: 2,
      claimed: weeklyTasks?.isPointsAddedClaimed ?? false,
      xp: 100,
      icon: 'add-location',
      color: '#4CAF50',
    },
    {
      id: 'point_verified',
      title: t('leaderboard.tasksList.point_verified.title'),
      desc: t('leaderboard.tasksList.point_verified.desc'),
      current: weeklyTasks?.points_verified ?? 0,
      target: 5,
      claimed: weeklyTasks?.isPointsVerifiedClaimed ?? false,
      xp: 60,
      icon: 'verified-user',
      color: '#00BCD4',
    },
    {
      id: 'total_dropoffs',
      title: t('leaderboard.tasksList.total_dropoffs.title'),
      desc: t('leaderboard.tasksList.total_dropoffs.desc'),
      current: weeklyTasks?.total_dropoffs ?? 0,
      target: 25,
      claimed: weeklyTasks?.isDropoffsClaimed ?? false,
      xp: 150,
      icon: 'delete-outline',
      color: '#E91E63',
    },
    {
      id: 'tip_read',
      title: t('leaderboard.tasksList.tip_read.title'),
      desc: t('leaderboard.tasksList.tip_read.desc'),
      current: weeklyTasks?.tips_read ?? 0,
      target: 7,
      claimed: weeklyTasks?.isTipsClaimed ?? false,
      xp: 40,
      icon: 'lightbulb-outline',
      color: '#FFC107',
    },
    {
      id: 'categories_dropped',
      title: t('leaderboard.tasksList.categories_dropped.title'),
      desc: t('leaderboard.tasksList.categories_dropped.desc'),
      current: weeklyTasks?.categories_dropped?.length ?? 0,
      target: 5,
      claimed: weeklyTasks?.isKarmaClaimed ?? false,
      xp: 80,
      icon: 'category',
      color: '#9C27B0',
    },
  ];

  const renderTasksSection = () => {
    const remainingDays = getRemainingDays();

    return (
      <View style={styles.tasksContainer}>
        {/* Bilgilendirme Kartı */}
        <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)', borderColor: isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)' }]}>
          <View style={styles.infoBannerHeader}>
            <MaterialIcons name="event-note" size={24} color="#4CAF50" />
            <Text style={[styles.infoBannerTitle, { color: colors.text }]}>
              {t('leaderboard.weeklyTasksTitle')}
            </Text>
          </View>
          <Text style={[styles.infoBannerSubtitle, { color: colors.icon }]}>
            {t('leaderboard.weeklyTasksSubtitle')}
          </Text>
          <Text style={[styles.countdownText, { color: '#4CAF50' }]}>
            <MaterialIcons name="access-time" size={14} color="#4CAF50" /> {t('leaderboard.remainingDays', { days: remainingDays })}
          </Text>
        </View>

        {/* Görev Listesi */}
        {tasksData.map((task) => {
          const progress = Math.min(task.current / task.target, 1);
          const isCompleted = task.current >= task.target;

          return (
            <View key={task.id} style={[styles.taskCard, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#888' }]}>
              <View style={styles.taskHeader}>
                <View style={[styles.taskIconBox, { backgroundColor: task.color + '15' }]}>
                  <MaterialIcons name={task.icon as any} size={24} color={task.color} />
                </View>

                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>
                    {task.title}
                  </Text>
                  <Text style={[styles.taskDesc, { color: colors.icon }]}>
                    {task.desc}
                  </Text>
                </View>

                <View style={[
                  styles.rewardBadge,
                  task.claimed
                    ? { backgroundColor: 'rgba(76, 175, 80, 0.2)' }
                    : isCompleted
                      ? { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                      : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                ]}>
                  {task.claimed ? (
                    <View style={styles.claimedRow}>
                      <MaterialIcons name="check" size={14} color="#4CAF50" />
                      <Text style={[styles.rewardText, { color: '#4CAF50' }]}>
                        {t('leaderboard.taskCompleted')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[
                      styles.rewardText,
                      { color: isCompleted ? '#4CAF50' : colors.text }
                    ]}>
                      {t('leaderboard.taskReward', { xp: task.xp })}
                    </Text>
                  )}
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]}>
                  <View style={[
                    styles.progressBarFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: isCompleted ? '#4CAF50' : task.color
                    }
                  ]} />
                </View>
                <Text style={[styles.progressTextValue, { color: isCompleted ? '#4CAF50' : colors.icon }]}>
                  {t('leaderboard.taskProgress', { current: task.current, target: task.target })}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Kullanıcı isim ve soyisminden profil dairesi için baş harfleri çıkaran yardımcı fonksiyon
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      const first = parts[0];
      const last = parts.pop();
      if (first && last) {
        return (first.charAt(0) + last.charAt(0)).toUpperCase();
      }
    }
    return name.substring(0, 2).toUpperCase();
  };

  // İlk 3 dereceye (Altın, Gümüş, Bronz) girenler için arka plan ve madalya renk stilleri
  const getRankStyle = (index: number) => {
    if (index === 0) return { bg: 'rgba(255, 215, 0, 0.2)', icon: 'medal.fill', color: '#B8860B' }; // Altın madalya stili
    if (index === 1) return { bg: 'rgba(192, 192, 192, 0.2)', icon: 'medal.fill', color: '#737373' }; // Gümüş madalya stili
    if (index === 2) return { bg: 'rgba(205, 127, 50, 0.2)', icon: 'medal.fill', color: '#8B4513' }; // Bronz madalya stili
    return null;
  };

  // Seviye (Level) değerine göre ekranda gösterilecek emoji belirleme işlevi
  const getRankIcon = (level: number) => {
    if (level >= 8) return '👑'; // Eko-Lider
    if (level === 7) return '🌍'; // Eko-Dost
    if (level === 6) return '🌲'; // Orman
    if (level === 5) return '🌳'; // Ağaç
    if (level === 4) return '🌿'; // Fidan
    if (level === 3) return '🍃'; // Yaprak
    if (level === 2) return '🌱'; // Filiz
    return '🌱'; // Tohum
  };

  const renderItem = ({ item, index }: { item: UserScore; index: number }) => {
    const rankStyle = getRankStyle(index);
    const isTop3 = index < 3;

    return (
      <View style={[styles.itemContainer, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#888' }]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: rankStyle ? rankStyle.color : colors.text }]}>
            {index + 1}
          </Text>
          {rankStyle && (
            <IconSymbol name={rankStyle.icon as any} size={14} color={rankStyle.color} style={{ marginTop: 2 }} />
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
          <Text style={[styles.scoreText, { color: isTop3 ? rankStyle?.color : '#4CAF50' }]}>{item.xp} XP</Text>
        </View>
      </View>
    );
  };

  if (loading && users.length === 0) {
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
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/homepage');
              }
            }} 
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          >
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
            <Text style={[styles.tabText, activeTab === 'weekly' && { color: '#FFF' }]}>{t('leaderboard.weekly')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'allTime' && { backgroundColor: colors.tint }]}
            onPress={() => setActiveTab('allTime')}
          >
            <Text style={[styles.tabText, activeTab === 'allTime' && { color: '#FFF' }]}>{t('leaderboard.allTime')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tasks' && { backgroundColor: colors.tint }]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text style={[styles.tabText, activeTab === 'tasks' && { color: '#FFF' }]}>{t('leaderboard.tasks')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'tasks' ? (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {renderTasksSection()}
        </ScrollView>
      ) : (
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
      )}
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
  tasksContainer: {
    gap: 16,
    marginTop: 10,
  },
  infoBanner: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  infoBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  infoBannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskCard: {
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  rewardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '800',
  },
  claimedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressContainer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressTextValue: {
    fontSize: 12,
    fontWeight: '700',
    width: 50,
    textAlign: 'right',
  },
});
