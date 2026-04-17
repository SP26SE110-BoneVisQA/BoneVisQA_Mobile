# Build & Run Notes — BoneVisQA Mobile

> **Audience:** anyone running `npx expo start --ios` fresh (new machine, fresh clone, after `rm -rf node_modules`)
> **Purpose:** every trap we hit during first boot on 2026-04-11, with the fix and root cause. Follow this checklist before filing bugs.

---

## TL;DR — mandatory files that MUST exist before `expo start`

| File | Purpose | Missing symptom |
|---|---|---|
| `babel.config.js` | babel presets — NativeWind + Expo | Either `Exception in HostFunction: <unknown>` or `Cannot find module 'babel-preset-expo'` |
| `metro.config.js` | Metro + NativeWind wiring | NativeWind `className` props ignored, text rendered unstyled |
| `global.css` | Tailwind source file imported by NativeWind | Same as above — no styles applied |
| `nativewind-env.d.ts` | Type declarations for NativeWind | `className` TS errors on every component |
| `tailwind.config.js` with `presets: [require("nativewind/preset")]` | NativeWind preset | Metro error: `Tailwind CSS has not been configured with the NativeWind preset` |
| `app.json` with `"newArchEnabled": true` | Required by reanimated v4 | Reanimated v4 runtime crash |
| `app.json` with `"extra": { "apiBaseUrl": "..." }` | Env injection for `src/constants/env.ts` | API base URL undefined → requests go to `undefined` |

All of the above are now committed in `docs/..` and in the repo root.

---

## 1. `babel.config.js`

Locked content:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

**Do NOT add `react-native-reanimated/plugin` manually.** `babel-preset-expo@54` automatically injects the correct worklets plugin (see `node_modules/babel-preset-expo/build/index.js` — it detects `react-native-worklets` and includes `require('react-native-worklets/plugin')`). Adding it twice breaks the worklets runtime and triggers `Exception in HostFunction: <unknown>` on module load.

**What we hit:** initially there was **no `babel.config.js`** at all. Expo SDK 54 does not auto-generate one — we had to create it. Without it, Metro still bundles (3670 modules OK) but at runtime nothing is transformed into worklets, and the app crashes with `Exception in HostFunction`.

**`babel-preset-expo` must be installed as a direct dev dependency.** `npm install babel-preset-expo` works but prefer `npx expo install babel-preset-expo` so it picks the SDK-pinned version (`~54.0.10`). A non-pinned version triggers the Expo compatibility warning.

---

## 2. `metro.config.js`

Locked content:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

**Why:** NativeWind v4 requires a Metro transform that reads a CSS entrypoint (`global.css`) and produces a StyleSheet. Without `metro.config.js` the entire `className=""` ecosystem silently no-ops and you get unstyled children (raw Text stacked vertically with zero layout).

---

## 3. `global.css`

Locked content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Imported in `App.tsx` BEFORE any component:

```ts
import 'react-native-gesture-handler';
import './global.css';     // <-- second line
import './src/i18n';
```

Order matters: `gesture-handler` must be first (RN requirement); `global.css` must be imported before any view that uses `className`, else the first paint is unstyled and only re-hydrates after the next render cycle.

---

## 4. `tailwind.config.js`

Locked content must include the NativeWind preset:

```js
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],   // <-- mandatory
  theme: { extend: { ... } },
  plugins: [],
};
```

Without the preset, Metro throws `Tailwind CSS has not been configured with the NativeWind preset` during bundler boot.

---

## 5. `nativewind-env.d.ts`

Locked content:

```ts
/// <reference types="nativewind/types" />
```

Placed at project root. `tsconfig.json` already has `"types": ["nativewind/types"]` so TS picks it up, but the reference file keeps IDEs happy.

---

## 6. `react-native-worklets` version pin

**Root cause:** `react-native-reanimated@4.1.7` peer-depends on `react-native-worklets: 0.5 - 0.8`. npm resolved the transitive dep to `0.8.1`, but Expo Go 54 ships with worklets `0.5.x` baked into its native runtime. Mismatch → `NativeWorklets` TurboModule can't be loaded → `Exception in HostFunction: <unknown>` at JS module load time.

**Fix:** pin worklets as a direct dependency:

```bash
npx expo install react-native-worklets
```

This installs `react-native-worklets@0.5.1` — the version Expo SDK 54 is built against. Verify:

```bash
grep '"react-native-worklets"' package.json
# "react-native-worklets": "0.5.1"
```

⚠️ Do NOT let `npm install` resolve worklets transitively — it will pick the newest allowed by the peer range (`0.8.x`), which breaks Expo Go. Always re-run `npx expo install react-native-worklets` after any `rm -rf node_modules && npm install`.

---

## 7. `app.json` — new arch + env

```json
{
  "expo": {
    ...
    "newArchEnabled": true,          // required by reanimated v4
    "plugins": ["expo-secure-store", "expo-localization"],
    "extra": {
      "apiBaseUrl": "https://bonevisqa.onrender.com"
    }
  }
}
```

`src/constants/env.ts` reads `Constants.expoConfig?.extra.apiBaseUrl`. If `extra` is missing, the URL becomes `undefined` and every request fails with `ERR_INVALID_URL`.

**`expo-constants` is a hard dependency** even though it's not listed in PLAN.md §1 — add it via `npx expo install expo-constants`.

---

## 8. Backend response quirks (not mobile bugs)

### 8.1 `/api/Auths/login` response shape

