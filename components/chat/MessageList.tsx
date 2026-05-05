import React, { useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Message } from '@/constants/types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isDark: boolean;
  colors: any;
}

export const MessageList: React.FC<MessageListProps> = React.memo(({ messages, isDark, colors }) => {
  const flatListRef = useRef<FlatList>(null);

  const renderMessage = ({ item }: { item: Message }) => {
    return <MessageBubble message={item} isDark={isDark} colors={colors} />;
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={item => item.id}
      renderItem={renderMessage}
      contentContainerStyle={styles.chatContainer}
      onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      removeClippedSubviews={true}
    />
  );
});

const styles = StyleSheet.create({
  chatContainer: { 
    padding: 20, 
    paddingBottom: 40 
  },
});
