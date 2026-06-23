# BUILD_ORDER.md

## Purpose
Exact build order to keep development clean and stable.

## Phase 0: Planning Files
Create all docs: GEMINI, DATABASE_SCHEMA, RLS_POLICIES, API_ENDPOINTS, SCREEN_FLOW, DESIGN_SYSTEM, DATA_MODEL_RULES, COMPONENTS_PLAN, IMPLEMENTATION_NOTES, BUILD_ORDER, QA_TEST_PLAN, COPYWRITING, EDGE_FUNCTIONS_SPEC, NOTIFICATION_STRATEGY, REALTIME_STRATEGY, CITY_DATA_IMPORT_PLAN, RELEASE_CHECKLIST, AI_AGENT_SETUP, ENV_SETUP.

## Phase 1: Project Setup
Create Expo TypeScript project, Expo Router, NativeWind, env variables, folder structure, Supabase client, React Query provider, SecureStore adapter.

## Phase 2: Design System Foundation
Build AppButton, AppInput, AppCard, SectionHeader, StatusBadge, AppModal, AppBottomSheet. Create constants.

## Phase 3: Supabase Foundation
Configure auth, Google, activation links, reset links, deep links. Create DB tables, RLS, realtime, seed data, avatar bucket.

## Phase 4: Auth Flow
Build Splash, Welcome, Sign Up, Email Verification, Sign In, Forgot Password. Test email activation and Google.

## Phase 5: App Opening Animation
Build Staircase Down animation and reduced motion fallback.

## Phase 6: Onboarding
Build Gender, Location Choice, Current Location, City Selector, Map Picker, Confirm Location, Prayer Settings, Notification Setup.

## Phase 7: Location System
Build resolve-location and save-location. Verify no paid APIs.

## Phase 8: Prayer Times
Build get-today-prayers, get-month-prayers, save-prayer-settings. Cache prayer times and show Jummah display.

## Phase 9: Prayer Logs and Home
Build sync-prayer-log-statuses and mark-prayer. Home has only Big Next/Current Card and Today’s Prayer List.

## Phase 10: Notifications
Build local and push notification support. Respect settings and reschedule on changes.

## Phase 11: Duo Pairing
Build unpaired Duo state and invite Edge Functions.

## Phase 12: Duo Dashboard
Build realtime dashboard, reminders, history, remove partner.

## Phase 13: Profile and Settings
Build profile, edit profile, avatar, gender, location, prayer settings, notification settings, logout.

## Phase 14: Security Testing
Test RLS, Edge Function validation, no private data leaks.

## Phase 15: Polish and Optimization
UI, performance, accessibility, loading/empty/error states.

## Phase 16: Final QA
Must pass auth, onboarding, prayer times, Qaza, Duo, realtime, notifications, Profile, RLS, no paid APIs, no polling.

Build rule: do not move to next phase until current phase works and is tested.
