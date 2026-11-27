# Chef Assistant: MCP Checkpoint V3

**Checkpoint date:** November 27, 2026  
**Project:** Chef Assistant  
**Development phase:** MCP integration with Claude Desktop  
**Status:** Existing application stable; MCP implementation not yet started

---

## 1. Project Overview

Chef Assistant is a conversational AI cooking application that helps users discover recipes, discuss ingredients, and follow cooking instructions.

The application uses a custom Python agent loop rather than an agent framework. This keeps model communication, tool execution, and application logic visible and understandable.

### Current technology stack

| Layer | Technology |
|---|---|
| Language | Python |
| AI model | Google Gemini |
| Model SDK | `google-genai` |
| Agent | Custom Python agent loop |
| Backend | FastAPI + Uvicorn |
| Frontend | Next.js + React + TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite |
| Testing | Pytest |
| Code quality | Ruff, ESLint, TypeScript |
| CI/CD checks | GitHub Actions and pre-commit hooks |

---

## 2. Current Application Status

### Backend

- [x] Custom agent loop (`agent.py`)
- [x] Gemini communication (`llm.py`)
- [x] System prompts (`prompts.py`)
- [x] Tool registry (`tools.py`)
- [x] SQLite database operations (`db.py`)
- [x] Recipe models and validation (`recipes.py`)
- [x] FastAPI backend (`server.py`)
- [x] Backend tests and Ruff checks passed in the last confirmed review

### Frontend

- [x] Next.js application
- [x] Chat interface
- [x] Streaming responses
- [x] Conversation history
- [x] Saved favorites
- [x] Recipe detail and cooking interface
- [x] Navigation and reusable components
- [x] Frontend configuration reviewed
- [x] Frontend README updated
- [x] ESLint passed
- [x] TypeScript typecheck passed
- [x] Production build passed

### Project maintenance

- [x] GitHub Actions workflows
- [x] Pre-commit hooks
- [x] Dependency installation verified
- [x] `npm audit` reported zero vulnerabilities after dependency updates
- [x] Frontend documentation committed successfully

### Documentation

- [x] Root README updated to reflect the current Next.js application
- [x] Frontend README updated
- [x] MCP development checkpoint created

---

## 3. New Development Direction: MCP

The next phase is to learn and implement the Model Context Protocol (MCP).

### Primary objective

Build a Python MCP server that exposes selected Chef Assistant capabilities to Claude Desktop.

The goal is to understand how an external AI application can discover and use tools provided by our application.

### Why MCP?

The current Chef Assistant has its own custom tool-calling system.

MCP introduces a standardized way for AI applications to communicate with external tools and services.

This provides an opportunity to:

- Reuse existing application functionality.
- Connect Chef Assistant capabilities to other AI applications.
- Learn how MCP clients and servers communicate.
- Explore interoperability between different AI models and tools.
- Potentially expand the application with external services later.

MCP is an additional integration layer, not a replacement for the existing Gemini agent.

---

## 4. Technology Decisions

| Component | Decision |
|---|---|
| MCP protocol | Model Context Protocol |
| MCP SDK | Official Python MCP SDK |
| MCP server | Python |
| Initial MCP client | Claude Desktop |
| Initial transport | Local stdio |
| Existing AI model | Gemini |
| Existing backend | FastAPI |
| Existing database | SQLite |

### Initial architecture

```text
Claude Desktop
      |
      | MCP communication
      | Local stdio transport
      |
      v
Python MCP Server
      |
      | Existing database functions
      |
      v
SQLite Database
      |
      v
Saved Recipes and Favorites
```

The MCP server will initially operate independently from FastAPI and the Gemini agent.

This keeps the existing application stable while we learn MCP.

---

## 5. Planned MCP Capabilities

Start with read-only tools.

| Tool | Description | Permission |
|---|---|---|
| `list_favorites` | Retrieve saved recipes | Read |
| `get_favorite` | Retrieve a specific saved recipe | Read |
| `search_recipes` | Search available recipes, if supported by the existing data model | Read |

