# Slice 0: Foundation and App Shell

Status: Complete — awaiting product review  
Completed: 2026-09-13

## User outcome

Opening FitFlow presents a coherent Today screen that introduces the product areas and clearly identifies gym attendance as the next feature.

## Decisions

* Use Expo SDK 57 with React Native and strict TypeScript.
* Keep the first release portrait-oriented.
* Follow the device light or dark appearance automatically.
* Use a small token-based theme and reusable feature cards before adopting a larger component library.
* Keep navigation, persistence, and interactive product behavior out of this slice.
* Place the application in `fitflow/` and keep planning documents at the workspace root.

## Acceptance evidence

* `npm run typecheck` passes.
* `npm run lint` passes.
* `npx expo-doctor` passes all 21 checks.
* Android and iOS production bundles export successfully.

## Deferred

* Navigation structure will be chosen when a feature needs a second screen.
* SQLite will be introduced with the first persistent feature rather than as unused infrastructure.
* Brand iconography and custom fonts remain open design decisions.
