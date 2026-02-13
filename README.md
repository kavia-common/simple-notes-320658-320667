# Simple Notes

A clean and simple notes app UI built with React. Notes are created, edited, and deleted locally in the browser with no backend and no authentication.

## Where the app lives

The React frontend is in:

- `notes_app_frontend/`

## Quick start

From the frontend directory:

```bash
cd notes_app_frontend
npm install
npm start
```

Then open `http://localhost:3000`.

## Data storage

Notes are persisted to the browser using `localStorage`. Clearing site data (or using a private/incognito window) will remove notes.

## Tests

From the frontend directory:

```bash
cd notes_app_frontend
npm test
```
