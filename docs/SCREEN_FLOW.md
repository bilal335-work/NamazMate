# SCREEN_FLOW.md

## Root Flow
Splash → Auth Flow → Email Verification Flow → Onboarding Flow → Main Tabs.

Main tabs: Home, Duo, Profile. No separate Invite tab.

## Splash
Checks session, email verification, profile, onboarding status, and routes to Welcome, Email Verification, saved onboarding step, or Home.

## Welcome
Shows NamazMate intro. Buttons: Get Started → Sign Up, I already have an account → Sign In.

## Auth Screens
Sign Up: full name, email, password, confirm password, Google Sign-In. Email signup sends activation link and goes to Email Verification. Google goes to onboarding.
Email Verification: Open Email App, I’ve Verified, Resend Email, Back to Sign In. Activation link, not code.
Sign In: email/password, Google, Forgot Password.
Forgot Password: sends reset link without exposing whether email exists.

## Onboarding
Order: Gender Selection → Location Setup → Prayer Settings → Notification Setup → Home.
Gender copy: “Tell us about yourself” and “Help us personalize your NamazMate experience. You can update this later in Profile.” Options: Male, Female, Prefer not to say.
Location methods: Use Current Location, Choose City, Pick on Map. All end at Confirm Location.
Prayer Settings: calculation method, Asr method, time format. PK/IN/BD default Hanafi; show Standard/Hanafi options.
Notifications: optional; app works if skipped or denied.

## Home
Two visual sections only:
1. Big Next / Current Prayer Card
2. Today’s Prayer List
Prayer rows: Fajr, Dhuhr/Jummah, Asr, Maghrib, Isha. Actions: Mark Prayed when available, Mark Qaza when qaza_available. Confirmation required, no undo.

## Duo
If not paired: Create Invite, Enter Invite Code, Pending Invites, Sent Invite. Sections live inside Duo tab with sheets/modals.
If paired: Partner header, Today Duo Summary, Prayer Comparison List, History tabs (7 days, 30 days, All Time), Send Reminder, Remove Partner.
Partner sees Qaza summary only and history from pair date onward.

## Profile
Sections: Account, Prayer Settings, Notifications, Duo, App Info.
Screens: Edit Profile, Change Avatar, Change Gender, Change Location, Prayer Settings, Notification Settings, Account Settings/Logout.
Changing gender affects display only. Location/prayer setting changes refresh cache and notifications.

## Protected Routing
Main tabs require authenticated + email verified + onboarding completed. Onboarding requires authenticated + verified + onboarding incomplete. Auth screens should not show to completed authenticated users.
