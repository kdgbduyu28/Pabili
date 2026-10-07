import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useShop } from '../store/useShop';

const SOURCES = {
  chaching: require('../../assets/sounds/chaching.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  pop: require('../../assets/sounds/pop.wav'),
  whoosh: require('../../assets/sounds/whoosh.wav'),
  tada: require('../../assets/sounds/tada.wav'),
};

export type Sound = keyof typeof SOURCES;

// Players live for the whole session: a handful of tiny clips, reused on every play.
const players: Partial<Record<Sound, AudioPlayer>> = {};
let modeSet = false;

export function play(name: Sound) {
  if (!useShop.getState().settings.sound) return;
  try {
    if (!modeSet) {
      modeSet = true;
      // UI sounds respect the ringer/silent switch.
      setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
    }
    const p = (players[name] ??= createAudioPlayer(SOURCES[name]));
    p.seekTo(0);
    p.play();
  } catch {
    // Audio is a nice-to-have; never let it break a tap.
  }
}
