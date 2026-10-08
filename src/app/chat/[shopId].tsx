import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShopAvatar } from '../../components/Icon';
import { Header, Wrap } from '../../components/Page';
import { ProductImage } from '../../components/ProductImage';
import { getProduct, getShop } from '../../data/catalog';
import { QUICK_REPLIES, botReply } from '../../data/chatbot';
import { unitPrice } from '../../data/promos';
import { peso } from '../../lib/format';
import { tap } from '../../lib/haptics';
import { ChatMsg, useShop } from '../../store/useShop';
import { C, R, themed } from '../../theme';
import { t } from '../../i18n';

const EMPTY: ChatMsg[] = [];

export default function Chat() {
  const { shopId, product: productId } = useLocalSearchParams<{ shopId: string; product?: string }>();
  const insets = useSafeAreaInsets();
  const shop = getShop(shopId);
  const messages = useShop((s) => s.chats[shopId] ?? EMPTY);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const asked = productId ? getProduct(productId) : undefined;
  const alreadySent = messages.some((m) => m.productId === productId);

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length, typing]);

  if (!shop) return <Header title={t("Chat")} />;

  const send = (body: string, pid?: string) => {
    const t = body.trim();
    if (!t && !pid) return;
    tap();
    const { sendChat } = useShop.getState();
    sendChat(shop.id, { id: `m${Date.now()}`, from: 'me', text: t, at: Date.now(), productId: pid });
    setText('');
    setTyping(true);
    setTimeout(() => {
      sendChat(shop.id, { id: `r${Date.now()}`, from: 'shop', text: botReply(shop, t, pid ? getProduct(pid) : undefined), at: Date.now() });
      setTyping(false);
    }, 1100 + Math.random() * 900);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={shop.name}
        right={
          <Pressable onPress={() => router.push(`/shop/${shop.id}`)} hitSlop={8}>
            <Ionicons name="storefront-outline" size={22} color={C.primary} />
          </Pressable>
        }
      />
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 12, gap: 8 }}>
        <Wrap style={{ maxWidth: 720, gap: 8 }}>
          <View style={styles.intro}>
            <ShopAvatar shop={shop} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: C.text }}>{shop.name}</Text>
              <Text style={styles.small}>Usually replies within minutes · {shop.responseRate}% response rate</Text>
            </View>
          </View>

          {messages.map((m) => {
            const p = m.productId ? getProduct(m.productId) : undefined;
            return (
              <Animated.View key={m.id} entering={FadeInDown.duration(200)} style={[styles.row, m.from === 'me' && { justifyContent: 'flex-end' }]}>
                {p ? (
                  <Pressable style={styles.productMsg} onPress={() => router.push(`/product/${p.id}`)}>
                    <ProductImage emoji={p.emoji} gradient={p.gradient} size={48} radius={R.sm} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={2} style={{ fontSize: 12, color: C.text }}>
                        {p.title}
                      </Text>
                      <Text style={{ color: C.primary, fontWeight: '700', fontSize: 13 }}>{peso(unitPrice(p, {}, Date.now()).price)}</Text>
                    </View>
                  </Pressable>
                ) : (
                  <View style={[styles.bubble, m.from === 'me' ? styles.mine : styles.theirs]}>
                    <Text style={[styles.text, m.from === 'me' && { color: '#fff' }]}>{m.text}</Text>
                  </View>
                )}
              </Animated.View>
            );
          })}
          {typing && (
            <Animated.View entering={FadeIn} style={[styles.bubble, styles.theirs, { alignSelf: 'flex-start' }]}>
              <Text style={[styles.text, { color: C.muted }]}>{t("typing…")}</Text>
            </Animated.View>
          )}
        </Wrap>
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <Wrap style={{ maxWidth: 720, gap: 8 }}>
          {asked && !alreadySent && (
            <Pressable style={styles.ask} onPress={() => send('', asked.id)}>
              <ProductImage emoji={asked.emoji} gradient={asked.gradient} size={36} radius={4} />
              <Text style={{ flex: 1, fontSize: 12, color: C.text }} numberOfLines={1}>
                Ask about: {asked.name}
              </Text>
              <Text style={{ color: C.primary, fontWeight: '700', fontSize: 12 }}>{t("Send")}</Text>
            </Pressable>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} keyboardShouldPersistTaps="handled">
            {QUICK_REPLIES.map((q) => (
              <Pressable key={q} style={styles.quick} onPress={() => send(q)}>
                <Text style={{ fontSize: 12, color: C.primary }}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => send(text)}
              placeholder={t("Type a message")}
              placeholderTextColor={C.faint}
              returnKeyType="send"
              style={styles.input}
            />
            <Pressable onPress={() => send(text)} style={styles.sendBtn} accessibilityLabel={t("Send")}>
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </Wrap>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = themed(() => ({
  intro: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: R.md, padding: 10, marginBottom: 6 },
  small: { fontSize: 11, color: C.muted },
  row: { flexDirection: 'row' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  mine: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: C.card, borderBottomLeftRadius: 4 },
  text: { fontSize: 14, color: C.text, lineHeight: 19 },
  productMsg: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: R.md, padding: 8, width: 260, borderWidth: 1, borderColor: C.line },
  composer: { backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line, paddingTop: 8, paddingHorizontal: 12 },
  ask: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.subtle, borderRadius: R.sm, padding: 6, borderWidth: 1, borderColor: C.line },
  quick: { borderWidth: 1, borderColor: C.primary, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6 },
  input: { flex: 1, height: 40, borderRadius: 20, backgroundColor: C.surface, paddingHorizontal: 16, fontSize: 14, color: C.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
}));
