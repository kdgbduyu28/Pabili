import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, MAX_WIDTH, themed } from '../theme';
import { t } from '../i18n';

/**
 * Bottom sheet rendered in the screen's own tree instead of a native Modal, so the
 * app-wide fly-to-cart layer can still draw on top of it.
 */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  if (!open) return null;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("Close")} />
      </Animated.View>
      <View style={styles.dock} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown.duration(240)}
          exiting={SlideOutDown.duration(180)}
          style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          {children}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = themed(() => ({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: C.overlay },
  dock: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', alignItems: 'center' },
  panel: {
    width: '100%',
    maxWidth: MAX_WIDTH / 2,
    backgroundColor: C.card,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '85%',
  },
}));
