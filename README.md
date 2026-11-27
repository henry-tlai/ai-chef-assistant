# Chef Assistant

A conversational AI chef that helps you decide what to cook, discover recipes, and follow cooking instructions step by step.

Built with Python, Google Gemini, FastAPI, Next.js, and SQLite. The project uses a hand-written agent loop rather than an agent framework, keeping the underlying AI behavior and tool execution visible in the code.

## Features

- **Conversational cooking assistant:** Chat naturally about food, ingredients, and what you feel like eating.
- **Recipe generation:** Get structured recipes with ingredients, servings, cooking times, and numbered instructions.
- **Cooking mode:** Follow a recipe one step at a time.
- **Streaming responses:** Watch the assistant's response appear as it is generated.
- **Favorites:** Save recipes, view saved recipes, reopen them, and delete them.
- **Saved conversations:** Conversations persist across server restarts and can be reopened or deleted.
- **Recipe history:** Review previous conversations.
- **REST API:** A FastAPI backend that serves the frontend and supports other clients.
- **Automated checks:** GitHub Actions and pre-commit hooks run code quality checks and tests.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python |
| AI model | Google Gemini API |
| Model SDK | `google-genai` |
| Agent | Custom Python agent loop |
| Backend | FastAPI + Uvicorn |
| Frontend | Next.js + React + TypeScript |
| Styling | Tailwind CSS |
| Markdown rendering | React Markdown |
| Database | SQLite |
| Configuration | python-dotenv |
| Testing | Pytest + NUnit-style Arrange-Act-Assert organization |
| Code quality | Ruff + ESLint + TypeScript |
| CI | GitHub Actions |

## Project Structure

```text
chef-assistant/
├── .github/
│   └── workflows/          # GitHub Actions checks
├── docs/                   # Project documentation and checkpoints
├── frontend/
│   ├── app/                # Next.js pages and layouts
│   ├── components/         # Reusable React components
│   ├── lib/                # Frontend API utilities
│   ├── public/             # Static assets
│   └── package.json
├── scripts/                # Project scripts
├── tests/                  # Python backend tests
├── agent.py                # Agent loop and tool execution
├── db.py                   # SQLite database operations
├── llm.py                  # Gemini API communication
├── main.py                 # Terminal interface
├── prompts.py              # System prompts and chef behavior
├── recipes.py              # Recipe models and formatting
├── server.py               # FastAPI backend and HTTP endpoints
├── tools.py                # Tools available to the AI agent
├── ui.py                   # Streamlit interface retained in the project
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

## Architecture

The primary application uses a Next.js frontend connected to a FastAPI backend.

```text
User
  |
  v
Next.js Frontend
  |
  | HTTP requests / streaming responses
  v
FastAPI Backend
  |
  v
Agent Loop
  |
  +------> Gemini API
  |           |
  |           v
  |       Tool requests
  |           |
  v           v
SQLite <--- tools.py
  |
  v
Saved recipes and conversations
```

### The agent loop

The agent loop is implemented in `agent.py`.

1. The application receives a user message.
2. The agent combines the conversation history, system prompt, and available tools.
3. Gemini decides whether to respond directly or request a tool.
4. If a tool is requested, Python executes the corresponding function.
5. The result is returned to the model.
6. The process repeats until the model produces a final response.

The model does not execute application code itself. Python controls tool execution through the tool registry in `tools.py`.

### Available agent tools

| Tool | Purpose |
|---|---|
| `save_favorite` | Saves a recipe when requested |
| `list_favorites` | Lists saved recipes |
| `get_favorite` | Retrieves a saved recipe |

Deleting favorites is handled by the application rather than the AI agent, keeping destructive actions under direct user control.

### Backend API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/chat` | Sends a message and returns a complete response |
| POST | `/chat/stream` | Streams an assistant response |
| GET | `/history/{session_id}` | Retrieves conversation messages |
| GET | `/conversations` | Lists saved conversations |
| DELETE | `/conversations/{session_id}` | Deletes a conversation |
| GET | `/favorites` | Lists saved recipes |
| GET | `/favorites/{favorite_id}` | Retrieves a saved recipe |
| DELETE | `/favorites/{favorite_id}` | Deletes a saved recipe |

The streaming endpoint returns the session identifier through the `X-Session-Id` response header.

### Persistence

SQLite stores conversations, messages, and favorite recipes.

Conversation messages are grouped by session ID. When an existing conversation is requested, the backend can rebuild its history from the database.

The frontend keeps the active conversation identifier in the URL so that users can return to a conversation after reloading the page.

## Setup

### Prerequisites

- Python 3.13
- Node.js 22 or later
- npm
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/henry-tlai/chef-assistant.git
cd chef-assistant
```

### 2. Create and activate a Python virtual environment

Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Mac/Linux:

```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your-gemini-api-key
```

Get an API key from [Google AI Studio](https://aistudio.google.com/).

Never commit your `.env` file or expose your API key in frontend code.

### 5. Install frontend dependencies

Open a second terminal:

```powershell
cd frontend
npm ci
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

This tells the frontend where to find the backend.

## Running the Application

### 1. Start the backend

From the project root, with the Python virtual environment activated:

```powershell
uvicorn server:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 2. Start the frontend

From the `frontend` directory:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

Both the backend and frontend must be running for the full application to work.

### Additional interfaces

The repository also retains `main.py` for the terminal interface and `ui.py` for the Streamlit interface.

## Testing and Code Quality

### Backend

Run the Python tests:

```powershell
python -m pytest -q
```

Run Ruff:

```powershell
ruff check .
```

### Frontend

From the `frontend` directory:

```powershell
npm run lint
npm run typecheck
npm run build
```

### Git hooks

The repository uses pre-commit hooks to run checks before commits, including:

- Secret and generated-file checks
- Ruff
- Python tests
- Frontend ESLint
- Frontend TypeScript checks
- Commit message validation

Commit messages must begin with `Added`, `Changed`, `Fixed`, or `Removed`.

## Development Roadmap

- [x] **V1:** Terminal cooking assistant with conversation, recipes, and favorites.
- [x] **V2:** FastAPI backend with persistent conversations, favorites, and streaming.
- [x] **V3:** Full-stack Next.js application with React and Tailwind CSS.
- [ ] **V4:** MCP integration with Claude Desktop.
- [ ] **Future ideas:** Pantry tracking, dietary preferences, grocery integrations, cooking timers, and voice interaction.

## Future: Model Context Protocol (MCP)

The next development phase explores the Model Context Protocol (MCP).

The goal is to build a Python MCP server that exposes selected Chef Assistant capabilities to Claude Desktop.

Planned capabilities include:

- Retrieving saved recipes.
- Listing favorite recipes.
- Accessing recipe details.
- Eventually saving recipes through controlled tool calls.

The MCP server will initially operate separately from the existing FastAPI application. This allows MCP to be explored without changing the working agent architecture.

MCP implementation has not started yet.

## Troubleshooting

| Problem | Possible solution |
|---|---|
| Gemini API errors | Verify the API key and model configuration in `llm.py`. |
| Backend connection error | Make sure the FastAPI server is running. |
| Frontend cannot reach backend | Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`. |
| Missing Python package | Activate the virtual environment and install requirements. |
| Missing frontend command | Run `npm ci` from `frontend`. |
| Chats or favorites missing | Check that the backend is using the expected SQLite database. |
| Streaming response appears incomplete | Check the backend logs and network connection. |
| Git commit hook fails | Read the specific hook error and fix the underlying issue rather than bypassing the hook. |

## License

Add a license before distributing or accepting contributions.
