import { create } from 'zustand';
import type { IconName } from '../components/Icon';
import { play } from '../lib/sound';

export type ToastIcon = IconName | 'coin';

export type Point = { x: number; y: number };

type Toast = { id: number; text: string; icon?: ToastIcon };
type Flight = { id: number; emoji: string; gradient: [string, string]; from: Point; to: Point };

type Ui = {
  toast: Toast | null;
  flights: Flight[];
  cartPulse: number;
  // The cart icon on the focused screen, so items fly to the one you can see.
  cartTarget: (() => Promise<Point | null>) | null;
  showToast: (text: string, icon?: ToastIcon) => void;
  hideToast: (id: number) => void;
  setCartTarget: (fn: (() => Promise<Point | null>) | null) => void;
  flyToCart: (emoji: string, gradient: [string, string], from: Point) => Promise<void>;
  landFlight: (id: number) => void;
};

let seq = 1;

export const useUi = create<Ui>()((set, get) => ({
  toast: null,
  flights: [],
  cartPulse: 0,
  cartTarget: null,
  showToast: (text, icon) => {
    if (icon === 'coin') play('coin');
    set({ toast: { id: seq++, text, icon } });
  },
  hideToast: (id) => set((s) => (s.toast?.id === id ? { toast: null } : s)),
  setCartTarget: (cartTarget) => set({ cartTarget }),
  flyToCart: async (emoji, gradient, from) => {
    play('whoosh');
    const to = (await get().cartTarget?.()) ?? { x: from.x + 120, y: 40 };
    set((s) => ({ flights: [...s.flights, { id: seq++, emoji, gradient, from, to }] }));
  },
  landFlight: (id) => {
    play('pop');
    set((s) => ({ flights: s.flights.filter((f) => f.id !== id), cartPulse: s.cartPulse + 1 }));
  },
}));

export const toast = (text: string, icon?: ToastIcon) => useUi.getState().showToast(text, icon);
