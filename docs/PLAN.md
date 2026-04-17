# BoneVisQA Mobile — Implementation Plan & Integration Contract

> **Audience:** 5 parallel implementation agents + human reviewer
> **Goal:** Build a production-ready Student mobile app on top of the existing Expo/NativeWind scaffold, wiring it to the BoneVisQA backend.
> **Do NOT reinvent contracts defined in this file.** Every agent MUST read this document first.

---

## 1. Tech Stack (locked)

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Expo SDK 54 + React Native 0.81 | Already in place |
| Language | TypeScript strict | Already enabled |
| Styling | NativeWind v4 | Already in place |
| Navigation | `@react-navigation/native` + stack + bottom-tabs | Already in place (switching Drawer → BottomTabs for student UX) |
| Server state | `@tanstack/react-query` v5 | Cache, retry, mutations |
| Client state | `zustand` | Auth, settings |
| Persistence | `expo-secure-store` (tokens), `@react-native-async-storage/async-storage` (non-sensitive) | Platform keychain for JWT |
| HTTP | `axios` | Interceptors, FormData |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | Type-safe validation |
| i18n | `i18next` + `react-i18next` + `expo-localization` | VN primary, EN fallback |
| Image | `expo-image`, `expo-image-picker`, `expo-image-manipulator` | Cache, upload |
| Date | `dayjs` + locale vi | Lightweight |
| Network info | `@react-native-community/netinfo` | Offline detection |
| Markdown | `react-native-markdown-display` | AI answer rendering |
| Toast | `react-native-toast-message` | Feedback |

**Install command (Agent 1 owns):**
```bash
npx expo install expo-secure-store expo-localization expo-image expo-image-picker expo-image-manipulator @react-native-async-storage/async-storage
npm install @tanstack/react-query axios zustand react-hook-form zod @hookform/resolvers i18next react-i18next @react-native-community/netinfo react-native-markdown-display react-native-toast-message dayjs
```

---

## 2. Backend (locked)

- **Base URL:** `https://bonevisqa.onrender.com`
- **Auth:** JWT Bearer, issued by `POST /api/Auths/login`
- **Preferred namespace:** `/api/student/*` (singular, richer feature set). Fallback to `/api/Students/*` only for `classes` (cụm mới chưa có class-list).
- **Known env:** Render free tier cold-start up to ~30s. All timeouts = 45s, initial request shows "Server is waking up…" after 3s.
- **Test token (expires 2026-04-11, dev only):**
  ```
  Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NjdmYmIwZS03MGU1LTRjNGYtOTE3Ny0xYjgyM2YyNTdhMDgiLCJlbWFpbCI6InN0dWRlbnQyQGdtYWlsLmNvbSIsInVuaXF1ZV9uYW1lIjoic3R1ZGVudDIiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJTdHVkZW50IiwiZXhwIjoxNzc1OTIyMDk5LCJpc3MiOiJCb25lVmlzUUEiLCJhdWQiOiJCb25lVmlzUUFDbGllbnQifQ.qSbQ9AMDcALk-NLZUwL54oIHVGYuILDXBiVTYDGNHRc
  ```
- **Known student endpoints** (verified in `/tmp/bonevisqa-swagger.json`):

### Auth
- `POST /api/Auths/login` body `{ email, password }` → `{ token, user }`
- `POST /api/Auths/register` body `{ email, password, fullName, role: "Student" }`
- `POST /api/Auths/forgot-password` body `{ email }`
- `POST /api/Auths/reset-password` body `{ email, token, newPassword }`
- `POST /api/Auths/request-medical-verification` (requires auth)

### Users
- `GET /api/users/me` → `StudentProfileDto`
- `PUT /api/users/me` body `UpdateStudentProfileRequestDto`
- `POST /api/users/me/avatar` multipart `file`

### Quizzes
- `GET /api/student/quizzes` query: class/assignment filters
- `POST /api/student/quizzes/{quizId}/start` → `{ attemptId, questions }`
- `POST /api/student/quizzes/answers` body `{ attemptId, questionId, answer }` — save per-question
- `POST /api/student/quizzes/submit` body `{ attemptId }` → grading
- `GET /api/student/quizzes/history` → attempt list
- `GET /api/student/quizzes/{attemptId}/review` → attempt detail + correct answers
- `DELETE /api/student/quizzes/{attemptId}` — delete draft
- `POST /api/student/quizzes/{quizId}/request-retake`
- `GET /api/student/quizzes/practice` — practice quiz list
- `POST /api/student/quizzes/practice/generate` body `{ topic, difficulty, count }` — AI-generated
- `POST /api/student/quizzes/practice/save`

