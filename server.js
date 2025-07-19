#!/usr/bin/env node

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database("./campaign.db");
db.pragma("foreign_keys = ON");

// Create new tables for enhanced player management and ground truth
async function createEnhancedTables(db) {
  try {
    // Campaigns table - Core campaign management
    await db.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        setting TEXT,
        current_session INTEGER DEFAULT 1,
        current_location TEXT,
        dm_name TEXT,
        status TEXT CHECK(status IN ('active', 'paused', 'completed', 'archived')) DEFAULT 'active',
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sessions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        session_number INTEGER,
        title TEXT,
        date DATE,
        summary TEXT,
        notes TEXT,
        participants TEXT DEFAULT '[]',
        locations_visited TEXT DEFAULT '[]',
        status TEXT CHECK(status IN ('draft', 'planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
        objectives TEXT,
        prep_notes TEXT,
        hooks TEXT,
        contingencies TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    // Add new columns to existing sessions table if they don't exist
    try {
      await db.exec(
        `ALTER TABLE sessions ADD COLUMN status TEXT CHECK(status IN ('draft', 'planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft'`
      );
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(`ALTER TABLE sessions ADD COLUMN objectives TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(`ALTER TABLE sessions ADD COLUMN prep_notes TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(`ALTER TABLE sessions ADD COLUMN hooks TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(`ALTER TABLE sessions ADD COLUMN contingencies TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    // Add Modular Method fields
    try {
      await db.exec(`ALTER TABLE sessions ADD COLUMN session_opener TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(`ALTER TABLE sessions ADD COLUMN session_objective TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(
        `ALTER TABLE sessions ADD COLUMN potential_encounters TEXT DEFAULT '[]'`
      );
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(`ALTER TABLE sessions ADD COLUMN set_piece TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(
        `ALTER TABLE sessions ADD COLUMN outro_options TEXT DEFAULT '[]'`
      );
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(
        `ALTER TABLE sessions ADD COLUMN estimated_duration INTEGER`
      );
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(`ALTER TABLE sessions ADD COLUMN momentum_notes TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.exec(
        `ALTER TABLE scenes ADD COLUMN scene_status TEXT CHECK(scene_status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned'`
      );
    } catch (e) {
      // Column already exists, ignore
    }

    // Scenes table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS scenes (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        campaign_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        location_id TEXT,
        scene_type TEXT DEFAULT 'encounter',
        scene_status TEXT CHECK(scene_status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
        current_setup TEXT,
        read_aloud TEXT,
        dm_notes TEXT,
        scene_order INTEGER,
        parent_scene_id TEXT,
        current_segment INTEGER DEFAULT 0,
        path_history TEXT DEFAULT '[]',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (parent_scene_id) REFERENCES scenes(id)
      )
    `);

    // Scene characters junction table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS scene_characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        character_type TEXT CHECK(character_type IN ('player', 'npc')) NOT NULL,
        character_name TEXT NOT NULL,
        role TEXT,
        motivation TEXT,
        favorability INTEGER DEFAULT 50,
        history TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scene_id) REFERENCES scenes(id),
        UNIQUE(scene_id, character_id, character_type)
      )
    `);

    // Players table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        campaign_id TEXT,
        name TEXT NOT NULL,
        class TEXT,
        level INTEGER DEFAULT 1,
        background TEXT,
        race TEXT,
        description TEXT,
        backstory TEXT,
        goals TEXT DEFAULT '[]',
        patron_spirits TEXT,
        icon TEXT DEFAULT '👤',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    // Add subclass column to players table (for D&D subclasses)
    try {
      await db.exec(`ALTER TABLE players ADD COLUMN subclass TEXT DEFAULT ''`);
    } catch (e) {
      // Column already exists, ignore
    }

    // NPCs table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS npcs (
        id TEXT PRIMARY KEY,
        campaign_id TEXT,
        name TEXT NOT NULL,
        role TEXT,
        motivation TEXT,
        description TEXT,
        favorability INTEGER DEFAULT 50,
        importance_level TEXT CHECK(importance_level IN ('minor', 'moderate', 'major')) DEFAULT 'minor',
        status TEXT CHECK(status IN ('active', 'inactive', 'deceased')) DEFAULT 'active',
        first_appearance_scene TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        FOREIGN KEY (first_appearance_scene) REFERENCES scenes(id)
      )
    `);

    // Locations table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        campaign_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        location_type TEXT CHECK(location_type IN ('city', 'town', 'village', 'dungeon', 'wilderness', 'building', 'landmark', 'region', 'other')) DEFAULT 'other',
        parent_location_id TEXT,
        coordinates TEXT,
        notable_features TEXT,
        secrets TEXT,
        status TEXT CHECK(status IN ('active', 'inactive', 'destroyed', 'abandoned')) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        FOREIGN KEY (parent_location_id) REFERENCES locations(id)
      )
    `);

    // Quest tracking table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS quests (
        id TEXT PRIMARY KEY,
        campaign_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT CHECK(category IN ('main', 'side', 'personal', 'faction', 'exploration', 'investigation')) DEFAULT 'side',
        status TEXT CHECK(status IN ('not_started', 'active', 'completed', 'failed', 'on_hold', 'abandoned')) DEFAULT 'not_started',
        priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        assigned_players TEXT DEFAULT '[]',
        location_id TEXT,
        session_id TEXT,
        objectives TEXT DEFAULT '[]',
        rewards TEXT DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // Notes management table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        campaign_id TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT CHECK(category IN ('session', 'character', 'location', 'plot', 'worldbuilding', 'rules', 'personal', 'other')) DEFAULT 'other',
        tags TEXT,
        note_references TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    // Character Notes System
    await db.exec(`
      CREATE TABLE IF NOT EXISTS character_notes (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        character_type TEXT CHECK(character_type IN ('player', 'npc')) NOT NULL,
        campaign_id TEXT NOT NULL,
        category TEXT CHECK(category IN ('general', 'backstory', 'personality', 'goals', 'secrets', 'dm_notes')) DEFAULT 'general',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        session_number INTEGER,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Character Relationships System
    await db.exec(`
      CREATE TABLE IF NOT EXISTS character_relationships (
        id TEXT PRIMARY KEY,
        from_character_id TEXT NOT NULL,
        from_character_type TEXT CHECK(from_character_type IN ('player', 'npc')) NOT NULL,
        to_character_id TEXT NOT NULL,
        to_character_type TEXT CHECK(to_character_type IN ('player', 'npc')) NOT NULL,
        campaign_id TEXT NOT NULL,
        relationship_type TEXT CHECK(relationship_type IN ('ally', 'friend', 'rival', 'enemy', 'romantic', 'family', 'mentor', 'student', 'neutral')) NOT NULL,
        strength INTEGER CHECK(strength BETWEEN 1 AND 5) DEFAULT 3,
        description TEXT,
        is_mutual BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(from_character_id, to_character_id, campaign_id)
      )
    `);

    // Character Progression Tracking
    await db.exec(`
      CREATE TABLE IF NOT EXISTS character_progression (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        character_type TEXT CHECK(character_type IN ('player', 'npc')) NOT NULL,
        campaign_id TEXT NOT NULL,
        progression_type TEXT CHECK(progression_type IN ('level_up', 'story_milestone', 'character_development', 'relationship_change', 'skill_improvement', 'goal_achievement', 'backstory_reveal', 'personality_growth')) NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        session_number INTEGER,
        progression_date DATE DEFAULT (date('now')),
        impact_level TEXT CHECK(impact_level IN ('minor', 'moderate', 'major')) DEFAULT 'moderate',
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Player Arcs Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS player_arcs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL,
        arc_type TEXT,
        title TEXT,
        content TEXT,
        status TEXT,
        importance_weight INTEGER,
        session_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id)
      )
    `);

    // Migrate player_arcs to include campaign_id with foreign key constraint
    try {
      // Check if campaign_id column exists but without foreign key constraint
      const tableInfo = await db
        .prepare("PRAGMA table_info(player_arcs)")
        .all();
      const hasCampaignId = tableInfo.some((col) => col.name === "campaign_id");

      if (!hasCampaignId) {
        // Simple case: add column with foreign key constraint
        await db.exec(
          `ALTER TABLE player_arcs ADD COLUMN campaign_id TEXT REFERENCES campaigns(id)`
        );
      } else {
        // Complex case: column exists but may not have foreign key constraint
        // Check if foreign key constraint exists
        const foreignKeys = await db
          .prepare("PRAGMA foreign_key_list(player_arcs)")
          .all();
        const hasCampaignFk = foreignKeys.some(
          (fk) => fk.from === "campaign_id" && fk.table === "campaigns"
        );

        if (!hasCampaignFk) {
          // Need to recreate table with proper foreign key constraint
          await db.exec(`
            BEGIN TRANSACTION;
            
            -- Create new table with proper foreign key constraint
            CREATE TABLE player_arcs_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              player_id TEXT NOT NULL,
              arc_type TEXT,
              title TEXT,
              content TEXT,
              status TEXT,
              importance_weight INTEGER,
              session_notes TEXT,
              campaign_id TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (player_id) REFERENCES players(id),
              FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
            );
            
            -- Copy data from old table
            INSERT INTO player_arcs_new 
            SELECT id, player_id, arc_type, title, content, status, importance_weight, 
                   session_notes, campaign_id, created_at, updated_at
            FROM player_arcs;
            
            -- Drop old table and rename new one
            DROP TABLE player_arcs;
            ALTER TABLE player_arcs_new RENAME TO player_arcs;
            
            COMMIT;
          `);
        }
      }
    } catch (e) {
      console.error("Error migrating player_arcs foreign key constraint:", e);
      // Don't throw to prevent server startup failure
    }

    await db.exec(`
      CREATE TABLE IF NOT EXISTS scene_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id TEXT NOT NULL UNIQUE,
        scene_card_data TEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Actor State/History Table for Run Scene functionality
    await db.exec(`
      CREATE TABLE IF NOT EXISTS scene_actor_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        character_type TEXT CHECK(character_type IN ('pc', 'npc')) NOT NULL,
        thought TEXT,
        action TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (scene_id) REFERENCES scenes(id)
      )
    `);

    try {
      await db.exec(`ALTER TABLE locations ADD COLUMN notable_features TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      await db.exec(`ALTER TABLE locations ADD COLUMN secrets TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    // Create indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_campaign ON sessions(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
      CREATE INDEX IF NOT EXISTS idx_scenes_session ON scenes(session_id);
      CREATE INDEX IF NOT EXISTS idx_scenes_campaign ON scenes(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_scenes_location ON scenes(location_id);
      CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(scene_status);
      CREATE INDEX IF NOT EXISTS idx_scene_characters_scene ON scene_characters(scene_id);
      CREATE INDEX IF NOT EXISTS idx_scene_characters_character ON scene_characters(character_id);
      CREATE INDEX IF NOT EXISTS idx_players_campaign ON players(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_quests_campaign ON quests(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
      CREATE INDEX IF NOT EXISTS idx_quests_category ON quests(category);
      CREATE INDEX IF NOT EXISTS idx_notes_campaign ON notes(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
      CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);
      CREATE INDEX IF NOT EXISTS idx_character_notes_character ON character_notes(character_id, character_type);
      CREATE INDEX IF NOT EXISTS idx_character_notes_campaign ON character_notes(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_character_notes_category ON character_notes(category);
      CREATE INDEX IF NOT EXISTS idx_relationships_from ON character_relationships(from_character_id, from_character_type);
      CREATE INDEX IF NOT EXISTS idx_relationships_to ON character_relationships(to_character_id, to_character_type);
      CREATE INDEX IF NOT EXISTS idx_relationships_campaign ON character_relationships(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_relationships_type ON character_relationships(relationship_type);
      CREATE INDEX IF NOT EXISTS idx_progression_character ON character_progression(character_id, character_type);
      CREATE INDEX IF NOT EXISTS idx_progression_campaign ON character_progression(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_progression_type ON character_progression(progression_type);
      CREATE INDEX IF NOT EXISTS idx_progression_date ON character_progression(progression_date);
      CREATE INDEX IF NOT EXISTS idx_progression_session ON character_progression(session_number);
      CREATE INDEX IF NOT EXISTS idx_actor_states_scene ON scene_actor_states(scene_id);
      CREATE INDEX IF NOT EXISTS idx_actor_states_character ON scene_actor_states(character_id);
      CREATE INDEX IF NOT EXISTS idx_actor_states_timestamp ON scene_actor_states(timestamp);
    `);

    console.log("✅ Enhanced database tables created successfully");
  } catch (error) {
    console.error("❌ Error creating enhanced tables:", error);
    throw error;
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("."));

// ==========================================
// API ROUTES
// ==========================================
const campaignRoutes = require("./routes/campaigns")(db);
app.use("/api/campaigns", campaignRoutes);

const locationRoutes = require("./routes/locations")(db);
app.use("/api/locations", locationRoutes);

const sessionRoutes = require("./routes/sessions")(db);
app.use("/api/sessions", sessionRoutes);

const sceneRoutes = require("./routes/scenes")(db);
app.use("/api/scenes", sceneRoutes);

const characterRoutes = require("./routes/characters")(db);
app.use("/api/characters", characterRoutes);

const questRoutes = require("./routes/quests")(db);
app.use("/api/quests", questRoutes);

const noteRoutes = require("./routes/notes")(db);
app.use("/api/notes", noteRoutes);

const characterRelationshipRoutes = require("./routes/character-relationships")(
  db
);
app.use("/api/character-relationships", characterRelationshipRoutes);

const playerArcRoutes = require("./routes/player-arcs")(db);
app.use("/api/player-arcs", playerArcRoutes);

// Start server
async function startServer() {
  try {
    await createEnhancedTables(db);
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Fatal error during server startup:", error);
    process.exit(1);
  }
}

startServer();
