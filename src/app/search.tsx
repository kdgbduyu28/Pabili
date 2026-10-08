import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Browse } from '../components/Browse';
import { CartButton } from '../components/CartButton';
import { Wrap, back } from '../components/Page';
import { Category, PRODUCTS, TRENDING, getShop, photoCategory, search, suggest } from '../data/catalog';
import { tap } from '../lib/haptics';
import { toast } from '../store/useUi';
import { useShop } from '../store/useShop';
import { C, R, themed } from '../theme';
import { t } from '../i18n';

const FILTERS: Record<string, { label: string; test: (id: string) => boolean }> = {
  mall: { label: 'Pabili Mall', test: (id) => getShop(PRODUCTS.find((p) => p.id === id)!.shopId).mall },
  freeship: { label: 'Free Shipping', test: (id) => !!PRODUCTS.find((p) => p.id === id)?.freeShipping },
};

export default function Search() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; filter?: string }>();
  const filter = params.filter && FILTERS[params.filter] ? params.filter : undefined;
  const [text, setText] = useState(params.q ?? '');
  const [query, setQuery] = useState(params.q ?? '');
  const recent = useShop((s) => s.recent);
  const { addRecent, clearRecent } = useShop.getState();

  const [photo, setPhoto] = useState<{ uri: string; category: Category } | null>(null);
  const [listening, setListening] = useState(false);
  const recognizer = useRef<{ stop: () => void } | null>(null);
  const speech = Platform.OS === 'web' ? speechRecognition() : null;

  const results = useMemo(() => {
    if (photo) return PRODUCTS.filter((p) => p.categoryId === photo.category.id);
    const base = query ? search(query) : filter ? PRODUCTS : [];
    return filter ? base.filter((p) => FILTERS[filter].test(p.id)) : base;
  }, [query, filter, photo]);

  const typed = text.trim() !== query ? suggest(text) : [];

  const submit = (q: string) => {
    setPhoto(null);
    setText(q);
    setQuery(q.trim());
    addRecent(q);
  };

  const pickPhoto = async () => {
    tap();
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.3 });
    const a = res.assets?.[0];
    if (res.canceled || !a) return;
    setText('');
    setQuery('');
    setPhoto({ uri: a.uri, category: photoCategory(a.uri, a.width, a.height) });
  };

  const listen = () => {
    if (!speech) return;
    if (listening) {
      recognizer.current?.stop();
      return;
    }
    const r = new speech();
    r.lang = 'en-PH';
    r.interimResults = false;
    r.onresult = (e) => submit(e.results[0][0].transcript);
    r.onerror = () => toast("Couldn't hear that. Try again?", 'mic-off');
    r.onend = () => setListening(false);
    recognizer.current = r;
    setListening(true);
    r.start();
  };

  const showSuggestions = !query && !filter && !photo;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingTop: insets.top }}>
        <Wrap style={styles.row}>
          <Pressable onPress={back} hitSlop={10} accessibilityLabel={t("Back")}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={18} color={C.primary} />
            <TextInput
              autoFocus={!params.q && !filter}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => submit(text)}
              placeholder={filter ? `Search in ${FILTERS[filter].label}` : 'Search Pabili'}
              placeholderTextColor={C.faint}
              returnKeyType="search"
              style={styles.input}
            />
            {!!text && (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setText('');
                  setQuery('');
                }}
              >
                <Ionicons name="close-circle" size={18} color={C.faint} />
              </Pressable>
            )}
            {speech && (
              <Pressable hitSlop={8} onPress={listen} accessibilityLabel={t("Search by voice")}>
                <Ionicons name={listening ? 'mic' : 'mic-outline'} size={20} color={listening ? C.primary : C.muted} />
              </Pressable>
            )}
            <Pressable hitSlop={8} onPress={pickPhoto} accessibilityLabel={t("Search by photo")}>
              <Ionicons name="camera-outline" size={20} color={C.muted} />
            </Pressable>
          </View>
          <CartButton />
        </Wrap>
      </LinearGradient>

      {typed.length > 0 ? (
        <ScrollView keyboardShouldPersistTaps="handled">
          <Wrap>
            {typed.map((sg) => (
              <Pressable
                key={`${sg.kind}${sg.text}`}
                style={styles.suggestion}
                onPress={() => {
                  if (sg.kind === 'category') router.push(`/category/${sg.id}`);
                  else if (sg.kind === 'shop') router.push(`/shop/${sg.id}`);
                  else submit(sg.text);
                }}
              >
                <Ionicons
                  name={sg.kind === 'category' ? 'grid-outline' : sg.kind === 'shop' ? 'storefront-outline' : 'search-outline'}
                  size={16}
                  color={C.muted}
                />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {sg.text}
                </Text>
                <Text style={styles.suggestionKind}>{sg.kind === 'product' ? '' : sg.kind}</Text>
              </Pressable>
            ))}
          </Wrap>
        </ScrollView>
      ) : showSuggestions ? (
        <ScrollView keyboardShouldPersistTaps="handled">
          <Wrap style={{ padding: 12, gap: 20 }}>
            {recent.length > 0 && (
              <View>
                <View style={styles.headRow}>
                  <Text style={styles.head}>{t("Recent Searches")}</Text>
                  <Pressable onPress={clearRecent}>
                    <Text style={{ color: C.muted, fontSize: 12 }}>{t("Clear")}</Text>
                  </Pressable>
                </View>
                <View style={styles.chips}>
                  {recent.map((r) => (
                    <Chip key={r} text={r} onPress={() => submit(r)} />
                  ))}
                </View>
              </View>
            )}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                <Ionicons name="flame" size={16} color={C.primary} />
                <Text style={styles.head}>{t("Trending Now")}</Text>
              </View>
              <View style={styles.chips}>
                {TRENDING.map((r) => (
                  <Chip key={r} text={r} onPress={() => submit(r)} hot />
                ))}
              </View>
            </View>
          </Wrap>
        </ScrollView>
      ) : (
        <Browse
          key={`${query}|${filter}|${photo?.uri}`}
          products={results}
          top={
            photo ? (
              <View style={styles.filterBanner}>
                <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
                <Text style={{ flex: 1, color: C.text, fontSize: 12 }}>
                  Items similar to your photo in <Text style={{ fontWeight: '700' }}>{photo.category.name}</Text>
                </Text>
                <Pressable onPress={() => setPhoto(null)} hitSlop={8}>
                  <Ionicons name="close" size={16} color={C.muted} />
                </Pressable>
              </View>
            ) : filter ? (
              <View style={styles.filterBanner}>
                <Text style={{ color: C.primary, fontWeight: '700' }}>{FILTERS[filter].label}</Text>
                <Pressable onPress={() => router.setParams({ filter: '' })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={{ color: C.muted, fontSize: 12 }}>{t("Clear filter")}</Text>
                    <Ionicons name="close" size={14} color={C.muted} />
                  </View>
                </Pressable>
              </View>
            ) : undefined
          }
        />
      )}
    </View>
  );
}

function Chip({ text, onPress, hot }: { text: string; onPress: () => void; hot?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, hot && { backgroundColor: C.primarySoft }]}>
      <Text style={[styles.chipText, hot && { color: C.primary }]}>{text}</Text>
    </Pressable>
  );
}

type SpeechResultEvent = { results: { [i: number]: { [j: number]: { transcript: string } } } };
type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: (e: SpeechResultEvent) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

/** The browser's speech API, when it has one (Chrome, Edge, Safari). */
function speechRecognition(): SpeechCtor | null {
  const w = globalThis as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const styles = themed(() => ({
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  suggestionText: { flex: 1, fontSize: 14, color: C.text },
  suggestionKind: { fontSize: 11, color: C.faint, textTransform: 'capitalize' },
  photo: { width: 36, height: 36, borderRadius: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: 4, paddingHorizontal: 10, height: 38 },
  input: { flex: 1, fontSize: 14, color: C.text, height: 38 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  head: { fontSize: 14, fontWeight: '600', color: C.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: C.card, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 13, color: C.text },
  filterBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.primarySoft, paddingHorizontal: 12, paddingVertical: 10 },
}));
