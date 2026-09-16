# Implementation Plan

## Goal
Turn My Farm into Gram AI’s main personalization experience while simplifying the dashboard.

## Changes
1. Remove the bottom flash-card area from the dashboard.
2. Replace visible “Smart Crop Planner” wording and links with “My Farm”.
3. Redesign My Farm around saved farm details and a personalized daily plan covering priorities, crop care, irrigation, nutrients, pest risks, weather advice, timeline, and reminders.
4. Add a concise “How to Use Gram AI” flow: Set up My Farm → Get personalized plan → Follow Today’s Priorities → Ask Gram AI → Scan crops → Track your farm.
5. Preserve existing profile editing, personalization data, navigation, and the Gram AI visual system.

## Technical details
- Reuse the existing profile, climate alert, weather, and reminder data flows where available.
- Keep the experience mobile-first and use existing design components and semantic color tokens.
- Maintain backward-compatible planner links through redirects where needed.
