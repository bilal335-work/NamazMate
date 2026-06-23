# DATA_MODEL_RULES.md

## Core Principles
Prayer logs belong to the user. Duo access is temporary while pair is active. Own history is never deleted. Shared Duo history disappears when unpaired. Partner can only see allowed data from pair date onward. Prayer day uses saved timezone.

## Prayer Keys
Use only `fajr`, `dhuhr`, `asr`, `maghrib`, `isha`. Jummah is display-only and stored as `dhuhr`.

## Prayer Statuses
`locked`, `available`, `prayed`, `qaza_available`, `qaza_prayed`, `not_completed`.

## Prayer Windows
- Fajr: Fajr → Dhuhr
- Dhuhr/Jummah: Dhuhr → Asr
- Asr: Asr → Maghrib
- Maghrib: Maghrib → Isha
- Isha: Isha → next day Fajr

## Allowed Transitions
`locked → available`, `available → prayed`, `available → qaza_available`, `qaza_available → qaza_prayed`, `qaza_available → not_completed`.

## Blocked Transitions
`prayed → anything`, `qaza_prayed → anything`, `not_completed → anything`, `locked → prayed`, `locked → qaza_prayed`, `available → qaza_prayed`, `qaza_available → prayed`.

## Qaza Rules
Qaza is same-day only, for five obligatory prayer slots. If not marked before day ends, it becomes `not_completed`. Previous days cannot be edited. Partner sees Qaza summary only.

## Scoring
`prayed = 1`, `qaza_prayed = 0.5`, all incomplete states = 0. Locked future prayers are not counted during the day. End of day score is out of 5.

## Timezone
Use `user_locations.timezone` as source of truth. Store prayer_date as `YYYY-MM-DD` in user timezone. Store marked_at as timestamptz. Countdown updates locally without API polling.

## Pairing
One active partner. One active invite per unpaired user. Invite expires after 7 days. Pair history starts from `pair_start_date`.

## Duo Visibility
Partner can see basic profile, scores, progress, and Qaza summary from pair date. Partner cannot see data before pair, exact Qaza prayer names, exact location, notification settings, push tokens, or prayer settings.

## Reminders
Custom reminder max 120 chars, emojis allowed, empty blocked, 30-minute cooldown per pair/sender/receiver/date/prayer.

## Notifications
Local: prayer time, before prayer, Qaza. Push: partner completed, reminder, invite accepted, partner removed. Respect settings and avoid duplicates.

## Backend Authority
Edge Functions enforce valid transitions, no undo, no future marking, same-day Qaza, one active pair, no own invite, no reminder spam, partner data from pair date only.
