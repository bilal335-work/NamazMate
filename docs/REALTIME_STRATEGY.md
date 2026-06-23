# REALTIME_STRATEGY.md

## Principle
Use Supabase Realtime for Duo. No polling, manual refresh loops, timer-based syncing, or repeated API calls to fake realtime.

## Realtime Tables
Enable only: `prayer_logs`, `pairs`, `partner_reminders`, `pair_invites`.

## Use Cases
Prayer progress: partner marks prayer → prayer_logs update → Duo dashboard updates.
Pair status: partner removed → pairs update → Duo closes for both.
Reminders: reminder insert → in-app state/cooldown updates.
Invites: invite status update → pairing screen updates.

## Subscription Scope
Home: no realtime needed in MVP.
Duo Pairing Screen: subscribe to user invite changes and pairs involving user.
Duo Dashboard: subscribe to today prayer logs for both users, active pair row, partner reminders for pair.

## Channel Names
Use predictable names like `duo:{pairId}`, `duo-invites:{userId}`, `prayer-logs:{pairId}:{date}`.

## Query Invalidation
On prayer log event: invalidate todayPrayerLog, duoToday, optionally duoHistory.
On pair event: invalidate activePair, duoToday, duoHistory.
On reminder event: invalidate partnerReminders/reminderCooldown.
On invite event: invalidate pairInvites/activePair.

## Optimistic Updates
Do not optimistically mark prayer before server confirms because no undo and backend validation. Update UI after Edge Function success.

## Security
RLS applies to realtime. Partner data only while active pair and from pair date onward.

## Cleanup
Unsubscribe when screen unmounts, logout, pair changes, date changes, or subscription not needed.

## Foreground/Background
No polling in background. Push handles important events. On foreground, refetch key queries and resubscribe.

## Date Change
When prayer day changes in user timezone, unsubscribe old date, fetch/sync new log, subscribe to new date, reschedule notifications.

## Errors
If realtime disconnects, do not block UI. Optionally show “Trying to reconnect...” and refetch when restored.