After the initial tools work, consider adding:

| Tool | Description | Permission |
|---|---|---|
| `save_favorite` | Save a recipe to the database | Write |

Favorite deletion will remain outside the initial MCP implementation.

We should avoid arbitrary SQL execution, unrestricted filesystem access, and unnecessary write permissions.

---

## 6. MCP Learning Objectives

Understand these concepts before expanding the implementation:

1. What MCP is and why it exists.
2. MCP hosts, clients, and servers.
3. How MCP communication works.
4. Tools, resources, and prompts.
5. Tool discovery and execution.
6. Input schemas and argument validation.
7. Standard input/output (stdio) transport.
8. How Claude Desktop launches local MCP servers.
9. How MCP differs from traditional function calling.
10. How an existing AI agent can become an MCP client.

---

## 7. Development Roadmap

### Phase 1: MCP fundamentals

- [ ] Understand MCP architecture.
- [ ] Learn the relationship between hosts, clients, and servers.
- [ ] Understand tools, resources, and prompts.
- [ ] Learn how stdio transport works.
- [ ] Review the official Python MCP SDK.

### Phase 2: Build a standalone Python MCP server

- [ ] Install the official Python MCP SDK.
- [ ] Create a dedicated MCP server module.
- [ ] Register a simple test tool.
- [ ] Run the server locally.
- [ ] Test tool discovery and execution.
- [ ] Understand how the server receives arguments and returns results.

### Phase 3: Connect Claude Desktop

- [ ] Install Claude Desktop if necessary.
- [ ] Locate its MCP configuration file.
- [ ] Configure the local Python MCP server.
- [ ] Restart Claude Desktop.
- [ ] Verify that the server connects.
- [ ] Test the initial tool through Claude.

### Phase 4: Connect Chef Assistant functionality

- [ ] Inspect existing SQLite database helpers.
- [ ] Reuse existing database functions.
- [ ] Implement read-only favorite retrieval.
- [ ] Add recipe search if appropriate.
- [ ] Validate tool arguments.
- [ ] Test with actual saved recipes.
- [ ] Add controlled recipe-saving functionality.

### Phase 5: Explore advanced integration

- [ ] Compare MCP with Gemini's existing function-calling system.
- [ ] Explore making the Gemini agent an MCP client.
- [ ] Investigate external MCP servers.
- [ ] Evaluate whether MCP improves maintainability and interoperability.
- [ ] Decide whether MCP belongs in the main application's architecture.

---

## 8. Important Development Rules

- Preserve the existing working application.
- Do not replace the custom agent loop just to introduce MCP.
- Keep the initial MCP server separate from FastAPI.
- Reuse existing database logic when practical.
- Avoid unnecessary dependencies and frameworks.
- Validate all tool arguments.
- Keep API keys and secrets out of tool responses.
- Do not expose unrestricted database or filesystem access.
- Keep destructive actions out of the initial implementation.
- Write tests for new functionality.
- Run relevant checks after meaningful changes.
- Work one step at a time and verify each step before continuing.

### Learning approach

The goal is not simply to get an MCP server running.

Understand what each part does, why it exists, how data moves between components, and how it relates to the existing Chef Assistant architecture.

---

## 9. Exact Resume Point

**Current state:** Documentation has been updated and committed. No MCP dependencies have been installed and no MCP server code has been created.

**Next task: Start learning MCP fundamentals.**

The first implementation milestone is:

> Build a small Python MCP server with one harmless test tool, connect it to Claude Desktop, and successfully invoke the tool through a conversation.

After that, expand the server to access Chef Assistant's saved recipes.

---

## 10. Official References

- MCP documentation: https://modelcontextprotocol.io/
- Official Python MCP SDK: https://github.com/modelcontextprotocol/python-sdk
- Claude Desktop: https://claude.ai/download
- Claude documentation: https://docs.claude.com/

---

**Checkpoint V3 ends here.**

The next development session should begin with MCP architecture and the official Python SDK, not with additional changes to the existing Chef Assistant application.
