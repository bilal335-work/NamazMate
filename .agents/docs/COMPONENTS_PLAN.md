# COMPONENTS_PLAN.md

## Purpose
Define reusable components to avoid duplicate UI and messy code.

## Folders
```txt
components/
  ui/
  auth/
  onboarding/
  prayer/
  duo/
  profile/
  location/
  notifications/
  animation/
```

## UI Base Components
- `AppButton`: solid, outline, ghost, destructive.
- `AppInput`: label, value, placeholder, secureTextEntry, error.
- `AppCard`: solid, outline, muted, row.
- `SectionHeader`: title, subtitle.
- `StatusBadge`: prayer status variants.
- `AppModal`: irreversible confirmations.
- `AppBottomSheet`: invite code, reminders, selectors.

## Animation
- `AppOpeningAnimation`: Staircase Down animation.

## Auth Components
- `AuthHeader`
- `AuthFormContainer`
- `SocialLoginButton` for Google
- `EmailVerificationCard`

## Onboarding Components
- `OnboardingLayout`
- `GenderOptionCard`
- `OnboardingProgress` optional

## Location Components
- `LocationOptionCard`
- `CitySelector`
- `LocationConfirmCard`
- `MapPicker`

## Prayer Components
- `NextPrayerCard`
- `PrayerRow`
- `PrayerStatusCircle`
- `PrayerScoreCard` optional

## Duo Components
- `DuoPairingView`
- `InviteCodeCard`
- `PendingInviteCard`
- `DuoDashboard`
- `DuoSummaryCard`
- `DuoPrayerComparisonRow`
- `SendReminderSheet`
- `DuoHistoryTabs`
- `DuoHistorySummary`

## Profile Components
- `ProfileHeader`
- `ProfileSection`
- `ProfileRow`
- `AvatarPicker`

## Notification Components
- `NotificationToggleRow`
- `ReminderMinutesSelector`

## Hooks Plan
Auth: `useAuthSession`, `useProfile`.
Prayer: `useTodayPrayers`, `usePrayerLog`, `usePrayerCountdown`, `useMarkPrayer`.
Duo: `useActivePair`, `useDuoRealtime`, `usePartnerPrayerLog`, `useSendReminder`, `useDuoHistory`.
Location: `useCities`, `useCurrentLocation`, `useResolveLocation`.
Notifications: `useNotificationPermission`, `useSchedulePrayerNotifications`.

## Services
- `services/supabase/client.ts`
- `services/supabase/auth.service.ts`
- `services/supabase/profile.service.ts`
- `services/prayer/prayer.service.ts`
- `services/location/location.service.ts`
- `services/duo/duo.service.ts`
- `services/notifications/notification.service.ts`

## Build Order
1. Base UI
2. Auth
3. Onboarding
4. Prayer
5. Duo
6. Profile
7. Animation

Final rule: screens compose components and hooks; no Supabase calls inside UI components.
