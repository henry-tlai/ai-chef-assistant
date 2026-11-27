
# AI Chef Assistant

The frontend for AI Chef Assistant, an AI-powered cooking application that helps users discover recipes, ask cooking questions, and save favorite recipes.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Markdown

## Getting Started

### Prerequisites

- Node.js 22 or later
- npm
- The AI Chef Assistant backend running locally

### Installation

From the frontend directory, install dependencies:

```bash
npm ci
```

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

This specifies the URL of the backend API. Change it when connecting to a different backend environment.

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates a production build |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint |
| `npm run typecheck` | Checks TypeScript types |

## Project Structure

```text
frontend/
├── app/
│   ├── discover/
│   ├── favorites/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── history-panel.tsx
│   ├── markdown.tsx
│   └── nav.tsx
├── lib/
│   └── api.ts
├── public/
├── package.json
└── README.md
```

## Backend

The frontend communicates with the FastAPI backend through the URL configured in `NEXT_PUBLIC_API_URL`.

Make sure the backend is running before using application features that require API access.