### Cases
- `GET /api/student/cases/catalog` — browseable cases
- `GET /api/student/cases/filter` query params
- `GET /api/student/cases/{caseId}` → case detail + images
- `GET /api/student/cases/history`
- `POST /api/student/cases/annotations` body `{ caseId, shapes }`

### Visual QA (AI chatbox)
- `POST /api/student/visual-qa/ask-json` body `{ caseId, question, imageBase64? }` — JSON flow
- `POST /api/student/visual-qa/ask` multipart — file upload flow
- `GET /api/student/questions` — Q&A history
- `POST /api/student/questions` — save question

### Progress & Dashboard
- `GET /api/student/progress`
- `GET /api/student/progress/topic-stats`
- `GET /api/student/progress/recent-activity`
- `GET /api/student/analytics`
- `GET /api/student/assignments`

### Notifications & Search & Announcements
- `GET /api/notifications` → list
- `PUT /api/notifications/{id}/read`
- `GET /api/search?q=` → mixed results
- `GET /api/student/announcements`

### Classes (fallback cụm cũ)
- `GET /api/Students/classes`
- `GET /api/Students/classes/{classId}`
- `DELETE /api/Students/classes/{classId}` — leave class

---

## 3. Target File Structure (locked)

```
src/
├── api/                     ← Agent-1 creates client; others add modules
│   ├── client.ts            [A1]
│   ├── auth.ts              [A1]
│   ├── users.ts             [A2]
│   ├── quizzes.ts           [A3]
│   ├── progress.ts          [A3]
│   ├── assignments.ts       [A3]
│   ├── cases.ts             [A4]
│   ├── visualQa.ts          [A4]
│   ├── questions.ts         [A4]
│   ├── notifications.ts     [A5]
│   ├── search.ts            [A5]
│   └── announcements.ts     [A5]
│
├── stores/
│   ├── authStore.ts         [A1]
│   ├── queryClient.ts       [A1]
│   └── settingsStore.ts     [A5]
│
├── types/
│   ├── api.ts               [A1] ← ApiError, PagedResult<T>
│   ├── auth.ts              [A1]
│   ├── user.ts              [A2]
│   ├── quiz.ts              [A3]
│   ├── case.ts              [A4]
│   └── notification.ts      [A5]
│
├── hooks/
│   ├── useAuth.ts           [A1]
│   ├── useProfile.ts        [A2]
│   ├── useQuiz.ts           [A3]
│   ├── useQuizAttempt.ts    [A3]
│   ├── useVisualQa.ts       [A4]
│   ├── useNotifications.ts  [A5]
│   └── useDebounce.ts       [A5] ← shared utility
│
├── i18n/                    [A5]
│   ├── index.ts
│   ├── vi.ts
│   └── en.ts
│
├── navigation/              [A1 creates; other agents only add types]
│   ├── RootNavigator.tsx    [A1]
│   ├── AuthNavigator.tsx    [A1]
│   ├── AppNavigator.tsx     [A1] ← BottomTabs + nested stacks
│   └── types.ts             [A1] ← shared route param lists
│
├── components/
│   ├── common/              [A1 owns primitives]
│   │   ├── Button.tsx       [A1]
│   │   ├── Input.tsx        [A1]
│   │   ├── Card.tsx         [A1]
│   │   ├── Loading.tsx      [A1]
│   │   ├── ErrorView.tsx    [A1]
│   │   ├── EmptyState.tsx   [A1]
│   │   ├── Screen.tsx       [A1] ← SafeAreaView + padding wrapper
│   │   ├── SearchBar.tsx    [A5]
│   │   ├── Toast.tsx        [A1]
│   │   └── NetworkBanner.tsx [A1]
│   ├── profile/             [A2]
│   ├── quiz/                [A3]
│   ├── cases/               [A4]
│   ├── chat/                [A4]
│   └── notifications/       [A5]
│
└── screens/
    ├── auth/                [A1]
    │   ├── LoginScreen.tsx              (rewrite — wire API)
    │   ├── RegisterScreen.tsx           (rewrite — wire API)
    │   └── ForgotPasswordScreen.tsx     (rewrite — wire API)
    └── student/
        ├── home/
        │   └── HomeScreen.tsx           [A3]
        ├── profile/                     [A2]
        │   ├── ProfileScreen.tsx
        │   ├── EditProfileScreen.tsx
        │   └── MedicalVerificationScreen.tsx
        ├── settings/                    [A2]
        │   ├── SettingsScreen.tsx
        │   └── ChangePasswordScreen.tsx
        ├── quiz/                        [A3]
        │   ├── QuizListScreen.tsx       (rewrite)
        │   ├── QuizPlayScreen.tsx
        │   ├── QuizReviewScreen.tsx
        │   ├── QuizHistoryScreen.tsx
        │   └── PracticeModeScreen.tsx
        ├── progress/                    [A3]
        │   ├── ProgressScreen.tsx
        │   └── AnalyticsScreen.tsx
        ├── cases/                       [A4]
        │   ├── CaseListScreen.tsx       (replaces CatalogScreen)
        │   ├── CaseDetailScreen.tsx
        │   └── CaseHistoryScreen.tsx
        ├── visualQa/                    [A4]
        │   ├── ChatScreen.tsx           (rewrite to wire API)
        │   └── AskScreen.tsx
        ├── notifications/               [A5]
        │   └── NotificationsScreen.tsx
        ├── search/                      [A5]
        │   └── SearchScreen.tsx
        └── announcements/               [A5]
            └── AnnouncementsScreen.tsx
```

