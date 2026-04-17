# BoneVisQA Mobile — Integration Report

> **Generated:** 2026-04-11
> **Method:** 5 parallel agents, each owning a module per [PLAN.md](./PLAN.md)
> **Audience:** human reviewer (you) — read this to verify each module, spot issues, and plan follow-ups

---

## 1. Overall status

| Check | Result |
|---|---|
| `npx tsc --noEmit` (whole project, strict) | ✅ **PASS** (exit 0) |
| Files in `src/` | 89 `.ts` / `.tsx` |
| `mockData.ts` deleted | ✅ |
| No `mock` / `Mock` / `fakeData` / `dummy` in `src/` | ✅ (grep clean) |
| No `any` in `src/` | ✅ (grep clean) |
| No `console.log/warn/error/info` in `src/` | ✅ (grep clean) |
| Dependencies installed | ✅ (see §7) |
| Git commit / push | ❌ **not performed** (user rule) |

---

## 2. Agent completion matrix

| Agent | Scope | Status | tsc | Notes |
|---|---|---|---|---|
| **A1** | Foundation + Auth + Nav + Common UI | ✅ DONE | ✅ PASS | Installed all deps; deleted legacy drawer & mockData; seeded stubs for A2–A5 |
| **A2** | Profile + Settings + MedVerification | ✅ DONE | ✅ PASS | Consumed A5 settingsStore directly; full RHF+zod; avatar flow with image-manipulator |
| **A3** | Home + Quiz + Progress + Assignments | ✅ DONE | ✅ PASS | Resumable quiz with offline queue; DTO normalization in API layer |
| **A4** | Cases + Visual-QA chat | ✅ DONE | ✅ PASS | XrayViewer v2 Gesture API; chat state shared via React Query cache |
| **A5** | Notifications + i18n + Search + Announcements + SettingsStore | ✅ DONE | ✅ PASS | Comprehensive vi/en translations; search result type flattening |

---

## 3. File inventory by module

### Foundation (Agent 1)
- `src/api/client.ts`, `src/api/auth.ts`
- `src/stores/authStore.ts`, `src/stores/queryClient.ts`
- `src/types/{api,auth}.ts`
- `src/hooks/useAuth.ts`
- `src/constants/env.ts`
- `src/navigation/{types,RootNavigator,AuthNavigator,AppNavigator}.tsx`
- `src/components/common/{Button,Input,Card,Screen,Loading,ErrorView,EmptyState,Toast,NetworkBanner}.tsx`
- `src/screens/auth/{Login,Register,ForgotPassword}Screen.tsx`
- `App.tsx`, `tailwind.config.js`, `app.json`, `package.json`

### Profile (Agent 2)
- `src/api/users.ts`
- `src/types/user.ts`
- `src/hooks/useProfile.ts`
- `src/components/profile/{ProfileHeader,ProfileField,ProfileSection,AvatarPicker}.tsx`
- `src/screens/student/profile/{Profile,EditProfile,MedicalVerification}Screen.tsx`
- `src/screens/student/settings/{Settings,ChangePassword}Screen.tsx`

### Quiz (Agent 3)
- `src/api/{quizzes,progress,assignments}.ts`
- `src/types/quiz.ts`
- `src/hooks/{useQuiz,useQuizAttempt}.ts`
- `src/components/quiz/{QuestionCard,QuizTimer,QuizProgressBar,QuizCardListItem,ScoreBadge,StatCard}.tsx`
- `src/screens/student/home/HomeScreen.tsx`
- `src/screens/student/quiz/{QuizList,QuizPlay,QuizReview,QuizHistory,PracticeMode}Screen.tsx`
- `src/screens/student/progress/{Progress,Analytics}Screen.tsx`

### Cases + Visual-QA (Agent 4)
- `src/api/{cases,visualQa,questions}.ts`
- `src/types/case.ts`
- `src/hooks/useVisualQa.ts`
- `src/components/cases/{CaseCard,CaseFilters,XrayViewer,CaseImageGallery}.tsx`
- `src/components/chat/{MessageBubble,ChatInput,ChatList}.tsx`
- `src/screens/student/cases/{CaseList,CaseDetail,CaseHistory}Screen.tsx`
- `src/screens/student/visualQa/{Chat,Ask}Screen.tsx`

