# Campaign Manager - Application Architecture

This document outlines the architecture of the Campaign Manager application, providing a high-level overview of its structure, components, and data flow. It is the single source of truth for architectural decisions.

## 1. 🏛️ High-Level Architecture

The Campaign Manager is a **monolithic web application** with a classic client-server architecture.

-   **Backend:** A Node.js server built with the **Express.js** framework. It handles all business logic, API requests, and database interactions.
-   **Frontend:** A traditional **vanilla JavaScript** client-side application. It is responsible for rendering the UI, handling user interactions, and communicating with the backend via a RESTful API.
-   **Database:** A **SQLite** database (`campaign.db`) is used for data persistence. The `better-sqlite3` library provides synchronous access to the database on the backend.

## 2. 📁 File & Directory Structure

The project is organized to separate concerns and promote modularity. All new code should follow this structure.

-   `server.js`: The main entry point for the backend server. Contains all API endpoint definitions and database initialization.
-   `index.html`: The main entry point for the frontend application. Contains the core HTML structure and placeholders for dynamic content.
-   `css/`: Contains all CSS, structured using a BEM-like methodology.
    -   `css/base/`: Global styles like resets, typography, and variables.
    -   `css/components/`: Styles for reusable components (e.g., `buttons.css`, `modals.css`). **Check here first before writing new CSS.**
    -   `css/features/`: Styles specific to a major feature area. Use sparingly; prefer component-based styles.
-   `js/`: Contains all frontend JavaScript code, organized by function.
    -   `js/app.js`: The main application initializer. **This is the only file that should have global scope.** It is responsible for instantiating all the "Manager" classes and handling top-level navigation.
    -   `js/services/`: For cross-cutting concerns that can be used by any feature.
        -   `api-service.js`: Handles all `fetch` calls to the backend.
        -   `search-service.js`: Provides global search logic.
        -   `gemini-service.js`: Handles interaction with the Gemini AI.
    -   `js/components/`: For complex, reusable UI components that are not tied to a single feature (e.g., `global-search.js`).
    -   `js/features/`: The core of the application logic, with each subdirectory representing a major feature. **All new features should be created here.**

### The `js/features/` Modular Pattern

Each feature directory (e.g., `js/features/characters/`) follows a specific pattern to separate concerns:

1.  **`[feature]-manager.js`**: The public-facing API for the module. This is the **only file that should be imported by `app.js` or other feature managers.** It acts as a coordinator, orchestrating the other modules within its feature set. It does not contain any direct data manipulation or DOM rendering logic.
    -   *Example:* `character-manager.js`

2.  **`[feature]-core.js`**: Handles all data-related logic. This includes making calls to `ApiService`, managing the in-memory state of the data (e.g., arrays of characters), and providing methods for CRUD (Create, Read, Update, Delete) operations. It should not directly interact with the DOM.
    -   *Example:* `character-core.js`

3.  **`[feature]-ui.js`**: Responsible for all DOM manipulation. This includes rendering HTML, creating modals, handling event listeners for the feature's UI, and displaying notifications. It gets its data by calling methods on the `[feature]-core.js` module (passed to it by the manager).
    -   *Example:* `character-ui.js`

4.  **Other specialized modules (optional)**: For complex features, logic can be further broken down into more specific files.
    -   *Example:* `character-relationships.js`, `quest-tracking.js`

By following this pattern, we ensure that data logic, UI rendering, and feature orchestration are kept separate, making the code easier to understand, maintain, and test.

## 3. ⚙️ System Components & Interaction Matrix

The application is divided into several core "manager" components, each responsible for a specific domain. These managers orchestrate "core" (data logic) and "UI" (rendering) modules.

