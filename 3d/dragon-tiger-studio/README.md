# Dragon Tiger 3D Studio

This package is the Function-stage design contract for the new real-time, mesh-driven Dragon Tiger game. It is deliberately separate from the existing video prototype under `games/dragon-tiger/`.

## Gate status

- Function: pending human approval
- Asset generation: blocked until Function approval
- Form / Blender composition: blocked until asset approval
- Runtime export: blocked until Form approval
- Deployment: blocked until Runtime approval

No paid Meshy generation has been submitted. No published game files have been replaced.

## Locked design decisions

- Mobile-first portrait gameplay surface: 390 x 844 reference viewport.
- One continuous spatial scene from entrance corridor to dealer table.
- Dealer is the hero; architecture and branded reliefs remain secondary.
- Shoe is on camera-left.
- Dragon card position is camera-left; Tiger is camera-right.
- The card is extracted without rotating, turned face-up exactly once, then released.
- Game truth controls the card identity, result, voice, lipsync, animation and payout.
- Two compatible dealer bodies (female and male) share one animation contract.

## Package map

- `room-brief.json`: purpose, bounds, camera, performance and spend ceilings.
- `props.json`: procedural, authored-character and Meshy-candidate asset register.
- `room-layout.json`: shell, placement anchors and production camera.
- `openings.json`: functional entrance/opening schedule.
- `specs/dealer-system.json`: mesh, rig, facial and customization contract.
- `specs/animation-contract.json`: reusable dealer/card animation events.
- `specs/runtime-contract.json`: authoritative event and mobile rendering contract.
- `specs/lighting-fixtures.json`: shared authoring/runtime fixture manifest.
- `plans/lower-room-plan.svg`: concept lower-room engineering plan.
- `plans/reflected-ceiling-plan.svg`: concept reflected ceiling plan.
- `plans/wall-elevations.svg`: concept wall elevations.
- `plans/function-plan-contact-sheet.jpg`: rendered plan/elevation review sheet.
- `masks/opening-contact-sheet.svg`: opening-mask review sheet.
- `milestone-reviews.json`: explicit approval record.
- `final-report.json`: later Form and Runtime evidence.
- `validate-function.mjs`: local structural and contract checks; it never grants approval.

## Function approval questions

1. Approve the emerald felt, black lacquer, aged brass and warm amber studio language.
2. Approve the camera-left shoe and camera-left Dragon placement.
3. Approve the 3 m-wide open arrival portal and short cinematic camera travel.
4. Approve the dealer framing target: head, torso, both arms, shoe and both cards visible on a phone without scrolling.

The plan marks are Function-stage procedural proxy outlines. Exact top-down silhouettes must be regenerated from evaluated Blender geometry before the Function gate is recorded as approved.

