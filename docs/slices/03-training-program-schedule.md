# Slice 3: Training Program Schedule

Status: Implemented — awaiting on-device product review  
Implemented: 2026-09-14

## User story

As a gym-goer, I want to choose or customize a repeating training split so that FitFlow can show what I planned for today and start the correct workout without forcing me to remember the rotation.

## Product distinction

This slice creates a **calendar and split planner**, not a complete exercise routine builder.

* A program answers **what type of workout is planned today**: Push, Pull, Legs, Upper, Lower, Full Body, or a custom label.
* It does not prescribe exercises, sets, reps, progression, or load. Reusable exercise templates remain a later feature.

Keeping these separate lets us validate scheduling before coupling it to a larger routine editor.

## Recommended presets

### Push / Pull / Legs

* Monday: Push
* Tuesday: Pull
* Wednesday: Legs
* Thursday: Push
* Friday: Pull
* Saturday: Legs
* Sunday: Rest

### Upper / Lower

* Monday: Upper
* Tuesday: Lower
* Wednesday: Rest
* Thursday: Upper
* Friday: Lower
* Saturday and Sunday: Rest

### Full Body Every Other Day (FBEOD)

* Alternates Full Body and Rest using a user-selected start date.
* It follows calendar days rather than resetting every Monday.

### Custom

* Assign a workout label or Rest to each weekday.
* Labels are free text up to 40 characters.

All presets become editable after selection.

## Recommended flow

1. Open **Train** and select **Create program**.
2. Choose PPL, Upper/Lower, FBEOD, or Custom.
3. Review the generated schedule, rename the program, and edit individual days if needed.
4. Activate the program. Only one program can be active at a time.
5. Train shows today's planned workout and the next seven calendar days.
6. Starting from today's plan creates the existing basic workout session with a durable copy of the planned workout label.
7. Rest days still allow an unplanned, empty workout to be started.

## Schedule rules

* Weekly programs repeat Monday through Sunday.
* FBEOD is anchored to a local calendar date and alternates training/rest continuously across week and month boundaries.
* A missed planned day does not shift the program or automatically become completed.
* Changing the active program affects today and future dates only. Completed sessions keep the label they started with.
* Activating a new program archives the previous program instead of deleting it.
* Deleting or editing a program never deletes completed workouts or attendance.
* Program calculations use local calendar dates; timezone travel does not rewrite past completed workout labels.

## Proposed data changes

* `training_programs`: ID, name, schedule type (`weekly` or `alternating`), anchor local date, active/archive state, creation and update timestamps.
* `training_program_days`: program ID, sequence or weekday index, workout label, rest flag, and order.
* `workout_sessions`: nullable program-day reference plus an immutable copied session label.
* Partial unique index enforcing one active program.
* Foreign keys use `ON DELETE SET NULL` for completed workout links so workout history remains intact.

## Screen states

1. Train screen with no program and a Create program action.
2. Preset picker.
3. Weekly schedule editor.
4. FBEOD start-date editor.
5. Active program summary with today and the next seven days.
6. Rest-day state with an optional unplanned workout action.
7. Replace-program confirmation.
8. Recoverable local persistence error.

## Non-goals

* Exercise selection inside program days.
* Prescribed sets, reps, RPE, progression, or deloads.
* Multiple simultaneously active programs.
* Calendar drag-and-drop, notifications, or reminders.
* Automatically shifting the schedule after missed days.
* Sharing, importing, coaching, or cloud sync.

## Acceptance criteria

* A user can create PPL, Upper/Lower, FBEOD, or a custom program.
* Preset days can be edited before and after activation.
* Exactly one program can be active.
* Today and the next seven days resolve correctly across week, month, year, leap-day, and daylight-saving boundaries.
* FBEOD continues its alternating cadence across Mondays and month boundaries.
* Starting today's plan creates a normal active workout carrying the planned label.
* Rest days permit an optional unplanned workout.
* Missed days do not move the schedule.
* Program edits and deletion do not rewrite or delete completed workout history.
* Program and schedule data survive an app restart.
* Empty, editing, replacement, active, rest-day, and error states work in light and dark modes.
* Migration, date calculation, constraint, repository, type, and lint checks pass.

## Product decisions to confirm

Approved on 2026-09-14:

* Use the recommended preset day layouts above as editable starting points.
* Treat FBEOD as an anchored every-other-calendar-day cadence.
* Keep only one active program and archive the previous one when replaced.
* Keep missed days fixed rather than shifting the schedule.
* Store only workout-day labels in this slice; add reusable exercise contents later.
* Show today plus the next seven days on Train.

## Implementation notes

* Train offers PPL, Upper/Lower, FBEOD, and Custom as editable starting points.
* Weekly programs use Monday-first slots; FBEOD uses a two-day training/rest cycle anchored to a validated local date.
* The editor supports program naming, per-day workout labels, and training/rest toggles.
* The active program card shows today plus the following seven days in a horizontally scrollable schedule.
* Starting a scheduled training day creates the existing basic workout with a durable copied session label and program-day reference.
* Starting on a rest day creates an unplanned empty workout without changing the schedule.
* Applying edits archives the previous program after confirmation. Removing a program archives it and preserves workouts.
* A partial SQLite index enforces exactly one active program, and linked workouts use `ON DELETE SET NULL` while retaining their copied labels.

## Verification

* TypeScript validation and ESLint pass without warnings.
* Twenty-five automated tests pass, including preset layouts, Monday-first mapping, leap-day FBEOD cadence, date validation, one-active-program enforcement, day constraints, and copied-label preservation.
* Expo Doctor passes all project checks.
* Android and iOS production bundles export successfully.

Hands-on confirmation of the program editor, horizontal schedule, keyboard behavior, and scheduled workout start remains part of the product review on a device or simulator.
