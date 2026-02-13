# Notes App (React, local-only)

A lightweight single-page notes app that runs entirely in the browser. Notes are stored locally using `localStorage` and require no backend or authentication.

## Features

The current app supports the following behavior:

### Note management

Users can create, edit, and delete notes.

A note has the following fields:

- `id`
- `title`
- `content`
- `createdAt`
- `updatedAt`

### Draft editor with explicit save

Edits are made in a draft state and are not persisted until the user saves.

The UI shows whether there are unsaved changes. Users can also discard changes to revert the draft back to the last saved version.

A keyboard shortcut is supported:

- `Ctrl+S` / `Cmd+S`: Save the current note

### Search

The sidebar includes a search input that filters notes by matching the query against the note title and content.

### Sorting

Notes are shown sorted by `updatedAt` (most recently updated first).

## Local storage behavior

Notes are persisted in the browser via `localStorage` under this key:

- `simple-notes.notes.v1` (see `src/App.js`)

On startup, the app loads the array of notes from this key, normalizes the shape, sorts by `updatedAt`, and automatically selects the most recently updated note (if any exist).

When the notes state changes, the app writes the full notes array back to `localStorage`.

Clearing site data for the app origin will permanently remove saved notes.

## Tech stack

This project is a Create React App-based frontend:

- React 18
- `react-scripts` (CRA) for dev server, build, and test

There is no backend dependency.

## Setup

### Prerequisites

- Node.js (LTS recommended)
- npm

### Install and run

From `notes_app_frontend/`:

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Available scripts

From `notes_app_frontend/`:

### Development server

```bash
npm start
```

Starts the CRA dev server.

### Production build

```bash
npm run build
```

Builds to the `build/` directory.

### Tests

```bash
npm test
```

Runs the test runner (watch mode when a TTY is available).

If you need a non-interactive CI run, you can use:

```bash
CI=true npm test
```

## Repository structure (frontend)

- `public/`: HTML template and static assets
- `src/App.js`: Notes application logic (create, edit, save, discard, delete, search, persistence)
- `src/App.css`: App styling (light, modern theme)
- `src/App.test.js`: Basic render test
- `src/setupTests.js`: Jest DOM matchers setup
