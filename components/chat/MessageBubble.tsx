import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '@/constants/types';

interface MessageBubbleProps {
  message: Message;
  isDark: boolean;
  colors: any;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, isDark, colors }) => {
  const isUser = message.sender === 'user';
  
  return (
    <View style={[
      styles.messageBubble, 
      isUser 
        ? styles.userBubble 
        : [styles.botBubble, { 
            backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', 
            shadowColor: isDark ? '#000' : '#888' 
          }]
    ]}>
      <Text style={[
        styles.messageText, 
        isUser ? styles.userText : { color: colors.text }
      ]}>
        {message.text}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  messageBubble: { 
    maxWidth: '82%', 
    padding: 16, 
    borderRadius: 24, 
    marginBottom: 16 
  },
  userBubble: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#51A646', 
    borderBottomRightRadius: 6 
  },
  botBubble: { 
    alignSelf: 'flex-start', 
    borderBottomLeftRadius: 6, 
    elevation: 3, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 12 
  },
  messageText: { 
    fontSize: 16, 
    lineHeight: 24, 
    fontWeight: '500' 
  },
  userText: { 
    color: '#FFF' 
  },
});
