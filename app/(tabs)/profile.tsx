import { PasswordModal } from '@/components/profile/PasswordModal';
import { ThemedText } from '@/components/ThemedText';
import { useProfileLogic } from '@/hooks/useProfileLogic';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { getLevelAndRankInfo } from '@/utils/points';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressableScale({ onPress, style, children, disabled = false }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, loading: contextLoading, isAdmin } = useUser();
  const { themeMode, setThemeMode, colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const {
    saving, editMode, setEditMode, showPasswordModal, setShowPasswordModal, alertMsg,
    formData, setFormData, setPasswordData, email, createdAtText, getInitials,
    handleSave, handlePasswordChange, handleCancel, handleLogout
  } = useProfileLogic(user, userProfile);

  const navigateToSettings = useCallback(() => router.push('/settings'), [router]);
  const navigateToAdmin = useCallback(() => router.push('/(tabs)/admin'), [router]);
  const enableEditMode = useCallback(() => setEditMode(true), [setEditMode]);
  const openPasswordModal = useCallback(() => setShowPasswordModal(true), [setShowPasswordModal]);

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  const isDark = colorScheme === 'dark';
  const subText = isDark ? '#A0A0A0' : '#707070';

  if (!user && !contextLoading) return <Redirect href="/(auth)/login" />;
  if (contextLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  const currentXp = userProfile?.xp || 0;
  const { level: currentLevel, rank: currentRank, nextLevelXp, progress: xpProgress, isMax } = getLevelAndRankInfo(currentXp);

  const infoData = [
    { label: t('profile.firstName'), value: formData.firstName || '-', editable: true, key: 'firstName', icon: 'person' },
    { label: t('profile.lastName'), value: formData.lastName || '-', editable: true, key: 'lastName', icon: 'person' },
    { label: t('profile.email'), value: email, editable: true, key: 'email', icon: 'email' },
    { label: t('profile.registerDate'), value: createdAtText, editable: false, icon: 'event' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
      {/* Dynamic Background Blob */}
      <View style={[styles.bgBlob, { backgroundColor: primaryColor, opacity: isDark ? 0.2 : 0.1 }]} />

      <View style={styles.header}>
        <PressableScale
          style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: cardColor, alignItems: 'center', justifyContent: 'center', shadowColor: isDark ? '#000' : '#888', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 1 }}
          onPress={navigateToSettings}
        >
          <MaterialIcons name="settings" size={24} color={textColor} />
        </PressableScale>
        <View style={styles.avatarContainer}>
          <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.avatarGlass}>
            <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.avatarText}>{getInitials()}</ThemedText>
            </View>
          </BlurView>
        </View>
        <ThemedText style={styles.title}>
          {formData.firstName || t('profile.defaultUser')} {formData.lastName || ''}
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
          <View style={[styles.levelBadge, { backgroundColor: primaryColor + '20' }]}>
            <MaterialIcons name="military-tech" size={18} color={primaryColor} />
            <ThemedText style={[styles.levelText, { color: primaryColor }]}>
              Lv {currentLevel} - {currentRank}
            </ThemedText>
          </View>
          <View style={[styles.trustBadge, { backgroundColor: '#4CAF50' + '20' }]}>
            <MaterialIcons name="verified-user" size={16} color="#4CAF50" />
            <ThemedText style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 12 }}>
              %{userProfile?.trustScore ?? 20} Güven
            </ThemedText>
          </View>
        </View>

        <View style={styles.xpContainer}>
          <View style={styles.xpLabels}>
            <ThemedText style={styles.xpText}>{currentXp} XP</ThemedText>
            <ThemedText style={styles.xpText}>{isMax ? 'MAX' : `${nextLevelXp} XP`}</ThemedText>
          </View>
          <View style={[styles.xpBarBg, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
            <View style={[styles.xpBarFill, { width: `${xpProgress}%`, backgroundColor: primaryColor }]} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {alertMsg && (
          <View style={[styles.alertContainer, alertMsg.type === 'success' ? styles.alertSuccess : styles.alertError]}>
            <MaterialIcons name={alertMsg.type === 'success' ? 'check-circle' : 'error'} size={20} color={alertMsg.type === 'success' ? '#155724' : '#721c24'} />
            <ThemedText style={styles.alertText}>{alertMsg.message}</ThemedText>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t('profile.profileInfo')}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, shadowColor: isDark ? '#000' : '#888' }]}>
          {editMode ? (
            <View style={styles.formGrid}>
              {infoData.filter(item => item.editable).map((item, i) => (
                <View key={i} style={styles.formGroup}>
                  <ThemedText style={[styles.labelText, { color: subText }]}>{item.label}</ThemedText>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: isDark ? '#222' : '#F5F7FA', borderColor: borderColor, color: textColor }]}
                    value={formData[item.key as keyof typeof formData] as string}
                    onChangeText={v => setFormData(f => ({ ...f, [item.key as keyof typeof formData]: v }))}
                    placeholder={t('profile.enterValue', { label: item.label })}
                    placeholderTextColor={subText}
                    keyboardType={item.key === 'email' ? 'email-address' : 'default'}
                    editable={!saving}
                  />
                </View>
              ))}
              <View style={styles.formActions}>
                <PressableScale style={[styles.btn, { backgroundColor: primaryColor, flex: 1 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={styles.btnText}>{t('profile.save')}</ThemedText>}
                </PressableScale>
                <PressableScale style={[styles.btn, { backgroundColor: secondaryColor }]} onPress={handleCancel} disabled={saving}>
                  <ThemedText style={styles.btnText}>{t('profile.cancel')}</ThemedText>
                </PressableScale>
              </View>
            </View>
          ) : (
            <View style={styles.infoGrid}>
              {infoData.map((item, i) => (
                <View key={i} style={styles.infoRow}>
                  <View style={[styles.infoIconBox, { backgroundColor: primaryColor + '15' }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={primaryColor} />
                  </View>
                  <View style={styles.infoContent}>
                    <ThemedText style={[styles.infoLabel, { color: subText }]}>{item.label}</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: textColor }]}>{item.value}</ThemedText>
                  </View>
                </View>
              ))}
              <View style={styles.actionButtons}>
                <PressableScale style={[styles.btnOutline, { borderColor: primaryColor }]} onPress={enableEditMode}>
                  <MaterialIcons name="edit" size={18} color={primaryColor} />
                  <ThemedText style={[styles.btnOutlineText, { color: primaryColor }]}>{t('profile.edit')}</ThemedText>
                </PressableScale>
                <PressableScale style={[styles.btnOutline, { borderColor: subText }]} onPress={openPasswordModal}>
                  <MaterialIcons name="lock" size={18} color={subText} />
                  <ThemedText style={[styles.btnOutlineText, { color: subText }]}>{t('profile.password')}</ThemedText>
                </PressableScale>
              </View>
            </View>
          )}
        </View>


        {isAdmin && (
          <PressableScale style={[styles.logoutBtn, { backgroundColor: primaryColor + '15', marginBottom: 16 }]} onPress={navigateToAdmin}>
            <MaterialIcons name="admin-panel-settings" size={22} color={primaryColor} />
            <ThemedText style={[styles.logoutText, { color: primaryColor }]}>{t('profile.adminPanel')}</ThemedText>
          </PressableScale>
        )}

        <PressableScale style={[styles.logoutBtn, { backgroundColor: '#FF4B4B' + '15' }]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color="#FF4B4B" />
          <ThemedText style={[styles.logoutText, { color: '#FF4B4B' }]}>{t('profile.logout')}</ThemedText>
        </PressableScale>
      </View>

      <PasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSave={handlePasswordChange}
        setPasswordData={setPasswordData}
        isDark={isDark}
        cardColor={cardColor}
        textColor={textColor}
        subText={subText}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  bgBlob: { position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  avatarContainer: { marginBottom: 16, borderRadius: 50, overflow: 'hidden' },
  avatarGlass: { padding: 8, borderRadius: 60 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, gap: 6 },
  levelText: { fontSize: 14, fontWeight: '700' },
  content: { paddingHorizontal: 20 },
  sectionHeader: { marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  card: { borderRadius: 24, padding: 24, marginBottom: 24, elevation: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  infoIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, gap: 8 },
  btnOutlineText: { fontSize: 15, fontWeight: '700' },
  infoGrid: { gap: 16 },
  formGrid: { gap: 16 },
  formGroup: { marginBottom: 16 },
  labelText: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  formInput: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 54, fontSize: 16, fontWeight: '500' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16, paddingHorizontal: 24 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  themeOption: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, marginHorizontal: 4, gap: 8 },
  themeText: { fontSize: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, marginTop: 10, gap: 10 },
  logoutText: { fontSize: 16, fontWeight: '800' },
  alertContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 24, gap: 10 },
  alertSuccess: { backgroundColor: '#d4edda' },
  alertError: { backgroundColor: '#f8d7da' },
  alertText: { fontSize: 14, fontWeight: '600', color: '#333' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  xpContainer: { width: '80%', marginTop: 5 },
  xpLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpText: { fontSize: 12, fontWeight: '800', color: '#888' },
  xpBarBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 5 }
});
