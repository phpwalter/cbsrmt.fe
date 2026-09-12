# CBS Radio Mystery Theater Frontend

Desktop landing page for the CBS Radio Mystery Theater archive, built with Vite and plain JavaScript.

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

## Current scope

This branch intentionally implements the desktop landing page only. The layout follows the approved `landing.png` reference composition:

- compact desktop header and placeholder navigation
- E.G. Marshall welcome panel
- central CBS Radio Mystery Theater branding
- static descriptive copy and tagline
- six-card Browse the Archive section
- presentation-only newsletter strip
- footer with placeholder links/social controls

Mobile behavior and secondary pages will be implemented in later passes.

## Assets

The landing page uses assets under `public/assets/images/`, including:

- `cat.jpg`
- `eg.marshell.1.png`
- `come-in.jpg`
- `cbsrmt2.jpg`
- `cbsrmt3.jpg`
- `icon-crime.png`
- `icon-suspense.png`
- `icon-psychological.png`
- `icon-classics.png`
- `icon-supernatural.png`
- `icon-all.png`

## Branch

Current implementation: `landing-page`.
