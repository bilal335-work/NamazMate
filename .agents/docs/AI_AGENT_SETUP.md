# AI_AGENT_SETUP.md

## Purpose
Define how an AI coding agent should work on NamazMate.

## Required Docs
Agent must follow all project docs. Priority: Security/RLS, Product decisions, Data model rules, API/Edge Function rules, Code quality, Design system.

## Restrictions
Do not use paid APIs, Google Places/Maps/Timezone, paid geocoding/notifications/analytics, Duo polling, service role in frontend, direct pair creation/removal from frontend, raw backend errors, or `any` unless unavoidable.

## Behavior
Before code: read docs, inspect files, check structure/scripts. While coding: keep files small, reuse components/hooks/services, keep API calls in services, sensitive logic in Edge Functions. Before done: run checks, review diff, report changed files/tests/limitations.
