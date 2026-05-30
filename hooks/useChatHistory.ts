import { useState, useCallback, useEffect } from 'react';
import { Message } from '@/constants/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export function useChatHistory(wasteType?: string | string[]) {
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

  useEffect(() => {
    if (wasteType) {
      const initialQuery = `Elimde bir ${wasteType} var, bununla ne gibi yaratıcı ileri dönüşüm projeleri yapabilirim?`;
      setInputText(initialQuery);
    }
  }, [wasteType]);

  const triggerGemini = async (currentMessages: Message[], promptText: string) => {
    setIsLoading(true);
    try {
      if (!GEMINI_API_KEY) throw new Error("Gemini API Anahtarı bulunamadı.");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: "Sen bir İleri Dönüşüm (Upcycling) Asistanısın. Kullanıcının elindeki atıkları yaratıcı ve çevre dostu projelere dönüştürmesi için pratik, adım adım uygulanabilir ve güvenli tavsiyeler ver. Kısa, öz ve motive edici ol.",
      });

      // Gemini sohbet geçmişini formatla (welcome mesajı ve son gönderilen prompt hariç)
      const history = currentMessages
        .filter(m => m.id !== 'welcome' && m.text !== promptText)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(promptText);
      const response = await result.response;
      const botText = response.text();

      setMessages(prev => [
        ...prev, 
        { id: Date.now().toString(), text: botText, sender: 'bot', timestamp: new Date() }
      ]);
    } catch (error: any) {
      console.warn("Gemini chat error:", error?.message || error);
      const isQuotaError = error?.message?.includes("429") || error?.message?.includes("depleted") || error?.message?.includes("quota");
      const errorMessage = isQuotaError 
        ? "Gemini API krediniz veya kotanız tükenmiş görünüyor. Lütfen Google AI Studio (https://aistudio.google.com/) üzerinden faturalandırma veya kullanım limitlerinizi kontrol edin."
        : "Üzgünüm, şu anda yanıt veremiyorum. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.";
      
      setMessages(prev => [
        ...prev, 
        { id: Date.now().toString(), text: errorMessage, sender: 'bot', timestamp: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = useCallback(async (textToProcess = inputText) => {
    if (!textToProcess.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToProcess.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => {
      const updatedMessages = [...prev, userMessage];
      triggerGemini(updatedMessages, textToProcess.trim());
      return updatedMessages;
    });

    setInputText('');
  }, [inputText]);

  return {
    messages,
    inputText,
    setInputText,
    isLoading,
    handleSend
  };
}
