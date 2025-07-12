# Campaign Manager - Development Guide

This file provides comprehensive guidance for Claude Code and developers working with this D&D campaign management application.

## Development Commands

### Server Operations
- `npm start` or `node server.js` - Start the development server on port 3000
- `start-server.bat` - Windows batch file to start server and open browser
- Server serves static files and provides REST API endpoints

### Testing
- `npm test` - Run the comprehensive test suite using `tests/test-runner.js`
- `run-tests.bat` - Windows batch file to run tests (checks server first)
- Tests include API validation, file structure, integration, and performance checks

### Database Operations
- `npm run migrate` - Run database migration script (`migrate-to-database.js`)
- Database uses SQLite with comprehensive schemas for all systems

## 🏗️ **System Overview**

A comprehensive D&D campaign management application with integrated systems for managing all aspects of tabletop RPG campaigns.

### **Core Systems Status**

| System | Status | Description |
|--------|--------|-------------|
| **Scene Management** | ✅ Complete | Dynamic scene progression with AI integration |
| **Character Management** | ✅ Complete + Enhanced | Enhanced relationship matrix with PC/NPC distinction |
| **Location Management** | ✅ Complete | Hierarchical location organization |
| **Quest Management** | ✅ Complete | Quest tracking with character integration |
| **Session Management** | ✅ Complete | Session planning and recap generation |
| **Player Arc Management** | ✅ Complete | Individual player story arc tracking |
| **Notes System** | ✅ Complete | Cross-system note management |
| **Global Search** | ✅ Complete | Comprehensive content search |
| **Export/Import** | ✅ Complete | Data management and backup |

### **Key Features**

#### **Enhanced Character System**
- Complete character lifecycle management
- **Enhanced relationship matrix** with PC/NPC visual distinction
- Color-coded relationship types (ally/enemy/neutral)
- Persistent relationship tracking with database integration
- Sample NPCs with pre-configured relationships

#### **AI Integration**
- Gemini AI service for content generation
- Contextual suggestions for scenes and characters
- Dynamic NPC personality development
- Automated recap generation

#### **Campaign Organization**
- Hierarchical location management
- Session planning with scene/quest assignments
- Player arc tracking for individual storylines
- Cross-system search and navigation

### File Structure Patterns
- **Features organized by domain**: `/js/features/{domain}/{domain}-{type}.js`
  - `{domain}-core.js` - Core business logic
  - `{domain}-manager.js` - Main manager class (orchestrates core/ui/forms)
  - `{domain}-ui.js` - UI rendering and interaction
  - `{domain}-forms.js` - Form handling (where applicable)
- **Shared components**: `/js/components/` - Reusable UI components
- **Services**: `/js/services/` - Cross-cutting concerns (API, search, etc.)
- **Architecture limit**: No file should exceed 500 lines

### Database Integration
- Uses SQLite with comprehensive schemas
- All data persists through REST API endpoints
- Database schema documented in `TECHNICAL_SPECS.md`
- Foreign key relationships maintain data integrity

## Key Development Patterns

### Module System
- Uses ES6 modules with explicit imports/exports
- Event delegation pattern (no onclick handlers in HTML)
- Data-action attributes for UI interactions
- Manager classes orchestrate core business logic and UI components

### API Integration
- RESTful endpoints for all data operations
- Consistent error handling and user feedback
- Async/await patterns for data fetching
- API endpoints documented in `TECHNICAL_SPECS.md`

### Cross-System Integration
- Character data flows to sessions, player arcs, scenes, and quests
- Location hierarchy affects scenes and character positioning
- Session planning integrates scenes, quests, and participants
- Notes system provides cross-references to all other systems

## Critical Development Guidelines

### Before Making Changes
1. **Read Documentation First**: Always start with `ARCHITECTURE.md` and `TECHNICAL_SPECS.md`
2. **Check System Dependencies**: Review the system matrix to understand integration points
3. **Verify API Endpoints**: Ensure you're using existing endpoints or creating new ones properly
4. **Test Cross-System Impact**: Changes to one system may affect dependent systems

