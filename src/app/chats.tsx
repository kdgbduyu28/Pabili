import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/bits';
import { ShopAvatar } from '../components/Icon';
import { Header, Wrap } from '../components/Page';
import { getShop } from '../data/catalog';
import { dateTime } from '../lib/format';
import { useShop } from '../store/useShop';
import { C } from '../theme';

export default function Chats() {
  const chats = useShop((s) => s.chats);
  const threads = Object.entries(chats)
    .filter(([, ms]) => ms.length)
    .map(([shopId, ms]) => ({ shop: getShop(shopId), last: ms[ms.length - 1] }))
    .filter((t) => t.shop)
    .sort((a, b) => b.last.at - a.last.at);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Chats" />
      <ScrollView>
        <Wrap>
          {threads.length === 0 ? (
            <EmptyState icon="chatbubbles-outline" title="No chats yet" subtitle='Tap "Chat" on any product to message the seller.' />
          ) : (
            threads.map(({ shop, last }) => (
              <Pressable key={shop.id} style={styles.row} onPress={() => router.push(`/chat/${shop.id}`)}>
                <ShopAvatar shop={shop} size={46} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.name}>{shop.name}</Text>
                  <Text style={styles.last} numberOfLines={1}>
                    {last.from === 'me' ? 'You: ' : ''}
                    {last.productId ? 'Sent a product' : last.text}
                  </Text>
                </View>
                <Text style={styles.time}>{dateTime(last.at)}</Text>
              </Pressable>
            ))
          )}
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  name: { fontSize: 14, fontWeight: '600', color: C.text },
  last: { fontSize: 13, color: C.muted },
  time: { fontSize: 10, color: C.faint, alignSelf: 'flex-start' },
});
