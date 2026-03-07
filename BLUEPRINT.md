# IronLog — Ultimate Gym Tracker App
## Exhaustive Product & Technical Blueprint

> **Stack Decision:** React Native Expo (not Next.js PWA)
>
> **Why Expo wins over a PWA for this use case:**
> - `expo-sqlite` provides true SQLite persistence that cannot be evicted by the OS (unlike browser IndexedDB/Cache Storage which Chrome can wipe under storage pressure)
> - `expo-camera` enables full native video recording + frame extraction required for AI Form Coach — browser MediaRecorder API is too limited
> - Native haptic feedback (`expo-haptics`), smooth 60/120fps animations via Reanimated 3, and proper push notifications are impossible in a PWA
> - A single codebase that compiles to a real `.apk` / `.aab` — no browser dependency, no service worker complexity
> - EAS Build + EAS Update (OTA) gives a solo developer a best-in-class CI/CD pipeline with zero DevOps overhead
> - Expo SDK 52+ ships with the New Architecture (JSI/Fabric) by default — near-native performance with no bridge

---

## Table of Contents

1. [Product Vision — The "Gym Rat" Dream](#1-product-vision)
2. [Complete Tech Stack](#2-tech-stack)
3. [System Architecture & Data Flow](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [Step-by-Step Implementation Blueprint](#5-implementation-blueprint)
6. [Project File Structure](#6-file-structure)
7. [Supabase Backend Setup](#7-supabase-backend)
8. [AI Feature Deep-Dives](#8-ai-features)
9. [Testing Strategy](#9-testing)
10. [Release & Deployment](#10-release)

---

## 1. Product Vision

### The Pitch
**IronLog** is the gym tracker that every serious lifter has been waiting for — the one that actually helps you get stronger, prevents overtraining, coaches your form, and thinks for you during rest periods. It is 100% free, works entirely offline, and uses AI in ways no other app on the market does.

---

### Top 5 Killer Features

---

#### Feature 1: AI Form Coach (Gemini Vision)
**What it does:**
The user records a 10–15 second video of any set directly inside the app. The app extracts 6–8 key frames, compresses them, and queues them for Gemini 2.0 Flash multimodal analysis. Gemini returns a structured JSON critique covering depth, back position, bar path, knee tracking, tempo, and lockout — rendered as an actionable card attached to that set in the session log.

**What Gemini returns (example for Squat):**
```json
{
  "overall_score": 7.2,
  "scores": {
    "depth": 6,
    "back_position": 8,
    "knee_tracking": 9,
    "bar_path": 7,
    "tempo": 6
  },
  "issues": [
    "Depth is approx 2 inches above parallel",
    "Bar speed breaks at mid-ascent — lack of quad drive"
  ],
  "recommendations": [
    "Cue: 'Push the floor away' to improve bar speed",
    "Add pause squats at 60% 1RM to build strength in the hole",
    "Consider widening stance by 1–2 inches to improve depth"
  ],
  "positive_feedback": "Bracing and upper back tightness are excellent"
}
```

**Why it's a killer feature:** No free gym app on the market does AI-powered form analysis. This replaces a $100/hour personal trainer. Form improvement history is tracked — users can see their squat score go from 6.1 → 8.4 over 3 months.

---

#### Feature 2: AI Periodization Engine (Gemini Text)
**What it does:**
The user fills a 5-field form: goal (strength / hypertrophy / endurance), available days per week, equipment access, training experience, and weak body parts. Gemini then analyzes the user's *entire* local training history — PRs, volume per muscle, stall patterns, frequency — and generates a scientifically-backed, fully periodized program with week-by-week progression targets.

The generated program is returned as structured JSON that maps directly into `workout_template` entities in the local database. The user reviews it, edits if desired, and hits "Save Program" — it becomes their templates immediately.

Supports all periodization models:
- **Linear Progression** — for beginners (add weight every session)
- **Daily Undulating Periodization (DUP)** — for intermediates (rotate strength/hypertrophy/speed days)
- **Block Periodization** — for advanced (accumulation → intensification → peaking blocks)

**Why it's a killer feature:** Every other app gives you generic sample programs. IronLog generates a program around *your* history, *your* stall points, and *your* schedule. It's a PhD-level strength coach for free.

---

#### Feature 3: AI Natural Language Logging
**What it does:**
A persistent input bar on the active workout screen. The user can type or speak (voice-to-text via `expo-speech`) exactly as they'd tell a training partner:

- `"bench 225 3x5 rpe 8"` → logs 3 sets of Barbell Bench Press, 225 lbs, 5 reps, RPE 8
- `"squats 3 plates for 5, felt easy"` → 315 lbs × 5 reps, notes: "felt easy"
- `"did a drop set on cable fly 40 12, 30 15, 20 failure"` → 3 sets with drop weights logged + failure tag
- `"deads 2 reps short of failure at 180kg"` → Deadlift 180kg, AMRAP set, notes appended

When offline, the NLP request is queued locally. The raw text is stored, the app attempts a local regex parser for simple formats (`weight x reps`), and the Gemini parse is applied during next sync to fill in ambiguities.

**Why it's a killer feature:** Logging during a 90-second rest period on a phone keyboard is friction. This removes virtually all of it. Experienced lifters will log faster than they can breathe.

---

#### Feature 4: Intelligent Plateau Breaker & Smart Progressive Overload
**What it does:**
IronLog continuously builds a **strength curve** for every exercise — a regression of weight × estimated 1RM over time. After each session, it projects the next target weight and reps using the user's personal rate-of-progress curve (not generic tables).

When the regression slope approaches zero across 3+ consecutive sessions, a plateau is detected **entirely locally** — no internet needed. The dashboard shows: `"⚠️ You've stalled on Bench Press for 4 sessions."` with a tap to "Get AI Advice."

When tapped (and online + synced), Gemini receives the user's plateau context and returns an evidence-based intervention as an actionable card:

```
INTERVENTION: Bench Press Plateau (4 sessions @ 100kg × 5)

Recommended actions:
1. Deload to 85kg (85%) for 1 session — full reset of CNS fatigue
2. Switch to 4×6 @ 90kg for 2 sessions (volume accumulation)
3. Add 2 sets of Close-Grip Bench Press — strengthen tricep lockout weakness
4. Return to 102.5kg in week 3 — projected new 5RM based on volume response
```

**Why it's a killer feature:** Every intermediate lifter hits the wall and doesn't know what to do. This turns a frustrating dead-end into a structured path forward, backed by actual sport science.

---

#### Feature 5: AI Recovery & Fatigue Intelligence
**What it does:**
After every workout, IronLog calculates a **fatigue score (0–100)** for each muscle group using a local algorithm based on:
- Weekly sets landed on that muscle (volume)
- Average relative intensity (% estimated 1RM)
- Days since last trained (recovery curve — research-backed 48–72hr window)
- User-reported wellness (optional daily check-in: sleep quality 1–5, soreness 1–3, energy 1–5)

This is rendered as a interactive **Muscle Map** — a human body silhouette with muscles color-coded green (fresh) → yellow (moderate) → red (fatigued). Tapping any muscle shows: fatigue score, last trained, weekly sets vs optimal range, and recovery ETA.

The Dashboard's "Train Today?" card uses this to recommend *what* to train based on current recovery state — completely offline.

When synced, Gemini analyzes multi-week patterns and surfaces systemic insights:
- `"Your anterior delts are consistently in the red. Your push/overhead frequency is 5x/week — reduce to 3x and watch shoulder health improve."`
- `"You haven't trained posterior chain in 9 days — hamstring and glute volume is critically low for your goals."`

**Why it's a killer feature:** Overtraining is the #1 invisible progress killer. This makes fatigue visible, actionable, and understandable — replacing both a coach and a sports scientist.

---

### Gemini API Integration Strategy

| Feature | Model | Modality | When Called |
|---|---|---|---|
| Form Coach | Gemini 2.0 Flash | Multimodal (images) | During sync (frames queued offline) |
| Periodization Engine | Gemini 2.0 Flash | Text | During sync (request queued offline) |
| NLP Logging | Gemini 2.0 Flash | Text | During sync (raw text queued offline) |
| Plateau Breaker | Gemini 2.0 Flash | Text | During sync (plateau flag + context queued) |
| Recovery Insights | Gemini 2.0 Flash | Text | During sync (fatigue snapshot queued) |

**Security:** The Gemini API key **never touches the client device**. All Gemini calls are proxied through a **Supabase Edge Function**. The client authenticates to Supabase via JWT, and the Edge Function validates the JWT before forwarding to Gemini.

**Free Tier Budget (Gemini 2.0 Flash):**
- 15 requests per minute, 1,500 requests per day — free
- A typical user's sync session sends 1–5 AI requests → well within limits
- Prompt caching: SHA-256 hash of every request. If an identical prompt was answered < 7 days ago, the cached local response is returned and no API call is made.

---

## 2. Tech Stack

### Full Stack Recommendation

| Layer | Technology | Version | Reason |
|---|---|---|---|
| **Framework** | React Native + Expo SDK | 52+ | Managed workflow, EAS Build/Update, New Architecture by default |
| **Language** | TypeScript | 5.x | Type safety, autocomplete, prevents entire classes of runtime bugs |
| **Navigation** | Expo Router (file-based) | v4 | Zero-config routing, deep linking, typed routes, tab/stack/modal support |
| **Local Database** | expo-sqlite + Drizzle ORM | latest | True SQLite, type-safe queries, schema migrations, reactive with `useLiveQuery` |
| **State Management** | Zustand | 5.x | Minimal boilerplate, no providers, co-located slices, perfect for offline-first |
| **Server State / Sync** | Custom SyncEngine (Zustand slice) | — | Manual-only sync requirement means React Query / SWR are overkill |
| **UI Components** | Custom + React Native Paper (Material 3) | 5.x | Material 3 theming, pre-built accessible components, dark mode |
| **Animations** | React Native Reanimated 3 + Moti | latest | True native thread animations at 60/120fps, Lottie support |
| **Charts** | Victory Native XL | latest | Skia-based, 60fps, Reanimated-integrated charts |
| **Camera** | expo-camera | latest | Video recording for form analysis, photo for body tracking |
| **Networking** | Supabase JS SDK v2 + @supabase/supabase-js | 2.x | Auth, realtime, storage — all in one SDK |
| **Backend** | Supabase | — | PostgreSQL + RLS + Auth + Edge Functions + Storage, generous free tier |
| **AI** | Gemini 2.0 Flash API | — | Free tier, multimodal, fastest response time, structured JSON output |
| **Edge Functions** | Deno (Supabase Edge Functions) | — | Gemini proxy, keeps API key server-side |
| **Notifications** | expo-notifications | latest | Rest timer alerts when app is backgrounded |
| **Haptics** | expo-haptics | latest | Set completion feedback, PR celebrations |
| **Speech** | expo-speech + Voice | latest | Voice input for NLP logging |
| **Secure Storage** | expo-secure-store | latest | Auth tokens stored securely (not AsyncStorage) |
| **Async Storage** | @react-native-async-storage/async-storage | latest | Non-sensitive user preferences |
| **Network Detection** | @react-native-community/netinfo | latest | Detect online/offline state for sync affordance |
| **Lottie** | lottie-react-native | latest | Confetti (PR), checkmarks, loading animations |
| **Icons** | @expo/vector-icons (MaterialCommunityIcons) | latest | 7000+ icons, zero config with Expo |
| **Build** | EAS Build | latest | Cloud builds, free tier, signed APK/AAB generation |
| **OTA Updates** | EAS Update | latest | Push JS bundle updates without Play Store review |
| **Crash Reporting** | Sentry for React Native | latest | Free tier, error tracking with stack traces |

### Why NOT Next.js PWA
| Concern | PWA Weakness | Expo Advantage |
|---|---|---|
| Offline storage | IndexedDB can be evicted by browser under storage pressure | SQLite with expo-sqlite is permanent until app uninstall |
| Camera / Video | Browser MediaRecorder lacks frame extraction control | expo-camera provides full video + frame-by-frame access |
| Performance | JS → browser bridge, repaint overhead | Reanimated 3 runs on UI thread (JSI), Skia renders at 120fps |
| Haptics | Not available in browsers | expo-haptics wraps native HapticFeedback APIs |
| App Store | PWAs can't be listed on Play Store as native apps | EAS Build produces a proper signed .aab for Play Store |
| Background | Service Workers are unreliable for precise timing | expo-notifications works from background with full reliability |
| Install friction | "Add to Home Screen" is discoverable only by power users | Play Store install is familiar to all Android users |

---

## 3. Architecture

### 3.1 Overview: Offline-First with Manual Sync

```
┌───────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                   │
│  Expo Router Screens  →  Custom Hooks  →  Zustand Store Slices    │
├───────────────────────────────────────────────────────────────────┤
│                       DOMAIN LAYER                                 │
│  WorkoutEngine | SyncEngine | AiQueue | FatigueCalculator         │
│  PrDetector    | ProgressPredictor | NaturalLanguageParser        │
├───────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                  │
│  ┌──────────────────────────┐    ┌────────────────────────────┐  │
│  │   LOCAL (always primary) │    │  REMOTE (sync-only)        │  │
│  │   expo-sqlite + Drizzle  │    │  Supabase (PostgreSQL)     │  │
│  │   · All reads/writes     │    │  · Only during user-       │  │
│  │   · Reactive useLiveQuery│    │    triggered sync          │  │
│  │   · SQLite WAL mode      │    │  · RLS per user_id         │  │
│  └──────────────────────────┘    └────────────────────────────┘  │
│                        ↕  SyncEngine  ↕                           │
│                 (manual trigger ONLY, never auto)                  │
├───────────────────────────────────────────────────────────────────┤
│                        AI LAYER                                    │
│  AiRequestQueue (local SQLite) → [sync] → Supabase Edge Function  │
│                                              → Gemini 2.0 Flash   │
│                          ← response cached in ai_insights table ← │
└───────────────────────────────────────────────────────────────────┘
```

**Core Principle:** The app is 100% functional without ever touching a network. Every read and every write goes to the local SQLite database first and last. Supabase is a backup/sync target, not a dependency.

---

### 3.2 State Management Architecture

**Zustand store slices (one file per domain):**

```
useWorkoutStore      — active session state (current exercise, sets, timer)
useExerciseStore     — exercise library cache (seeded from SQLite on boot)
useHistoryStore      — paginated history, filters
useAnalyticsStore    — aggregated stats cache
useBodyStore         — body measurement state
useSyncStore         — sync status, pending count, network state, last sync time
useAiStore           — AI insights cache, queue status
useSettingsStore     — unit preference, theme, notification prefs
useAuthStore         — Supabase auth session
```

**Why Zustand over Redux / Context:**
- No boilerplate (no reducers, actions, action creators)
- Subscribe to slices individually → no unnecessary re-renders
- Works perfectly with Drizzle's `useLiveQuery` — store holds derived/computed state, DB holds truth
- No Provider hell

---

### 3.3 Offline-First Data Flow

**Reading Data:**
```
Screen mounts
  → calls useLiveQuery(db.select().from(workoutSessions).orderBy(...))
  → Drizzle watches SQLite table
  → any write to that table triggers automatic re-render
  → NO network call ever happens for reading
```

**Writing Data (e.g., logging a set):**
```
User taps "Complete Set"
  → WorkoutEngine.completeSet(setData)
  → Drizzle INSERT into workout_sets
  → set sync_status = 'PENDING'
  → PrDetector.check(setData) runs synchronously
    → if PR: UPDATE personal_records, trigger confetti
  → FatigueCalculator.recalculate(muscleGroups) runs in background
  → useLiveQuery re-renders SetList automatically
  → useSyncStore.incrementPendingCount()
  → SyncBadge in header updates to show orange dot
```

**The entire flow above is synchronous SQLite operations — response time < 5ms.**

---

### 3.4 Manual Sync — Detailed Mechanism

**Network Detection:**
```typescript
// hooks/useNetworkMonitor.ts
import NetInfo from '@react-native-community/netinfo';

export function useNetworkMonitor() {
  const setIsOnline = useSyncStore(s => s.setIsOnline);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    return unsubscribe;
  }, []);
}
```

**Sync Affordance UI:**
- `isOnline = true` AND `pendingCount > 0` → persistent floating banner appears above tab bar: `"12 changes ready to sync  ↑ Upload"`
- `isOnline = false` → gray status dot in header, no banner (data is safe locally)
- Tapping banner → `SyncScreen` modal

**SyncEngine — Full Flow:**

```
Phase 0: Preflight
  ├─ Verify Supabase session is valid (refresh JWT if needed)
  ├─ Record sync start time
  └─ Set syncStore.status = 'PUSHING'

Phase 1: PUSH (local PENDING → remote)
  ├─ SELECT * FROM all_tables WHERE sync_status IN ('LOCAL', 'PENDING')
  ├─ Batch by entity type (exercises, sessions, sets, measurements, etc.)
  ├─ For each batch:
  │   ├─ Serialize to Supabase DTO (add user_id, convert types)
  │   ├─ supabase.from(table).upsert(batch, { onConflict: 'id' })
  │   ├─ On success: UPDATE local rows SET sync_status = 'SYNCED', server_id = id
  │   └─ On failure: mark batch as PUSH_FAILED, continue with next batch
  └─ Update syncStore.pushedCount

Phase 2: PULL (remote new/updated → local)
  ├─ Fetch last_sync_timestamp from AsyncStorage
  ├─ SELECT * FROM all_tables WHERE user_id = uid AND server_updated_at > last_sync_ts
  ├─ For each remote record:
  │   ├─ No local match (by id): INSERT locally, sync_status = 'SYNCED'
  │   ├─ Local match, local sync_status = 'SYNCED': UPDATE locally (safe overwrite)
  │   └─ Local match, local sync_status = 'PENDING': → CONFLICT (see Phase 3)
  └─ Update syncStore.pulledCount

Phase 3: CONFLICT RESOLUTION
  ├─ Default: Last-Write-Wins (compare updated_at timestamps)
  ├─ For workout_sessions and workout_sets (critical, irreplaceable data):
  │   └─ Push conflict to conflictsQueue array in syncStore
  │      → After Phase 4, show ConflictResolutionModal to user
  │      → User picks: "Keep Mine" | "Keep Server" | "Keep Both" (new session copy)
  └─ Write outcome to sync_logs table

Phase 4: AI QUEUE PROCESSING
  ├─ SELECT * FROM ai_insights WHERE status = 'QUEUED'
  ├─ For each queued request:
  │   ├─ Check prompt_hash cache — if response < 7 days old: use cache, mark COMPLETED
  │   ├─ POST to Supabase Edge Function (process-ai-request) with payload
  │   ├─ Edge Function calls Gemini → returns structured JSON
  │   ├─ Store response in ai_insights.response_payload
  │   └─ Mark ai_insights.status = 'COMPLETED'
  └─ Update syncStore.aiProcessedCount

Phase 5: FINALIZE
  ├─ Save new last_sync_timestamp to AsyncStorage
  ├─ INSERT into sync_logs (pushed, pulled, conflicts, ai_processed, duration)
  └─ Set syncStore.status = 'COMPLETED' with summary object
```

**Conflict Resolution Modal:**
```
┌──────────────────────────────────────────────────────┐
│  ⚠️  Sync Conflict: "Push Day - Tuesday"             │
│                                                       │
│  Your Version          │  Server Version              │
│  Modified: 2h ago      │  Modified: 3h ago            │
│  6 sets logged         │  5 sets logged               │
│  Volume: 8,450 kg      │  Volume: 7,200 kg            │
│                                                       │
│  [Keep Mine]  [Keep Server]  [Keep Both (duplicate)] │
└──────────────────────────────────────────────────────┘
```

---

### 3.5 Change Tracking Schema (applied to every synced entity)

Every entity table carries these four columns:

| Column | Type | Purpose |
|---|---|---|
| `sync_status` | `'LOCAL' \| 'PENDING' \| 'SYNCED' \| 'PUSH_FAILED'` | Track what needs to go up |
| `updated_at` | `INTEGER` (epoch ms) | Local last-modified timestamp |
| `server_id` | `TEXT \| NULL` | Null until first successful push |
| `is_deleted` | `INTEGER` (0/1) | Soft delete — never hard-delete, push tombstone |

**Why soft deletes?** If a user deletes a workout locally and then syncs, hard-deleting from the server would be permanent. With a soft delete + `is_deleted = 1`, the record is pushed to the server with the tombstone, and the server marks it deleted in its own row. During pull, `is_deleted = 1` records are filtered from all display queries via `WHERE is_deleted = 0`.

---

## 4. Database Schema

### Local Database: `IronLogDB` (expo-sqlite via Drizzle ORM)

All schemas defined in `src/db/schema/` as Drizzle table definitions.

---

#### `exercises` — Seeded with 250+ exercises, user can add custom ones

```sql
CREATE TABLE exercises (
  id              TEXT PRIMARY KEY,        -- UUID v4, generated client-side
  name            TEXT NOT NULL,
  primary_muscle  TEXT NOT NULL,           -- CHEST|BACK|SHOULDERS|BICEPS|TRICEPS|
                                           -- QUADS|HAMSTRINGS|GLUTES|CALVES|ABS|
                                           -- FOREARMS|TRAPS|LATS|FULL_BODY
  secondary_muscles TEXT,                  -- JSON array of muscle enums
  category        TEXT NOT NULL,           -- BARBELL|DUMBBELL|MACHINE|CABLE|
                                           -- BODYWEIGHT|BAND|CARDIO|KETTLEBELL
  equipment       TEXT,
  instructions    TEXT,
  video_cue_url   TEXT,                    -- Optional reference video URL (user-added)
  is_custom       INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  sync_status     TEXT NOT NULL DEFAULT 'LOCAL',
  server_id       TEXT,
  is_deleted      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_exercises_muscle ON exercises(primary_muscle);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_sync ON exercises(sync_status) WHERE is_deleted = 0;
```

---

#### `workout_templates` — Saved programs/routines

```sql
CREATE TABLE workout_templates (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  description           TEXT,
  target_muscles        TEXT,              -- JSON array
  estimated_duration_min INTEGER,
  source                TEXT DEFAULT 'USER', -- USER|AI_GENERATED|IMPORTED
  created_at            INTEGER NOT NULL,
  updated_at            INTEGER NOT NULL,
  sync_status           TEXT NOT NULL DEFAULT 'LOCAL',
  server_id             TEXT,
  is_deleted            INTEGER NOT NULL DEFAULT 0
);
```

---

#### `template_exercises` — Exercises within a template (ordered)

```sql
CREATE TABLE template_exercises (
  id                TEXT PRIMARY KEY,
  template_id       TEXT NOT NULL REFERENCES workout_templates(id),
  exercise_id       TEXT NOT NULL REFERENCES exercises(id),
  order_index       INTEGER NOT NULL,
  target_sets       INTEGER,
  target_reps_min   INTEGER,
  target_reps_max   INTEGER,
  target_rpe        REAL,
  rest_seconds      INTEGER DEFAULT 90,
  superset_group    INTEGER,              -- NULL = standalone; same integer = grouped
  notes             TEXT,
  updated_at        INTEGER NOT NULL,
  sync_status       TEXT NOT NULL DEFAULT 'LOCAL',
  is_deleted        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_template_exercises_template ON template_exercises(template_id);
```

---

#### `workout_sessions` — A single training session

```sql
CREATE TABLE workout_sessions (
  id                TEXT PRIMARY KEY,
  template_id       TEXT REFERENCES workout_templates(id),  -- NULL = freestyle
  name              TEXT NOT NULL,
  started_at        INTEGER NOT NULL,
  finished_at       INTEGER,             -- NULL while session in-progress
  duration_seconds  INTEGER,
  total_volume_kg   REAL,                -- Denormalized sum of (weight × reps) for all sets
  total_sets        INTEGER,             -- Denormalized set count
  body_weight_kg    REAL,               -- Optional: user's weight this session
  notes             TEXT,
  rating            INTEGER,             -- 1–5 subjective session rating
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  sync_status       TEXT NOT NULL DEFAULT 'LOCAL',
  server_id         TEXT,
  is_deleted        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_sessions_started ON workout_sessions(started_at DESC) WHERE is_deleted = 0;
CREATE INDEX idx_sessions_template ON workout_sessions(template_id);
CREATE INDEX idx_sessions_sync ON workout_sessions(sync_status);
```

---

#### `workout_sets` — Individual sets within a session (highest volume table)

```sql
CREATE TABLE workout_sets (
  id                TEXT PRIMARY KEY,
  session_id        TEXT NOT NULL REFERENCES workout_sessions(id),
  exercise_id       TEXT NOT NULL REFERENCES exercises(id),
  set_number        INTEGER NOT NULL,
  set_type          TEXT NOT NULL DEFAULT 'WORKING',  -- WARMUP|WORKING|DROPSET|FAILURE|AMRAP
  weight_kg         REAL,              -- NULL for bodyweight-only exercises
  reps              INTEGER,           -- NULL for timed sets
  duration_seconds  INTEGER,           -- NULL for rep-based sets
  distance_meters   REAL,             -- NULL for non-cardio
  rpe               REAL,             -- 1–10, NULL if not tracked
  estimated_1rm     REAL,             -- Computed: Epley formula
  is_pr             INTEGER DEFAULT 0,
  pr_types          TEXT,             -- JSON array: ['MAX_WEIGHT','ESTIMATED_1RM']
  notes             TEXT,
  completed_at      INTEGER NOT NULL,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  sync_status       TEXT NOT NULL DEFAULT 'LOCAL',
  server_id         TEXT,
  is_deleted        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_sets_session ON workout_sets(session_id) WHERE is_deleted = 0;
CREATE INDEX idx_sets_exercise ON workout_sets(exercise_id, completed_at DESC) WHERE is_deleted = 0;
CREATE INDEX idx_sets_sync ON workout_sets(sync_status);
```

---

#### `personal_records` — All-time bests per exercise per metric

```sql
CREATE TABLE personal_records (
  id                TEXT PRIMARY KEY,
  exercise_id       TEXT NOT NULL REFERENCES exercises(id),
  record_type       TEXT NOT NULL,      -- MAX_WEIGHT|MAX_REPS|MAX_VOLUME|ESTIMATED_1RM
  value             REAL NOT NULL,
  achieved_at       INTEGER NOT NULL,
  session_id        TEXT REFERENCES workout_sessions(id),
  set_id            TEXT REFERENCES workout_sets(id),
  previous_value    REAL,              -- Previous record for delta display
  created_at        INTEGER NOT NULL,
  sync_status       TEXT NOT NULL DEFAULT 'LOCAL',
  server_id         TEXT,
  is_deleted        INTEGER NOT NULL DEFAULT 0,
  UNIQUE(exercise_id, record_type)     -- One active PR per type per exercise
);
CREATE INDEX idx_prs_exercise ON personal_records(exercise_id);
```

---

#### `body_measurements` — Weight and body composition tracking

```sql
CREATE TABLE body_measurements (
  id                TEXT PRIMARY KEY,
  date              INTEGER NOT NULL,   -- Date at midnight epoch ms (day granularity)
  weight_kg         REAL,
  body_fat_pct      REAL,
  chest_cm          REAL,
  waist_cm          REAL,
  hips_cm           REAL,
  left_arm_cm       REAL,
  right_arm_cm      REAL,
  left_thigh_cm     REAL,
  right_thigh_cm    REAL,
  neck_cm           REAL,
  photo_uri         TEXT,              -- Local file:// URI (expo-file-system)
  notes             TEXT,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  sync_status       TEXT NOT NULL DEFAULT 'LOCAL',
  server_id         TEXT,
  is_deleted        INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX idx_measurements_date ON body_measurements(date) WHERE is_deleted = 0;
CREATE INDEX idx_measurements_sync ON body_measurements(sync_status);
```

---

#### `ai_insights` — Queue + cache for all AI requests/responses

```sql
CREATE TABLE ai_insights (
  id                TEXT PRIMARY KEY,
  type              TEXT NOT NULL,     -- FORM_ANALYSIS|PROGRAM_GEN|PLATEAU_ADVICE|
                                       -- RECOVERY_INSIGHT|NLP_PARSE
  prompt_hash       TEXT NOT NULL,     -- SHA-256 of canonical prompt (for dedup cache)
  request_payload   TEXT NOT NULL,     -- JSON request sent to Edge Function
  response_payload  TEXT,             -- JSON response from Gemini (NULL until processed)
  status            TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED|PROCESSING|COMPLETED|FAILED
  related_exercise_id TEXT REFERENCES exercises(id),
  related_session_id  TEXT REFERENCES workout_sessions(id),
  related_set_id      TEXT REFERENCES workout_sets(id),
  created_at        INTEGER NOT NULL,
  processed_at      INTEGER,
  error_message     TEXT,
  retry_count       INTEGER DEFAULT 0,
  sync_status       TEXT NOT NULL DEFAULT 'LOCAL',
  server_id         TEXT
);
CREATE INDEX idx_ai_queued ON ai_insights(status) WHERE status = 'QUEUED';
CREATE INDEX idx_ai_hash ON ai_insights(prompt_hash, status);
CREATE INDEX idx_ai_exercise ON ai_insights(related_exercise_id);
```

---

#### `sync_logs` — Audit trail of every sync operation

```sql
CREATE TABLE sync_logs (
  id                TEXT PRIMARY KEY,
  started_at        INTEGER NOT NULL,
  completed_at      INTEGER,
  status            TEXT NOT NULL,     -- IN_PROGRESS|SUCCESS|FAILED|PARTIAL
  records_pushed    INTEGER DEFAULT 0,
  records_pulled    INTEGER DEFAULT 0,
  conflicts_detected INTEGER DEFAULT 0,
  conflicts_resolved INTEGER DEFAULT 0,
  ai_requests_sent  INTEGER DEFAULT 0,
  ai_requests_cached INTEGER DEFAULT 0,
  error_message     TEXT,
  duration_ms       INTEGER
);
```

---

#### `user_preferences` — Lightweight key/value settings (also mirrored in AsyncStorage for fast boot)

```sql
CREATE TABLE user_preferences (
  key               TEXT PRIMARY KEY,
  value             TEXT NOT NULL,
  updated_at        INTEGER NOT NULL
);
-- Default rows seeded on first launch:
-- ('weight_unit', 'KG'), ('theme', 'dark'), ('default_rest_seconds', '90'),
-- ('onboarding_complete', 'false'), ('last_sync_timestamp', '0'),
-- ('weekly_session_goal', '4'), ('plate_unit', 'KG')
```

---

### Cloud Database: Supabase PostgreSQL

Every local table is mirrored in Supabase with two additional columns:

```sql
-- Added to EVERY synced table in Supabase:
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
server_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

-- Trigger to auto-update server_updated_at on every UPDATE:
CREATE OR REPLACE FUNCTION update_server_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.server_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to each table:
CREATE TRIGGER set_server_updated_at
BEFORE UPDATE ON workout_sessions
FOR EACH ROW EXECUTE FUNCTION update_server_timestamp();

-- Row Level Security (applied to EVERY table):
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own data"
  ON workout_sessions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Efficient sync index (on EVERY table):
CREATE INDEX idx_sessions_user_sync
  ON workout_sessions(user_id, server_updated_at);
```

---

## 5. Implementation Blueprint

### Phase 0: Project Foundation (Week 1)

#### Step 1: Initialize Expo Project

```bash
# Create project with Expo Router template
npx create-expo-app@latest IronLog --template expo-template-blank-typescript
cd IronLog

# Install Expo Router
npx expo install expo-router expo-constants expo-linking expo-status-bar

# Install core dependencies
npx expo install expo-sqlite expo-file-system expo-camera expo-haptics \
  expo-notifications expo-speech expo-secure-store \
  @react-native-async-storage/async-storage \
  @react-native-community/netinfo \
  react-native-reanimated react-native-gesture-handler \
  react-native-safe-area-context react-native-screens

# Install Drizzle ORM for SQLite
npm install drizzle-orm
npm install -D drizzle-kit

# Install Supabase SDK
npm install @supabase/supabase-js

# Install UI & animation libraries
npm install zustand moti lottie-react-native victory-native \
  react-native-paper react-native-svg \
  @shopify/react-native-skia

# Install utilities
npm install uuid crypto-js date-fns
npm install -D @types/uuid

# Install Sentry
npx expo install @sentry/react-native

# Configure app.json for Expo Router
# Set "scheme": "ironlog", "web.bundler": "metro"
```

#### Step 2: Configure Project Structure

```
IronLog/
├── app/                          ← Expo Router screens (file-based routing)
│   ├── _layout.tsx               ← Root layout (providers, theme, auth gate)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           ← Tab navigator
│   │   ├── index.tsx             ← Dashboard
│   │   ├── workout.tsx           ← Workout (templates list)
│   │   ├── history.tsx           ← History
│   │   ├── analytics.tsx         ← Analytics & charts
│   │   └── profile.tsx           ← Profile, body tracking, settings
│   ├── workout/
│   │   ├── active.tsx            ← Active workout session (full screen, no tab bar)
│   │   └── [sessionId].tsx       ← Session review (read-only)
│   ├── exercise/
│   │   ├── index.tsx             ← Exercise library
│   │   └── [id].tsx              ← Exercise detail
│   ├── template/
│   │   ├── create.tsx            ← Template builder
│   │   └── [id].tsx              ← Template detail/edit
│   ├── ai/
│   │   ├── form-coach.tsx        ← Form Coach recording screen
│   │   ├── programmer.tsx        ← AI program generator
│   │   └── insights.tsx          ← All AI insights
│   ├── sync.tsx                  ← Sync screen (modal)
│   └── onboarding.tsx            ← First launch onboarding
├── src/
│   ├── db/
│   │   ├── index.ts              ← SQLite connection + Drizzle client init
│   │   ├── schema/               ← Drizzle table definitions (one file per entity)
│   │   │   ├── exercises.ts
│   │   │   ├── workoutSessions.ts
│   │   │   ├── workoutSets.ts
│   │   │   ├── personalRecords.ts
│   │   │   ├── bodyMeasurements.ts
│   │   │   ├── aiInsights.ts
│   │   │   ├── syncLogs.ts
│   │   │   └── userPreferences.ts
│   │   ├── migrations/           ← Drizzle-generated migration files
│   │   └── seed/
│   │       └── exercises.json    ← 250+ exercises seed data
│   ├── store/                    ← Zustand slices
│   │   ├── workoutStore.ts       ← Active session state
│   │   ├── exerciseStore.ts
│   │   ├── syncStore.ts
│   │   ├── aiStore.ts
│   │   ├── authStore.ts
│   │   └── settingsStore.ts
│   ├── engine/
│   │   ├── WorkoutEngine.ts      ← Core workout logic (start, log set, finish)
│   │   ├── PrDetector.ts         ← PR detection on every set completion
│   │   ├── FatigueCalculator.ts  ← Per-muscle fatigue scoring (offline)
│   │   ├── ProgressPredictor.ts  ← Next session weight prediction + plateau detection
│   │   ├── OneRmCalculator.ts    ← Epley, Brzycki, Lombardi formulas
│   │   └── VolumeAggregator.ts   ← Aggregate weekly/monthly volume per muscle
│   ├── sync/
│   │   ├── SyncEngine.ts         ← Orchestrates full sync flow
│   │   ├── PushEngine.ts         ← Phase 1: push local PENDING to Supabase
│   │   ├── PullEngine.ts         ← Phase 2: pull remote changes
│   │   ├── ConflictResolver.ts   ← Last-write-wins + dialog escalation
│   │   ├── AiQueueProcessor.ts   ← Phase 4: process QUEUED AI requests
│   │   └── NetworkMonitor.ts     ← NetInfo wrapper → Zustand sync state
│   ├── ai/
│   │   ├── AiRequestQueue.ts     ← Enqueue AI requests to ai_insights table
│   │   ├── PromptBuilder.ts      ← Construct optimized Gemini prompts
│   │   ├── ResponseParser.ts     ← Parse + validate Gemini JSON responses
│   │   ├── PromptCache.ts        ← SHA-256 hash dedup cache check
│   │   ├── FormCoachAI.ts        ← Form analysis: frame extraction + prompt
│   │   ├── ProgrammerAI.ts       ← Program generation: context builder + parser
│   │   ├── PlateauBreakerAI.ts   ← Plateau context builder + suggestion renderer
│   │   └── RecoveryAI.ts         ← Fatigue snapshot builder + insight renderer
│   ├── supabase/
│   │   ├── client.ts             ← Supabase JS client init
│   │   ├── auth.ts               ← Sign-in/up/out helpers
│   │   └── dto/                  ← Type-safe DTOs for each table
│   ├── hooks/
│   │   ├── useNetworkMonitor.ts
│   │   ├── useActiveWorkout.ts
│   │   ├── usePrDetection.ts
│   │   ├── useExerciseHistory.ts ← Last N sessions for an exercise
│   │   ├── useFatigue.ts
│   │   ├── useProgressChart.ts
│   │   └── useSyncStatus.ts
│   ├── components/
│   │   ├── ui/                   ← Primitives (Button, Card, Sheet, Badge, etc.)
│   │   ├── workout/
│   │   │   ├── SetRow.tsx         ← Inline editable weight × reps × RPE row
│   │   │   ├── RestTimer.tsx      ← Circular animated countdown
│   │   │   ├── ExerciseHeader.tsx ← Current exercise + previous best
│   │   │   ├── NlpInput.tsx       ← Natural language logging input bar
│   │   │   └── SupersetDivider.tsx
│   │   ├── analytics/
│   │   │   ├── StrengthCurve.tsx  ← Victory Native line chart
│   │   │   ├── VolumeBar.tsx      ← Stacked volume bar chart
│   │   │   └── MuscleHeatGrid.tsx ← Weekly muscle frequency grid
│   │   ├── body/
│   │   │   ├── MuscleMap.tsx      ← SVG body map with color-coded fatigue
│   │   │   └── ProgressPhoto.tsx
│   │   ├── sync/
│   │   │   ├── SyncBanner.tsx     ← Floating "ready to sync" banner
│   │   │   └── ConflictModal.tsx  ← Side-by-side conflict resolution
│   │   ├── ai/
│   │   │   ├── FormScoreCard.tsx  ← Form analysis result display
│   │   │   ├── InsightCard.tsx    ← Generic AI insight card
│   │   │   └── ProgramPreview.tsx ← Generated program review
│   │   └── celebrations/
│   │       └── PrConfetti.tsx     ← Lottie confetti on PR
│   ├── constants/
│   │   ├── muscles.ts            ← Muscle group enum + metadata
│   │   ├── exercises.ts          ← Exercise category enum
│   │   └── colors.ts             ← Design tokens
│   ├── theme/
│   │   ├── index.ts              ← Material 3 theme config
│   │   ├── darkTheme.ts
│   │   └── lightTheme.ts
│   └── utils/
│       ├── uuid.ts               ← Deterministic UUID generation
│       ├── units.ts              ← kg/lbs conversion utilities
│       ├── date.ts               ← Date formatting helpers
│       ├── hash.ts               ← SHA-256 for prompt cache keys
│       └── epley.ts              ← 1RM estimation formula
├── supabase/
│   ├── functions/
│   │   ├── process-ai-request/
│   │   │   └── index.ts          ← Deno Edge Function: Gemini proxy
│   │   └── _shared/
│   │       └── gemini.ts         ← Gemini client + prompt templates
│   └── migrations/               ← SQL migration files for Supabase schema
├── assets/
│   ├── animations/               ← Lottie JSON files
│   ├── images/
│   └── fonts/
├── drizzle.config.ts             ← Drizzle Kit configuration
├── app.json                      ← Expo config
├── eas.json                      ← EAS Build + Update config
├── babel.config.js
└── tsconfig.json
```

---

#### Step 3: Design System & Theme

**Dark-first, gym-aesthetic color palette:**

```typescript
// src/constants/colors.ts
export const Colors = {
  // Primary — electric blue (weights, actions)
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryLight: '#93C5FD',

  // Accent — neon green (PRs, success, progress)
  accent: '#22C55E',
  accentDark: '#15803D',
  accentLight: '#86EFAC',

  // Warning — amber (fatigue moderate, pending sync)
  warning: '#F59E0B',

  // Danger — red (fatigue high, failure, delete)
  danger: '#EF4444',

  // Backgrounds (dark-first)
  background: '#0A0A0A',      // Near-black base
  surface: '#141414',         // Cards, sheets
  surfaceVariant: '#1E1E1E',  // Elevated surfaces
  border: '#2A2A2A',          // Subtle borders

  // Text
  textPrimary: '#F9FAFB',     // Near-white
  textSecondary: '#9CA3AF',   // Gray for secondary info
  textMuted: '#4B5563',       // Disabled / placeholder

  // Muscle group fatigue colors
  fatigueFresh: '#22C55E',     // Green
  fatigueMid: '#F59E0B',       // Amber
  fatigueHigh: '#EF4444',      // Red
  fatigueNone: '#374151',      // Not trained (gray)
};
```

**Reusable component specs:**
- `SetRow` — full-width row with three inline `TextInput` fields (weight, reps, RPE), left type badge (WORKING/WARMUP/DROP), right checkmark button. On checkmark press: row animates to "completed" state, green tick, slight scale bounce.
- `RestTimer` — circular arc drawn with `react-native-svg`, countdown value in center (large bold font), +15/-15s tapping zones on sides. Auto-dark-pulse at 10 seconds remaining.
- `MuscleMap` — SVG of front + back human body, each muscle path filled with a fatigue color. Tappable with a `Modal` bottom sheet on tap.
- `SyncBanner` — `Animated.View` sliding up from bottom of content area (above tab bar), orange glow, upload icon, pending count display.

---

### Phase 1: Core Database & Seed Data (Week 1–2)

#### Step 4: Drizzle Schema + Migration

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

const expo = SQLite.openDatabaseSync('ironlog.db', { enableChangeListener: true });
export const db = drizzle(expo, { schema });

// Enable WAL mode for better concurrent read performance
expo.execSync('PRAGMA journal_mode = WAL;');
expo.execSync('PRAGMA foreign_keys = ON;');
```

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
```

**Generate + run initial migration:**
```bash
npx drizzle-kit generate
# This creates src/db/migrations/0001_initial.sql

# Migration runs automatically via useMigrations() hook on app start
```

#### Step 5: Seed Exercise Library

Create `src/db/seed/exercises.json` with 250+ exercises in this structure:

```json
[
  {
    "id": "ex_barbell_bench_press",
    "name": "Barbell Bench Press",
    "primary_muscle": "CHEST",
    "secondary_muscles": ["TRICEPS", "SHOULDERS"],
    "category": "BARBELL",
    "equipment": "Barbell, Flat Bench",
    "instructions": "Lie flat on bench, grip bar slightly wider than shoulder-width, lower to mid-chest, press to lockout.",
    "is_custom": 0
  },
  ...
]
```

Categories to cover:
- **Chest:** Flat/Incline/Decline Barbell & Dumbbell Press, Cable Fly, Dips, Push-ups (+ variations)
- **Back:** Deadlift variations, Rows (barbell/dumbbell/cable/machine), Pull-ups/Pulldowns, Face Pulls
- **Shoulders:** OHP (barbell/dumbbell), Lateral Raises, Front Raises, Rear Delt Fly, Shrugs
- **Arms:** All curl variations, all tricep variations (extensions, pushdowns, dips, skullcrushers)
- **Legs:** Squat variations, Leg Press, RDL/SLDL, Lunges, Leg Curl/Extension, Calf Raises, Hip Thrust
- **Core:** Planks, Crunches, Leg Raises, Ab Wheel, Cable Crunch, Landmine
- **Cardio:** Treadmill, Bike, Rowing Machine, Jump Rope, Stairmaster

---

### Phase 2: Core Workout Engine (Week 2–3)

#### Step 6: WorkoutEngine

```typescript
// src/engine/WorkoutEngine.ts

export class WorkoutEngine {
  
  static async startSession(templateId?: string): Promise<WorkoutSession> {
    const session: NewWorkoutSession = {
      id: generateUUID(),
      templateId: templateId ?? null,
      name: templateId ? await getTemplateName(templateId) : `Workout ${formatDate(new Date())}`,
      startedAt: Date.now(),
      finishedAt: null,
      syncStatus: 'LOCAL',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      isDeleted: 0,
    };
    await db.insert(workoutSessions).values(session);
    return session;
  }

  static async completeSet(setData: NewWorkoutSet): Promise<{ isPr: boolean; prTypes: PrType[] }> {
    // 1. Compute estimated 1RM
    setData.estimated1rm = OneRmCalculator.epley(setData.weightKg, setData.reps);
    
    // 2. Write set to DB
    await db.insert(workoutSets).values({ ...setData, syncStatus: 'PENDING' });
    
    // 3. Update session volume (denormalized)
    await db.update(workoutSessions)
      .set({ 
        totalVolumeKg: sql`total_volume_kg + ${setData.weightKg * setData.reps}`,
        totalSets: sql`total_sets + 1`,
        updatedAt: Date.now(),
        syncStatus: 'PENDING',
      })
      .where(eq(workoutSessions.id, setData.sessionId));
    
    // 4. PR detection (synchronous, uses cached PR data from store)
    const prResult = await PrDetector.check(setData);
    if (prResult.isPr) {
      await PrDetector.updateRecords(prResult);
      // Trigger haptic + confetti via store event
      useWorkoutStore.getState().triggerPrCelebration(prResult);
    }
    
    return prResult;
  }

  static async finishSession(sessionId: string, rating?: number): Promise<void> {
    const now = Date.now();
    const session = await db.query.workoutSessions.findFirst({
      where: eq(workoutSessions.id, sessionId)
    });
    await db.update(workoutSessions)
      .set({ 
        finishedAt: now,
        durationSeconds: Math.round((now - session.startedAt) / 1000),
        rating: rating ?? null,
        updatedAt: now,
        syncStatus: 'PENDING',
      })
      .where(eq(workoutSessions.id, sessionId));
    
    // Queue fatigue recalculation
    FatigueCalculator.scheduleRecalculation();
  }
}
```

#### Step 7: Active Workout Screen — UI Design Detail

```
┌─────────────────────────────────────────────────┐
│  ← Back   Push Day — Tuesday        ⋯  [00:42] │  ← timer
├─────────────────────────────────────────────────┤
│  ████████████████░░░░░░░░  3/6 exercises        │  ← progress bar
├─────────────────────────────────────────────────┤
│                                                   │
│  BARBELL BENCH PRESS                             │  ← exercise name
│  Chest · Triceps · Shoulders                    │  ← muscles
│  Last session: 4 × 100kg (10, 8, 8, 6 reps)    │  ← previous perf
│                                                   │
├─────────────────────────────────────────────────┤
│  #  TYPE    WEIGHT    REPS    RPE   ✓            │
│  ─────────────────────────────────────────────  │
│  1  WARMUP  [  60 ] × [  10 ]  —    ✓ ●done    │  ← completed
│  2  WORK    [ 100 ] × [  8  ]  [8]  ✓ ●done    │
│  3  WORK    [ 100 ] × [  8  ]  [—]  ○ tap       │  ← current
│  4  WORK    [ 100 ] × [  6  ]  [—]  ○           │
│  + Add Set                                       │
├─────────────────────────────────────────────────┤
│  🎙  "bench 100 for 8 rpe 8"          [Send]   │  ← NLP bar
├─────────────────────────────────────────────────┤
│  ← Prev Exercise        Next Exercise →          │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │  ⏱ REST  01:23  [−15]  [+15]  [Skip]  │    │  ← rest timer
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

#### Step 8: PR Detector

```typescript
// src/engine/PrDetector.ts

export type PrType = 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_VOLUME' | 'ESTIMATED_1RM';

export class PrDetector {
  static async check(set: WorkoutSet): Promise<{ isPr: boolean; prTypes: PrType[] }> {
    const prTypes: PrType[] = [];
    const existingPrs = await db.query.personalRecords.findMany({
      where: eq(personalRecords.exerciseId, set.exerciseId)
    });

    const prMap = Object.fromEntries(existingPrs.map(pr => [pr.recordType, pr.value]));
    const setVolume = (set.weightKg ?? 0) * (set.reps ?? 0);

    if (set.weightKg && set.weightKg > (prMap['MAX_WEIGHT'] ?? 0)) prTypes.push('MAX_WEIGHT');
    if (set.reps && set.reps > (prMap['MAX_REPS'] ?? 0)) prTypes.push('MAX_REPS');
    if (setVolume > (prMap['MAX_VOLUME'] ?? 0)) prTypes.push('MAX_VOLUME');
    if (set.estimated1rm && set.estimated1rm > (prMap['ESTIMATED_1RM'] ?? 0)) prTypes.push('ESTIMATED_1RM');

    return { isPr: prTypes.length > 0, prTypes };
  }

  static async updateRecords(result: { set: WorkoutSet; prTypes: PrType[] }): Promise<void> {
    for (const type of result.prTypes) {
      const value = type === 'MAX_WEIGHT' ? result.set.weightKg
        : type === 'MAX_REPS' ? result.set.reps
        : type === 'MAX_VOLUME' ? result.set.weightKg * result.set.reps
        : result.set.estimated1rm;

      await db.insert(personalRecords)
        .values({
          id: generateUUID(),
          exerciseId: result.set.exerciseId,
          recordType: type,
          value,
          achievedAt: result.set.completedAt,
          sessionId: result.set.sessionId,
          setId: result.set.id,
          syncStatus: 'PENDING',
          createdAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: [personalRecords.exerciseId, personalRecords.recordType],
          set: { value, achievedAt: result.set.completedAt, updatedAt: Date.now() },
        });
    }
  }
}
```

---

### Phase 3: History, Analytics & Body Tracking (Week 3–4)

#### Step 9: History Screen

Three viewing modes, all reading from local SQLite:
1. **Calendar View** — `react-native-calendars` month grid, colored dots per day (color = primary muscle trained that day)
2. **List View** — reverse-chronological FlatList of `WorkoutCard` components (session name, date, duration, total volume, PR count)
3. **Session Detail** — read-only view of a completed session (same UI as active workout but non-editable, shows all sets with weights)

All history queries use Drizzle with pagination (`limit` + `offset`) to keep memory usage low for users with years of data.

#### Step 10: Analytics Engine (All Offline)

```typescript
// src/engine/VolumeAggregator.ts
// Query: weekly volume per muscle group for the last N weeks
export async function getWeeklyVolumeByMuscle(weeks: number) {
  const since = Date.now() - (weeks * 7 * 24 * 60 * 60 * 1000);
  return db.select({
    week: sql<number>`strftime('%W-%Y', datetime(${workoutSets.completedAt}/1000, 'unixepoch'))`,
    muscle: exercises.primaryMuscle,
    volume: sql<number>`SUM(${workoutSets.weightKg} * ${workoutSets.reps})`,
    sets: sql<number>`COUNT(*)`,
  })
  .from(workoutSets)
  .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
  .where(and(
    gte(workoutSets.completedAt, since),
    eq(workoutSets.isDeleted, 0),
  ))
  .groupBy(sql`1, 2`)
  .orderBy(sql`1`);
}
```

**Analytics screens include:**
- **Strength Progress** — per-exercise line chart (estimated 1RM over time) with a trend line
- **Volume Dashboard** — weekly volume bar chart, stacked by muscle group
- **Frequency Heatmap** — GitHub-style grid: rows = muscle groups, columns = weeks, color intensity = sets
- **PR Timeline** — chronological list of all PRs with delta ("+5kg above previous")
- **Tools:** 1RM Calculator (manual entry), Plate Calculator (visual bar diagram), Wilks/DOTS score (for powerlifters)

#### Step 11: Fatigue Calculator (Offline)

```typescript
// src/engine/FatigueCalculator.ts

const MUSCLE_RECOVERY_DAYS: Record<MuscleGroup, number> = {
  CHEST: 2, BACK: 2, SHOULDERS: 2, BICEPS: 1.5, TRICEPS: 1.5,
  QUADS: 3, HAMSTRINGS: 3, GLUTES: 3, CALVES: 1, ABS: 1, FULL_BODY: 3,
};

export async function calculateMuscleGroupFatigue(): Promise<FatigueMap> {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  // Get all sets in last 7 days
  const recentSets = await db.select({ ... }).from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(gte(workoutSets.completedAt, sevenDaysAgo));

  const fatigueMap: FatigueMap = {};

  for (const muscle of ALL_MUSCLES) {
    const muscleSets = recentSets.filter(s => 
      s.primaryMuscle === muscle || s.secondaryMuscles?.includes(muscle)
    );
    
    const lastTrained = Math.max(...muscleSets.map(s => s.completedAt), 0);
    const daysSinceLastTrained = (now - lastTrained) / (24 * 60 * 60 * 1000);
    const weeklySetCount = muscleSets.length;
    const avgIntensity = muscleSets.reduce((sum, s) => sum + (s.rpe ?? 7), 0) / (muscleSets.length || 1);
    
    // Fatigue formula: 
    //   raw = (sets × intensity_factor) / recovery_days
    //   intensity_factor: RPE 10 = 1.5, RPE 7 = 1.0, RPE 5 = 0.7
    const intensityFactor = 0.5 + (avgIntensity / 10);
    const rawFatigue = (weeklySetCount * intensityFactor);
    const recoveryFactor = Math.min(daysSinceLastTrained / MUSCLE_RECOVERY_DAYS[muscle], 1);
    const fatigue = Math.round(rawFatigue * (1 - recoveryFactor) * 10); // 0–100 scale

    fatigueMap[muscle] = {
      score: Math.min(fatigue, 100),
      lastTrainedAt: lastTrained || null,
      daysSinceLastTrained: lastTrained ? daysSinceLastTrained : null,
      weeklySetCount,
      status: fatigue < 30 ? 'FRESH' : fatigue < 65 ? 'MODERATE' : 'FATIGUED',
    };
  }

  return fatigueMap;
}
```

---

### Phase 4: Sync Engine (Week 4–5)

#### Step 12: NetworkMonitor

```typescript
// src/sync/NetworkMonitor.ts
import NetInfo from '@react-native-community/netinfo';
import { useSyncStore } from '../store/syncStore';

export function startNetworkMonitor() {
  return NetInfo.addEventListener(state => {
    const isOnline = !!(state.isConnected && state.isInternetReachable);
    useSyncStore.getState().setIsOnline(isOnline);
  });
}
```

#### Step 13: SyncStore (Zustand)

```typescript
// src/store/syncStore.ts
import { create } from 'zustand';

type SyncStatus = 'IDLE' | 'PUSHING' | 'PULLING' | 'PROCESSING_AI' | 'RESOLVING' | 'COMPLETED' | 'FAILED';

interface SyncStore {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  status: SyncStatus;
  progress: number;  // 0–100
  conflicts: ConflictItem[];
  lastSyncSummary: SyncSummary | null;
  
  setIsOnline: (v: boolean) => void;
  setPendingCount: (n: number) => void;
  setStatus: (s: SyncStatus) => void;
  setProgress: (n: number) => void;
  addConflict: (c: ConflictItem) => void;
  resolveConflict: (id: string, resolution: 'mine' | 'server' | 'both') => void;
  setSyncSummary: (s: SyncSummary) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({ ... }));
```

#### Step 14: SyncEngine Implementation

```typescript
// src/sync/SyncEngine.ts

export class SyncEngine {
  static async runFullSync(): Promise<SyncSummary> {
    const syncLog = await SyncEngine.startSyncLog();
    
    try {
      useSyncStore.getState().setStatus('PUSHING');
      const pushed = await PushEngine.run((progress) => {
        useSyncStore.getState().setProgress(progress * 0.4); // 0–40%
      });

      useSyncStore.getState().setStatus('PULLING');
      const { pulled, conflicts } = await PullEngine.run((progress) => {
        useSyncStore.getState().setProgress(40 + progress * 0.3); // 40–70%
      });

      if (conflicts.length > 0) {
        useSyncStore.getState().setStatus('RESOLVING');
        await ConflictResolver.resolveAll(conflicts);
      }

      useSyncStore.getState().setStatus('PROCESSING_AI');
      const aiResult = await AiQueueProcessor.run((progress) => {
        useSyncStore.getState().setProgress(70 + progress * 0.3); // 70–100%
      });

      const summary: SyncSummary = {
        pushed, pulled, conflicts: conflicts.length,
        aiSent: aiResult.sent, aiCached: aiResult.cached,
        completedAt: Date.now(),
      };

      await SyncEngine.completeSyncLog(syncLog.id, 'SUCCESS', summary);
      await AsyncStorage.setItem('last_sync_timestamp', Date.now().toString());
      useSyncStore.getState().setStatus('COMPLETED');
      useSyncStore.getState().setSyncSummary(summary);
      return summary;

    } catch (error) {
      await SyncEngine.completeSyncLog(syncLog.id, 'FAILED', null, error.message);
      useSyncStore.getState().setStatus('FAILED');
      throw error;
    }
  }
}
```

---

### Phase 5: AI Features (Week 5–7)

#### Step 15: Supabase Edge Function — Gemini Proxy

```typescript
// supabase/functions/process-ai-request/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

serve(async (req) => {
  // Validate Supabase JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const { type, payload } = await req.json();

  // Build Gemini request based on type
  const geminiRequest = buildGeminiRequest(type, payload);
  
  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiRequest),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Gemini API error' }), { 
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }

  const geminiData = await response.json();
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
  
  // Parse structured JSON from Gemini response
  const parsed = parseGeminiResponse(type, text);
  
  return new Response(JSON.stringify(parsed), {
    headers: { 'Content-Type': 'application/json' },
  });
});

function buildGeminiRequest(type: string, payload: any) {
  const systemInstruction = `You are an expert strength and conditioning coach and sports scientist. 
Always respond with valid JSON matching the exact schema requested. Never add markdown formatting.`;

  switch (type) {
    case 'FORM_ANALYSIS':
      return {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{
          parts: [
            { text: `Analyze the form for a ${payload.exerciseName}. Return JSON with schema: { overall_score: number 1-10, scores: { depth: number, back_position: number, bar_path: number, knee_tracking: number, tempo: number }, issues: string[], recommendations: string[], positive_feedback: string }` },
            ...payload.frames.map((b64: string) => ({ inline_data: { mime_type: 'image/jpeg', data: b64 } })),
          ]
        }],
        generationConfig: { responseMimeType: 'application/json' },
      };

    case 'PROGRAM_GEN':
      return {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{
          parts: [{ text: `Generate a ${payload.periodizationType} training program. User context: ${JSON.stringify(payload.context)}. Return JSON array of workout_templates with exercises, sets, reps, and RPE targets.` }]
        }],
        generationConfig: { responseMimeType: 'application/json' },
      };

    case 'PLATEAU_ADVICE':
      return {
        contents: [{
          parts: [{ text: `${systemInstruction}\n\nUser has plateaued on ${payload.exerciseName} at ${payload.weight}kg × ${payload.reps} reps for ${payload.sessionsStalled} sessions. Training history: ${JSON.stringify(payload.history)}. Return JSON: { interventions: Array<{ title: string, description: string, duration_weeks: number, priority: 'HIGH'|'MEDIUM' }> }` }]
        }],
        generationConfig: { responseMimeType: 'application/json' },
      };

    case 'RECOVERY_INSIGHT':
      return {
        contents: [{
          parts: [{ text: `${systemInstruction}\n\nAnalyze this athlete's fatigue profile and provide recovery insights: ${JSON.stringify(payload.fatigueMap)}. Wellness: ${JSON.stringify(payload.wellness)}. Return JSON: { insights: Array<{ muscle_group: string, severity: 'OK'|'WARNING'|'CRITICAL', observation: string, recommendation: string }>, recommended_focus: string, rest_recommendation: string }` }]
        }],
        generationConfig: { responseMimeType: 'application/json' },
      };

    case 'NLP_PARSE':
      return {
        contents: [{
          parts: [{ text: `${systemInstruction}\n\nParse this gym workout log entry into structured data. Input: "${payload.text}". Available exercises: ${JSON.stringify(payload.exerciseList)}. Return JSON: { sets: Array<{ exercise_name: string, weight_kg: number|null, reps: number|null, set_type: 'WORKING'|'WARMUP'|'DROPSET'|'FAILURE'|'AMRAP', rpe: number|null, notes: string|null }> }` }]
        }],
        generationConfig: { responseMimeType: 'application/json' },
      };
  }
}
```

#### Step 16: AiRequestQueue

```typescript
// src/ai/AiRequestQueue.ts
import { createHash } from 'crypto';  // crypto-js on RN

export class AiRequestQueue {
  static async enqueue(type: AiInsightType, payload: object, relatedIds?: {
    exerciseId?: string; sessionId?: string; setId?: string;
  }): Promise<string> {
    const payloadStr = JSON.stringify(payload);
    const promptHash = hashSHA256(payloadStr);
    
    // Check cache first
    const cached = await db.query.aiInsights.findFirst({
      where: and(
        eq(aiInsights.promptHash, promptHash),
        eq(aiInsights.status, 'COMPLETED'),
        gte(aiInsights.processedAt, Date.now() - 7 * 24 * 60 * 60 * 1000), // < 7 days old
      )
    });
    if (cached) return cached.id; // Return existing cached insight
    
    const id = generateUUID();
    await db.insert(aiInsights).values({
      id,
      type,
      promptHash,
      requestPayload: payloadStr,
      status: 'QUEUED',
      relatedExerciseId: relatedIds?.exerciseId ?? null,
      relatedSessionId: relatedIds?.sessionId ?? null,
      relatedSetId: relatedIds?.setId ?? null,
      createdAt: Date.now(),
      syncStatus: 'LOCAL',
    });
    
    // Increment sync pending count so banner appears
    const count = await AiRequestQueue.getQueuedCount();
    useSyncStore.getState().setPendingCount(
      useSyncStore.getState().pendingCount + 1
    );
    
    return id;
  }
  
  static async getQueuedCount(): Promise<number> {
    const result = await db.select({ count: count() })
      .from(aiInsights)
      .where(eq(aiInsights.status, 'QUEUED'));
    return result[0]?.count ?? 0;
  }
}
```

---

### Phase 6: UI Polish & Animations (Week 7–8)

#### Step 17: Key Animations

**PR Confetti (Lottie):**
```typescript
// src/components/celebrations/PrConfetti.tsx
import LottieView from 'lottie-react-native';
import { Modal } from 'react-native';

export function PrConfetti({ visible, prTypes, onDismiss }) {
  return (
    <Modal transparent visible={visible} onRequestClose={onDismiss}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
        <LottieView
          source={require('../../../assets/animations/confetti.json')}
          autoPlay loop={false}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.prBadge}>
          <Text style={styles.prText}>🏆 NEW PR!</Text>
          {prTypes.map(t => <Text key={t} style={styles.prType}>{PR_LABELS[t]}</Text>)}
        </View>
      </Pressable>
    </Modal>
  );
}
```

**Set Completion Animation (Reanimated 3):**
```typescript
// In SetRow.tsx
const checkScale = useSharedValue(1);
const rowOpacity = useSharedValue(1);

const onComplete = () => {
  checkScale.value = withSequence(
    withSpring(1.4, { damping: 4 }),
    withSpring(1.0, { damping: 8 })
  );
  rowOpacity.value = withTiming(0.6, { duration: 300 });
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  WorkoutEngine.completeSet(setData);
};
```

**Rest Timer (SVG + Reanimated):**
```typescript
// src/components/workout/RestTimer.tsx
// Circular SVG arc that decreases as timer counts down
// Uses react-native-svg Animated + Reanimated worklet
const circumference = 2 * Math.PI * 45; // radius = 45
const strokeDashoffset = useDerivedValue(() => 
  circumference * (1 - remaining.value / totalSeconds.value)
);
```

#### Step 18: Onboarding Flow

3-screen onboarding with Moti animated illustrations:
1. **"Log smarter"** — NLP bar demo animation
2. **"Train with intelligence"** — Muscle map + AI badge
3. **"Your data, your control"** — Offline lock icon + sync button

Quick setup form on screen 4:
- Weight unit preference (KG / LBS)
- Default rest timer (60s / 90s / 120s / 180s)
- Weekly session goal (3 / 4 / 5 / 6 / custom)

Onboarding is skippable from slide 1. No forced account creation.

---

### Phase 7: Settings, Auth & Final Polish (Week 8–9)

#### Step 19: Settings Screen

```
Settings
├── Preferences
│   ├── Units — KG / LBS (global toggle, converts all displayed weights)
│   ├── Theme — Dark / Light / System
│   └── Default Rest Timer — 60s / 90s / 120s / 180s
├── Notifications
│   ├── Rest Timer Sound — On / Off
│   └── Rest Timer Vibration — On / Off
├── Data Management
│   ├── Export All Data → JSON file (expo-file-system + expo-sharing)
│   ├── Import Data → JSON
│   └── Clear All Local Data → (double confirmation, irreversible)
├── Cloud Sync
│   ├── Sign In / Sign Up (if not signed in)
│   ├── Signed in as: user@email.com (if signed in)
│   ├── Last synced: 2 hours ago
│   └── Sign Out
└── About
    ├── Version
    ├── Open Source Licenses
    └── Privacy Policy
```

#### Step 20: Auth Integration

Auth is **optional** — the entire app works without an account. Auth is needed only for cloud sync.

```typescript
// src/supabase/auth.ts
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  await SecureStore.setItemAsync('supabase_session', JSON.stringify(data.session));
  useAuthStore.getState().setSession(data.session);
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await SecureStore.setItemAsync('supabase_session', JSON.stringify(data.session));
  useAuthStore.getState().setSession(data.session);
}

// Called on app boot — restore session from secure storage
export async function restoreSession() {
  const stored = await SecureStore.getItemAsync('supabase_session');
  if (!stored) return;
  const session = JSON.parse(stored);
  await supabase.auth.setSession(session);
  useAuthStore.getState().setSession(session);
}
```

---

## 6. File Structure (Condensed Reference)

```
IronLog/
├── app/                    ← All screens (Expo Router, file-based)
├── src/
│   ├── db/                 ← Drizzle schema, migrations, seed data
│   ├── store/              ← Zustand slices (one per domain)
│   ├── engine/             ← Core business logic (offline algorithms)
│   ├── sync/               ← Manual sync infrastructure
│   ├── ai/                 ← AI queue, prompts, response parsers
│   ├── supabase/           ← Supabase client + auth helpers
│   ├── hooks/              ← Custom React hooks
│   ├── components/         ← Reusable Compose components
│   ├── constants/          ← Enums, design tokens
│   ├── theme/              ← Material 3 theme
│   └── utils/              ← Pure utility functions
├── supabase/
│   └── functions/          ← Deno Edge Functions (Gemini proxy)
├── assets/
│   └── animations/         ← Lottie JSON files
├── drizzle.config.ts
├── app.json
└── eas.json
```

---

## 7. Supabase Backend Setup

### Step-by-Step Supabase Configuration

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Init Supabase in project root
supabase init

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy Edge Functions
supabase functions deploy process-ai-request

# Set Gemini secret
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

**SQL migrations to run in Supabase SQL editor:**

```sql
-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create all tables (mirrors local schema + user_id + server_updated_at)
-- (Run for each table: exercises, workout_templates, template_exercises,
--  workout_sessions, workout_sets, personal_records, body_measurements, ai_insights)

-- 3. RLS (run for each table):
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_isolation" ON workout_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Indexes for sync efficiency (run for each table):
CREATE INDEX idx_sessions_user_sync ON workout_sessions(user_id, server_updated_at);

-- 5. Auto-update trigger (run for each table):
CREATE TRIGGER update_workout_sessions_timestamp
BEFORE UPDATE ON workout_sessions
FOR EACH ROW EXECUTE FUNCTION update_server_timestamp();
```

**Supabase Storage (for form coach video frames):**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('form-videos', 'form-videos', false);
CREATE POLICY "user_form_videos" ON storage.objects
  FOR ALL USING (bucket_id = 'form-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 8. AI Feature Deep-Dives

### Form Coach — Frame Extraction Detail

```typescript
// src/ai/FormCoachAI.ts
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

export async function analyzeFormVideo(videoUri: string, exerciseName: string): Promise<string> {
  // Extract 7 frames evenly distributed across video duration
  const frames: string[] = [];
  const videoInfo = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 0 });
  
  for (let i = 0; i < 7; i++) {
    const timeMs = (i / 6) * /* videoDurationMs */ 12000;
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { 
      time: timeMs,
      quality: 0.7,  // JPEG quality — balance size vs detail
    });
    
    // Convert to base64 for Gemini multimodal
    const base64 = await FileSystem.readAsStringAsync(uri, { 
      encoding: FileSystem.EncodingType.Base64 
    });
    frames.push(base64);
  }
  
  // Queue AI request — will be processed during next sync
  const insightId = await AiRequestQueue.enqueue('FORM_ANALYSIS', {
    exerciseName,
    frames,
  });
  
  return insightId;
}
```

### NLP Logging — Offline Fallback Parser

When offline, a local regex parser handles common formats before Gemini improves it during sync:

```typescript
// src/ai/NlpLocalParser.ts
// Handles formats like: "bench 100 3x5", "225x5x3", "squats 3 plates for 5"
const PLATE_VALUES: Record<string, number> = {
  'plate': 45, 'plates': 45, '2 plates': 90, '3 plates': 135
};

