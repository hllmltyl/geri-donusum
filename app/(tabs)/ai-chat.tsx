import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, ActivityIndicator, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { KeyboardWrapper } from '@/components/ui/KeyboardWrapper';
import { MessageList } from '@/components/chat/MessageList';
import { useChatHistory } from '@/hooks/useChatHistory';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressableScale({ onPress, style, children, disabled = false }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function UpcycleScreen() {
  const { wasteType } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const glassBg = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';
  
  const { messages, inputText, setInputText, isLoading, handleSend } = useChatHistory(wasteType as string);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <KeyboardWrapper 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top']}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Background Decor */}
      <View style={[styles.bgBlob, { backgroundColor: colors.tint, opacity: isDark ? 0.15 : 0.08 }]} />

      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={32} color={colors.text} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text }]}>İleri Dönüşüm Asistanı</Text>
      </View>

      <MessageList messages={messages} isDark={isDark} colors={colors} />
      
      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)', 
          borderTopColor: glassBorder, 
          marginBottom: isKeyboardVisible ? 0 : insets.bottom,
          paddingBottom: 16
        }
      ]}>
        <PressableScale 
          style={[styles.scanButton, { backgroundColor: colors.tint + '15' }]} 
          onPress={() => router.push('/(tabs)/scan')}
        >
          <IconSymbol name="camera.fill" size={20} color={colors.tint} />
        </PressableScale>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}
          placeholder="Mesajınızı yazın..."
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
  inputContainer: { flexDirection: 'row', padding: 16, alignItems: 'center', borderTopWidth: 1 },
  scanButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  input: { flex: 1, minHeight: 50, maxHeight: 120, borderRadius: 25, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, fontSize: 16, marginRight: 10 },
  sendButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});
