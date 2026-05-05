import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, NativeSafeAreaViewProps } from 'react-native-safe-area-context';

interface KeyboardWrapperProps extends NativeSafeAreaViewProps {
  children: React.ReactNode;
  keyboardVerticalOffset?: number;
  style?: ViewStyle | ViewStyle[];
}

export const KeyboardWrapper: React.FC<KeyboardWrapperProps> = ({ 
  children, 
  keyboardVerticalOffset = Platform.OS === 'ios' ? 90 : 0, // Android typically needs 0 or very small offset with 'height'
  style,
  ...safeAreaProps
}) => {
  return (
    <SafeAreaView style={[styles.container, style]} {...safeAreaProps}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
