// app/layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.dark : styles.light]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  light: {
    backgroundColor: '#fff',
  },
  dark: {
    backgroundColor: '#121212',
  },
});