| Component (Owner) | Responsibilities | Dependencies (Uses) | Used By |
|---|---|---|---|
| **`app.js`** | Main application entry point. Initializes all managers and handles global navigation and event listening. | All Managers | *(Top Level)* |
| **`ApiService.js`** | Centralizes all `fetch` calls to the backend REST API. Provides a consistent interface for all data requests. | *(none)* | All "Core" modules |
| **`DataManager.js`** | Manages in-memory data caching and provides a simple interface for loading/saving data via `ApiService`. | `ApiService` | Various Managers |
| **`CampaignManager`** | Manages high-level campaign information, statistics, and the main campaign workspace view. | `CampaignCore`, `CampaignUI`, `CampaignForms` | `app.js` |
| **`CharacterManager`** | Orchestrates character-related modules. Handles creating, reading, updating, and deleting characters (players and NPCs). | `CharacterCore`, `CharacterUI`, `CharacterRelationships`, `CharacterProgression` | `app.js`, `SessionManager` |
| **`LocationManager`** | Orchestrates location-related modules. Manages the hierarchical structure of all game locations. | `LocationCore`, `LocationUI` | `app.js`, `SceneManager` |
| **`NotesManager`** | Manages the creation, organization, and display of all notes (session, character, plot, etc.). | `ApiService` | `app.js` |
| **`PlayerArcManager`** | Orchestrates modules for managing long-term story arcs for player characters, including goals and milestones. | `PlayerArcCore`, `PlayerArcUI`, `PlayerArcProgression` | `app.js` |
| **`QuestManager`** | Orchestrates modules for managing quests, including their status, objectives, and rewards. | `QuestCore`, `QuestUI`, `QuestTracking` | `app.js`, `SessionManager` |
| **`SceneManager`** | Orchestrates all scene-related modules. Manages individual scenes, including NPC presence, actions, and outcomes. | `SceneCore`, `SceneUI`, `SceneActions`, `SceneAI`, `SceneNavigation` | `app.js`, `SessionManager` |
| **`SessionManager`** | Orchestrates modules for managing campaign sessions, including planning, recaps, and assigning scenes/quests. | `SessionCore`, `SessionUI`, `SessionPlanner` | `app.js` |
| **`GlobalSearch.js`** | Provides application-wide search functionality by interacting with `SearchService`. | `SearchService` | `app.js` |
| **`ExportImportPanel.js`**| Handles the UI and logic for exporting and importing campaign data via `ExportImportService`. | `ExportImportService` | `app.js` |

## 4. 🔄 Data Flow

1.  **UI Interaction:** A user performs an action in the browser (e.g., clicks "Save Character").
2.  **Frontend Manager:** The relevant manager (e.g., `CharacterManager`) captures the event and gathers data from the form.
3.  **API Service:** The manager calls a method in `ApiService.js` (e.g., `updateCharacter(characterData)`).
4.  **HTTP Request:** `ApiService.js` uses `fetch()` to send a `PUT` request to the corresponding backend API endpoint (e.g., `/api/characters/:id`).
5.  **Backend API Endpoint:** The Express route in `server.js` receives the request.
6.  **Database Interaction:** The endpoint handler executes a SQL query against the `campaign.db` database using `better-sqlite3`.
7.  **HTTP Response:** The server sends a JSON response back to the client indicating success or failure.
8.  **UI Update:** The `ApiService.js` promise resolves, and the frontend manager updates the UI accordingly (e.g., closes a modal, displays a notification).

## 5. 🎨 Styling Architecture

The project uses a BEM-like methodology for its CSS.

-   **`css/base/`**: Contains resets, typographic rules, and CSS variables.
-   **`css/components/`**: Contains styles for reusable components like buttons, forms, and modals.
-   **`css/features/`**: Contains styles specific to a major feature, though most styles should be component-based.
-   **`css/utilities/`**: Contains utility classes for spacing, layout, and responsive design.

This structure promotes reusability and helps prevent style conflicts. Before creating new CSS, always check `css/components/` and `css/utilities/` for existing styles that can be reused.

## 6. ⚠️ Known Issues & Technical Debt

This section tracks major architectural challenges and technical debt that need to be addressed.

### **Hard-coded Campaign ID**

-   **Problem**: Many database queries and API endpoints use a hard-coded campaign ID (`"campaign-4-old-cistern"`). This is the most significant piece of technical debt and prevents the application from being truly multi-campaign.
-   **Solution Needed**: Implement a dynamic campaign selection mechanism. This would likely involve:
    1.  A global state management solution on the frontend to hold the currently active campaign ID.
    2.  Passing the campaign ID as a parameter in all relevant API calls.
    3.  Updating all backend queries to use the provided campaign ID instead of the hard-coded one.

### **Asynchronous Data Fetching in UI**

-   **Problem**: Several frontend methods that rely on player data do not properly handle the asynchronous nature of fetching that data, leading to potential race conditions and UI bugs.
-   **Affected Methods**: `renderPlayersPanel(scene)`, `renderPlayerParticipation(scene)`, `renderPlayerActionInputs(scene)`.
-   **Solution Needed**: Refactor these methods to use `async/await` or a promise-based approach. Ensure that data is fully loaded *before* attempting to render or use it in the UI.