Backend returns a **flat** payload, NOT `{ token, user }`:

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "userId": "uuid",
  "fullName": "...",
  "email": "...",
  "token": "eyJ...",
  "requiresMedicalVerification": false,
  "roles": ["Student"]
}
```

On failure `success = false`, `token = null`, and `message` holds the human error. HTTP status stays **200** — axios does NOT throw. `useLogin()` in `src/hooks/useAuth.ts` handles this: it maps the flat response to `{ token, user }` and throws an `ApiError` when `success === false`. Do not re-wrap in `onSuccess` — the throw has to happen inside `mutationFn` so TanStack Query routes it to `onError`.

### 8.2 Empty-list endpoints return HTTP 404 instead of `[]`

For students with no data, these endpoints return **404** with a Vietnamese message (e.g. `"Không tìm thấy quiz luyện tập phù hợp"`):
- `GET /api/student/quizzes`
- `GET /api/student/quizzes/practice`
- `GET /api/student/quizzes/history`

`src/api/quizzes.ts` catches 404 and returns `[]` so the UI shows the `EmptyState` instead of `ErrorView`. If you add a new list endpoint and the BE returns 404-for-empty, do the same — wrap with `isNotFound(error)` helper.

Other list endpoints that likely share this quirk (not yet patched — patch when a student with empty data hits them):
- `/api/student/cases/catalog`, `/cases/filter`, `/cases/history`
- `/api/student/questions`
- `/api/student/assignments`
- `/api/student/announcements`, `/api/student/progress/recent-activity`
- `/api/notifications`
- `/api/search`

### 8.3 Render.com cold start

The BE is on Render free tier. First request after ~15 minutes idle takes 20–30 seconds. The axios client timeout is 45s. Surface "Server is waking up…" in the UI if login takes more than 3s.

### 8.4 Expired JWT token

The test token in `docs/PLAN.md §2` expires `exp: 1775922099` (2026-04-11 ~15:41). Always get a fresh token by calling `/api/Auths/login` with the student credentials.

---

## 9. Clean-boot recipe

From scratch on a new machine:

```bash
git clone https://github.com/SP26SE110-BoneVisQA/BoneVisQA_Mobile
cd BoneVisQA_Mobile
npm install
# Align pinned native deps with the installed Expo SDK
npx expo install --fix
# Pin worklets to the version Expo Go 54 ships with
npx expo install react-native-worklets
# Start
npx expo start --ios --clear
```

If the simulator app shows a red error screen:
```bash
# nuclear reset
pkill -9 -f "expo start"; pkill -9 -f "metro"
xcrun simctl terminate booted host.exp.Exponent
xcrun simctl uninstall booted host.exp.Exponent   # only if Expo Go is stale
npx expo start --ios --clear
```

`--clear` wipes Metro's transform cache. Required whenever you touch:
- `babel.config.js`
- `metro.config.js`
- `tailwind.config.js`
- `global.css`
- any native dep upgrade

---

## 10. What we saw before vs. after each fix

| Symptom | Root cause | Fix |
|---|---|---|
| `Exception in HostFunction: <unknown>` + `NativeWorklets` in stack | `react-native-worklets@0.8.1` (transitive) incompatible with Expo Go 54 bundled 0.5.x | `npx expo install react-native-worklets` → pins to 0.5.1 |
| `Cannot find module 'babel-preset-expo'` | babel-preset-expo missing from package.json | `npx expo install babel-preset-expo` |
| `Tailwind CSS has not been configured with the NativeWind preset` | Missing `presets: [require("nativewind/preset")]` in tailwind.config.js | Added preset |
| Raw unstyled text, nav works but no colors | Missing `metro.config.js` + `global.css` + import in App.tsx | Created all three |
| "App entry not found — main not registered" | `babel.config.js` accidentally double-loaded reanimated plugin, crashing the module graph before `registerRootComponent` ran | Removed manual plugin, let `babel-preset-expo` auto-include worklets |
| Login 200 OK but onSuccess crashes | `LoginResponse` type assumed `{ token, user }`, BE returns flat `{ success, token, userId, email, ... }` | Rewrote `types/auth.ts` + `hooks/useAuth.ts` to unwrap |
| Quiz tab shows "Đã xảy ra lỗi" with BE Vietnamese message | BE returns 404 when user has no practice quizzes | `isNotFound()` helper in `api/quizzes.ts` returns `[]` |
| `ConfigError: expected package.json path /Users/.../support-tien/package.json` | Forgot to `cd` into the mobile subdir before `expo start` | Always run expo commands from `BoneVisQA_Mobile/` |

---

## 11. Things that DO NOT need fixing (ignore the warnings)

- `2 moderate severity vulnerabilities` from `npm audit` — in transitive dev deps; ignore until Expo SDK bumps.
- `warning: Bundler cache is empty, rebuilding (this may take a minute)` — normal on `--clear`, takes ~8s on M1.
- `The following packages should be updated for best compatibility with the installed expo version` — only act if the listed package causes a real runtime error. `expo-doctor` output is advisory.

---

## 12. Hard rules for this project (non-negotiable)

1. **No `git commit` and no `git push`** — user controls git manually. Subagents must never run either.
2. **No mock data** — every screen fetches real API. `src/constants/mockData.ts` is deleted and must stay deleted. Empty states come from real API returning `[]` (or 404 → `[]`).
3. **No `any`, no `console.log`** in `src/`. TS strict mode is enforced via `tsc --noEmit` in CI.
4. **Vietnamese UI by default.** English translations live in `src/i18n/en.ts` and are loaded via i18next.
