import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';
import { toast } from '../store/useUi';

export const APP_URL = 'https://pabili.pages.dev';

/** Native share sheet; on web, the Web Share API or a copied link as a fallback. */
export async function shareText(message: string, url = APP_URL): Promise<void> {
  const text = `${message} ${url}`;
  try {
    if (Platform.OS === 'web') {
      const nav = globalThis.navigator as Navigator | undefined;
      if (nav?.share) {
        await nav.share({ text: message, url });
        return;
      }
      await Clipboard.setStringAsync(text);
      toast('Copied to clipboard', 'copy');
      return;
    }
    await Share.share({ message: text });
  } catch {
    // Dismissing the share sheet throws on some platforms; nothing to do.
  }
}
