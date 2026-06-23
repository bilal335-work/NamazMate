# NamazMate QA Testing Guide & Checklist

This document is a manual QA testing guide to verify the features of NamazMate using the development tools.

---

## How to use the dev panel
- Open any tab (Home, Duo, or Profile) in development mode.
- Tap the floating **gear icon** (bottom right) to expand the dev panel.
- Toggle/use controls to mock time or seed database states without affecting real settings.
- Tap **Hide** at the top right of the dev panel to close it.

---

## Prayer time tests

- [ ] **Set mock time to 1 min before Fajr window**
  - **Steps**: In Section 1, enable "Mock Time", and set the time to 1 minute before Fajr start time.
  - **Expected**: Fajr shows as "next prayer" with a countdown of ~60s on the home screen.
- [ ] **Set mock time to during Fajr window**
  - **Steps**: Set mock time to between Fajr start and Sunrise.
  - **Expected**: Fajr is markable (SlideToMark is active and enabled).
- [ ] **Set mock time to after Fajr, before Dhuhr**
  - **Steps**: Set mock time to after Sunrise but before Dhuhr start.
  - **Expected**: Fajr shows as missed / qaza eligible.
- [ ] **Tap "On time" on Fajr from force-status section**
  - **Steps**: Scroll to Section 4 of the dev panel and tap "On time" for Fajr.
  - **Expected**: Fajr shows as "Prayed" (status updated) in the home screen prayer list.
- [ ] **Set mock time to Friday Dhuhr window**
  - **Steps**: Set mock date to any Friday and time during Dhuhr window.
  - **Expected**: Dhuhr displays as "Jumu'ah" instead of Dhuhr.

---

## Duo flow tests

- [ ] **Tap "Seed fake partner" in dev panel**
  - **Steps**: In Section 2, tap "Seed fake partner".
  - **Expected**: Duo tab shows a partner comparison screen with data seeded for "Dev Partner".
- [ ] **Mark a prayer as late using force-status**
  - **Steps**: In Section 4, tap "Late" or "Qaza" for a prayer.
  - **Expected**: Duo comparison row updates for both you and your partner (since mock logs are shared/populated).
- [ ] **Tap "Clear all data"**
  - **Steps**: In Section 2, tap "Clear all data" and confirm.
  - **Expected**: Duo tab returns to the unpaired/no-invite empty state, and prayer logs/fake partner profiles are removed from the database.

---

## Onboarding tests

- [ ] **Sign out from profile tab**
  - **Steps**: Go to Profile -> Settings -> Sign out.
  - **Expected**: User lands on the Welcome screen.
- [ ] **Sign in**
  - **Steps**: Log in with a user that has `onboarding_completed` set to `false`.
  - **Expected**: lands on onboarding flow.
- [ ] **Complete each onboarding step manually**
  - **Steps**: Proceed through gender selection, avatar selection, location configuration, prayer settings, and notification permissions.
  - **Expected**: Correctly transitions step-by-step and lands on Home screen at completion.
- [ ] **Test GPS denial**
  - **Steps**: Deny location permission when requested.
  - **Expected**: Fallback city search field appears so the user can search and select a city manually.
- [ ] **Test skip notifications**
  - **Steps**: Choose to skip/deny notifications during onboarding.
  - **Expected**: App finishes onboarding successfully and works normally on the Home screen.

---

## Auth tests

- [ ] **Sign up with new email**
  - **Steps**: Go to sign up page, fill details, and register.
  - **Expected**: Sends email confirmation / shows verification screen.
- [ ] **Sign in with wrong password**
  - **Steps**: Enter correct email but incorrect password.
  - **Expected**: Friendly error message is shown in the UI.
- [ ] **Forgot password**
  - **Steps**: Request reset password email, open link, and enter new password.
  - **Expected**: Password is successfully updated, allowing login with new password.
- [ ] **Google sign in**
  - **Steps**: Sign in using Google authentication.
  - **Expected**: A new user is created and lands on onboarding.
- [ ] **Sign out from profile tab**
  - **Steps**: Click Sign Out button.
  - **Expected**: User session is cleared, and user lands on the Welcome/Login screen.

---

## Notification tests

- [ ] **Complete onboarding with notifications granted**
  - **Steps**: Complete onboarding and allow notification permission.
  - **Expected**: Notifications are scheduled (check logs or local notification triggers).
- [ ] **Change prayer calculation method in settings**
  - **Steps**: Go to Settings -> Calculation method, change it, and save.
  - **Expected**: All prayer notifications are rescheduled according to the new timings.
- [ ] **Deny notification permission**
  - **Steps**: Block notifications in device settings.
  - **Expected**: No crash, app functions normally without notifications.

---

## Known dev warnings
- **FCM warning on Android**: Expected. `google-services.json` is gitignored. Copy it from a secure location before running an Android build. This warning does not affect any app functionality during local Expo Go testing.
