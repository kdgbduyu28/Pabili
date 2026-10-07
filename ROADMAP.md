# Pabili roadmap

Planned work, roughly in priority order. Pabili stays pretend: no real payments, nothing ships.

## Planned

- **Dark mode.** Follow the phone's light/dark setting, with a manual override in Settings. Colors live in `src/theme.ts`, so this means adding a dark palette there and switching screens from fixed colors (white cards, gray backgrounds) to theme tokens. Product images, gradients and the brand rose→orange should be checked for contrast on dark surfaces.
- **Push notifications** (`expo-notifications`): "Your parcel is here, tap to unbox!", restock alerts and daily coin reminders while the app is closed.
- **App icon, splash screen and store assets**, then EAS builds for iOS and Android.
- **Installable web app (PWA)**: add-to-home-screen from pabili.pages.dev.
- **Filipino / English** language toggle.
- **Tests for the checkout math** (vouchers, bundles, shop vouchers, shipping, coins) so new features don't quietly break totals.

## Later (needs a backend)

- Accounts and cloud sync (Supabase), so carts, orders and coins follow you across devices.
- Real friends in Slash It and Group Buy, leaderboards, shared hauls.

## Not yet verified

- Sound effects actually playing on each platform.
- Voice search (web Speech API) and Search by Photo.
- Everything on a real iPhone and Android device.
