# CBS Radio Mystery Theater Frontend

A responsive landing page for the CBS Radio Mystery Theater archive, built with Vite and plain JavaScript.

## Development

```bash
npm install
npm run dev
```

The Vite development server will print the local URL after startup.

## Production build

```bash
npm run build
npm run preview
```

The production bundle is written to `dist/`.

## API integration

The landing page works without a backend by using curated fallback content. To populate featured/searchable episodes from the CBSRMT API, create a local `.env` file:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

The frontend calls:

```text
GET /episodes?limit=24
```

It accepts common collection wrappers (`items`, `episodes`, `data`, or `results`) and falls back safely when the API is unavailable.

## Assets

Historical imagery is served from `public/assets/images/`. The page currently uses the supplied CBS Radio microphone, Mystery Theater artwork, studio imagery, and host portraits.

## Design

The implementation follows the approved noir landing-page direction:

- monochrome editorial photography
- charcoal/black surfaces
- muted gold accents
- serif display typography
- featured episodes
- archive discovery controls
- E.G. Marshall opening quote
- responsive mobile navigation
- accessible search dialog and signup form

## Branch

Initial implementation: `landing-page`.
