import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/ThemeContext';

import Voice from '@react-native-voice/voice'; // For mobile

// Web highlighting
let SyntaxHighlighter: any, atomDark: any;
if (Platform.OS === 'web') {
  // @ts-ignore
  SyntaxHighlighter = require('react-syntax-highlighter').Prism;
  // @ts-ignore
  atomDark = require('react-syntax-highlighter/dist/esm/styles/prism').atomDark;
}

export default function VoiceInput() {
  const { theme, toggleTheme } = useTheme();

  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [recognition, setRecognition] = useState<any>(null); // For web only
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [codeLanguage, setCodeLanguage] = useState('python');

  // Setup Web recognition
  useEffect(() => {
    if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = language;

      recog.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleTranscript(transcript);
      };

      recog.onerror = (event: any) => {
        setError('Speech recognition error: ' + event.error);
        setIsListening(false);
      };

      setRecognition(recog);

      return () => {
        recog.stop();
        recog.onresult = null;
        recog.onerror = null;
      };
    }
  }, [language]);

  // Setup Mobile Voice handlers
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Voice.onSpeechResults = (event) => {
        const transcript = event.value?.[0] || '';
        handleTranscript(transcript);
      };

      Voice.onSpeechError = (event) => {
        setError('Speech recognition error: ' + event.error?.message);
        setIsListening(false);
      };

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }
  }, []);

  // Unified transcript handler
  const handleTranscript = async (transcript: string) => {
    setSpokenText(transcript);
    setLoading(true);
    setError('');
    setGeneratedCode('');
    try {
      const code = await callBackend(transcript);
      setGeneratedCode(code);
    } catch (e) {
      setError('Error generating code.');
    }
    setLoading(false);
    setIsListening(false);
  };

  // Start Listening
  const startListening = async () => {
    if (Platform.OS === 'web') {
      if (recognition) {
        recognition.lang = language;
        recognition.start();
        setIsListening(true);
        setSpokenText('');
        setGeneratedCode('');
        setError('');
      } else {
        setError('Speech recognition not supported in this browser.');
      }
    } else {
      try {
        await Voice.start(language);
        setIsListening(true);
        setSpokenText('');
        setGeneratedCode('');
        setError('');
      } catch (e: any) {
        setError('Cannot start listening: ' + e.message);
      }
    }
  };

  // Stop Listening
  const stopListening = async () => {
    if (Platform.OS === 'web') {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    } else {
      try {
        await Voice.stop();
        setIsListening(false);
      } catch (e: any) {
        setError('Cannot stop listening: ' + e.message);
      }
    }
  };

  const callBackend = async (prompt: string): Promise<string> => {
    try {
      const response = await axios.post('http://localhost:5000/generate-code', {
        prompt: prompt,
        language: codeLanguage,
      });
      return response.data.code;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Unknown error';
      setError('Backend error: ' + message);
      return '// Error generating code';
    }
  };

  const copyToClipboard = async () => {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(generatedCode);
    } else {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(generatedCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const clearAll = () => {
    setSpokenText('');
    setGeneratedCode('');
    setError('');
    setCopied(false);
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Voice-to-Code Converter</Text>

      {/* Theme toggle */}
      {Platform.OS === 'web' ? (
        <View style={{ marginBottom: 16, alignItems: 'flex-end' }}>
          <button
            style={{
              padding: '10px 20px',
              background: '#007AFF',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 16,
              marginBottom: 8,
            }}
            onClick={toggleTheme}
          >
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </View>
      ) : (
        <Button
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          onPress={toggleTheme}
        />
      )}

      {/* Language dropdown */}
      {Platform.OS === 'web' && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ marginRight: 8, fontWeight: 'bold' }}>Voice Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '5px 10px' }}
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="hi-IN">Hindi</option>
            <option value="fr-FR">French</option>
            <option value="es-ES">Spanish</option>
          </select>
        </div>
      )}

      {/* Code language dropdown */}
      {Platform.OS === 'web' && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ marginRight: 8, fontWeight: 'bold' }}>Code Language:</label>
          <select
            value={codeLanguage}
            onChange={(e) => setCodeLanguage(e.target.value)}
            style={{ padding: '5px 10px' }}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
          </select>
        </div>
      )}

      {/* Start/Stop Listening */}
      <TouchableOpacity
        style={[styles.listenBtn, isListening && styles.listening]}
        onPress={isListening ? stopListening : startListening}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.listenBtnText}>
            {isListening ? 'Stop Listening' : 'Start Speaking'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Clear */}
      <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
        <Text style={styles.clearBtnText}>Clear</Text>
      </TouchableOpacity>

      {/* Spoken text */}
      <Text style={styles.label}>Spoken Text:</Text>
      <Text style={styles.text}>{spokenText}</Text>

      {/* Generated code */}
      <Text style={styles.label}>Generated Code:</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 10 }} />
      ) : Platform.OS === 'web' && generatedCode ? (
        <View>
          <SyntaxHighlighter language={codeLanguage} style={atomDark}>
            {generatedCode}
          </SyntaxHighlighter>
          <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
            <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.code}>{generatedCode}</Text>
          {generatedCode ? (
            <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
              <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Error */}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const getStyles = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      padding: 20,
      flex: 1,
      backgroundColor: theme === 'light' ? '#fff' : '#121212',
    },
    heading: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 20,
      color: theme === 'light' ? '#000' : '#fff',
    },
    label: {
      fontWeight: 'bold',
      marginTop: 20,
      color: theme === 'light' ? '#000' : '#fff',
    },
    text: {
      fontSize: 16,
      color: theme === 'light' ? '#333' : '#ddd',
    },
    code: {
      fontFamily: 'monospace',
      backgroundColor: theme === 'light' ? '#eee' : '#333',
      padding: 10,
      marginTop: 10,
      color: theme === 'light' ? '#000' : '#fff',
    },
    error: {
      color: 'red',
      marginTop: 10,
    },
    listenBtn: {
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 5,
      alignItems: 'center',
      marginTop: 10,
    },
    listening: {
      backgroundColor: '#FF3B30',
    },
    listenBtnText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    copyBtn: {
      backgroundColor: '#007AFF',
      padding: 8,
      borderRadius: 5,
      alignSelf: 'flex-start',
      marginTop: 10,
    },
    copyBtnText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    clearBtn: {
      backgroundColor: '#8E8E93',
      padding: 8,
      borderRadius: 5,
      alignSelf: 'flex-start',
      marginTop: 10,
    },
    clearBtnText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });
