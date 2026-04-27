import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

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

  const glassBg = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Merhaba! Ben İleri Dönüşüm Asistanın. Elindeki atıklardan neler yapabileceğini öğrenmek için bana yazabilirsin.',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (wasteType) {
      const initialQuery = `Elimde bir ${wasteType} var, bununla ne gibi yaratıcı ileri dönüşüm projeleri yapabilirim?`;
      setInputText(initialQuery);
    }
  }, [wasteType]);

  const handleSend = async (textToProcess = inputText) => {
    if (!textToProcess.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToProcess.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      if (!GEMINI_API_KEY) throw new Error("Gemini API Anahtarı bulunamadı.");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = `Sen bir İleri Dönüşüm (Upcycling) Asistanısın. Kullanıcının elindeki atıkları yaratıcı ve çevre dostu projelere dönüştürmesi için pratik, adım adım uygulanabilir ve güvenli tavsiyeler ver. Kısa, öz ve motive edici ol.\n\nKullanıcı: ${textToProcess}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const botText = response.text();

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: botText, sender: 'bot', timestamp: new Date() }]);
    } catch (error) {
      // console.error("Gemini API Hatası:", error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Üzgünüm, şu anda yanıt veremiyorum.', sender: 'bot', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : [styles.botBubble, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', shadowColor: isDark ? '#000' : '#888' }]]}>
        <Text style={[styles.messageText, isUser ? styles.userText : { color: colors.text }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Background Decor */}
      <View style={[styles.bgBlob, { backgroundColor: colors.tint, opacity: isDark ? 0.15 : 0.08 }]} />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>İleri Dönüşüm Asistanı</Text>
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
        
        <BlurView intensity={isDark ? 30 : 80} tint={isDark ? 'dark' : 'light'} experimentalBlurMethod="dimezisBlurView" style={[styles.inputContainer, { backgroundColor: glassBg, borderTopColor: glassBorder }]}>
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
        </BlurView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgBlob: { position: 'absolute', top: 50, right: -100, width: 300, height: 300, borderRadius: 150 },
  header: { paddingHorizontal: 24, paddingVertical: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  keyboardView: { flex: 1 },
  chatContainer: { padding: 20, paddingBottom: 40 },
  messageBubble: { maxWidth: '82%', padding: 16, borderRadius: 24, marginBottom: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#51A646', borderBottomRightRadius: 6 },
  botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6, elevation: 3, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  messageText: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  userText: { color: '#FFF' },
  inputContainer: { flexDirection: 'row', padding: 16, alignItems: 'flex-end', borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 30 : 16 },
  input: { flex: 1, minHeight: 50, maxHeight: 120, borderRadius: 25, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, fontSize: 16, marginRight: 12 },
  sendButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});