**Legacy files to delete** (Agent 1 handles):
- `src/components/CustomDrawerContent.tsx` (drawer → bottom tabs)
- `src/screens/student/dashboard/StudentDashboardScreen.tsx` → replaced by `home/HomeScreen.tsx` [A3]
- `src/screens/student/catalog/CatalogScreen.tsx` → replaced by `cases/CaseListScreen.tsx` [A4]
- `src/screens/student/history/HistoryScreen.tsx` → replaced by `cases/CaseHistoryScreen.tsx` [A4]
- `src/screens/student/qa/*` → replaced by `visualQa/*` [A4]
- `src/components/student/quiz/types.ts` → replaced by `types/quiz.ts` [A3]
- `src/constants/mockData.ts` → deleted after all modules go live (final step)

---

## 4. Shared Contracts (CRITICAL — do not deviate)

### 4.1 `src/api/client.ts` (Agent 1)

```ts
// Exports:
export const api: AxiosInstance;                     // Bearer auto-attached
export async function handleApiError(e: unknown): Promise<ApiError>;
export function isAuthError(e: unknown): boolean;    // 401
// Config:
//   baseURL from env.ts
//   timeout 45000
//   interceptor reads authStore.getState().token
//   401 → authStore.getState().logout() + navigate to Login
```

### 4.2 `src/stores/authStore.ts` (Agent 1)

```ts
export interface AuthState {
  token: string | null;
  user: { id: string; email: string; fullName: string; role: 'Student' } | null;
  isHydrated: boolean;
  isAuthenticated: boolean;          // derived: !!token
  login: (token: string, user: AuthState['user']) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;      // called on app start — reads SecureStore
  setUser: (user: AuthState['user']) => void;
}

export const useAuthStore: UseBoundStore<StoreApi<AuthState>>;
// Token persistence via expo-secure-store keys: BONEVISQA_TOKEN, BONEVISQA_USER
```

### 4.3 `src/stores/queryClient.ts` (Agent 1)

```ts
export const queryClient: QueryClient;
// defaults:
//   staleTime: 30_000
//   retry: 2 (but no retry for 401)
//   refetchOnWindowFocus: false (RN has no window)
```

### 4.4 `src/navigation/types.ts` (Agent 1 defines, everyone imports)

```ts
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppTabParamList = {
  HomeTab: undefined;
  QuizTab: undefined;
  CasesTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Search: undefined;
  Announcements: undefined;
};

export type QuizStackParamList = {
  QuizList: undefined;
  QuizPlay: { quizId: string; attemptId?: string };
  QuizReview: { attemptId: string };
  QuizHistory: undefined;
  PracticeMode: undefined;
  Progress: undefined;
  Analytics: undefined;
};

export type CasesStackParamList = {
  CaseList: undefined;
  CaseDetail: { caseId: string };
  CaseHistory: undefined;
  VisualQaChat: { caseId?: string };
  VisualQaAsk: { caseId: string };
};

export type NotificationsStackParamList = {
  Notifications: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  MedicalVerification: undefined;
};
```

