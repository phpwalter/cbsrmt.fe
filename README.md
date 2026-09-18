# CBS Radio Mystery Theater Frontend

CBS Radio Mystery Theater frontend built with Vite and plain JavaScript.

## Development

The frontend consumes the Python API. Copy the environment template before starting:

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

The API uses America/Chicago as the authoritative day, looks up the date exactly 50 years earlier, and returns every CBS RMT broadcast from that date. If there was no broadcast on that date, it returns the most recent prior broadcast date.

The landing page:

- renders the resolved historical date from the API;
- shows all broadcasts when multiple episodes aired that day;
- omits descriptions when multiple cards are displayed;
- uses four-digit artwork paths such as `/assets/episodes/0733.png`;
- enables Play only when audio is available;
- displays a fallback message when the anniversary date had no broadcast;
- displays an availability message if the API cannot be reached.

## Production build

```powershell
npm run build
npm run preview
```

The production bundle is written to `dist/`.

## Branch

Current implementation: `v7`.