### Notifications + i18n + Search (Agent 5)
- `src/api/{notifications,search,announcements}.ts`
- `src/types/notification.ts`
- `src/stores/settingsStore.ts`
- `src/hooks/{useNotifications,useDebounce}.ts`
- `src/i18n/{index,vi,en}.ts`
- `src/components/common/SearchBar.tsx`
- `src/components/notifications/NotificationItem.tsx`
- `src/screens/student/notifications/NotificationsScreen.tsx`
- `src/screens/student/search/SearchScreen.tsx`
- `src/screens/student/announcements/AnnouncementsScreen.tsx`

### Legacy file kept (unused by any agent)
- `src/components/StatCard.tsx` — Agent 3's new `components/quiz/StatCard.tsx` is the one referenced; the legacy file is orphaned and safe to delete in a cleanup pass.

---

## 4. Key contract violations / deviations (INTEGRATION RISK)

These are intentional deviations — review each.

### 4.1 Dependencies
- **A1 added `expo-constants`** (not in PLAN.md §1). Required by `src/constants/env.ts` to read `Constants.expoConfig?.extra.apiBaseUrl`. Logged in PLAN.md §7. **Action:** accept.
- **Installed `zod@4`** (latest). All schemas use forward-compatible API. **Action:** verify no v3 breaking patterns crept in.
- **Installed `zustand@5`** (latest). Simpler `create<State>()(...)` pattern used throughout. **Action:** verify.

### 4.2 Naming
- PLAN said `getPractice()` — A3 implemented `getPracticeList()`. Matches A3's brief. Consumers use the latter. **Action:** none, but update PLAN.md if you want strict consistency.

### 4.3 Navigation gaps
- **Home → PracticeMode direct deep-nav** not wired. Home tab's Practice CTA opens the Quiz tab (default `QuizList`), not directly at `PracticeMode`. A3 decided nested cross-stack typing was fragile. **Action:** follow-up issue; easy fix with `navigation.navigate('QuizTab', { screen: 'PracticeMode' })` once types are patched.
- **Home → Visual-QA chat** similar: lands on Cases tab. Same reason.
- **Notification deep-linking** not wired. NotificationsScreen marks as read on tap but doesn't navigate to the linked target. A5 stored raw `targetUrl` from BE and added TODO. Needs a shared `navigationRef`. **Action:** follow-up issue.
- **Search result → target screen** works for case/quiz via `navigation.getParent()` dispatch — verify on device.

### 4.4 Quiz answer encoding
- A3 encodes multi-select answers as sorted comma-joined letters (`"A,C"`) because BE `StudentSubmitQuestionDto.studentAnswer` is a single string. **RISK:** BE may expect different delimiter. **Action:** confirm with BE before QA.

### 4.5 Visual-QA image input
- A4's `useVisualQa` routes local file attachments to `askMultipart` (sends `CustomImage` form field). `askJson` path never base64-encodes images because `expo-file-system` is not installed. **Action:** accept — multipart works for all cases.

### 4.6 Notification.link shape
- PLAN said `{ screen, params }` object but BE `NotificationDto` has a free-form `targetUrl` string. A5 stores it in `link.screen` as-is. **Action:** add a parser from targetUrl → route params, or ask BE to return structured target.

### 4.7 StudentAnalyticsSummaryDto gap
- Backend analytics DTO doesn't include `weeklyScores`, `strengths`, `weaknesses`. A3's AnalyticsScreen renders empty states for those sections. **Action:** log in PLAN.md §9 (done); ask BE to extend DTO.

### 4.8 StudentProgressDto gap
- No `streakDays` field. HomeScreen "Chuỗi ngày" stat shows `0`. **Action:** BE task.

### 4.9 Assignment deep-link gap
- `StudentAssignmentSummaryDto` has no `quizId`/`classId`. Tapping an assignment on Home is read-only. **Action:** BE task.

### 4.10 Annotation multi-shape gap
- Swagger annotation DTO supports only one polygon + label + free-text coordinates. A4's `saveAnnotation` drops shapes beyond the first. **Action:** BE schema work needed to support multi-shape annotations.

### 4.11 i18n sweep
- A5 shipped complete `vi.ts`/`en.ts` tables. A1–A4 screens still use raw Vietnamese literals (allowed by PLAN §6.6). **Action:** mechanical follow-up pass — grep unicode Vietnamese in `.tsx`, replace with `t('...')`. One agent-sized pass per module.

---