export function parseLocally(input: string, exercises: Exercise[]): ParseResult | null {
  const normalized = input.toLowerCase().trim();
  
  // Pattern: "exercise weight reps_x_sets" or "exercise weight sets_x_reps"
  const pattern = /^(.+?)\s+(\d+(?:\.\d+)?(?:\s*(?:kg|lbs))?)\s+(\d+)[x×](\d+)(?:\s+rpe\s*(\d+(?:\.\d+)?))?/i;
  const match = normalized.match(pattern);
  
  if (match) {
    const [, exerciseName, weightStr, a, b, rpe] = match;
    const exercise = findClosestExercise(exerciseName, exercises);
    const weight = parseWeight(weightStr);
    
    return {
      exerciseName: exercise?.name ?? exerciseName,
      exerciseId: exercise?.id ?? null,
      sets: parseInt(a),
      reps: parseInt(b),
      weightKg: weight,
      rpe: rpe ? parseFloat(rpe) : null,
      confidence: exercise ? 'HIGH' : 'LOW',
      needsGeminiConfirmation: !exercise,
    };
  }
  return null;
}
```

### Progressive Overload — Local Algorithm

```typescript
// src/engine/ProgressPredictor.ts
export async function getNextSessionTarget(exerciseId: string): Promise<ProgressionTarget> {
  // Fetch last 10 sessions for this exercise
  const history = await db.select({ ... })
    .from(workoutSets)
    .where(and(eq(workoutSets.exerciseId, exerciseId), eq(workoutSets.setType, 'WORKING')))
    .orderBy(desc(workoutSets.completedAt))
    .limit(50); // ~10 sessions worth

  if (history.length < 2) return { suggestedWeight: null, suggestedReps: null, confidence: 'INSUFFICIENT_DATA' };

  // Group by session, take best set per session → build 1RM time series
  const sessionPeaks = groupBySession(history).map(sets => ({
    date: sets[0].completedAt,
    estimated1rm: Math.max(...sets.map(s => s.estimated1rm ?? 0)),
  }));

  // Linear regression on last 8 sessions
  const regression = linearRegression(sessionPeaks.slice(-8));
  const slope = regression.slope; // kg per session

  // Plateau detection: slope ≤ 0 for 3+ consecutive sessions
  const isPlateaued = sessionPeaks.slice(-3).every((p, i, arr) => 
    i === 0 || p.estimated1rm <= arr[i-1].estimated1rm
  );

  if (isPlateaued) {
    // Queue AI advice if not already done for this plateau
    await PlateauBreakerAI.maybeQueueAdvice(exerciseId, sessionPeaks);
  }

  // Suggest next weight: last best + margin based on slope
  const lastBest = history[0];
  const increment = lastBest.weightKg >= 100 ? 2.5 : 1.25; // Smaller increments at heavier weights
  const suggestedWeight = isPlateaued ? lastBest.weightKg : lastBest.weightKg + increment;

  return {
    suggestedWeight,
    suggestedReps: lastBest.reps,
    isPlateaued,
    slope,
    confidence: sessionPeaks.length >= 6 ? 'HIGH' : 'MEDIUM',
  };
}
```

---

## 9. Testing Strategy

### Unit Tests (Jest + React Native Testing Library)

| Module | What to Test |
|---|---|
| `PrDetector` | PR detection across all 4 types, edge cases (tied value, first ever set) |
| `FatigueCalculator` | Score ranges, boundary conditions, muscle group recovery curves |
| `ProgressPredictor` | Slope calculation, plateau detection trigger at correct threshold |
| `OneRmCalculator` | Epley formula correctness, rpe-adjusted variants |
| `NlpLocalParser` | 20+ input format variations, plate-based weights, RPE parsing, failure modes |
| `ConflictResolver` | LWW decision, equal timestamps edge case |
| `AiRequestQueue` | Cache hit (< 7 days), cache miss (> 7 days), duplicate enqueueing |
| Drizzle schema | Insert/query/update/soft-delete for all entities |

### Integration Tests

- Full workout flow: start session → log 3 sets → PR detected → finish session → verify DB state
- Sync push: create 5 PENDING records → run PushEngine → mock Supabase → verify all SYNCED
- Sync pull: mock remote records newer than last sync → verify local inserts
- Conflict resolution: simulate same ID modified locally + remotely → verify conflict detected
- AI queue processing: enqueue 3 AI requests → run AiQueueProcessor → mock Edge Function → verify COMPLETED + response stored

### Manual QA Checklist

- [ ] Enable airplane mode → complete full workout → verify all data persists
- [ ] Kill and relaunch app mid-workout → verify session resumes from local state
- [ ] Complete 500+ workout sessions with 5000+ sets → verify history/analytics screens render smoothly
- [ ] Sync with no pending changes → verify graceful no-op message
- [ ] Trigger conflict → verify modal appears → resolve each way → verify correct outcome
- [ ] Queue 5 AI requests offline → reconnect → sync → verify all processed
- [ ] Toggle KG/LBS → verify ALL displayed weights convert globally

---

## 10. Release & Deployment

### EAS Configuration

```json
// eas.json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Build commands:**
```bash
# Development build (for testing on device)
eas build --profile development --platform android

# Production AAB for Play Store
eas build --profile production --platform android

# Submit to Play Store internal track
eas submit --platform android --profile production

# OTA update (JS-only changes, no store review needed)
eas update --branch production --message "Fix rest timer accuracy"
```

### Play Store Launch Checklist

- [ ] App icon (1024×1024 PNG) — dark bg, dumbbell or barbell silhouette
- [ ] Feature graphic (1024×500 PNG)
- [ ] Screenshots (at least 4, different form factors: phone + 7-inch tablet)
- [ ] Short description (80 chars): "The smartest offline gym tracker with AI coaching"
- [ ] Full description: highlight offline-first + AI Form Coach + free
- [ ] Privacy policy URL (required for apps with account features)
- [ ] Data safety declaration (what data is collected, how it's used)
- [ ] Content rating questionnaire

### Sentry Setup

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,  // 20% of sessions
  enabled: !__DEV__,      // Only in production
});
```

---

## Summary: Development Timeline

| Phase | Focus | Duration |
|---|---|---|
| **Phase 0** | Project setup, design system, dependencies | Week 1 |
| **Phase 1** | Drizzle schema, migrations, seed 250+ exercises | Week 1–2 |
| **Phase 2** | WorkoutEngine, active workout screen, PR detection, rest timer | Week 2–3 |
| **Phase 3** | History, analytics (all 5 chart types), body tracking, fatigue calculator | Week 3–4 |
| **Phase 4** | NetworkMonitor, SyncStore, SyncEngine (push/pull/conflict) | Week 4–5 |
| **Phase 5** | Supabase Edge Function, AI queue, all 5 AI features | Week 5–7 |
| **Phase 6** | Animations, onboarding, NLP input, muscle map polish | Week 7–8 |
| **Phase 7** | Settings, auth, export/import, accessibility pass, performance | Week 8–9 |
| **Phase 8** | Testing, QA, EAS builds, Play Store submission | Week 9–10 |

**Total estimated solo dev timeline: 10–12 weeks to production-ready v1.0**

---

*This document is the single source of truth for the IronLog architecture. All implementation decisions should be validated against the offline-first principle: if the feature doesn't work in airplane mode, it's not done.*