### Code Standards
- **No files > 500 lines** - Refactor into smaller modules
- **Follow existing patterns** - Use established naming conventions and architecture
- **Avoid hard-coded values** - Use dynamic data from APIs
- **Update documentation** - Keep `ARCHITECTURE.md` and `TECHNICAL_SPECS.md` current

### Integration Testing
- **Character System**: Verify character data flows correctly to all dependent systems
- **Session Management**: Test scene/quest assignments and participant tracking
- **Location Hierarchy**: Ensure parent-child relationships work correctly
- **Data Synchronization**: Cross-system updates should propagate properly

## Known Issues to Watch For

### Hard-coded Data
- Campaign ID currently hard-coded as "campaign-4-old-cistern"
- Some async method calls need updates for player data fetching
- Verify all character references use dynamic data from database

### Architecture Violations
- Direct database access from frontend (should use API)
- Missing error handling for async operations
- Components exceeding 500-line limit

## AI Integration

### Gemini AI Service
- Located in `js/services/gemini-service.js`
- Provides contextual content generation
- Used for scene suggestions, character development, and session recaps
- Requires API key configuration

### Scene AI Components
- `js/components/scene-ai.js` - AI-powered scene suggestions
- `js/components/scene-action-system.js` - Action queue management
- Integration with character and location data for context

## Testing Strategy

### Manual Testing
- Manual test checklist available at `tests/manual-test-checklist.md`
- Focus on cross-system integration and data flow
- Test all CRUD operations for each system

### Automated Testing
- Comprehensive test suite in `tests/test-runner.js`
- Tests API endpoints, file structure, integration, and performance
- Run `npm test` before committing changes

## Documentation Requirements

### When Adding Features
- Update `ARCHITECTURE.md` system matrix
- Document new API endpoints in `TECHNICAL_SPECS.md`
- Add component specifications for new classes
- Update integration points and dependencies

### Quality Checklist
- Feature works without breaking existing functionality
- Data persists correctly across sessions
- Error scenarios handled gracefully
- Cross-system navigation works smoothly
- No hard-coded values introduced

## Data Flow Understanding

### Character Data Flow
1. Created via `CharacterManager` → `POST /api/characters`
2. Used by `SessionManager` for participant lists
3. Referenced by `PlayerArcManager` for arc assignments
4. Available to `SceneManager` for NPC management
5. Integrated with `QuestManager` for quest participants

### Session Planning Integration
1. `SessionManager` assigns scenes and quests
2. Updates scene progression and quest status
3. Generates recaps from integrated data
4. Maintains participant tracking across sessions

## Coding Standards
### Do not allow code to be more than 500 lines per file for easier readability and segregation of purpose.

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Start the server
npm start
# OR
node server.js

# Access the application
# Open http://localhost:3000 in your browser
```

## 🗄️ **Database & API**

- **Database**: SQLite with comprehensive schemas for all systems
- **API Endpoints**: RESTful endpoints for all major systems
  - `/api/characters/*` - Character management
  - `/api/relationships/*` - Character relationships
  - `/api/locations/*` - Location hierarchy
  - `/api/sessions/*` - Session planning
  - `/api/scenes/*` - Scene management
  - `/api/quests/*` - Quest tracking
  - `/api/notes/*` - Note management

See `TECHNICAL_SPECS.md` for complete database schemas and API documentation.

## 🔄 **Recent Enhancements**

### **Character Relationship Matrix Enhancement**
- Enhanced PC/NPC distinction with visual differentiation (blue/green)
- Color-coded relationship borders (positive/negative/neutral)
- Persistence layer with localStorage fallback
- Sample NPCs with pre-configured relationships
- Enhanced visual design with comprehensive legends
- Full API integration for CRUD operations

## After Major Changes 
### Cleanup any test files or documents that were created for the purpose of development
### Update CLAUDE.md and TECHNICAL_SPECS.md to keep the knowledge up to date

This system emphasizes modular architecture, comprehensive integration, and maintaining data consistency across all components.