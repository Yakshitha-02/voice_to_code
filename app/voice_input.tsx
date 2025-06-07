import React from 'react';
import { View } from 'react-native';
import VoiceInput from '../components/VoiceInput';

export default function VoiceInputScreen() {
  return (
    <View style={{ flex: 1 }}>
      <VoiceInput />
    </View>
  );
}
