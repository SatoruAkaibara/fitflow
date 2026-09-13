# FitFlow

FitFlow is an incremental, local-first fitness and productivity tracker built with Expo, React Native, and TypeScript.

## Current checkpoint

Slices 0 through 3 are implemented: the app foundation, local gym attendance, resumable workout sessions, and editable training-program schedules backed by SQLite.

The interface follows a One UI-inspired direction with layered translucent surfaces, rounded modules, restrained color, light/dark themes, and subtle haptic feedback.

The current review gate is the training-program schedule. Workout history and previous-set recall will not begin until this slice is reviewed on-device.

## Run locally

```bash
npm install
npm start
```

Use `npm run typecheck`, `npm run lint`, and `npm test` before considering a slice complete.
