# CBS Radio Mystery Theater Frontend

Desktop frontend for the CBS Radio Mystery Theater archive, built with Vite and plain JavaScript.

## Development

The landing page now consumes the Python API. Copy the environment template before starting:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The default API configuration is:

```text
VITE_API_BASE_URL=http://localhost:8000
```

The Vite development server normally runs at `http://localhost:5173`.

## Landing-page API integration

The upper-right **50 Years Ago Tonight** panel calls:

```http
GET /episode/today
```

The API uses America/Chicago as the authoritative day, looks up the date exactly 50 years earlier, and returns every CBS RMT broadcast from that date. When there was no broadcast on that date, the API returns the most recent prior broadcast date.

The landing page:

- renders the resolved historical date from the API;
- shows all broadcasts when multiple episodes aired that day;
- omits episode descriptions when multiple cards are displayed;
- uses four-digit artwork paths such as `/assets/episodes/0733.png`;
- enables Play only when the API reports available audio;
- displays a fallback message when the requested anniversary date had no broadcast;
- displays an availability message rather than stale hard-coded data if the API cannot be reached.

The API response is cached by the API service until the end of the current Central Time day.

## Production build

```powershell
npm run build
npm run preview
```

The production bundle is written to `dist/`.

## Current landing-page scope

- desktop header and navigation;
- E.G. Marshall welcome panel;
- CBS Radio Mystery Theater branding;
- live **50 Years Ago Tonight** API feature;
- eight Browse the Archive category cards;
- newsletter strip;
- footer controls.

Secondary episode/archive pages and broader responsive behavior remain separate follow-on work.

## Branch

Current implementation: `landing-page-v6`.