## 5. Review checklist (replaces PLAN.md §8)

Tick each item as you verify. Anything unchecked = blocker for beta.

### Build & boot
- [ ] `npm install` clean (no peer-dep warnings blocking)
- [ ] `npx tsc --noEmit` passes ← **already verified ✅**
- [ ] `npx expo start` boots (iOS simulator)
- [ ] App launches and shows Login screen (no crash on hydrate)

### Auth flow
- [ ] Login `student2@gmail.com` → lands on Home (cold-start tolerated ~30s)
- [ ] Register creates account + auto-login or redirects to Login
- [ ] Forgot password accepts email → toast
- [ ] Logout returns to Login + clears SecureStore
- [ ] App restart stays logged in (hydrate reads SecureStore)
- [ ] Expired token → redirect to Login with toast

### Home
- [ ] Quick stats render from `/api/student/progress`
- [ ] Recent activity list renders
- [ ] Assignments section renders or empty state
- [ ] Pull-to-refresh works
- [ ] "Hỏi AI" CTA opens Cases tab
- [ ] "Practice" CTA opens Quiz tab

### Quiz
- [ ] Quiz list renders with tabs (Được giao / Luyện tập)
- [ ] Start quiz → questions load
- [ ] Answer selection auto-saves (watch Network tab for `POST /answers`)
- [ ] Timer countdown visible (if quiz has duration)
- [ ] Kill app mid-quiz → re-open → attempt resumes from AsyncStorage
- [ ] Offline: answer a question → re-connect → check flush happens
- [ ] Submit → lands on Review with score
- [ ] Review shows correct vs selected per question
- [ ] History list → tap attempt → Review opens
- [ ] Swipe-to-delete draft works
- [ ] Practice mode: generate → quiz plays
- [ ] Request retake → BE accepts

### Progress
- [ ] Progress screen shows topic bars
- [ ] Analytics screen renders (even if weekly scores empty)

### Cases + Visual-QA
- [ ] Case list loads with filter chips
- [ ] Search (inline input) filters local results
- [ ] Tap case → detail with tabs (Info / Images / Hỏi AI)
- [ ] XrayViewer: pinch-zoom works
- [ ] XrayViewer: pan when zoomed
- [ ] XrayViewer: double-tap toggles 1×/2.5×
- [ ] XrayViewer: reset button works
- [ ] Chat tab: ask question → answer appears as Markdown
- [ ] Attach image → answer uses multipart flow
- [ ] Fullscreen ChatScreen shares state with CaseDetail chat tab (same caseId)
- [ ] Case history loads

### Profile + Settings
- [ ] Profile loads full DTO
- [ ] Edit profile saves, reflects immediately
- [ ] Avatar picker: gallery + camera flow
- [ ] Avatar uploaded and shown
- [ ] Medical verification form submits
- [ ] Change password: banner visible, BE gap respected
- [ ] Settings: language toggle vi↔en → UI keys change (for screens already keyed)
- [ ] Settings: theme toggle persists
- [ ] Logout from Settings works

### Notifications
- [ ] Notifications list loads
- [ ] Unread dot visible
- [ ] Tap → marks read (network call)
- [ ] Empty state renders when 0

### Search
- [ ] Search 2+ chars → debounced query
- [ ] Result sections grouped by type
- [ ] Recent searches persist across launches
- [ ] Tap case result → navigates to CaseDetail

### Announcements
- [ ] Announcement list loads
- [ ] Class filter pills work
- [ ] Modal shows full content

### Cross-cutting
- [ ] NetworkBanner appears when offline
- [ ] Toast visible on errors
- [ ] All screens wrapped by `Screen` (no SafeAreaView regression)
- [ ] All screens use `Loading` / `ErrorView` / `EmptyState` consistently
- [ ] No red screen / warning in Metro console
- [ ] Render.com cold-start banner or long loading handled gracefully

---

## 6. Known runtime risks (not caught by tsc)

