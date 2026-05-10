import React from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { themeMode, setThemeMode, colorScheme } = useTheme();

  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');

  const isDark = colorScheme === 'dark';
  const subText = isDark ? '#A0A0A0' : '#707070';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]} 
      contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingTop: 20 }}
    >
      <Stack.Screen 
        options={{ 
          title: t('settings.title'), 
          headerBackTitle: t('settings.back'),
          headerShadowVisible: false, 
          headerStyle: { backgroundColor }, 
          headerTintColor: textColor 
        }} 
      />
      <View style={styles.content}>
        
        {/* Tema Ayarları */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t('settings.theme')}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, padding: 16, flexDirection: 'row', justifyContent: 'space-between', shadowColor: isDark ? '#000' : '#888' }]}>
          {(['system', 'light', 'dark'] as const).map((mode) => {
            const isActive = themeMode === mode;
            return (
              <PressableScale
                key={mode}
                style={[
                  styles.themeOption,
                  { backgroundColor: isActive ? primaryColor : (isDark ? '#222' : '#F5F7FA') }
                ]}
                onPress={() => setThemeMode(mode)}
              >
                <MaterialIcons name={mode === 'light' ? 'light-mode' : mode === 'dark' ? 'dark-mode' : 'settings-system-daydream'} size={20} color={isActive ? '#FFF' : subText} />
                <ThemedText style={[styles.themeText, { color: isActive ? '#FFF' : subText, fontWeight: isActive ? '700' : '500' }]}>
                  {t(`settings.${mode}`)}
                </ThemedText>
              </PressableScale>
            );
          })}
        </View>

        {/* Dil Ayarları */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t('settings.language')}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, padding: 16, flexDirection: 'row', justifyContent: 'space-between', shadowColor: isDark ? '#000' : '#888' }]}>
          {(['tr', 'en'] as const).map((lang) => {
            const isActive = i18n.language === lang;
            return (
              <PressableScale
                key={lang}
                style={[
                  styles.themeOption,
                  { backgroundColor: isActive ? primaryColor : (isDark ? '#222' : '#F5F7FA') }
                ]}
                onPress={() => changeLanguage(lang)}
              >
                <MaterialIcons name="language" size={20} color={isActive ? '#FFF' : subText} />
                <ThemedText style={[styles.themeText, { color: isActive ? '#FFF' : subText, fontWeight: isActive ? '700' : '500' }]}>
                  {lang === 'tr' ? 'Türkçe' : 'English'}
                </ThemedText>
              </PressableScale>
            );
          })}
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 10
  },
  sectionHeader: { 
    marginBottom: 12, 
    marginTop: 10 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '800' 
  },
  card: { 
    borderRadius: 24, 
    marginBottom: 24, 
    elevation: 4, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 20 
  },
  themeOption: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderRadius: 16, 
    marginHorizontal: 4, 
    gap: 8 
  },
  themeText: { 
    fontSize: 14 
  }
});
