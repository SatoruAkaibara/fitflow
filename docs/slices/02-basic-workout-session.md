# Slice 2: Basic Workout Session

Status: Implemented — awaiting on-device product review  
Implemented: 2026-09-13

## User story

As a gym-goer, I want to start a workout, record exercises and completed sets, and finish the session so that my training is safely captured with minimal typing.

## Recommended flow

1. Tap **Train** in the floating navigation pill.
2. Start an empty workout or resume the single active workout saved on the device.
3. Add an exercise by entering its name.
4. Add normal sets with weight in kilograms and reps, then mark each set complete.
5. Finish once at least one set is complete, or explicitly discard the session.
6. Return to Today; finishing a workout records gym attendance without duplicating an existing check-in.

## Session rules

* Only one active workout can exist at a time.
* Every edit commits to SQLite immediately; reopening the app resumes the active session.
* The elapsed time is derived from the stored start timestamp rather than incrementing a persisted counter.
* Exercises remain in the order added and may appear more than once in a session.
* Weight accepts `0` for bodyweight movements and values up to `999.99 kg`.
* Reps accept whole numbers from `1` through `999`.
* Empty draft sets are removed when a workout is finished.
* Deleting an exercise with completed sets requires confirmation.
* Finishing a workout promotes today's attendance source to `workout`, preventing the manual undo action from removing earned attendance.

## Screen states

1. Train landing screen with no active workout.
2. Active workout with no exercises.
3. Active workout with exercises and editable sets.
4. Recovered workout after app restart.
5. Saving or finishing mutation state.
6. Recoverable local persistence error.
7. Discard confirmation.

## Non-goals

* Exercise library, muscle metadata, or exercise search.
* Workout history and previous-set suggestions.
* Rest timers.
* RPE, supersets, dropsets, routines, or templates.
* Session notes, photos, or cloud sync.
* Pounds or automatic unit conversion.

## SQLite migration

* `workout_sessions`: ID, status, start timestamp, completion timestamp, creation timestamp.
* `workout_exercises`: ID, session ID, exercise name, order index.
* `exercise_sets`: ID, exercise ID, set number, weight in kilograms, reps, completion flag.
* Partial unique index enforcing one active session.
* Foreign keys with cascading deletion for discarded sessions and removed exercises.

## Acceptance criteria

* A user can start, resume, finish, and explicitly discard a workout.
* A user can add, rename, reorder, and remove exercises.
* A user can add, edit, complete, uncomplete, and remove normal sets.
* Invalid weights or reps cannot be completed and show an accessible inline explanation.
* Rapid taps cannot create duplicate sessions, exercises, or sets.
* Active workout content survives an app restart.
* Finishing creates or promotes today's attendance without duplication.
* Empty, active, saving, confirmation, and error states work in light and dark themes.
* Migration, validation, repository, and date behavior tests pass.

## Product decisions

Approved on 2026-09-13:

* Start with free-text exercise names instead of building an exercise library.
* Use kilograms only in this slice and add unit preferences later.
* Require at least one completed set before finishing.
* Allow only one active workout and resume it automatically.
* Defer RPE until after the basic session flow is proven.

## Implementation notes

* The floating navigation now opens Today and Train; Fuel and More remain disabled previews.
* Starting a session is idempotent and a partial SQLite index enforces one active workout.
* Adding an exercise creates its first empty normal set automatically.
* Exercise names support rename, reorder, and removal. Removing an exercise with completed sets requires confirmation.
* Draft weight and rep values save on field exit. A set can only be completed with `0–999.99 kg` and `1–999` whole reps.
* Active sessions, exercises, set values, and completion state reload from SQLite after a restart.
* Finishing deletes empty draft sets, completes the session, and creates or promotes today's attendance to the protected `workout` source in one exclusive transaction.
* Discarding requires confirmation and cascades through exercises and sets.
* The Train screen follows the same smoked-glass, high-contrast One UI-inspired light/dark presentation as Today.

## Verification

* TypeScript validation and ESLint pass.
* Seventeen automated tests pass, including workout validation, one-active-session enforcement, database value constraints, and cascade deletion.
* Expo Doctor passes all 21 checks.
* Android and iOS production bundles export successfully.

Hands-on confirmation of keyboard behavior, restart recovery, and the complete finish-to-attendance flow remains part of the product review on a device or simulator.
