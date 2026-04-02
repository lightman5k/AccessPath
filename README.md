# AccessPath Admin Demo

AccessPath Admin is a Next.js demo app for showcasing operations workflows across dashboarding, customer support, inventory, logistics, integrations, reporting, and settings.

## Requirements

- Node.js 20+
- npm 10+

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open `http://localhost:3000`

## Production Build

Build the app locally with:

```bash
npm run build
```

Start the production server with:

```bash
npm run start
```

## Environment

For local demo mode, the app can still fall back to JSON-backed storage.

For deployed auth, set:

- `AUTH_SECRET`
- `DATABASE_URL`

A sample env file is included as `.env.example`.

## Demo Guide

See [DEMO.md](./DEMO.md) for a short walkthrough of the main flows and pages.
