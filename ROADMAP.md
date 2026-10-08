# Pabili roadmap

Pabili stays pretend: no real payments, nothing ships.

## Done

- **Dark mode.** Follows the phone's setting, with System/Light/Dark in Settings. Colors come from the light and dark palettes in `src/theme.ts`; style sheets use `themed()`.
- **Phone notifications** (local, no server): parcel arrivals, restock alerts, completed group buys, Slash It wins and a daily coin reminder. Tapping one opens the right screen. On/off in Settings.
- **App icon, splash screen and store assets**, plus `eas.json` with development, preview (installable APK) and production profiles. Icon source lives in `design/*.svg`.
- **Installable web app**: manifest, home-screen icons and theme color, so pabili.pages.dev can be added to a phone's home screen.
- **Filipino / English** toggle in Settings. Text is translated with `t()` from `src/i18n`, keyed by the English wording; anything without a Filipino entry in `src/i18n/fil.ts` stays in English.
- **Tests** for the checkout math and the notification schedule (`npm test`).

## Next

- **Run the EAS builds.** This needs your Expo account: `npx eas-cli@latest login`, then `npx eas-cli@latest build --profile preview --platform android` for an installable APK, or `--profile development` for a dev build. App Store and Play Store submissions also need developer accounts.
- **Finish the Filipino copy.** Main screens are translated; toasts, notification text, game screens and some labels with numbers in them are still English.

## Later (needs a backend)

- Accounts and cloud sync (Supabase), so carts, orders and coins follow you across devices.
- Real friends in Slash It and Group Buy, leaderboards, shared hauls.

## Not yet verified

- Sound effects actually playing on each platform.
- Voice search (web Speech API) and Search by Photo.
- Notifications and everything else on a real iPhone and Android device.
