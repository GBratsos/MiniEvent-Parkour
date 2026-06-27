# MINI John Cooper Works — Parkour Time Trial Scoreboard

A live event scoreboard built for a **MINI John Cooper Works Parkour experience**. Designed to run on two screens simultaneously: a public display on a large monitor and a private admin console for entering results.

---

## What it does

The app has two views accessible at different routes:

| Route      | View              | Purpose                                             |
| ---------- | ----------------- | --------------------------------------------------- |
| `/`        | **Display**       | Public leaderboard shown on a TV/large screen       |
| `/backend` | **Admin console** | Entry panel for operators to add and manage results |

### Display (`/`)

- Shows the current leader with their best lap time prominently
- Podium section highlighting positions 2 and 3
- Top 5 standings panel
- Full results table with all individual lap times, best lap, total time, and championship points
- Automatically polls the cloud every **15 seconds** to stay live without any manual refresh
- Drivers with no recorded times are pushed to the bottom of the table

### Admin console (`/backend`)

- Add a driver by name with up to 4 lap times (format `M:SS.mmm`, e.g. `1:12.345`)
- Inline editing — click any cell in the leaderboard to edit the driver name or a lap time in place
- Delete individual drivers or clear the entire leaderboard
- Export results as a `.json` file and re-import them later
- **Save to cloud** button pushes the current state to JSONBin so the Display screen picks it up within 15 seconds (only shown when JSONBin is configured)

---

## Scoring

Points are awarded by finishing position:

| Position  | Points |
| --------- | ------ |
| 1st       | 40     |
| 2nd       | 36     |
| 3rd       | 33     |
| 4th       | 30     |
| 5th       | 25     |
| 6th       | 21     |
| 7th       | 18     |
| 8th       | 15     |
| 9th–16th  | 10     |
| 17th–18th | 5      |
| 19th+     | 0      |

Drivers are ranked first by **best lap time**, then by **total time** as a tiebreaker.

---

## Tech stack

| Layer      | Technology           |
| ---------- | -------------------- |
| Framework  | React 18             |
| Language   | TypeScript 5         |
| Build tool | Vite 5               |
| Routing    | React Router v6      |
| Icons      | Font Awesome 6 (CDN) |

---

## External services

### JSONBin.io (optional)

Used as a lightweight cloud key-value store to sync results between the admin console and the display screen across different devices/browsers.

- The admin saves data via `PUT /v3/b/{BIN_ID}`
- The display reads data via `GET /v3/b/{BIN_ID}/latest`
- Polling interval: 15 seconds on the display

Without JSONBin configured, the app still works fully — it stores data in `localStorage` and both views must be open in the same browser.

**Sign up**: [https://jsonbin.io](https://jsonbin.io) (free tier is sufficient)

### Font Awesome 6

Loaded from the cdnjs Cloudflare CDN at runtime. Used for all icons (medals, trophy, star, edit, trash, etc.).

CDN URL: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css`

### Google Fonts

Loaded via CSS `@import` from Google Fonts at runtime. Two families are used:

- **Barlow Condensed** (weights 600, 700, 800) — headings and leaderboard values
- **Inter** (weights 400, 500, 600, 700) — body text and labels

> The display page carries a `noindex, nofollow` robots meta tag — it is not intended to be indexed by search engines.

---

## Getting started

### Prerequisites

- Node.js 18+ and npm

### Install

```bash
npm install
```

### Configure environment (optional)

Create a `.env` file in the project root to enable cloud sync:

```env
VITE_JSONBIN_BIN_ID=your_bin_id_here
VITE_JSONBIN_API_KEY=your_master_key_here
```

Both variables must be present for cloud sync to activate. If either is missing, the app silently falls back to localStorage.

### Run in development

```bash
npm run dev
```

The dev server starts on `http://0.0.0.0:5173`. Open:

- `http://localhost:5173/` for the display screen
- `http://localhost:5173/backend` for the admin console

### Build for production

```bash
npm run build
```

Output is placed in `dist/`. Serve the folder with any static file host (Nginx, Vercel, Netlify, GitHub Pages, etc.).

### Preview the production build locally

```bash
npm run preview
```

### Deploy to Vercel

A `vercel.json` is included that rewrites all routes to `index.html`, which is required for client-side routing to work correctly:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Set the two environment variables (`VITE_JSONBIN_BIN_ID`, `VITE_JSONBIN_API_KEY`) in the Vercel project settings before deploying.

---

## Data persistence

| Scenario               | Behaviour                                                                     |
| ---------------------- | ----------------------------------------------------------------------------- |
| JSONBin configured     | On load: fetch from cloud. On save: write to cloud. Display polls every 15 s. |
| JSONBin not configured | Data lives in `localStorage`. Both views must share the same browser session. |
| Both                   | `localStorage` is always written as a local cache/fallback.                   |

---

## Project structure

```
src/
  App.tsx          # Root component, state management, routing
  Display.tsx      # Public leaderboard view (/)
  Backend.tsx      # Admin console (/backend)
  types.ts         # Participant type definition
  timeUtils.ts     # Lap time parsing, formatting, points calculation
  styles.css       # All styles
  lib/
    jsonbin.ts     # JSONBin.io API client (load / save)
  assets/          # SVGs and images
```
