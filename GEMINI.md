# Gemini Project Configuration: campaign-manager

This document guides Gemini's interactions with the `campaign-manager` project.

## 1. Project Overview

The project is a modular, data-driven campaign management system for Dungeons & Dragons (D&D) campaigns. It uses a Node.js/Express backend with a SQLite database and a vanilla JavaScript frontend.

The main goal is to provide a cohesive, integrated system for Dungeon Masters (DMs) to manage all aspects of a campaign, including characters, locations, sessions, player arcs, and notes, while ensuring data continuity and reducing manual prep time.

**Key Principles:**
- **Modularity:** Features are organized into distinct modules (e.g., `character-manager.js`, `location-manager.js`).
- **Data-Driven:** The application is driven by a well-defined SQLite database schema.
- **Integration:** All systems (characters, sessions, locations, etc.) are designed to be tightly integrated. Changes in one system should reflect correctly in others.
- **Convention over Configuration:** Follow established patterns and file structures.

## 2. Technical Stack

- **Backend:** Node.js with Express.js
- **Database:** SQLite (`better-sqlite3` library)
- **Frontend:** Vanilla JavaScript (ES6 Modules)
- **Styling:** Plain CSS with a BEM-like methodology.
- **Dependencies:** Managed via `package.json`. Key libraries include `express`, `better-sqlite3`, `cors`, and `body-parser`.

## 3. File Structure & Naming Conventions

- **Backend Server:** `server.js` is the main entry point.
- **Frontend Logic:**
    - Core application logic is in `js/app.js`.
    - Feature-specific logic is in `js/features/<feature-name>/`.
    - Reusable components are in `js/components/`.
    - Services (API, etc.) are in `js/services/`.
- **CSS:** Styles are located in the `css/` directory, organized by base, components, and features.
- **API:** All backend endpoints are prefixed with `/api/`.
- **Naming:** Use camelCase for JavaScript variables and functions. Use kebab-case for file names and CSS classes.

## 4. Database Interaction

- The database schema is defined and initialized in `server.js`.
- The database file is `campaign.db`.
- All database interactions are performed on the backend via the `better-sqlite3` library. **Never access the database directly from the frontend.**
- When modifying tables, ensure backward compatibility or provide a migration path. The `server.js` file contains examples of adding new columns safely.

## 5. Development Workflow & Key Tasks

### Running the Application
- **Do not start the server automatically.** Always assume the server is already running unless you encounter an error indicating otherwise.
- **If you need to start the server:** First, terminate any existing server process on port 3000, then manually run `npm start` or `node server.js`.
- **Only request a server restart** if you encounter errors that specifically require it. Attempt to resolve issues without restarting whenever possible.
- **Run Tests:** Use the `run-tests.bat` script or `npm test`. The server must be running for tests to execute. Do not restart the server unless necessary as described above.

### Common Tasks
- **Adding a Feature:**
    1.  Review `DEVELOPMENT_WORKFLOW.md` and `TECHNICAL_SPECS.md`.
    2.  Create new JS files under `js/features/<feature-name>/`.
    3.  Create new CSS files under `css/components/` or `css/features/`.
    4.  Define new API endpoints in `server.js`.
    5.  Update the database schema in `server.js` if necessary.
- **Modifying Existing Code:**
    1.  Adhere strictly to the existing code style and architectural patterns.
    2.  Ensure changes do not break integrations with other systems. Refer to the "System Awareness Checklist" in `DEVELOPMENT_WORKFLOW.md`.
    3.  Avoid introducing hard-coded values, especially the campaign ID (`"campaign-4-old-cistern"`).

## 6. Important Rules & Guardrails

1.  **Always check for hard-coded data:** A key technical debt in this project is hard-coded values, particularly the campaign ID. When implementing new features, make them dynamic.
2.  **Maintain System Integration:** Before making changes, consult `DEVELOPMENT_WORKFLOW.md` to understand system dependencies. A change to the `characters` system might impact `sessions`, `player-arcs`, and `scenes`.
3.  **Follow API Specifications:** All API endpoints are documented in `TECHNICAL_SPECS.md`. Adhere to these specifications when making frontend or backend changes.
4.  **Update Documentation:** When adding or modifying features, update `TECHNICAL_SPECS.md` and other relevant documentation.
5.  **Testing:** All new features should have corresponding verification points outlined, and if possible, automated tests added to `tests/test-runner.js`.
