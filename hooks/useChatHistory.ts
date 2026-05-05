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

  const handleSend = useCallback(async (textToProcess = inputText) => {
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

      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), text: botText, sender: 'bot', timestamp: new Date() }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), text: 'Üzgünüm, şu anda yanıt veremiyorum.', sender: 'bot', timestamp: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  return {
    messages,
    inputText,
    setInputText,
    isLoading,
    handleSend
  };
}
