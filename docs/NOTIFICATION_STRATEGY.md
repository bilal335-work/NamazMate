# NOTIFICATION_STRATEGY.md

## Types
Local notifications: prayer time, before prayer, Qaza available.
Push notifications: partner completed prayer, partner reminder, invite accepted, partner removed, invite received/expired.

## Settings
`prayerRemindersEnabled`, `beforePrayerReminderEnabled`, `beforePrayerMinutes`, `qazaReminderEnabled`, `partnerActivityEnabled`, `inviteNotificationsEnabled`.
Defaults: all ON, before prayer 10 minutes.

## Permission Flow
Ask system notification permission only after user taps Allow Notifications. If denied/skipped, save disabled and app still works. User can enable later.

## Push Tokens
Register Expo push token when permission granted, user logs in on new device, or token changes. Store in `push_tokens`. Multiple devices allowed. Invalid tokens become inactive.

## Local Scheduling
Schedule after onboarding, enabling notifications, location/prayer settings change, new month, cache refresh. Cancel/reschedule when reminders disabled, settings change, logout.

## Local Rules
Prayer time fires if enabled/permission granted/future. Before prayer fires at prayer time minus selected minutes. Qaza reminder fires when window passed and same-day Qaza available. No duplicates.

## Push Rules
Partner completed prayer: send generic “{name} completed a prayer.” Do not reveal exact Qaza details.
Partner reminder: send “{name} sent you a reminder: {message}”. Message max 120, cooldown 30 minutes.
Invite accepted and partner removed respect settings.

## Anti-Spam
One reminder per pair/sender/receiver/date/prayer every 30 minutes. Do not duplicate prayer, before prayer, Qaza, invite, removal, or reminder notifications.

## Payload
Short title/body and minimal navigation data. No sensitive data, exact Qaza details, or push tokens.

## Tap Navigation
Prayer/Qaza → Home. Partner events/invite/removal → Duo.

## Free-Only
Use Expo Notifications and Expo Push API. No paid notification services.
