# NextRep — The Ultimate Gym Tracker
## Complete Product & Technical Blueprint v2

---

## Decisions Log

| Question | Decision | Rationale |
|---|---|---|
| **App name** | **NextRep** | Memorable, action-oriented, unique |
| **Monorepo or separate repos?** | **Monorepo** (pnpm workspaces + Turborepo) | Solo dev, shared TypeScript types between mobile + API, single git history, unified CI/CD |
| **Own backend vs Supabase?** | **Own backend** (Fastify + Drizzle ORM) | Full control, no vendor lock-in, free |
| **Database?** | **Neon PostgreSQL** (free tier: 0.5GB, serverless, forever free) | Production-grade serverless Postgres, generous free tier, zero maintenance |
| **Auth needed?** | **Yes — lightweight JWT** | Even for a single user, proper auth protects the API and is a required resume skill. Use email/password with bcrypt + JWT (access + refresh tokens) |
| **Auth provider?** | **Self-rolled JWT** (no Firebase/Auth0) | Zero cost, full understanding, demonstrates security knowledge |
| **Hosting?** | **Render free tier** (API) + **Neon free tier** (DB) | Both forever-free, no credit card required, production-ready |
| **Offline model?** | **Write-buffer only** — SQLite is a temporary queue for workouts logged offline. After sync, local queue is cleared. All reads (history, charts, progress) hit the cloud API | Simpler architecture, single source of truth (cloud), less data duplication |
| **AI features?** | **Deferred to Phase 2+** — core workout tracking, charts, streaks, sharing ship first | Getting fundamentals smooth and gorgeous is priority #1 |
| **Rep/weight prediction?** | **Custom ML model** (not LLM) — XGBoost trained on user data, served via ONNX Runtime in Node.js, later on-device via TFLite | Regression/time-series task; ML models are purpose-built for this unlike LLMs |
| **UI inspiration?** | **Hevy** — clean, minimal, information-dense, dark-first, professional | Best-in-class gym app UI, proven UX patterns |
| **Cost?** | **$0/month** — all free tiers | Neon free, Render free, Expo EAS free, GitHub Actions free |

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Structure](#3-monorepo-structure)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [API Design](#6-api-design)
7. [Offline Buffer & Sync](#7-offline-buffer--sync)
8. [Progress Analytics & Charts](#8-progress-analytics--charts)
9. [Streaks & Milestone Sharing](#9-streaks--milestone-sharing)
10. [Custom ML Model (Phase 2)](#10-custom-ml-model-phase-2)
11. [AI Features (Phase 3)](#11-ai-features-phase-3)
12. [UI/UX Design System](#12-uiux-design-system)
13. [Implementation Blueprint](#13-implementation-blueprint)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment & CI/CD](#15-deployment--cicd)

---

## 1. Product Vision

### What is NextRep?

NextRep is the most technically sophisticated, feature-rich, and beautiful gym tracker ever built by a solo developer. It is designed for one person — you — but architected as if it serves millions. Every architectural decision, from the custom ML pipeline to the offline-sync buffer to the ONNX-powered predictions, is production-grade and technically-strong.

### Core Principles

1. **Cloud-primary, offline-resilient** — All data lives in Neon PostgreSQL. SQLite is a temporary write-buffer for offline workouts. Once synced, the buffer clears.
2. **Beautiful and dense** — Hevy-inspired UI: dark, clean, information-rich without feeling cluttered. Every screen earns its pixel.
3. **Data-driven motivation** — Extensive charts, streaks, milestones, and shareable achievements that make progress *visible* and *addictive*.
4. **ML, not LLM** — For prediction tasks (next set weight/reps), use purpose-built ML models trained on your own data. LLMs for natural language tasks only (deferred to Phase 3).
5. **Zero cost** — Every service on a free tier. No subscriptions, no payments, no vendor lock-in.

---

### Feature Set (Priority Order)

#### Phase 1 — Core (Ship First) ★

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Workout Logging** | Start from template or freestyle. Log sets inline (weight × reps × RPE). Set types: warmup, working, drop, failure, AMRAP. |
| 2 | **Exercise Library** | 250+ seeded exercises with muscle groups, categories, equipment. Add custom exercises. Cached locally for offline use. |
| 3 | **Workout Templates** | Create, edit, duplicate, delete routines. Reorder exercises, set target sets/reps/RPE, configure rest timers, superset grouping. |
| 4 | **Rest Timer** | Circular animated countdown. Auto-starts on set completion. ±15s adjustment. Configurable default per exercise or global. Sound + haptic alert. |
| 5 | **PR Detection & Celebration** | Auto-detect: heaviest weight, most reps, highest volume, best estimated 1RM. Confetti animation + haptic burst on PR. |
| 6 | **Workout History** | Calendar view (colored dots per muscle trained), list view (reverse chrono), session detail (read-only review). |
| 7 | **Progress Charts (12 chart types)** | Strength curves, volume trends, frequency heatmaps, body comp, 1RM estimates, muscle balance radar, session duration trends, tonnage comparison, PR timeline, records board, streak calendar, weekly overview. |
| 8 | **Streaks** | Daily/weekly workout streaks. Longest streak tracking. Streak freeze (rest day doesn't break it if within goal). Visual streak calendar. |
| 9 | **Milestone Sharing** | Hit a PR, 50th workout, 100-day streak → generate a beautiful share card → native share sheet (Instagram story, WhatsApp, etc.). |
| 10 | **Body Tracking** | Log weight, body fat %, measurements. Weight trend chart with moving average. Progress photos (camera + gallery). |
| 11 | **Offline Write Buffer** | Log workouts offline → SQLite queue → "5 workouts not synced ↑" banner → tap to push to cloud → clear local buffer. |
| 12 | **Dashboard** | Quick-start recent templates, today's muscle recovery status, weekly streak, latest PRs, volume this week vs last week. |
| 13 | **Settings** | Units (kg/lbs), theme (dark/light), rest timer defaults, data export (JSON), account management. |

#### Phase 2 — Intelligence ★★

| # | Feature | Description |
|---|---------|-------------|
| 14 | **Custom ML Weight/Rep Predictor** | XGBoost model trained on your workout history. Predicts optimal weight × reps for your next set. Served via ONNX Runtime on the backend. Later: on-device via TFLite. |
| 15 | **Plateau Detection** | Local regression analysis on per-exercise strength curves. Detect stalls over N sessions. Visual warning + suggested interventions. |
| 16 | **Fatigue Intelligence** | Per-muscle-group fatigue scoring (algorithmic, offline). Muscle map visualization. "What should I train today?" recommendation. |
| 17 | **Progressive Overload Engine** | Automatically suggest next session's weight based on personal progression rate. Smallest-increment-aware (2.5kg barbell, 1kg dumbbell). |

#### Phase 3 — AI ★★★

| # | Feature | Description |
|---|---------|-------------|
| 18 | **AI Form Coach** | Record video → Gemini Vision analysis → structured form feedback. |
| 19 | **AI Program Generator** | Gemini generates periodized program from your history + goals. |
| 20 | **AI Natural Language Logging** | Voice/text: "bench 225 3x5 rpe 8" → parsed and logged. |
| 21 | **AI Recovery Insights** | Multi-week fatigue pattern analysis via Gemini. |

---

## 2. Tech Stack

### Complete Stack

| Layer | Technology | Version | Why |
|---|---|---|---|
| **Monorepo** | pnpm workspaces + Turborepo | latest | Zero-config monorepo, parallel builds, shared packages, caching |
| **Language** | TypeScript | 5.x | End-to-end type safety: mobile ↔ shared types ↔ API ↔ DB |
| **Mobile Framework** | React Native + Expo SDK | 52+ | New Architecture (JSI/Fabric), managed workflow, EAS Build |
| **Mobile Routing** | Expo Router | v4 | Type-safe, deep linking, tab/stack/modal |
| **Mobile Local DB** | expo-sqlite (buffer only) | latest | Temporary offline queue, NOT primary data store |
| **Mobile State** | Zustand + TanStack Query | 5.x / v5 | Zustand for UI state, TanStack Query for server-state caching |
| **Mobile UI Kit** | Custom + React Native Paper | 5.x | Material 3 theming, Hevy-inspired design system, dark-first |
| **Mobile Animations** | Reanimated 3 + Moti | latest | True native thread animations at 60/120fps |
| **Mobile Charts** | Victory Native XL | latest | Skia-based, 60fps, Reanimated-integrated |
| **Mobile Camera** | expo-camera + expo-image-picker | latest | Video for form coach, photos for body tracking |
| **Mobile Haptics** | expo-haptics | latest | Set completion, PR celebration |
| **Mobile Share** | expo-sharing + react-native-view-shot | latest | Capture milestone cards → native share sheet |
| **Mobile Notifications** | expo-notifications (local) | latest | Rest timer alerts when backgrounded |
| **Mobile Secure Storage** | expo-secure-store | latest | JWT tokens only |
| **Mobile Network** | @react-native-community/netinfo | latest | Online/offline detection for sync banner |
| **Backend Framework** | Fastify | 5.x | Fastest Node.js framework, schema validation, plugin system |
| **Backend ORM** | Drizzle ORM (PostgreSQL) | latest | Same ORM family as mobile (SQLite), shared schema types via packages/shared |
| **Backend Validation** | Zod | latest | Runtime validation, shared schemas with frontend |
| **Backend Auth** | Custom JWT (jose + bcrypt) | latest | Access + refresh tokens, zero-cost, full control |
| **Backend ML Runtime** | onnxruntime-node | latest | Run XGBoost/LightGBM models exported to ONNX (Phase 2) |
| **Cloud Database** | Neon PostgreSQL (free) | latest | Serverless Postgres, 0.5GB free forever, auto-suspend |
| **File Storage** | Cloudflare R2 (free) | latest | 10GB free, S3-compatible, for progress photos + form videos |
| **API Deployment** | Render (free tier) | latest | Free web service, auto-deploy from GitHub |
| **Mobile Builds** | EAS Build (free) | latest | Cloud-built .apk / .aab |
| **OTA Updates** | EAS Update | latest | Push JS updates without Play Store review |
| **CI/CD** | GitHub Actions | latest | Free for public repos, 2000 min/month for private |
| **Crash Reporting** | Sentry (free) | latest | Error tracking with stack traces |
| **ML Training** | Python + XGBoost + scikit-learn | latest | Train locally or in CI, export to ONNX (Phase 2) |
| **ML On-Device** | TensorFlow Lite + react-native-tflite | latest | Offline predictions on phone (Phase 2+) |

### Free Tier Budget

| Service | Free Tier Limits | Our Usage |
|---|---|---|
| **Neon** | 0.5GB storage, 1 project, auto-suspend 5min | Single user → well under 0.5GB for years |
| **Render** | 1 web service, 750 hrs/month, spins down 15min | Solo user → cold starts acceptable (~30s) |
| **Cloudflare R2** | 10GB storage, 10M reads/mo, 1M writes/mo | Progress photos + form videos → plenty |
| **Expo EAS** | 30 builds/month, updates unlimited | Solo dev → more than enough |
| **Sentry** | 5K errors/month | Way more than needed |
| **GitHub Actions** | 2000 min/month (private) / unlimited (public) | CI/CD for builds and ML training |

---

## 3. Monorepo Structure

```
nextrep/
├── apps/
│   ├── mobile/                           ← Expo React Native app
│   │   ├── app/                          ← Expo Router screens (file-based routing)
│   │   │   ├── _layout.tsx               ← Root layout (providers, theme, auth)
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in.tsx
│   │   │   │   └── sign-up.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx           ← Tab navigator
│   │   │   │   ├── index.tsx             ← Dashboard
│   │   │   │   ├── workout.tsx           ← Templates list
│   │   │   │   ├── history.tsx           ← Workout history (calendar + list)
│   │   │   │   ├── charts.tsx            ← All analytics & progress charts
│   │   │   │   └── profile.tsx           ← Body tracking, settings, account
│   │   │   ├── workout/
│   │   │   │   ├── active.tsx            ← Active workout session (full screen)
│   │   │   │   └── [sessionId].tsx       ← Session review
│   │   │   ├── exercise/
│   │   │   │   ├── index.tsx             ← Exercise library
│   │   │   │   └── [id].tsx              ← Exercise detail + history
│   │   │   ├── template/
│   │   │   │   ├── create.tsx
│   │   │   │   └── [id].tsx
│   │   │   ├── milestones.tsx            ← Milestone feed + share
│   │   │   ├── sync.tsx                  ← Sync modal
│   │   │   └── onboarding.tsx
│   │   ├── src/
│   │   │   ├── api/                      ← TanStack Query hooks (one file per domain)
│   │   │   │   ├── client.ts             ← Fetch instance with JWT interceptor
│   │   │   │   ├── useWorkouts.ts        ← CRUD queries + mutations
│   │   │   │   ├── useExercises.ts
│   │   │   │   ├── useTemplates.ts
│   │   │   │   ├── useAnalytics.ts       ← Chart data fetching
│   │   │   │   ├── useBody.ts
│   │   │   │   ├── useStreaks.ts
│   │   │   │   └── useAuth.ts
│   │   │   ├── db/                       ← SQLite offline buffer (NOT primary storage)
│   │   │   │   ├── index.ts              ← expo-sqlite connection
│   │   │   │   ├── offlineQueue.ts       ← Schema for offline buffer table
│   │   │   │   └── exerciseCache.ts      ← Cached exercise library for offline use
│   │   │   ├── store/                    ← Zustand slices (UI state only)
│   │   │   │   ├── activeWorkoutStore.ts ← Live session state (exercises, sets, timer)
│   │   │   │   ├── syncStore.ts          ← Online/offline, pending count, sync status
│   │   │   │   ├── settingsStore.ts      ← Units, theme, rest timer defaults
│   │   │   │   └── authStore.ts          ← JWT session
│   │   │   ├── sync/
│   │   │   │   ├── SyncEngine.ts         ← Push offline queue → API → clear local
│   │   │   │   └── NetworkMonitor.ts     ← NetInfo wrapper
│   │   │   ├── engine/                   ← Offline-capable business logic
│   │   │   │   ├── PrDetector.ts         ← PR detection (compares against cached PRs)
│   │   │   │   ├── OneRmCalculator.ts    ← Epley, Brzycki formulas
│   │   │   │   └── RestTimer.ts          ← Timer logic
│   │   │   ├── components/
│   │   │   │   ├── ui/                   ← Design system primitives
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   ├── Sheet.tsx         ← Bottom sheet
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Chip.tsx
│   │   │   │   │   └── Skeleton.tsx      ← Loading placeholder
│   │   │   │   ├── workout/
│   │   │   │   │   ├── SetRow.tsx        ← Inline weight × reps × RPE row
│   │   │   │   │   ├── RestTimerOverlay.tsx
│   │   │   │   │   ├── ExerciseCard.tsx
│   │   │   │   │   └── WorkoutSummary.tsx
│   │   │   │   ├── charts/              ← Chart components (12 types)
│   │   │   │   │   ├── StrengthCurve.tsx
│   │   │   │   │   ├── VolumeTrend.tsx
│   │   │   │   │   ├── FrequencyHeatmap.tsx
│   │   │   │   │   ├── MuscleBalance.tsx ← Radar chart
│   │   │   │   │   ├── BodyWeightTrend.tsx
│   │   │   │   │   ├── OneRmProgress.tsx
│   │   │   │   │   ├── SessionDuration.tsx
│   │   │   │   │   ├── TonnageComparison.tsx
│   │   │   │   │   ├── PrTimeline.tsx
│   │   │   │   │   ├── RecordsBoard.tsx
│   │   │   │   │   ├── StreakCalendar.tsx
│   │   │   │   │   └── WeeklyOverview.tsx
│   │   │   │   ├── milestones/
│   │   │   │   │   ├── ShareCard.tsx     ← Beautiful card for sharing
│   │   │   │   │   └── StreakBadge.tsx
│   │   │   │   ├── sync/
│   │   │   │   │   └── SyncBanner.tsx    ← "5 workouts not synced ↑"
│   │   │   │   └── celebrations/
│   │   │   │       └── PrConfetti.tsx    ← Lottie confetti
│   │   │   ├── constants/
│   │   │   │   ├── muscles.ts
│   │   │   │   └── colors.ts
│   │   │   ├── theme/
│   │   │   │   ├── index.ts
│   │   │   │   ├── dark.ts
│   │   │   │   └── light.ts
│   │   │   └── utils/
│   │   │       ├── units.ts              ← kg/lbs conversion
│   │   │       ├── date.ts
│   │   │       └── share.ts             ← View-shot → share sheet helper
│   │   ├── assets/
│   │   │   ├── animations/              ← Lottie JSON (confetti, checkmark, fire)
│   │   │   └── images/
│   │   ├── app.json
│   │   ├── eas.json
│   │   ├── babel.config.js
│   │   └── tsconfig.json
│   │
│   └── api/                              ← Fastify backend
│       ├── src/
│       │   ├── index.ts                  ← Server entry point
│       │   ├── app.ts                    ← Fastify app creation + plugin registration
│       │   ├── db/
│       │   │   ├── index.ts              ← Drizzle + Neon connection
│       │   │   ├── schema/               ← Drizzle table definitions
│       │   │   │   ├── users.ts
│       │   │   │   ├── exercises.ts
│       │   │   │   ├── workoutTemplates.ts
│       │   │   │   ├── templateExercises.ts
│       │   │   │   ├── workoutSessions.ts
│       │   │   │   ├── workoutSets.ts
│       │   │   │   ├── personalRecords.ts
│       │   │   │   ├── bodyMeasurements.ts
│       │   │   │   ├── streaks.ts
│       │   │   │   ├── milestones.ts
│       │   │   │   └── index.ts          ← Re-exports all schemas
│       │   │   ├── migrations/           ← Drizzle Kit generated SQL
│       │   │   └── seed/
│       │   │       └── exercises.ts      ← 250+ exercise seed data
│       │   ├── routes/
│       │   │   ├── auth.ts               ← POST /auth/register, /auth/login, /auth/refresh
│       │   │   ├── exercises.ts          ← GET /exercises, POST /exercises (custom)
│       │   │   ├── templates.ts          ← CRUD /templates
│       │   │   ├── workouts.ts           ← CRUD /workouts, POST /workouts/sync
│       │   │   ├── sets.ts               ← Nested under /workouts/:id/sets
│       │   │   ├── analytics.ts          ← GET /analytics/* (chart data)
│       │   │   ├── body.ts               ← CRUD /body-measurements
│       │   │   ├── records.ts            ← GET /records (PRs)
│       │   │   ├── streaks.ts            ← GET /streaks
│       │   │   ├── milestones.ts         ← GET /milestones
│       │   │   └── predict.ts            ← POST /predict/next-set (Phase 2)
│       │   ├── plugins/
│       │   │   ├── auth.ts               ← JWT verification preHandler hook
│       │   │   ├── cors.ts
│       │   │   └── rateLimit.ts
│       │   ├── services/
│       │   │   ├── authService.ts        ← Register, login, token generation
│       │   │   ├── workoutService.ts     ← Business logic for workouts
│       │   │   ├── analyticsService.ts   ← Complex aggregate queries for charts
│       │   │   ├── prService.ts          ← PR detection and recording
│       │   │   ├── streakService.ts      ← Streak calculation + milestone triggers
│       │   │   ├── milestoneService.ts   ← Milestone detection
│       │   │   └── predictionService.ts  ← ONNX model inference (Phase 2)
│       │   ├── ml/                       ← ML infrastructure (Phase 2)
│       │   │   ├── models/               ← .onnx model files
│       │   │   ├── inference.ts          ← ONNX Runtime wrapper
│       │   │   └── features.ts           ← Feature engineering
│       │   └── utils/
│       │       ├── jwt.ts                ← jose JWT sign/verify
│       │       ├── password.ts           ← bcrypt hash/compare
│       │       └── errors.ts             ← Standardized error responses
│       ├── drizzle.config.ts
│       ├── Dockerfile                    ← For Render deployment
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                           ← Shared types + schemas + utilities
│       ├── src/
│       │   ├── types/
│       │   │   ├── exercise.ts           ← Exercise, MuscleGroup, Category
│       │   │   ├── workout.ts            ← WorkoutSession, WorkoutSet, SetType
│       │   │   ├── template.ts
│       │   │   ├── record.ts             ← PersonalRecord, PrType
│       │   │   ├── body.ts               ← BodyMeasurement
│       │   │   ├── analytics.ts          ← Chart data shapes
│       │   │   ├── streak.ts             ← Streak, Milestone types
│       │   │   ├── auth.ts               ← LoginRequest, TokenResponse
│       │   │   ├── sync.ts               ← SyncPayload, SyncResult
│       │   │   └── api.ts                ← API response wrappers
│       │   ├── schemas/
│       │   │   ├── workout.ts            ← Zod validation schemas
│       │   │   ├── exercise.ts
│       │   │   └── auth.ts
│       │   ├── constants/
│       │   │   ├── muscles.ts
│       │   │   └── exercises.ts
│       │   └── utils/
│       │       ├── oneRm.ts              ← 1RM formulas (shared)
│       │       └── units.ts              ← Unit conversion (shared)
│       ├── package.json
│       └── tsconfig.json
│
├── ml/                                   ← ML training pipeline (Phase 2)
│   ├── train.py                          ← XGBoost/LightGBM training script
│   ├── export_onnx.py                    ← Export model to ONNX format
│   ├── evaluate.py                       ← Model evaluation metrics
│   ├── features.py                       ← Feature engineering
│   ├── requirements.txt
│   └── README.md
│
├── turbo.json                            ← Turborepo pipeline config
├── pnpm-workspace.yaml
├── package.json                          ← Root package.json
├── .github/
│   └── workflows/
│       ├── ci.yml                        ← Lint, type-check, test on PR
│       ├── deploy-api.yml                ← Deploy API to Render on push to main
│       └── train-model.yml              ← Retrain ML model (Phase 2, manual trigger)
├── .gitignore
└── README.md
```

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".expo/**"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": { "cache": false },
    "db:migrate": { "cache": false },
    "db:seed": { "cache": false }
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

## 4. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         📱 MOBILE APP (Expo)                              │
│                                                                           │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────────────┐  │
│  │  Expo Router │   │ Zustand Store│   │  TanStack Query              │  │
│  │  (Screens)   │──▶│ (UI State)   │   │  (Server State + Cache)      │  │
│  └─────────────┘   └──────────────┘   └──────────┬───────────────────┘  │
│                                                    │                      │
│  ┌────────────────────────────────────────────────┐│                      │
│  │  SQLite Write Buffer (expo-sqlite)             ││                      │
│  │  ┌──────────────────────────────┐              ││                      │
│  │  │ offline_workout_queue        │  ◀── Writes while offline           │
│  │  │ exercise_cache               │              ││                      │
│  │  └──────────────────────────────┘              ││                      │
│  │  On sync: push queue → API → clear queue       ││                      │
│  └────────────────────────────────────────────────┘│                      │
│                                                    │                      │
│                                         API calls  │  (HTTPS + JWT)       │
│                                                    ▼                      │
├──────────────────────────────────────────────────────────────────────────┤
│                         🖥️  BACKEND API (Fastify on Render)               │
│                                                                           │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐   │
│  │  Routes   │  │  Services    │  │   Auth     │  │  ML Inference   │   │
│  │  (REST)   │──│  (Business   │──│  (JWT +    │  │  (ONNX Runtime) │   │
│  │          │  │   Logic)     │  │   bcrypt)  │  │  (Phase 2)      │   │
│  └──────────┘  └──────┬───────┘  └────────────┘  └─────────────────┘   │
│                        │                                                  │
│                        ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Drizzle ORM (PostgreSQL driver via @neondatabase/serverless)       │ │
│  └────────────────────────────────┬────────────────────────────────────┘ │
├───────────────────────────────────┼──────────────────────────────────────┤
│                                   ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🐘 Neon PostgreSQL (Free Tier)                                     │ │
│  │  • All workout data, history, PRs, analytics, streaks, milestones  │ │
│  │  • Single source of truth                                          │ │
│  │  • Auto-suspend after 5min inactivity, wakes on first query        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────┐                              │
│  │  ☁️ Cloudflare R2 (Free Tier)           │                              │
│  │  • Progress photos                     │                              │
│  │  • Form coach videos (Phase 3)         │                              │
│  │  • ML model files (Phase 2)            │                              │
│  └────────────────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Online (Normal Mode)

```
User logs a set → TanStack mutation → POST /workouts/:id/sets → Fastify → Drizzle → Neon
                                    ↓
                              On success: invalidate query cache
                                    ↓
                              UI re-renders with fresh data from cache
```

All reads (history, charts, progress, PRs) are TanStack queries that hit the API and cache responses. TanStack Query provides:
- **Automatic caching** — repeat visits to a screen don't re-fetch
- **Stale-while-revalidate** — shows cached data instantly, refreshes in background
- **Optimistic updates** — set completion updates UI before API responds
- **Query invalidation** — completing a set invalidates related analytics queries

### Data Flow: Offline (Buffered Mode)

```
User opens app with no internet
  → NetworkMonitor detects offline
  → Zustand syncStore.isOnline = false
  → TanStack queries serve stale cache or show "offline" state
  → User can still START a workout (core flow)

User logs a set offline:
  → Write to SQLite offline_workout_queue table (NOT via API)
  → Zustand activeWorkoutStore updates UI immediately
  → syncStore.pendingCount++ → banner appears

User reconnects:
  → NetworkMonitor detects online
  → Banner: "5 workouts not synced ↑ Tap to sync"
  → User taps → SyncEngine reads SQLite queue
  → POST /workouts/sync (batch payload)
  → On success: DELETE from SQLite queue
  → Invalidate all TanStack Query caches (fresh data from server)
```

### What Works Offline

| Feature | Offline? | How |
|---|---|---|
| Start & complete a workout | ✅ Yes | Writes to SQLite buffer |
| Log sets (weight, reps, RPE) | ✅ Yes | Writes to SQLite buffer |
| Rest timer | ✅ Yes | Local timer, no API needed |
| Browse exercise library | ✅ Yes | Cached in SQLite on first launch |
| PR detection | ✅ Partial | Compares against locally cached PRs (may miss if stale) |
| View workout history | ⚠️ Stale | Shows TanStack cached data if available |
| View progress charts | ⚠️ Stale | Shows cached charts if previously loaded |
| View streaks | ⚠️ Stale | Shows cached streak if previously loaded |
| Body measurements | ❌ No | Requires API |
| Share milestones | ❌ No | Requires API |

---

## 5. Database Schema

### Cloud Database: Neon PostgreSQL (Primary Source of Truth)

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REFRESH TOKENS (for JWT auth)
-- ============================================================
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked = false;

-- ============================================================
-- EXERCISES (seeded with 250+)
-- ============================================================
CREATE TYPE muscle_group AS ENUM (
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS',
  'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS',
  'FOREARMS', 'TRAPS', 'LATS', 'FULL_BODY'
);

CREATE TYPE exercise_category AS ENUM (
  'BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE',
  'BODYWEIGHT', 'BAND', 'KETTLEBELL', 'CARDIO', 'OTHER'
);

CREATE TABLE exercises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  primary_muscle    muscle_group NOT NULL,
  secondary_muscles muscle_group[] DEFAULT '{}',
  category          exercise_category NOT NULL,
  equipment         TEXT,
  instructions      TEXT,
  is_custom         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_archived       BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_exercises_user ON exercises(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_exercises_muscle ON exercises(primary_muscle);

-- ============================================================
-- WORKOUT TEMPLATES
-- ============================================================
CREATE TABLE workout_templates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  description           TEXT,
  target_muscles        muscle_group[] DEFAULT '{}',
  estimated_duration_min INTEGER,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_archived           BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_templates_user ON workout_templates(user_id) WHERE is_archived = false;

-- ============================================================
-- TEMPLATE EXERCISES
-- ============================================================
CREATE TABLE template_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  order_index     INTEGER NOT NULL,
  target_sets     INTEGER DEFAULT 3,
  target_reps_min INTEGER DEFAULT 8,
  target_reps_max INTEGER DEFAULT 12,
  target_rpe      REAL,
  rest_seconds    INTEGER DEFAULT 90,
  superset_group  INTEGER,
  notes           TEXT
);

CREATE INDEX idx_template_ex ON template_exercises(template_id);

-- ============================================================
-- WORKOUT SESSIONS
-- ============================================================
CREATE TABLE workout_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id       UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL,
  finished_at       TIMESTAMPTZ,
  duration_seconds  INTEGER,
  total_volume_kg   REAL DEFAULT 0,
  total_sets        INTEGER DEFAULT 0,
  notes             TEXT,
  rating            SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted        BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_sessions_user ON workout_sessions(user_id, started_at DESC)
  WHERE is_deleted = false;
CREATE INDEX idx_sessions_date ON workout_sessions(user_id, (started_at::date))
  WHERE is_deleted = false;

-- ============================================================
-- WORKOUT SETS
-- ============================================================
CREATE TYPE set_type AS ENUM ('WARMUP', 'WORKING', 'DROPSET', 'FAILURE', 'AMRAP');

CREATE TABLE workout_sets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id       UUID NOT NULL REFERENCES exercises(id),
  set_number        SMALLINT NOT NULL,
  type              set_type NOT NULL DEFAULT 'WORKING',
  weight_kg         REAL,
  reps              SMALLINT,
  duration_seconds  INTEGER,
  distance_meters   REAL,
  rpe               REAL CHECK (rpe BETWEEN 1 AND 10),
  estimated_1rm     REAL,
  is_pr             BOOLEAN DEFAULT false,
  pr_types          TEXT[],
  notes             TEXT,
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sets_session ON workout_sets(session_id);
CREATE INDEX idx_sets_exercise ON workout_sets(exercise_id, completed_at DESC);
CREATE INDEX idx_sets_exercise_time ON workout_sets(exercise_id, completed_at)
  INCLUDE (weight_kg, reps, estimated_1rm);

-- ============================================================
-- PERSONAL RECORDS
-- ============================================================
CREATE TYPE pr_type AS ENUM ('MAX_WEIGHT', 'MAX_REPS', 'MAX_VOLUME', 'ESTIMATED_1RM');

CREATE TABLE personal_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  record_type     pr_type NOT NULL,
  value           REAL NOT NULL,
  achieved_at     TIMESTAMPTZ NOT NULL,
  session_id      UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  set_id          UUID REFERENCES workout_sets(id) ON DELETE SET NULL,
  previous_value  REAL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id, record_type)
);

CREATE INDEX idx_prs_user ON personal_records(user_id);
CREATE INDEX idx_prs_exercise ON personal_records(user_id, exercise_id);

-- ============================================================
-- BODY MEASUREMENTS
-- ============================================================
CREATE TABLE body_measurements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  weight_kg       REAL,
  body_fat_pct    REAL,
  chest_cm        REAL,
  waist_cm        REAL,
  hips_cm         REAL,
  left_arm_cm     REAL,
  right_arm_cm    REAL,
  left_thigh_cm   REAL,
  right_thigh_cm  REAL,
  neck_cm         REAL,
  notes           TEXT,
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_body_user ON body_measurements(user_id, date DESC);

-- ============================================================
-- STREAKS
-- ============================================================
CREATE TABLE user_streaks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_workout_date DATE,
  streak_start_date DATE,
  weekly_goal      SMALLINT NOT NULL DEFAULT 4,
  freeze_days_left SMALLINT NOT NULL DEFAULT 1,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE streak_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  has_workout     BOOLEAN NOT NULL DEFAULT false,
  was_frozen      BOOLEAN NOT NULL DEFAULT false,
  streak_day      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_streak_hist ON streak_history(user_id, date DESC);

-- ============================================================
-- MILESTONES
-- ============================================================
CREATE TYPE milestone_type AS ENUM (
  'WORKOUT_COUNT',
  'STREAK',
  'PR',
  'TOTAL_VOLUME',
  'BODY_WEIGHT',
  'EXERCISE_MASTERY',
  'CONSISTENCY'
);

CREATE TABLE milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            milestone_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  value           REAL,
  achieved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_shared       BOOLEAN NOT NULL DEFAULT false,
  related_exercise_id UUID REFERENCES exercises(id),
  related_session_id  UUID REFERENCES workout_sessions(id),
  metadata        JSONB
);

CREATE INDEX idx_milestones_user ON milestones(user_id, achieved_at DESC);

-- ============================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_templates BEFORE UPDATE ON workout_templates FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_sessions BEFORE UPDATE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_body BEFORE UPDATE ON body_measurements FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_streaks BEFORE UPDATE ON user_streaks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### Local SQLite Schema (Offline Buffer Only — Two Tables)

```sql
-- Temporary buffer for workouts logged while offline
CREATE TABLE offline_queue (
  id              TEXT PRIMARY KEY,
  payload_type    TEXT NOT NULL,       -- 'WORKOUT_SESSION' | 'BODY_MEASUREMENT'
  payload         TEXT NOT NULL,       -- Full JSON of session + all sets
  created_at      INTEGER NOT NULL,
  retry_count     INTEGER DEFAULT 0
);

-- Cached exercise library for offline browsing
CREATE TABLE exercise_cache (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  primary_muscle    TEXT NOT NULL,
  secondary_muscles TEXT,              -- JSON array
  category          TEXT NOT NULL,
  equipment         TEXT,
  instructions      TEXT,
  is_custom         INTEGER DEFAULT 0,
  cached_at         INTEGER NOT NULL
);
```

---

## 6. API Design

### Authentication

```
POST   /auth/register   ← { email, password, displayName }
POST   /auth/login       ← { email, password } → { accessToken, refreshToken }
POST   /auth/refresh     ← { refreshToken } → { accessToken, refreshToken }
DELETE /auth/logout      ← Invalidate refresh token
```

**JWT Strategy:**
- **Access token**: 15-minute expiry, HS256, contains `{ sub: userId, email }`.
- **Refresh token**: 30-day expiry, stored hashed in `refresh_tokens` table. Rotation: each refresh issues new pair + invalidates old.
- **Client storage**: Access token in Zustand (memory), refresh token in `expo-secure-store`.
- **API interceptor**: Fetch wrapper attaches `Authorization: Bearer <token>`. On `401`, silently refreshes and retries once.

```typescript
// apps/api/src/utils/jwt.ts
import * as jose from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signAccessToken(userId: string, email: string) {
  return new jose.SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(SECRET);
}

export async function signRefreshToken(userId: string) {
  return new jose.SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  const { payload } = await jose.jwtVerify(token, SECRET);
  return payload;
}
```

### REST Endpoints

All endpoints except `/auth/*` require `Authorization: Bearer <accessToken>`.

```
── Exercises ──
GET    /exercises                         ← All (global + user custom), filterable
GET    /exercises/:id                     ← Detail + recent set history
POST   /exercises                         ← Create custom exercise

── Templates ──
GET    /templates                         ← User's templates
GET    /templates/:id                     ← Template with exercises
POST   /templates                         ← Create
PUT    /templates/:id                     ← Update
DELETE /templates/:id                     ← Archive

── Workouts ──
GET    /workouts                          ← Paginated (query: page, limit, from, to, muscle)
GET    /workouts/calendar                 ← { "2026-03-01": ["CHEST","TRICEPS"] }
GET    /workouts/:id                      ← Session with all sets
POST   /workouts                          ← Create finished session
POST   /workouts/sync                     ← Batch push offline sessions
DELETE /workouts/:id                      ← Soft delete

── Sets ──
POST   /workouts/:id/sets                 ← Add set
PUT    /workouts/:id/sets/:setId          ← Edit set
DELETE /workouts/:id/sets/:setId          ← Remove set

── Analytics ──
GET    /analytics/strength/:exerciseId    ← 1RM time-series
GET    /analytics/volume                  ← Weekly volume by muscle
GET    /analytics/frequency               ← Muscle frequency heatmap
GET    /analytics/tonnage                 ← Weekly tonnage trend
GET    /analytics/duration                ← Session duration trend
GET    /analytics/muscle-balance          ← Radar chart data
GET    /analytics/overview                ← Dashboard summary
GET    /analytics/records-board           ← All PRs by exercise

── Records ──
GET    /records                           ← All PRs sorted by recent
GET    /records/:exerciseId               ← PRs for exercise

── Body ──
GET    /body-measurements                 ← All (query: from, to)
POST   /body-measurements                 ← Log
PUT    /body-measurements/:id             ← Update
GET    /body-measurements/trend           ← Weight with 7-day moving avg

── Streaks ──
GET    /streaks                           ← Current, longest, history
GET    /streaks/calendar                  ← Calendar grid data

── Milestones ──
GET    /milestones                        ← All achievements
POST   /milestones/:id/share             ← Mark as shared

── ML (Phase 2) ──
POST   /predict/next-set                  ← { exerciseId, previousSets } → { weight, reps }
```

---

## 7. Offline Buffer & Sync

### SyncEngine

```typescript
// apps/mobile/src/sync/SyncEngine.ts

export class SyncEngine {
  static async pushOfflineQueue(): Promise<{ pushed: number; failed: number }> {
    const store = useSyncStore.getState();
    store.setStatus('SYNCING');

    try {
      const pendingItems = await db.select().from(offlineQueue).all();
      if (pendingItems.length === 0) {
        store.setStatus('IDLE');
        return { pushed: 0, failed: 0 };
      }

      const workouts = pendingItems
        .filter(i => i.payloadType === 'WORKOUT_SESSION')
        .map(i => JSON.parse(i.payload));

      let pushed = 0;

      if (workouts.length > 0) {
        await apiClient.post('/workouts/sync', { sessions: workouts });
        pushed += workouts.length;
      }

      // Clear synced items from local buffer
      await db.delete(offlineQueue)
        .where(inArray(offlineQueue.id, pendingItems.map(i => i.id)));

      // Invalidate all TanStack caches → fresh data from server
      queryClient.invalidateQueries();

      store.setStatus('IDLE');
      store.setPendingCount(0);
      return { pushed, failed: 0 };

    } catch (error) {
      store.setStatus('ERROR');
      throw error;
    }
  }
}
```

### Active Workout — Online vs Offline

```typescript
// apps/mobile/src/engine/WorkoutEngine.ts

export class WorkoutEngine {
  static async finishSession(session: FinishedSession): Promise<void> {
    const isOnline = useSyncStore.getState().isOnline;

    if (isOnline) {
      try {
        await apiClient.post('/workouts', session);
        queryClient.invalidateQueries({ queryKey: ['workouts'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['records'] });
        queryClient.invalidateQueries({ queryKey: ['streaks'] });
        queryClient.invalidateQueries({ queryKey: ['milestones'] });
      } catch {
        // API failed → fall through to offline buffer
        await WorkoutEngine.bufferOffline(session);
      }
    } else {
      await WorkoutEngine.bufferOffline(session);
    }
  }

  private static async bufferOffline(session: FinishedSession) {
    await db.insert(offlineQueue).values({
      id: generateUUID(),
      payloadType: 'WORKOUT_SESSION',
      payload: JSON.stringify(session),
      createdAt: Date.now(),
      retryCount: 0,
    });
    useSyncStore.getState().incrementPendingCount();
  }
}
```

---

## 8. Progress Analytics & Charts

NextRep ships with **12 distinct chart/visualization types** — more than any competing app.

### Chart 1: Strength Curve (Line Chart)
- **Endpoint:** `GET /analytics/strength/:exerciseId?weeks=12`
- **Visual:** Line chart via Victory Native. X = date, Y = estimated 1RM
- **Extras:** Trend line overlay, PR markers (star icons), tap for detail popover

### Chart 2: Volume Trend (Stacked Bar Chart)
- **Endpoint:** `GET /analytics/volume?weeks=8`
- **Visual:** Stacked bar chart. Each bar = 1 week, colors = muscle groups
- **Extras:** Toggle between total volume (kg) and set count

### Chart 3: Muscle Frequency Heatmap (Grid)
- **Endpoint:** `GET /analytics/frequency?weeks=8`
- **Visual:** GitHub-contribution-style grid. Rows = muscle groups, columns = weeks
- **Extras:** Color intensity = set count. Tap cell for detail

### Chart 4: Muscle Balance Radar (Spider Chart)
- **Endpoint:** `GET /analytics/muscle-balance?period=month`
- **Visual:** Radar chart with axis per major muscle. Filled area = relative volume
- **Extras:** Overlay previous month as transparent comparison

### Chart 5: Body Weight Trend (Line Chart)
- **Endpoint:** `GET /body-measurements/trend?weeks=12`
- **Visual:** Line with raw points + 7-day moving average smooth line
- **Extras:** Goal line, color zones relative to goal

### Chart 6: 1RM Progression (Multi-Line)
- **Endpoint:** `GET /analytics/strength/:exerciseId?weeks=52&formula=all`
- **Visual:** Multi-line showing Epley, Brzycki, Lombardi estimates
- **Extras:** Shaded confidence band, table view toggle

### Chart 7: Session Duration Trend (Bar Chart)
- **Endpoint:** `GET /analytics/duration?weeks=12`
- **Visual:** Bar chart, color = below/at/above average
- **Extras:** Average line overlay

### Chart 8: Weekly Tonnage Comparison (Paired Bars)
- **Endpoint:** `GET /analytics/tonnage?weeks=8`
- **Visual:** Side-by-side bars: this week (solid) vs last month same week (outline)
- **Extras:** Percentage change label (+12%, -5%)

### Chart 9: PR Timeline (Vertical Timeline)
- **Endpoint:** `GET /records?limit=50`
- **Visual:** Scrollable vertical timeline with PR nodes
- **Extras:** Delta badge ("+5kg"), filter by exercise, shareable per card

### Chart 10: Records Board (Table)
- **Endpoint:** `GET /analytics/records-board`
- **Visual:** Grouped table per exercise with MAX_WEIGHT, MAX_REPS, MAX_VOLUME, 1RM
- **Extras:** Sortable, highlight recent PRs, filter by muscle

### Chart 11: Streak Calendar (Calendar Heatmap)
- **Endpoint:** `GET /streaks/calendar?months=3`
- **Visual:** Monthly calendar grid — green (workout), blue (freeze), gray (off), red (break)
- **Extras:** Current streak counter, longest streak badge

### Chart 12: Weekly Overview (Dashboard Cards)
- **Endpoint:** `GET /analytics/overview`
- **Visual:** 2×3 stat card grid: sessions this week, total volume (vs last week %), muscles trained today, current streak, PRs this month, most trained muscle

---

## 9. Streaks & Milestone Sharing

### Streak Rules

```
  - A "streak day" = any calendar day with ≥ 1 completed workout
  - Streak increments for each consecutive active day
  - FREEZE: 1 free rest day per week (auto-applied on first miss)
  - Additional misses break the streak

  Streak Tiers:
    🔥  7 days  — "On Fire"
    ⚡ 14 days  — "Unstoppable"
    💪 30 days  — "Iron Will"
    🏆 60 days  — "Beast Mode"
    👑 100 days — "Gym Royalty"
    💎 365 days — "Diamond"
```

### Milestone Triggers

| Trigger | Examples |
|---|---|
| Workout count thresholds | "10th Workout!", "50th Workout! 🎉", "100th Workout! 💯" |
| Streak thresholds | "7-Day Streak 🔥", "30-Day Iron Will 💪" |
| New PR | "New Bench Press PR! 100kg 🏆" |
| Lifetime volume | "100,000 kg lifetime volume! 💪", "1,000,000 kg! 🤯" |
| Exercise mastery (100+ sets) | "Bench Press Master — 100 sets completed" |
| Consistency (4x/week, 4 weeks) | "4 Weeks of Consistency 🎯" |

### Share Card Design

```
┌──────────────────────────────────────────┐
│                                          │
│           🏆  NEW PERSONAL RECORD        │
│                                          │
│        BARBELL BENCH PRESS               │
│                                          │
│             100 KG                       │
│           ──────────                     │
│           + 5 kg from previous           │
│                                          │
│        ───── NEXTREP ─────              │
│        March 7, 2026                     │
│                                          │
└──────────────────────────────────────────┘
```

- Dark gradient background matching app theme
- Bold typography for achievement value
- Optimized for Instagram Story (1080×1920) and square (1080×1080)
- Generated via `react-native-view-shot` → `expo-sharing`

---

## 10. Custom ML Model (Phase 2)

### Why ML, Not LLM?

Predicting optimal weight and reps is a **regression task**. An LLM would be slower, cost money per inference, hallucinate numbers, and require internet. A purpose-built ML model:
- Responds in milliseconds (not seconds)
- Costs zero per inference (runs in Node.js on Render)
- Is specifically optimized for numeric prediction (no hallucination)
- Can run on-device (TFLite) for offline prediction in Phase 3

### Model Architecture

**Model:** XGBoost Regressor (gradient boosted decision trees)
**Task:** Given historical performance + current context → predict weight and reps

**Input Features (16):**

| Feature | Type | Description |
|---|---|---|
| exercise_category_encoded | Int | BARBELL=0, DUMBBELL=1, MACHINE=2, etc. |
| primary_muscle_encoded | Int | CHEST=0, BACK=1, etc. |
| best_1rm | Float | All-time estimated 1RM for this exercise |
| recent_1rm | Float | 1RM from last 3 sessions (detects detraining) |
| last_weight | Float | Weight used in most recent session |
| last_reps | Float | Reps achieved in most recent session |
| last_rpe | Float | RPE in most recent session |
| sessions_count | Int | Total sessions with this exercise |
| avg_weight_last_5 | Float | Average weight over last 5 sessions |
| avg_reps_last_5 | Float | Average reps over last 5 sessions |
| weight_trend_slope | Float | Linear regression slope of weight over last 8 sessions |
| days_since_last | Int | Days since last session with this exercise |
| session_fatigue | Float | Sets completed so far / total exercises in session |
| set_number | Int | Which set of this exercise (1st, 2nd, 3rd...) |
| is_first_exercise | Bool | Position in workout (fatigue proxy) |
| body_weight_kg | Float | Most recent body weight |

**Output:** `{ weight_kg: 102.5, reps: 5, confidence: 0.82 }`

### Pipeline

```
1. DATA EXPORT     →  GET /ml/export (SQL → CSV)
2. TRAIN           →  Python + XGBoost (locally or GitHub Actions)
3. EXPORT ONNX     →  .onnx file → uploaded to Cloudflare R2
4. LOAD            →  onnxruntime-node on Fastify server boot
5. SERVE           →  POST /predict/next-set
6. DISPLAY         →  "Suggested: 102.5kg × 5" chip in SetRow
```

### Training Script

```python
# ml/train.py
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit
import onnxmltools
from onnxconverter_common import FloatTensorType

df = pd.read_csv('training_data.csv')

features = ['exercise_category_encoded', 'primary_muscle_encoded',
            'best_1rm', 'recent_1rm', 'last_weight', 'last_reps', ...]

X = df[features]
y = df['actual_weight']

model = xgb.XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.05)

tscv = TimeSeriesSplit(n_splits=5)
for train_idx, val_idx in tscv.split(X):
    model.fit(X.iloc[train_idx], y.iloc[train_idx],
              eval_set=[(X.iloc[val_idx], y.iloc[val_idx])])

# Export to ONNX
initial_type = [('input', FloatTensorType([None, len(features)]))]
onnx_model = onnxmltools.convert_xgboost(model, initial_types=initial_type)
onnxmltools.utils.save_model(onnx_model, 'models/weight_predictor.onnx')
```

### Server Inference

```typescript
// apps/api/src/ml/inference.ts
import * as ort from 'onnxruntime-node';

let session: ort.InferenceSession | null = null;

export async function loadModel() {
  session = await ort.InferenceSession.create('./ml/models/weight_predictor.onnx');
}

export async function predictNextSet(features: number[]) {
  const tensor = new ort.Tensor('float32', Float32Array.from(features), [1, features.length]);
  const results = await session!.run({ input: tensor });
  const predicted = results.output.data[0] as number;
  return { weight: Math.round(predicted / 1.25) * 1.25, confidence: 0.8 };
}
```

---

## 11. AI Features (Phase 3)

Deferred — architecture is designed to support:

1. **AI Form Coach** — `expo-camera` → extract frames → POST to backend → backend calls Gemini 2.0 Flash multimodal → structured form feedback
2. **AI Program Generator** — Training history context → Gemini → periodized program as JSON → templates
3. **AI Natural Language Logging** — Voice/text → local regex parser (offline) → Gemini refinement (online)
4. **AI Recovery Insights** — Fatigue data + wellness → Gemini → human-readable advice

All Gemini calls proxied through backend (API key never on client).

---

## 12. UI/UX Design System

### Hevy-Inspired Design Language

- **Dark-first** (pure black backgrounds, OLED-friendly)
- **Information density** — lots of data visible without scrolling
- **Inline editing** — set logging happens in-line, no modals
- **Bold typography** for numbers (weight, reps, PRs)
- **Minimal color** — monochrome + single accent (electric blue)
- **Bottom sheet modals** instead of full-page navigation
- **Subtle Reanimated animations** — smooth and functional, not flashy

### Color System

```typescript
export const Colors = {
  background:       '#000000',    // Pure black (OLED)
  surface:          '#0F0F0F',    // Cards
  surfaceElevated:  '#1A1A1A',    // Active states
  surfaceHighest:   '#242424',    // Inputs

  primary:          '#4A90FF',    // Electric blue
  primaryMuted:     '#2A5DB5',
  primarySurface:   '#0D1B3A',

  success:          '#34D399',    // Green (PRs, positive trends)
  successSurface:   '#0A2E1E',
  warning:          '#FBBF24',    // Amber (pending sync)
  warningSurface:   '#2E2508',
  danger:           '#F87171',    // Red (streak broken)

  textPrimary:      '#FFFFFF',
  textSecondary:    '#A1A1AA',
  textMuted:        '#52525B',

  border:           '#27272A',

  chart: [
    '#4A90FF', '#34D399', '#FBBF24', '#F87171',
    '#A78BFA', '#FB923C', '#22D3EE', '#F472B6',
    '#84CC16', '#E879F9', '#06B6D4', '#EF4444',
  ],
};
```

### Key Screen Layouts

#### Tab Bar
```
 ┌──────┬──────────┬─────────┬────────┬─────────┐
 │ 🏠   │ 🏋️       │ 📅      │ 📊     │ 👤      │
 │ Home │ Workout  │ History │ Charts │ Profile │
 └──────┴──────────┴─────────┴────────┴─────────┘
```

#### Active Workout (Hevy Layout)
```
┌─────────────────────────────────────────────┐
│  ✕  Push Day              🕐 00:42:15       │
├─────────────────────────────────────────────┤
│  BARBELL BENCH PRESS                 📊 ▾   │
│  Chest · Triceps · Shoulders                │
│  Previous: 95kg × 8, 8, 7, 6               │
│                                              │
│  ┌──────┬──────────┬───────┬──────┬───────┐ │
│  │ SET  │ PREVIOUS │  KG   │ REPS │  ✓    │ │
│  ├──────┼──────────┼───────┼──────┼───────┤ │
│  │ W    │ 60 × 10  │ [ 60] │ [10] │  ✅    │ │
│  │ 1    │ 95 × 8   │ [100] │ [ 8] │  ✅ 🏆 │ │
│  │ 2    │ 95 × 8   │ [100] │ [ 7] │  ✅    │ │
│  │ 3    │ 95 × 7   │ [100] │ [  ] │  ○    │ │
│  │ 4    │ 95 × 6   │ [   ] │ [  ] │  ○    │ │
│  └──────┴──────────┴───────┴──────┴───────┘ │
│  + Add Set                                   │
├─────────────────────────────────────────────┤
│  ⏱ REST   01:23          [ −15 ] [ +15 ]   │
├─────────────────────────────────────────────┤
│  ▲ Add Exercise                              │
└─────────────────────────────────────────────┘
```

---

## 13. Implementation Blueprint

### Phase 1: Foundation (Week 1)

```
Step 1.1: Initialize Monorepo
  ├─ npx create-turbo@latest nextrep
  ├─ Configure pnpm-workspace.yaml
  ├─ Create apps/mobile (create-expo-app), apps/api, packages/shared
  ├─ turbo.json pipeline
  └─ Git init, .gitignore, README

Step 1.2: Shared Package
  ├─ TypeScript interfaces (Exercise, Workout, Set, PR, Streak, Milestone)
  ├─ Zod validation schemas
  ├─ Constants (muscle groups, categories)
  └─ Utilities (1RM formulas, unit conversion)

Step 1.3: Backend Scaffolding
  ├─ Fastify app with TypeScript
  ├─ Drizzle ORM + @neondatabase/serverless
  ├─ All Drizzle schema files
  ├─ drizzle-kit generate + push to Neon
  ├─ Seed 250+ exercises
  ├─ JWT auth plugin (jose + bcrypt)
  ├─ CORS, rate limiting, error handlers
  ├─ Auth routes (register, login, refresh)
  └─ Dockerfile

Step 1.4: Mobile Scaffolding
  ├─ Expo Router file structure
  ├─ Design system (colors, fonts, theme)
  ├─ UI primitives (Button, Card, Input, Sheet, Badge, Skeleton)
  ├─ Zustand stores (auth, settings, sync, activeWorkout)
  ├─ TanStack Query + API client with JWT interceptor
  ├─ SQLite offline queue
  ├─ NetworkMonitor + SyncBanner
  └─ Auth screens
```

### Phase 2: Exercise Library + Templates (Week 2)

```
Step 2.1: Backend — /exercises and /templates CRUD
Step 2.2: Mobile
  ├─ Exercise library (search, muscle chips, category filter)
  ├─ Exercise detail (muscles, instructions)
  ├─ Add custom exercise (bottom sheet)
  ├─ SQLite exercise cache for offline
  ├─ Template list (cards with muscle tags)
  └─ Template builder (add/reorder exercises, set targets)
```

### Phase 3: Active Workout Engine (Week 2–3)

```
Step 3.1: Backend
  ├─ POST /workouts, POST /workouts/sync
  ├─ PR detection service
  ├─ Streak update service
  └─ Milestone detection service

Step 3.2: Mobile — Core Workout Screen
  ├─ ActiveWorkoutStore (Zustand)
  ├─ Start from template or freestyle
  ├─ SetRow (inline weight × reps, checkmark, previous column)
  ├─ Set type badges (warmup, working, drop, failure, AMRAP)
  ├─ Add/remove sets + exercises mid-workout
  ├─ PR detection with confetti + haptic
  ├─ Finish → summary → API or SQLite buffer
  └─ Rest timer (SVG arc, Reanimated, sound, haptic)
```

### Phase 4: History & Calendar (Week 3–4)

```
Step 4.1: Backend — GET /workouts paginated + calendar
Step 4.2: Mobile
  ├─ Calendar view (dots by muscle)
  ├─ List view (infinite scroll)
  ├─ Session detail (read-only review)
  └─ Filters (date range, muscle, template)
```

### Phase 5: Charts & Analytics (Week 4–5)

```
Step 5.1: Backend — 8 analytics endpoints
Step 5.2: Mobile — 12 chart components
  ├─ Install Victory Native XL + Skia
  ├─ StrengthCurve, VolumeTrend, FrequencyHeatmap
  ├─ MuscleBalance, BodyWeightTrend, OneRmProgress
  ├─ SessionDuration, TonnageComparison
  ├─ PrTimeline, RecordsBoard
  ├─ StreakCalendar, WeeklyOverview
  └─ Each: loading skeleton → cached data → interactive
```

### Phase 6: Body, Streaks, Milestones & Sharing (Week 5–6)

```
Step 6.1: Backend — body CRUD, streaks, milestones
Step 6.2: Mobile
  ├─ Body tracking (weight, fat %, measurements, photos)
  ├─ Weight trend chart
  ├─ Streak display + streak calendar
  ├─ Milestone feed (timeline)
  └─ Share card generator → native share sheet
```

### Phase 7: Onboarding, Settings & Polish (Week 6–7)

```
  ├─ 3-screen onboarding + quick setup
  ├─ Settings (units, theme, rest timer, export, account)
  ├─ Animations (set complete, PR confetti, page transitions)
  ├─ Loading skeletons, error states, empty states
  └─ Keyboard handling, accessibility
```

### Phase 8: Testing & Release (Week 7–8)

```
  ├─ Backend: Jest unit + Supertest integration tests
  ├─ Mobile: Jest unit + RNTL component tests
  ├─ Performance: query indexing, FlatList optimization
  ├─ EAS production build → Play Store submission
  ├─ Render deployment + Neon migrations
  └─ Sentry setup
```

### Phase 9: Custom ML (Week 9–10) — Phase 2 ★★

```
  ├─ ML pipeline: Python XGBoost training
  ├─ ONNX export → onnxruntime-node on server
  ├─ POST /predict/next-set endpoint
  ├─ Mobile: "Suggested: 102.5kg × 5" in SetRow
  └─ GitHub Action for periodic retraining
```

### Phase 10: AI Features (Week 11+) — Phase 3 ★★★

```
  └─ [Deferred — see Section 11]
```

---

## 14. Testing Strategy

### Backend (Jest + Supertest)

| Module | Tests |
|---|---|
| authService | Register, login, refresh, token expiry, duplicate email |
| workoutService | Create session, add sets, batch sync, soft delete |
| prService | All 4 PR types, no PR on warmup, overwrites |
| streakService | Increment, freeze, break, reset, milestone at thresholds |
| milestoneService | Workout count, streak, volume milestones |
| analyticsService | Strength curve shape, volume aggregations |
| API integration | All endpoints: status codes + response shapes |

### Mobile (Jest + RNTL)

| Module | Tests |
|---|---|
| PrDetector | All 4 types, edge cases |
| OneRmCalculator | Epley, Brzycki, Lombardi |
| SyncEngine | Push, clear on success, retry on failure |
| WorkoutEngine | Start, finish, offline/online branching |
| Active Workout UI | Start → log 3 sets → checkmark → finish → summary |

### QA Checklist

- [ ] Full workout online → verify history + charts
- [ ] Full workout offline → verify queued → sync → verify pushed + cleared
- [ ] Set new PR → confetti + badge + records
- [ ] All 12 charts render with real data
- [ ] Share milestone → share sheet with card
- [ ] Toggle kg/lbs → all weights convert
- [ ] Kill app mid-workout → resume from state
- [ ] 100+ sessions → smooth scrolling

---

## 15. Deployment & CI/CD

### Render Deployment

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@nextrep/api

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### EAS Configuration

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": {
      "android": { "buildType": "app-bundle" },
      "env": { "EXPO_PUBLIC_API_URL": "https://nextrep-api.onrender.com" }
    }
  }
}
```

### GitHub Actions CI

```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run lint type-check test
```

---

## What Makes This Impressive

| Area | What's Impressive |
|---|---|
| **Architecture** | Production monorepo (Turborepo), shared types, clean domain separation |
| **Backend** | Custom REST API: Fastify, Drizzle ORM, JWT with refresh rotation, complex analytics SQL |
| **Database** | Serverless Postgres (Neon), proper indexing, triggers, enum types, aggregate queries |
| **Mobile** | Expo New Architecture, offline write-buffering, Reanimated 3, 12+ chart types |
| **State** | Zustand (UI) + TanStack Query (server) — proper dual-state architecture |
| **ML Pipeline** | Custom XGBoost → ONNX export → onnxruntime-node inference → (future) TFLite on-device |
| **DevOps** | Docker, GitHub Actions CI, EAS Build, Render + Neon — all free tier |
| **Data Viz** | 12 distinct Skia-based chart types via Victory Native XL |
| **UX** | Hevy-caliber dark UI, haptics, Lottie celebrations, native sharing, streak gamification |

---

*NextRep — your data, your gains, your rules.*
