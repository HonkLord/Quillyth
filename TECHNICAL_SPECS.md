# Campaign Manager - Technical Specifications

This document provides detailed specifications for the database schema and API endpoints. For a high-level overview of the application's structure, see `ARCHITECTURE.md`.

## 🗄️ **Database Schema Specifications**

### **Characters Table**

```sql
CREATE TABLE characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('player', 'npc', 'monster')),
    level INTEGER DEFAULT 1,
    class TEXT,
    race TEXT,
    background TEXT,
    alignment TEXT,
    stats TEXT, -- JSON string
    description TEXT,
    image_url TEXT,
    campaign_id TEXT DEFAULT 'campaign-4-old-cistern',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Field Specifications:**

-   `type`: 'player' | 'npc' | 'monster'
-   `level`: 1-20 for D&D characters
-   `stats`: JSON format: `{"str": 10, "dex": 12, "con": 14, "int": 13, "wis": 15, "cha": 8}`
-   `campaign_id`: Currently hard-coded to "campaign-4-old-cistern"

### **Character Notes Table**

```sql
CREATE TABLE character_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    session_number INTEGER,
    is_private BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

### **Character Relationships Table**

```sql
CREATE TABLE character_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_character_id INTEGER NOT NULL,
    to_character_id INTEGER NOT NULL,
    relationship_type TEXT NOT NULL,
    strength INTEGER DEFAULT 1 CHECK (strength >= 1 AND strength <= 5),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (to_character_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

### **Locations Table**

```sql
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    campaign_id TEXT DEFAULT 'campaign-4-old-cistern',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE SET NULL
);
```

### **Sessions Table**

```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    session_number INTEGER,
    scheduled_date DATE,
    status TEXT DEFAULT 'planned',
    summary TEXT,
    notes TEXT,
    participants TEXT, -- JSON array of character IDs
    assigned_scenes TEXT, -- JSON array of scene IDs
    assigned_quests TEXT, -- JSON array of quest IDs
    campaign_id TEXT DEFAULT 'campaign-4-old-cistern',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Player Arcs Table**

```sql
CREATE TABLE player_arcs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    theme TEXT,
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    goals TEXT, -- JSON array
    milestones TEXT, -- JSON array
    dm_notes TEXT,
    campaign_id TEXT DEFAULT 'campaign-4-old-cistern',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

## 🔌 **API Endpoint Specifications**

### **Character Endpoints**

#### `GET /api/characters`

-   **Description:** Fetches all characters for the active campaign.
-   **Response Format:**
    ```json
    [
      {
        "id": 1,
        "name": "Lyralei Moonwhisper",
        "type": "player",
        "level": 5,
        "class": "Ranger",
        "race": "Elf",
        "description": "A skilled elven ranger...",
        "campaign_id": "campaign-4-old-cistern"
      }
    ]
    ```

#### `POST /api/characters`

-   **Description:** Creates a new character.
-   **Request Body:**
    ```json
    {
      "name": "Character Name",
      "type": "player|npc|monster",
      "level": 1,
      "class": "Class Name",
      "race": "Race Name",
      "description": "Character description"
    }
    ```

### **Location Endpoints**

#### `GET /api/locations`

-   **Description:** Fetches all locations, including their hierarchical structure.

#### `POST /api/locations`

-   **Description:** Creates a new location.
-   **Request Body:**
    ```json
    {
      "name": "Location Name",
      "type": "city|town|dungeon|etc.",
      "description": "Location description",
      "parent_id": null
    }
    ```

*(Note: This is not an exhaustive list. Add new endpoints here as they are created.)*

---

**Last Updated**: Current Session
**Next Review**: After each feature implementation