1. **Axios FormData on Android**: avatar/proof/visual-qa multipart uploads need `{ uri, name, type }` object as file part. All three implementations use this pattern — spot-check on Android.
2. **react-native-reanimated v4** XrayViewer relies on v2 `Gesture` API. Ensure `babel.config.js` has `react-native-reanimated/plugin` as the LAST plugin. **Action:** verify Agent 1 didn't miss this in config.
3. **`NavigationContainer` + `react-navigation/native-stack` + Reanimated** — ensure `App.tsx` imports `react-native-gesture-handler` FIRST (A1 did).
4. **Auth token hydration race**: `RootNavigator` shows Loading until `authStore.isHydrated`. Verify there's no flash of Auth before hydration completes on cold start.
5. **Zod v4 error format** differs from v3 — RHF field errors may need message override. Test registration form validation UX.
6. **expo-image-picker permission flow** — first launch prompts. On denial, ensure graceful fallback (no crash).
7. **Render free tier cold start** — first request after 15 min idle may take 20–30s. ErrorView retry is the fallback.

---

## 7. Dependencies installed (final)

Per `package.json` after A1:

| Package | Version |
|---|---|
| @tanstack/react-query | ^5.97.0 |
| axios | ^1.15.0 |
| zustand | ^5.0.12 |
| expo-secure-store | ~15.0.8 |
| expo-localization | ~17.0.8 |
| expo-image | ~3.0.11 |
| expo-image-picker | ~17.0.10 |
| expo-image-manipulator | ~14.0.8 |
| expo-constants | ~18.0.13 |
| @react-native-async-storage/async-storage | 2.2.0 |
| react-hook-form | ^7.72.1 |
| zod | ^4.3.6 |
| @hookform/resolvers | ^5.2.2 |
| i18next | ^26.0.4 |
| react-i18next | ^17.0.2 |
| @react-native-community/netinfo | ^12.0.1 |
| react-native-markdown-display | ^7.0.2 |
| react-native-toast-message | ^2.3.3 |
| dayjs | ^1.11.20 |
| *(removed)* @react-navigation/drawer | — |

---

## 8. Backend gaps to raise with BE team

Priority order:

1. **`/api/student/quizzes/answers` & `/submit` answer encoding** — confirm multi-select delimiter. Blocks quiz QA.
2. **`StudentAnalyticsSummaryDto`** — add weeklyScores, strengths, weaknesses. Analytics screen is half-empty.
3. **`StudentProgressDto`** — add streakDays. Home stat shows 0.
4. **`StudentAssignmentSummaryDto`** — add quizId, classId for deep-link from Home.
5. **Notification `targetUrl`** — return structured target `{ screen, params }` for deterministic navigation.
6. **Annotation DTO** — support multi-shape payloads.
7. **Change-password endpoint** — currently hacked via `/reset-password` with empty token. Add `POST /api/Auths/change-password` with old+new.
8. **Push notification** — register-device endpoint missing; in-app only until added.
9. **Refresh token** — no endpoint; JWT expiry forces re-login.
10. **Visual-QA `imageUrl` semantics** — http URL or base64? Clarify.
11. **`/api/student/cases/filter`** — multi-value query params (CSV)?
12. **`/api/student/quizzes/practice`** response shape — single object vs array.

---

## 9. Out of scope (explicit)

Same as PLAN.md §10:
- Push notifications
- Biometric login
- Deep linking (scheme/universal)
- Skia drawing annotations
- Sentry / analytics SDK
- Automated tests

---

## 10. Recommended next actions (in order)

1. **Run on device**: `npx expo start`, scan QR, log in with `student2@gmail.com`, walk through the review checklist (§5). Anything failing → file issue.
2. **Backend alignment**: raise §8 gaps in one ticket batch.
3. **Navigation fixes**: cross-stack deep nav for Home CTAs + Notification taps. 2-hour cleanup task.
4. **i18n sweep**: mechanical replacement of VN literals → `t('...')` keys (already populated in `src/i18n/vi.ts`).
5. **Delete orphan** `src/components/StatCard.tsx` after confirming nothing imports it.
6. **Android smoke test**: verify FormData uploads + SecureStore + react-native-reanimated.
7. **babel.config.js audit**: confirm `react-native-reanimated/plugin` is last.
8. **Only then**: human commits the change — per the user's hard rule, no agent commits.

---

## 11. How to resume work

- Every agent left structured final reports. Full transcripts in:
  `/private/tmp/claude-501/-Users-vinh-workspace-support-tien/.../tasks/<agentId>.output`
  (do not read — too large; use this report as the summary).
- Each module is independently reviewable via its directory under `src/{api,screens,components,hooks,types}/...` — file ownership table in PLAN.md §3.
- If any module needs rework, re-launch the corresponding agent with a focused brief referencing PLAN.md and the specific deviation in §4 above.