### 4.5 `src/types/api.ts` (Agent 1)

```ts
export interface ApiError {
  status: number;
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 4.6 Common UI primitives (Agent 1)

Each primitive must:
- Accept `className?: string` for NativeWind override
- Be typed with exported `interface XxxProps`
- Support dark mode via NativeWind `dark:` prefixes
- Pass `testID` through

**`Button`** — variants: `primary | secondary | outline | ghost | destructive`, sizes: `sm | md | lg`, `loading`, `disabled`, `leftIcon`, `rightIcon`.
**`Input`** — `label`, `error`, `helper`, controlled via `value/onChangeText`, also exposes `ref` to native `TextInput`.
**`Card`** — simple `View` with rounded-2xl, shadow, padding, supports `onPress`.
**`Screen`** — SafeAreaView wrapper with `scroll?: boolean`, `refresh?: { refreshing, onRefresh }`, `padding?: boolean`.
**`Loading`** — centered ActivityIndicator with optional text.
**`ErrorView`** — shows error + retry button, takes `ApiError`.
**`EmptyState`** — icon + title + subtitle + optional action.
**`NetworkBanner`** — red bar when offline, hidden otherwise.

### 4.7 Design tokens (update `tailwind.config.js` — Agent 1)

Keep existing palette, add:
```js
colors: {
  primary: { DEFAULT: '#14b8a6', dark: '#0d9488', light: '#5eead4' },
  slate: { 900: '#0f172a', 800: '#1e293b', 700: '#334155', ... },
  // leave existing
}
```

---

## 5. Agent Briefs

> **All agents**: work ONLY inside `/Users/vinh/workspace/support-tien/BoneVisQA_Mobile`. Do not touch files outside your ownership (section 3). Read this PLAN.md first. All UI must be in Vietnamese (vi-VN) by default with i18n keys.

### Agent 1 — Foundation + Auth + Navigation + Common UI
**Owns:** `src/api/client.ts`, `src/api/auth.ts`, `src/stores/authStore.ts`, `src/stores/queryClient.ts`, `src/types/{api,auth}.ts`, `src/hooks/useAuth.ts`, `src/navigation/*`, `src/constants/env.ts`, `src/screens/auth/*`, `src/components/common/*` (except SearchBar), `App.tsx`, `package.json`, `tailwind.config.js`, delete `CustomDrawerContent.tsx`.

**Deliverables:**
1. Install all deps from section 1.
2. Implement contracts from section 4.1–4.7.
3. Rewrite `App.tsx`:
   - Wrap: `GestureHandlerRootView → SafeAreaProvider → QueryClientProvider → NavigationContainer → RootNavigator`
   - On mount: call `authStore.hydrate()` then render.
   - Mount `<Toast />` at the bottom.
4. `RootNavigator`: if `isHydrated && isAuthenticated` → `App`, else → `Auth`.
5. `AuthNavigator`: stack of Login / Register / ForgotPassword.
6. `AppNavigator`: bottom tabs — Home, Quiz, Cases, Notifications, Profile — each tab is its own native-stack.
7. Rewrite `LoginScreen` / `RegisterScreen` / `ForgotPasswordScreen`:
   - `react-hook-form` + `zod`
   - Real API calls
   - Loading / error states
   - Save token + user on success, navigation auto-switches
8. Seed `i18n` loader placeholder (Agent 5 fills keys) — in App.tsx do `import './src/i18n'` lazily.
9. Env: `src/constants/env.ts` reads from `app.json → extra.apiBaseUrl`, fallback `https://bonevisqa.onrender.com`. Update `app.json` to include `extra.apiBaseUrl`.
10. Placeholder screens for tabs that other agents will replace: export a tiny "Loading…" component so navigator compiles standalone. Use format `export default function HomeScreen() { return <Screen><Loading/></Screen>; }`. **OTHER AGENTS WILL OVERWRITE THESE FILES** — section 3 lists the exact paths.

**Done-when:** `npx tsc --noEmit` passes; `npm start` boots; login with `student2@gmail.com` works end-to-end.

---

### Agent 2 — Profile, Settings, Medical Verification
**Depends on:** Agent 1 (api client, authStore, common UI, navigation types).
**Owns:** `src/api/users.ts`, `src/types/user.ts`, `src/hooks/useProfile.ts`, `src/screens/student/profile/*`, `src/screens/student/settings/*`, `src/components/profile/*`.

**Deliverables:**
1. `api/users.ts`:
   - `getMe(): Promise<StudentProfile>`
   - `updateMe(dto: UpdateStudentProfileDto): Promise<StudentProfile>`
   - `uploadAvatar(uri: string): Promise<{ avatarUrl: string }>` — FormData multipart
   - `requestMedicalVerification(dto): Promise<void>`
2. `types/user.ts`: `StudentProfile` (18 fields from Swagger), `UpdateStudentProfileDto` (11 editable).
3. `useProfile()` TanStack Query hook — `queryKey: ['me']`, mutations invalidate `['me']`.
4. **ProfileScreen** — Header w/ avatar + name + email + role + cohort. Sections: Personal info, Academic info, Contact, Emergency. Edit button → `EditProfile`. Menu items → Settings, Medical Verification, Logout.
5. **EditProfileScreen** — RHF + zod for 11 fields, avatar picker with `expo-image-picker` → `uploadAvatar` → then `updateMe`. Save → toast + navigate back.
6. **SettingsScreen** — toggles: language (vi/en), theme (light/dark/system) — reads from `settingsStore` (Agent 5). Until Agent 5 ships, scaffold calls to a placeholder `settingsStore` with the same interface. Also: About, Logout.
7. **ChangePasswordScreen** — form `oldPassword / newPassword / confirm` → stub endpoint `POST /api/Auths/reset-password` with current token email (or document BE gap if no change-password endpoint).
8. **MedicalVerificationScreen** — form `schoolId, fullName, proofDocument (image)` → `POST /api/Auths/request-medical-verification`.
9. Avatar flow must `expo-image-manipulator.manipulateAsync(..., { compress: 0.8, format: 'jpeg' })` before upload to keep payloads small.

**Done-when:** profile loads, edit persists, avatar uploads, logout works.

---

### Agent 3 — Home, Quiz, Progress, Assignments
**Depends on:** Agent 1.
**Owns:** `src/api/{quizzes,progress,assignments}.ts`, `src/types/quiz.ts`, `src/hooks/{useQuiz,useQuizAttempt}.ts`, `src/screens/student/{home,quiz,progress}/*`, `src/components/quiz/*`.

**Deliverables:**
1. `api/quizzes.ts`:
   - `listQuizzes(params)`, `startQuiz(quizId)`, `submitAnswer(attemptId, questionId, answer)`, `submitQuiz(attemptId)`, `getHistory()`, `getReview(attemptId)`, `deleteAttempt(attemptId)`, `requestRetake(quizId)`, `getPractice()`, `generatePractice(dto)`, `savePractice(dto)`.
2. `api/progress.ts`: `getProgress()`, `getTopicStats()`, `getRecentActivity()`, `getAnalytics()`.
3. `api/assignments.ts`: `list()`.
4. `types/quiz.ts`: Quiz, Question (MCQ + image support), Attempt, AttemptAnswer, ReviewResult, PracticeGenerateDto, ProgressSummary, TopicStat, RecentActivity, Analytics.
5. **HomeScreen** — dashboard: greeting, quick stats (progress), recent activity list, upcoming assignments, announcement preview (import from Agent 5 once ready — until then, render empty state if hook not exported). Pull-to-refresh.
6. **QuizListScreen** (rewrite): list of assigned + practice quizzes, filter by status. Card = title, class, question count, due date, status chip.
7. **QuizPlayScreen** — resumable:
   - Loads/starts attempt via `startQuiz`.
   - One question per screen (swipeable) with progress bar + timer (if quiz has time limit).
   - Every answer change calls `submitAnswer` (debounced 500ms) — save-per-question.
   - Final "Submit" button calls `submitQuiz`, navigates to `QuizReview`.
   - Offline queue: if request fails, push to `quizOfflineQueue` in AsyncStorage, flush on reconnect (netinfo).
8. **QuizReviewScreen** — shows attempt with correct answers, explanations, score. Retake button → `requestRetake`.
9. **QuizHistoryScreen** — paginated list; swipe to delete draft.
10. **PracticeModeScreen** — generator form (topic, difficulty, count) → calls `generatePractice` → shows generated quiz inline → save.
11. **ProgressScreen** — charts using simple bar views (no charts lib — roll your own with `<View style={{width}}>` bars). Topic stats + recent activity list.
12. **AnalyticsScreen** — richer stats.

**Done-when:** full quiz flow works end-to-end with test student account.

---

### Agent 4 — Cases, Visual QA (AI Chatbox)
**Depends on:** Agent 1.
**Owns:** `src/api/{cases,visualQa,questions}.ts`, `src/types/case.ts`, `src/hooks/useVisualQa.ts`, `src/screens/student/cases/*`, `src/screens/student/visualQa/*`, `src/components/{cases,chat}/*`.

**Deliverables:**
1. `api/cases.ts`: `getCatalog(params)`, `filter(params)`, `getById(caseId)`, `getHistory()`, `saveAnnotation(dto)`.
2. `api/visualQa.ts`: `askJson(dto)`, `askMultipart(formData)`.
3. `api/questions.ts`: `list()`, `create(dto)`.
4. `types/case.ts`: Case, CaseImage, Annotation, Shape (rect/point/polygon), Question, VisualQaMessage.
5. **CaseListScreen** — replaces `CatalogScreen`. Filter chips (region, modality, difficulty), search bar that routes to global search or filters locally. Grid of cards with thumbnail.
6. **CaseDetailScreen**:
   - Tabs: Info / Images / Chat
   - `XrayViewer` component with pinch-zoom, pan, double-tap-reset using `react-native-gesture-handler` + `react-native-reanimated`.
   - "Ask AI" button → `VisualQaChat` for this case.
7. **CaseHistoryScreen** — replaces legacy HistoryScreen.
8. **VisualQaChatScreen** (rewrite from `qa/ChatScreen.tsx`):
   - Chat UI with MessageBubble (user/assistant), auto-scroll, keyboard avoidance.
   - Input bar with "Attach image" + "Send".
   - Sends `askJson` by default; if user attaches image from camera/gallery, switch to multipart.
   - Render assistant response as Markdown.
   - Persist Q&A by calling `POST /api/student/questions`.
9. **VisualQaAskScreen** — quick-ask mode without case context.
10. `useVisualQa()` — mutation hook, also exposes `messages` list via React Query cache with key `['visualqa', caseId]`.

**Done-when:** can browse cases, zoom X-ray, ask AI a question and see markdown answer.

---

### Agent 5 — Notifications, Search, Announcements, i18n, Settings store, NetInfo
**Depends on:** Agent 1.
**Owns:** `src/api/{notifications,search,announcements}.ts`, `src/types/notification.ts`, `src/stores/settingsStore.ts`, `src/hooks/{useNotifications,useDebounce}.ts`, `src/screens/student/{notifications,search,announcements}/*`, `src/components/{notifications/*,common/SearchBar.tsx}`, `src/i18n/*`.

**Deliverables:**
1. `api/notifications.ts`: `list()`, `markRead(id)`.
2. `api/search.ts`: `search(q: string)`.
3. `api/announcements.ts`: `list()`.
4. `types/notification.ts`: Notification, NotificationType (`assignment | announcement | quiz | system`), SearchResult (discriminated union by type).
5. `stores/settingsStore.ts`:
   ```ts
   interface SettingsState {
     language: 'vi' | 'en';
     theme: 'light' | 'dark' | 'system';
     setLanguage(l): void;
     setTheme(t): void;
     hydrate(): Promise<void>;
   }
   ```
   persist via AsyncStorage key `BONEVISQA_SETTINGS`.
6. `i18n/index.ts` — init i18next with `expo-localization` locale → fallback vi. Export `t` and `useTranslation` re-export. Agents 2/3/4 may use string literals; Agent 5 sweeps keys into `vi.ts` / `en.ts` in a final pass (document in report).
7. **NotificationsScreen** — list with unread indicator, tap → route to linked resource (Assignment / Case / Announcement / Quiz). Swipe-to-read.
8. **SearchScreen** — `SearchBar` + debounced query (300ms) + sectioned results by type + empty state + recent searches from AsyncStorage.
9. **AnnouncementsScreen** — list of announcements, detail inline modal.
10. Hook up `NetworkBanner` to netinfo inside Agent 1's component (Agent 1 scaffolds component, Agent 5 wires listener inside the component if needed — if already wired by A1, skip).
11. Badge count for NotificationsTab: expose `useUnreadCount()` hook.

**Done-when:** notifications load, can mark as read; global search returns results; language switch persists.

---

## 6. Integration Rules

1. **No agent touches `package.json`** except Agent 1. If you need a new dep, STOP and add it to `PLAN.md § Dependencies Added` with a justification, then Agent 1 (or the human reviewer) will install.
2. **Imports**: everyone uses `../../api/...` relative paths (no path aliases unless Agent 1 configures them in `tsconfig.json`).
3. **Query keys** namespace: `['me']`, `['quizzes', params]`, `['quiz', quizId]`, `['attempt', attemptId]`, `['progress']`, `['cases', params]`, `['case', caseId]`, `['notifications']`, `['search', q]`, `['announcements']`. Document any new key in this PLAN.
4. **Error handling**: every screen uses `<ErrorView error={apiError} onRetry={refetch} />` on failure.
5. **Loading**: every screen uses `<Loading />` for initial, skeleton optional.
6. **i18n**: use `t('namespace.key')`. Until Agent 5 registers keys, string literals in Vietnamese are acceptable — Agent 5 will sweep them.
7. **Logout path**: every screen's logout action calls `useAuthStore.getState().logout()`. Do not reimplement.
8. **Navigation**: use typed `useNavigation<NativeStackNavigationProp<XStackParamList>>()`. Do not use untyped string navigation.
9. **No `any`**: forbidden per global TS rules.
10. **No `console.log`**: forbidden per global TS rules. Use `__DEV__ && console.warn` only if debugging.

## 7. Dependencies Added (log any additions here)

| Package | Version | Added by | Reason |
|---|---|---|---|
| @tanstack/react-query | ^5.x | A1 | Server state |
| axios | ^1.x | A1 | HTTP + interceptors |
| zustand | ^4.x | A1 | Client state |
| expo-secure-store | latest | A1 | Token storage |
| @react-native-async-storage/async-storage | latest | A1 | Non-sensitive persistence |
| react-hook-form | ^7.x | A1 | Forms |
| zod | ^3.x | A1 | Validation |
| @hookform/resolvers | ^3.x | A1 | RHF+zod |
| i18next | ^23.x | A1 | i18n |
| react-i18next | ^14.x | A1 | i18n bindings |
| expo-localization | latest | A1 | Locale detection |
| expo-image | latest | A1 | Image cache |
| expo-image-picker | latest | A1 | Camera/gallery |
| expo-image-manipulator | latest | A1 | Resize before upload |
| @react-native-community/netinfo | latest | A1 | Offline detection |
| react-native-markdown-display | ^7.x | A1 | AI answer render |
| react-native-toast-message | ^2.x | A1 | Toasts |
| dayjs | ^1.x | A1 | Date formatting |

## 8. Review Checklist (human reviewer fills after agents done)

- [ ] `npm install` clean (no peer-dep warnings blocking)
- [ ] `npx tsc --noEmit` passes
- [ ] `npx expo start` boots on iOS simulator
- [ ] Login flow: enter student2@gmail.com → lands on Home
- [ ] Home: stats load from `/api/student/progress`
- [ ] Quiz list loads from `/api/student/quizzes`
- [ ] Start quiz → answer → submit → review
- [ ] Practice mode generates
- [ ] Cases list loads, case detail shows X-ray with zoom
- [ ] Visual QA: ask question → get markdown answer
- [ ] Profile loads + edit saves + avatar uploads
- [ ] Notifications load + mark as read
- [ ] Search returns results
- [ ] Language switch vi↔en persists
- [ ] Logout returns to Login
- [ ] No `any`, no `console.log`, no mock data imports
- [ ] `src/constants/mockData.ts` deleted
- [ ] Cold-start banner shown when Render wakes

## 9. Backend Gaps (to raise with BE team)

1. No device-token endpoint for push notifications → push postponed.
2. No refresh-token endpoint → JWT expiry forces re-login.
3. No `change-password` endpoint → stubbed via reset-password flow.
4. `/api/student/quizzes/answers` exact shape unclear → confirm with BE before Agent 3 ships resumable logic.
5. `/api/notifications` has no register-device endpoint → in-app inbox only.
6. Schema for `visual-qa/ask` (multipart) vs `ask-json` unclear on image size limits.

## 10. Out of Scope (explicit NO)

- Push notifications (needs BE endpoint)
- Biometric login (nice-to-have, postponed)
- Deep linking (postponed)
- Skia drawing annotations (postponed — use simple rect picker later)
- Sentry / analytics SDK (postponed)
- Tests (agents create no tests; human reviewer adds per [testing rules](../../rules/common/testing.md))
