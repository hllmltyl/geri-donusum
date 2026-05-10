import { MessageList } from '@/components/chat/MessageList';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { KeyboardWrapper } from '@/components/ui/KeyboardWrapper';
import { Colors } from '@/constants/Colors';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressableScale({ onPress, style, children, disabled = false }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function UpcycleScreen() {
  const { wasteType } = useLocalSearchParams();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const glassBg = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';

  const { messages, inputText, setInputText, isLoading, handleSend } = useChatHistory(wasteType as string);

  return (
    <KeyboardWrapper
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      <View style={[styles.bgBlob, { backgroundColor: colors.tint, opacity: isDark ? 0.15 : 0.08 }]} />

      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={32} color={colors.text} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('chat.title')}</Text>
      </View>

      <MessageList messages={messages} isDark={isDark} colors={colors} />

      <View style={[
        styles.inputContainer,
        {
          backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
          borderTopColor: glassBorder,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 12,
          paddingTop: 12
        }
      ]}>

        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.icon}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <PressableScale
          style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.tint : colors.icon + '50' }]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : <IconSymbol name="paperplane.fill" size={20} color="#FFF" />}
        </PressableScale>
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgBlob: { position: 'absolute', top: 50, right: -100, width: 300, height: 300, borderRadius: 150 },
  header: { paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(150,150,150,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  inputContainer: { flexDirection: 'row', paddingHorizontal: 16, alignItems: 'center', borderTopWidth: 1 },
  scanButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  input: { flex: 1, minHeight: 50, maxHeight: 120, borderRadius: 25, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, fontSize: 16, marginRight: 10 },
  sendButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});
