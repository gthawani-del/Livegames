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

Dragon Tiger is the only live destination. Future games are deliberately rendered as non-interactive “Coming soon” cards until their routes are ready.
