# Slice 1: Gym Attendance Check-In

Status: Implemented — awaiting on-device product review  
Implemented: 2026-09-13

## User story

As a gym-goer, I want to mark that I trained today and see recent attendance so that I can maintain momentum without logging a full workout.

## Recommended behavior

* The Today screen has one primary action: **Check in to the gym**.
* A successful check-in immediately updates today's state and the monthly attendance grid.
* Only one attendance record is allowed per local calendar day.
* A completed workout can create that day's attendance record automatically in a later slice without creating a duplicate.
* The user can undo today's manual check-in from the same screen. Editing older days is deferred.
* Streaks count consecutive scheduled days only after scheduling rules exist. This slice shows monthly total and recent consistency, not a potentially misleading streak.

## Time and data rules

* Store the event timestamp in UTC plus the device timezone and derived local date at creation time.
* A day runs from local midnight to local midnight in the timezone recorded for the check-in.
* Traveling later does not move an existing check-in to a different date.
* The SQLite migration creates an attendance table with a unique local-date constraint for the current local profile.

## Screen states

1. Loading local database.
2. Not checked in today.
3. Checked in today.
4. Recoverable persistence error with retry.
5. Monthly grid with no history or with recorded days.

## Non-goals

* Workout details, exercises, and sets.
* Editing past attendance.
* Multiple gyms or location verification.
* Scheduled training days and streak calculations.
* Supabase accounts or cloud sync.

## Acceptance criteria

* The user can check in and undo today's manual check-in.
* Repeated taps cannot create duplicate records.
* The check-in survives an app restart.
* The current month grid accurately marks stored local dates, including month boundaries.
* Loading, empty, checked-in, and error states are accessible and visually distinct in light and dark mode.
* Database and date-rule tests pass along with lint and type-checking.

## Product decisions to confirm

Approved on 2026-09-13:

* Undo is available for today's manual check-in only; older-day editing is deferred.
* The screen shows a monthly total instead of a streak until training schedules exist.
* Manual attendance does not require GPS or gym-location verification.

Additional implementation decision:

* Attendance history uses a GitHub-style, Monday-first heatmap covering the latest 16 weeks; the current week remains visible and future dates are muted.
* The frontend uses a One UI-inspired visual system: translucent layered surfaces, continuous squircle corners, monochrome hierarchy, restrained accent colors, pill controls, and system-driven light/dark themes.
* Attendance actions use subtle spring scaling and soft system haptics.

## Implementation notes

* Expo SQLite owns a persistent `fitflow.db` database and applies versioned migrations through `PRAGMA user_version`.
* Attendance records retain a UTC event timestamp, the timezone at creation, and an immutable local-date key.
* A database uniqueness constraint and `INSERT OR IGNORE` make repeated check-in taps idempotent.
* Undo deletes only records whose source is `manual`, preserving the future workout-generated source.
* The Today screen handles loading, checked-out, checked-in, mutation, and recoverable error states.
* Expo Blur uses a neutral dark smoke layer without a white glass tint, paired with dedicated high-contrast foreground colors.
* Gym check-in is a single 64px horizontal capsule with status, one-line context, and a compact explicit action; workout-earned attendance cannot be manually undone.
* A floating blurred pill previews the four-area navigation model and samples the scrolling content beneath it; only Today is active until the corresponding features exist.
* The date and greeting use the device-native system sans-serif with a Samsung-style size and weight hierarchy; no proprietary Samsung font file is bundled.

## Verification

* TypeScript validation passes.
* ESLint passes without warnings.
* Nine date and schema tests pass, including duplicate dates, invalid sources, leap day, year boundaries, and the rolling heatmap range.
* Expo Doctor passes all 21 checks.
* Android and iOS production bundles export successfully.

Hands-on confirmation of restart persistence and screen behavior remains part of the product review on a device or simulator.
