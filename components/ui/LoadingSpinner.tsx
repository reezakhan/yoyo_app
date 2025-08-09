import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

export function LoadingSpinner({ size = 'large', color, style }: LoadingSpinnerProps) {
  const defaultColor = useThemeColor({}, 'primary');

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color || defaultColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    flex: 1
  },
});