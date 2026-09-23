import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Send, Sparkles } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

interface Message {
  text: string;
  sender: 'ai' | 'user';
}

export default function ChatAssistant() {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi there! I'm your AI Shopping Assistant. How can I help you find the perfect gear today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => scrollViewRef.current?.scrollToEnd({ animated: true });
  useEffect(() => { if (isOpen) setTimeout(scrollToBottom, 100); }, [messages, isOpen, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!isAuthenticated) {
      setMessages(prev => [...prev, { text: input, sender: 'user' }, { text: "Please login to chat with me! 🔒", sender: 'ai' }]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/recommend', { query: userMessage });
      console.log("🤖 AI RESPONSE:", response.data); // Look here in the terminal!
      
      const aiReply = response.data.recommendation || response.data.reply || response.data.message || response.data.answer || response.data.text || "I found some great options!";
      
      setMessages(prev => [...prev, { text: aiReply, sender: 'ai' }]);
    } catch (error: any) {
      console.error("❌ AI ERROR:", error.response?.status, error.message);
      setMessages(prev => [...prev, { text: "Oops! My brain is overwhelmed. Please try again.", sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { bottom: 20 + insets.bottom }]}>
      {isOpen ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.window}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={18} color="#ffffff" />
              <Text style={styles.headerTitle}>AI Assistant</Text>
            </View>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}><X size={22} color="#ffffff" /></TouchableOpacity>
          </View>
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messagesContainer} style={styles.messagesScroll}>
            {messages.map((msg, idx) => (
              <View key={idx} style={[styles.messageBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.messageText, msg.sender === 'user' ? styles.userText : styles.aiText]}>{msg.text}</Text>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={COLORS.accent} style={{ marginRight: 6 }} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.form}>
            <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder={isAuthenticated ? "Ask about a product..." : "Login to chat..."} placeholderTextColor="rgba(255, 255, 255, 0.3)" editable={!isLoading} />
            <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={handleSend} disabled={!input.trim() || isLoading}><Send size={16} color={COLORS.surface} /></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <TouchableOpacity style={styles.togglePillBtn} onPress={() => setIsOpen(true)} activeOpacity={0.85}><Sparkles size={16} color="#ffffff" /><Text style={styles.togglePillText}>AI ASSISTANT</Text></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', right: 20, zIndex: 1000 },
  togglePillBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: RADIUS.pill, backgroundColor: COLORS.accent, ...SHADOWS.glow },
  togglePillText: { color: COLORS.surface, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  window: { width: Math.min(width - 32, 340), height: 460, backgroundColor: '#18181b', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden', ...SHADOWS.lg },
  header: { backgroundColor: COLORS.accent, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: COLORS.surface, fontWeight: '800', fontSize: 15, textTransform: 'uppercase' },
  closeBtn: { padding: 2 },
  messagesScroll: { flex: 1, backgroundColor: '#121215' },
  messagesContainer: { padding: SPACING.md, gap: SPACING.sm },
  messageBubble: { maxWidth: '80%', padding: SPACING.sm + 4, borderRadius: RADIUS.md },
  userBubble: { backgroundColor: '#2c221e', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center' },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: COLORS.surface },
  aiText: { color: 'rgba(255, 255, 255, 0.9)' },
  loadingText: { color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic', fontSize: 13 },
  form: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, backgroundColor: '#18181b', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' },
  input: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: RADIUS.pill, paddingHorizontal: SPACING.md, paddingVertical: 8, color: COLORS.surface, fontSize: 14 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});