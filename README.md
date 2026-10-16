# Livegames

Mobile-first lobby for Spartan live table games.

## Run locally

No build step is required. Serve the repository root with any static web server:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Structure

- `index.html` — semantic lobby markup and game destinations
- `styles.css` — mobile-first responsive design
- `app.js` — accessible, touch-enabled hero carousel
- `assets/images/` — optimized original game artwork
- `games/dragon-tiger/` — integrated playable Dragon Tiger route

Dragon Tiger is the only live destination. Its round flow is guarded by an explicit state machine so betting, both card reveals and settlement cannot run out of order. Future games are deliberately rendered as non-interactive “Coming soon” cards until their routes are ready.

The dealer clip, entry art, card sprites and deterministic voice cues are checked into this repository, so the internal game route has no dependency on the previous authenticated game host.
