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

    await db.exec(`
      CREATE TABLE IF NOT EXISTS scene_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id TEXT NOT NULL UNIQUE,
        scene_card_data TEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
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
// CAMPAIGNS API
// ==========================================

app.get("/api/campaigns", (req, res) => {
  try {
    const campaigns = db.prepare("SELECT * FROM campaigns").all();
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

app.get("/api/campaigns/current", (req, res) => {
  try {
    const campaign = db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 1").get();
    if (!campaign) {
      return res.status(404).json({ error: "No campaigns found" });
    }
    res.json(campaign);
  } catch (error) {
    console.error("Error fetching current campaign:", error);
    res.status(500).json({ error: "Failed to fetch current campaign" });
  }
});

app.get("/api/campaigns/:id", (req, res) => {
  try {
    const campaign = db
      .prepare("SELECT * FROM campaigns WHERE id = ?")
      .get(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Parse metadata if it exists
    if (campaign.metadata) {
      try {
        campaign.metadata = JSON.parse(campaign.metadata);
      } catch (e) {
        campaign.metadata = {};
      }
    }

    res.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

// Update campaign
app.put("/api/campaigns/:id", (req, res) => {
  try {
    const {
      name,
      description,
      setting,
      current_session,
      current_location,
      dm_name,
      status,
      metadata,
    } = req.body;

    const stmt = db.prepare(`
      UPDATE campaigns 
      SET name = ?, description = ?, setting = ?, current_session = ?, current_location = ?, dm_name = ?, status = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      name,
      description || null,
      setting || null,
      current_session || 1,
      current_location || null,
      dm_name || null,
      status || "active",
      JSON.stringify(metadata || {}),
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Return updated campaign
    const updatedCampaign = db
      .prepare("SELECT * FROM campaigns WHERE id = ?")
      .get(req.params.id);

    if (updatedCampaign.metadata) {
      try {
        updatedCampaign.metadata = JSON.parse(updatedCampaign.metadata);
      } catch (e) {
        updatedCampaign.metadata = {};
      }
    }

    res.json(updatedCampaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// Create new campaign
app.post("/api/campaigns", (req, res) => {
  try {
    const {
      id,
      name,
      description,
      setting,
      current_session,
      current_location,
      dm_name,
      status,
      metadata,
    } = req.body;

    if (!id || !name) {
      return res
        .status(400)
        .json({ error: "Campaign ID and name are required" });
    }

    const stmt = db.prepare(`
      INSERT INTO campaigns (id, name, description, setting, current_session, current_location, dm_name, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const result = stmt.run(
      id,
      name,
      description || null,
      setting || null,
      current_session || 1,
      current_location || null,
      dm_name || null,
      status || "active",
      JSON.stringify(metadata || {})
    );

    // Return created campaign
    const newCampaign = db
      .prepare("SELECT * FROM campaigns WHERE id = ?")
      .get(id);

    if (newCampaign.metadata) {
      try {
        newCampaign.metadata = JSON.parse(newCampaign.metadata);
      } catch (e) {
        newCampaign.metadata = {};
      }
    }

    res.status(201).json(newCampaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    if (error.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      res.status(409).json({ error: "Campaign with this ID already exists" });
    } else {
      res.status(500).json({ error: "Failed to create campaign" });
    }
  }
});

// ==========================================
// LOCATIONS API
// ==========================================

app.get("/api/locations", (req, res) => {
  try {
    const campaignId = req.query.campaign_id;
    if (!campaignId) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    const locations = db
      .prepare(
        "SELECT * FROM locations WHERE campaign_id = ? ORDER BY hierarchy_level, name"
      )
      .all(campaignId);
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

app.get("/api/locations/:id", (req, res) => {
  try {
    const location = db
      .prepare("SELECT * FROM locations WHERE id = ?")
      .get(req.params.id);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

app.post("/api/locations", (req, res) => {
  try {
    const {
      campaign_id,
      name,
      description,
      read_aloud,
      atmosphere,
      location_type,
      parent_id,
    } = req.body;
    if (!campaign_id) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    const stmt = db.prepare(`
            INSERT INTO locations (id, campaign_id, name, description, read_aloud, atmosphere, location_type, parent_id, hierarchy_level, coordinates, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const result = stmt.run(
      id,
      campaign_id,
      name,
      description || "",
      read_aloud || "",
      atmosphere || "",
      location_type || "location",
      parent_id || null,
      0,
      "{}",
      "{}"
    );

    res.json({ id: id, success: true, changes: result.changes });
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ error: "Failed to create location" });
  }
});

app.put("/api/locations/:id", (req, res) => {
  try {
    // Debug: Log the incoming request body
    console.log(`🔧 DEBUG: PUT /api/locations/${req.params.id}`);
    console.log(`🔧 Request body:`, JSON.stringify(req.body, null, 2));

    // Build dynamic update query based on provided fields
    const allowedFields = [
      "name",
      "description",
      "read_aloud",
      "atmosphere",
      "location_type",
      "parent_id",
      "notable_features",
      "secrets",
    ];
    const updateFields = [];
    const updateValues = [];

    // Only include fields that are actually provided in the request
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(req.body[field]);
        console.log(`🔧 Adding field: ${field} = ${req.body[field]}`);
      }
    }

    // Always update the timestamp
    updateFields.push("updated_at = CURRENT_TIMESTAMP");

    console.log(
      `🔧 Total fields to update: ${
        updateFields.length - 1
      } (excluding timestamp)`
    );

    if (updateFields.length === 1) {
      // Only timestamp
      console.log(`🔧 ERROR: No valid fields found in request body`);
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    const sql = `UPDATE locations SET ${updateFields.join(", ")} WHERE id = ?`;
    updateValues.push(req.params.id);

    const stmt = db.prepare(sql);
    const result = stmt.run(...updateValues);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// ==========================================
// SESSIONS API
// ==========================================

app.get("/api/sessions", (req, res) => {
  try {
    const campaignId = req.query.campaign_id;
    if (!campaignId) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    const sessions = db
      .prepare(
        `
      SELECT * FROM sessions 
      WHERE campaign_id = ? 
      ORDER BY session_number DESC, created_at DESC
    `
      )
      .all(campaignId);

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

app.post("/api/sessions", (req, res) => {
  try {
    const { campaign_id, session_number, title, date, summary, notes } =
      req.body;
    if (!campaign_id) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    const id = `session-${session_number || Date.now()}`;

    const stmt = db.prepare(`
      INSERT INTO sessions (id, campaign_id, session_number, title, date, summary, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    const result = stmt.run(
      id,
      campaign_id,
      session_number,
      title,
      date,
      summary || "",
      notes || ""
    );
    res.json({ id, success: true, changes: result.changes });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Update session
app.put("/api/sessions/:id", (req, res) => {
  try {
    const sessionId = req.params.id;
    const updates = req.body;

    // Get current session to check what fields exist
    const currentSession = db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .get(sessionId);
    if (!currentSession) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Build dynamic update query based on provided fields
    const allowedFields = [
      "session_number",
      "title",
      "date",
      "summary",
      "notes",
      "participants",
      "locations_visited",
      "status",
      "objectives",
      "prep_notes",
      "hooks",
      "contingencies",
      "session_opener",
      "session_objective",
      "potential_encounters",
      "set_piece",
      "outro_options",
      "estimated_duration",
      "momentum_notes",
    ];

    const updateFields = [];
    const updateValues = [];

    allowedFields.forEach((field) => {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Add updated_at timestamp
    updateFields.push("updated_at = ?");
    updateValues.push(new Date().toISOString());
    updateValues.push(sessionId);

    const query = `UPDATE sessions SET ${updateFields.join(", ")} WHERE id = ?`;
    const stmt = db.prepare(query);

    const result = stmt.run(...updateValues);

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ error: "Session not found or no changes made" });
    }

    res.json({
      success: true,
      changes: result.changes,
      message: "Session updated successfully",
    });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// ==========================================
// SCENES API
// ==========================================

// Get single scene
app.get("/api/scenes/:id", (req, res) => {
  try {
    const sceneId = req.params.id;

    // Get scene data
    const scene = db
      .prepare(
        `
      SELECT s.*, l.name as location_name, ses.title as session_name
      FROM scenes s
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN sessions ses ON s.session_id = ses.id
      WHERE s.id = ?
    `
      )
      .get(sceneId);

    if (!scene) {
      return res.status(404).json({ error: "Scene not found" });
    }

    // Get scene characters
    const characters = db
      .prepare(
        `
      SELECT * FROM scene_characters WHERE scene_id = ?
    `
      )
      .all(sceneId);

    scene.characters = characters;

    res.json(scene);
  } catch (error) {
    console.error("Error fetching scene:", error);
    res.status(500).json({ error: "Failed to fetch scene" });
  }
});

app.get("/api/scenes", (req, res) => {
  try {
    const campaignId = req.query.campaign_id;
    if (!campaignId) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    const sessionId = req.query.session_id;

    let query = `
      SELECT s.*, 
             l.name as location_name,
             sess.title as session_title
      FROM scenes s
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN sessions sess ON s.session_id = sess.id
      WHERE s.campaign_id = ?
    `;

    const params = [campaignId];

    if (sessionId) {
      query += " AND s.session_id = ?";
      params.push(sessionId);
    }

    query += " ORDER BY s.scene_order, s.created_at";

    const scenes = db.prepare(query).all(...params);

    // Get characters for each scene
    const scenesWithCharacters = scenes.map((scene) => {
      const characters = db
        .prepare(
          `
        SELECT character_name as name, character_type, role, motivation, favorability, history
        FROM scene_characters 
        WHERE scene_id = ?
      `
        )
        .all(scene.id);

      return {
        ...scene,
        characters: characters || [],
        pathHistory: scene.path_history ? JSON.parse(scene.path_history) : [],
        currentSegment: {
          read_aloud: scene.read_aloud || "",
          dm_notes: scene.dm_notes || "",
        },
        currentOptions: [], // Could be stored in a separate table if needed
      };
    });

    res.json(scenesWithCharacters);
  } catch (error) {
    console.error("Error fetching scenes:", error);
    res.status(500).json({ error: "Failed to fetch scenes" });
  }
});

app.post("/api/scenes", (req, res) => {
  try {
    const {
      campaign_id,
      session_id,
      name,
      description,
      location_id,
      current_setup,
      read_aloud,
      dm_notes,
      scene_order,
      characters,
    } = req.body;

    if (!campaign_id) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();

    // Insert scene
    const sceneStmt = db.prepare(`
      INSERT INTO scenes (
        id, campaign_id, session_id, name, description, location_id, 
        current_setup, read_aloud, dm_notes, scene_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const result = sceneStmt.run(
      id,
      campaign_id,
      session_id,
      name,
      description || "",
      location_id,
      current_setup || "",
      read_aloud || "",
      dm_notes || "",
      scene_order || 0
    );

    // Insert characters if provided
    if (characters && characters.length > 0) {
      const charStmt = db.prepare(`
        INSERT INTO scene_characters (
          scene_id, character_id, character_type, character_name, 
          role, motivation, favorability, history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `);

      characters.forEach((char) => {
        const charId =
          char.id || char.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
        charStmt.run(
          id,
          charId,
          char.character_type || "npc",
          char.name,
          char.role || "",
          char.motivation || "",
          char.favorability || 50,
          char.history || ""
        );
      });
    }

    res.json({
      id: id,
      success: true,
      changes: result.changes,
      message: "Scene created successfully",
    });
  } catch (error) {
    console.error("Error creating scene:", error);
    res.status(500).json({ error: "Failed to create scene" });
  }
});

// Update scene
app.put("/api/scenes/:id", (req, res) => {
  try {
    const sceneId = req.params.id;
    const {
      name,
      description,
      location_id,
      session_id,
      current_setup,
      read_aloud,
      dm_notes,
      scene_order,
      scene_status,
      characters,
    } = req.body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Scene name is required" });
    }

    // Check if scene exists
    const existingScene = db
      .prepare("SELECT id FROM scenes WHERE id = ?")
      .get(sceneId);
    if (!existingScene) {
      return res.status(404).json({ error: "Scene not found" });
    }

    // Update scene
    const updateStmt = db.prepare(`
      UPDATE scenes SET 
        name = ?, 
        description = ?, 
        location_id = ?, 
        session_id = ?,
        current_setup = ?, 
        read_aloud = ?, 
        dm_notes = ?, 
        scene_order = ?,
        scene_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = updateStmt.run(
      name,
      description || "",
      location_id,
      session_id,
      current_setup || "",
      read_aloud || "",
      dm_notes || "",
      scene_order || 0,
      scene_status || "planned",
      sceneId
    );

    // Update characters if provided
    if (characters !== undefined) {
      // Delete existing characters for this scene
      const deleteCharStmt = db.prepare(
        "DELETE FROM scene_characters WHERE scene_id = ?"
      );
      deleteCharStmt.run(sceneId);

      // Insert updated characters
      if (characters && characters.length > 0) {
        const charStmt = db.prepare(`
          INSERT INTO scene_characters (
            scene_id, character_id, character_type, character_name, 
            role, motivation, favorability, history
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `);

        characters.forEach((char) => {
          const charId =
            char.id || char.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
          charStmt.run(
            sceneId,
            charId,
            char.character_type || "npc",
            char.name,
            char.role || "",
            char.motivation || "",
            char.favorability || 50,
            char.history || ""
          );
        });
      }
    }

    res.json({
      id: sceneId,
      success: true,
      changes: result.changes,
      message: "Scene updated successfully",
    });
  } catch (error) {
    console.error("Error updating scene:", error);
    res.status(500).json({ error: "Failed to update scene" });
  }
});

app.delete("/api/scenes/:id", (req, res) => {
  try {
    const sceneId = req.params.id;

    // Check if scene exists
    const scene = db.prepare("SELECT * FROM scenes WHERE id = ?").get(sceneId);
    if (!scene) {
      return res.status(404).json({ error: "Scene not found" });
    }

    // Begin transaction for atomic deletion
    const deleteTransaction = db.transaction(() => {
      // Delete scene characters (foreign key relationships)
      const deleteCharacters = db.prepare(
        "DELETE FROM scene_characters WHERE scene_id = ?"
      );
      const charactersResult = deleteCharacters.run(sceneId);

      // Delete scene cards (if any)
      const deleteCards = db.prepare(
        "DELETE FROM scene_cards WHERE scene_id = ?"
      );
      const cardsResult = deleteCards.run(sceneId);

      // Delete the scene itself
      const deleteScene = db.prepare("DELETE FROM scenes WHERE id = ?");
      const sceneResult = deleteScene.run(sceneId);

      return {
        scene: sceneResult.changes,
        characters: charactersResult.changes,
        cards: cardsResult.changes,
      };
    });

    const results = deleteTransaction();

    if (results.scene > 0) {
      console.log(
        `✅ Scene deleted: ${sceneId} (${results.characters} characters, ${results.cards} cards)`
      );
      res.json({
        success: true,
        message: "Scene deleted successfully",
        deletedRecords: results,
      });
    } else {
      res.status(404).json({ error: "Scene not found or already deleted" });
    }
  } catch (error) {
    console.error("Error deleting scene:", error);
    res.status(500).json({ error: "Failed to delete scene" });
  }
});

// ==========================================
// SCENE CARDS API
// ==========================================

// Get scene card data
app.get("/api/scene-cards/:sceneId", (req, res) => {
  try {
    const result = db
      .prepare(
        "SELECT scene_card_data, last_updated FROM scene_cards WHERE scene_id = ?"
      )
      .get(req.params.sceneId);

    if (result) {
      res.json({
        sceneCard: JSON.parse(result.scene_card_data),
        lastUpdated: result.last_updated,
      });
    } else {
      res.status(404).json({ error: "Scene card not found" });
    }
  } catch (error) {
    console.error("Error fetching scene card:", error);
    res.status(500).json({ error: "Failed to fetch scene card" });
  }
});

// Save scene card data
app.post("/api/scene-cards/:sceneId", (req, res) => {
  try {
    const { sceneCard, lastUpdated } = req.body;
    const sceneId = req.params.sceneId;

    const stmt = db.prepare(`
      INSERT INTO scene_cards (scene_id, scene_card_data, last_updated) 
      VALUES (?, ?, ?) 
      ON CONFLICT(scene_id) 
      DO UPDATE SET 
        scene_card_data = ?, 
        last_updated = ?
    `);

    const cardDataString = JSON.stringify(sceneCard);
    const timestamp = lastUpdated || new Date().toISOString();

    stmt.run(sceneId, cardDataString, timestamp, cardDataString, timestamp);

    res.json({
      success: true,
      message: "Scene card saved successfully",
      lastUpdated: timestamp,
    });
  } catch (error) {
    console.error("Error saving scene card:", error);
    res.status(500).json({ error: "Failed to save scene card" });
  }
});

// Delete scene card data
app.delete("/api/scene-cards/:sceneId", (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM scene_cards WHERE scene_id = ?");
    const result = stmt.run(req.params.sceneId);

    if (result.changes > 0) {
      res.json({ success: true, message: "Scene card deleted successfully" });
    } else {
      res.status(404).json({ error: "Scene card not found" });
    }
  } catch (error) {
    console.error("Error deleting scene card:", error);
    res.status(500).json({ error: "Failed to delete scene card" });
  }
});

// List all scene cards
app.get("/api/scene-cards", (req, res) => {
  try {
    const results = db
      .prepare(
        "SELECT scene_id, last_updated FROM scene_cards ORDER BY last_updated DESC"
      )
      .all();

    res.json(results);
  } catch (error) {
    console.error("Error listing scene cards:", error);
    res.status(500).json({ error: "Failed to list scene cards" });
  }
});

// ==========================================
// CHARACTER API
// ==========================================

// Get all characters (players + NPCs)
app.get("/api/characters", (req, res) => {
  try {
    const campaignId = req.query.campaign_id;
    if (!campaignId) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }

    // Get all player characters
    const players = db
      .prepare(
        "SELECT * FROM players WHERE campaign_id = ? AND status = 'active' ORDER BY name"
      )
      .all(campaignId);

    // Get important NPCs from scene_characters
    const npcs = db
      .prepare(
        `
        SELECT 
          sc.character_name as name,
          sc.role,
          sc.motivation,
          AVG(sc.favorability) as favorability,
          COUNT(*) as scene_count,
          'npc' as type
        FROM scene_characters sc
        JOIN scenes s ON sc.scene_id = s.id
        WHERE s.campaign_id = ? AND sc.character_type = 'npc'
        GROUP BY sc.character_name
        ORDER BY scene_count DESC, favorability DESC
      `
      )
      .all(campaignId);

    // Format response
    const characters = {
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        class: p.class,
        level: p.level,
        race: p.race,
        background: p.background,
        description: p.description,
        type: "player",
      })),
      npcs: npcs.map((n) => ({
        id: n.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: n.name,
        role: n.role,
        motivation: n.motivation,
        favorability: Math.round(n.favorability || 50),
        type: "npc",
      })),
    };

    res.json(characters);
  } catch (error) {
    console.error("Error fetching characters:", error);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

// Get important NPCs
app.get("/api/characters/important-npcs", (req, res) => {
  try {
    const campaignId = req.query.campaign_id;
    if (!campaignId) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }

    // Get NPCs from scenes that appear frequently or have high importance
    const importantNPCs = db
      .prepare(
        `
      SELECT 
        sc.character_name as name,
        sc.role,
        sc.motivation,
        AVG(sc.favorability) as avg_favorability,
        COUNT(*) as scene_count,
        GROUP_CONCAT(DISTINCT s.name) as scenes
      FROM scene_characters sc
      JOIN scenes s ON sc.scene_id = s.id
      WHERE s.campaign_id = ? AND sc.character_type = 'npc'
      GROUP BY sc.character_name
      HAVING scene_count > 1 OR AVG(sc.favorability) > 70
      ORDER BY scene_count DESC, avg_favorability DESC
      LIMIT 10
    `
      )
      .all(campaignId);

    // Format the response to match what the frontend expects
    const formattedNPCs = importantNPCs.map((npc) => ({
      id: npc.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: npc.name,
      role: npc.role,
      motivation: npc.motivation,
      favorability: Math.round(npc.avg_favorability || 50),
      importance:
        npc.scene_count > 2
          ? "high"
          : npc.avg_favorability > 70
          ? "medium"
          : "low",
      scenes: npc.scenes ? npc.scenes.split(",") : [],
      type: "npc",
    }));

    res.json(formattedNPCs);
  } catch (error) {
    console.error("Error fetching important NPCs:", error);
    res.json([]); // Return empty array on error to prevent frontend issues
  }
});

// Get character progression data
app.get("/api/characters/progression", (req, res) => {
  try {
    const campaignId = req.query.campaign_id;
    if (!campaignId) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }

    // Get character development over time from player arcs and campaign events
    const progression = db
      .prepare(
        `
      SELECT 
        p.id,
        p.name,
        p.level,
        COUNT(DISTINCT pa.id) as active_arcs,
        COUNT(DISTINCT ce.id) as character_moments,
        MAX(ce.session_number) as last_development_session
      FROM players p
      LEFT JOIN player_arcs pa ON p.id = pa.player_id AND pa.status = 'active'
      LEFT JOIN campaign_events ce ON p.id IN (
        SELECT value FROM json_each(ce.participants)
      ) AND ce.event_type = 'character_moment'
      WHERE p.campaign_id = ? AND p.status = 'active'
      GROUP BY p.id, p.name, p.level
    `
      )
      .all(campaignId);

    const progressionData = {};
    progression.forEach((char) => {
      progressionData[char.id] = {
        name: char.name,
        level: char.level,
        active_arcs: char.active_arcs,
        character_moments: char.character_moments,
        last_development_session: char.last_development_session,
      };
    });

    res.json(progressionData);
  } catch (error) {
    console.error("Error fetching character progression:", error);
    res.json({}); // Return empty object on error to prevent frontend issues
  }
});

// Get specific character by ID
app.get("/api/characters/:id", (req, res) => {
  try {
    const characterId = req.params.id;

    // Try to find as player first
    const player = db
      .prepare("SELECT * FROM players WHERE id = ?")
      .get(characterId);

    if (player) {
      res.json({
        ...player,
        type: "player",
      });
      return;
    }

    // Try to find as NPC
    const npc = db
      .prepare(
        `
        SELECT 
          sc.character_name as name,
          sc.role,
          sc.motivation,
          AVG(sc.favorability) as favorability,
          COUNT(*) as scene_count
        FROM scene_characters sc
        JOIN scenes s ON sc.scene_id = s.id
        WHERE sc.character_name = ? AND sc.character_type = 'npc'
        GROUP BY sc.character_name
      `
      )
      .get(characterId.replace(/-/g, " "));

    if (npc) {
      res.json({
        id: characterId,
        name: npc.name,
        role: npc.role,
        motivation: npc.motivation,
        favorability: Math.round(npc.favorability || 50),
        type: "npc",
      });
      return;
    }

    res.status(404).json({ error: "Character not found" });
  } catch (error) {
    console.error("Error fetching character:", error);
    res.status(500).json({ error: "Failed to fetch character" });
  }
});

// Create new character
app.post("/api/characters", (req, res) => {
  try {
    const { type, ...characterData } = req.body;

    if (type === "player") {
      // Create player character
      const {
        campaign_id,
        name,
        class: playerClass,
        level,
        background,
        race,
        description,
        backstory,
      } = characterData;

      if (!campaign_id) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const stmt = db.prepare(`
        INSERT INTO players (id, campaign_id, name, class, level, background, race, description, backstory, goals, patron_spirits, icon, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);

      const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const result = stmt.run(
        id,
        campaign_id,
        name,
        playerClass || "",
        level || 1,
        background || "",
        race || "",
        description || "",
        backstory || "",
        "[]",
        "",
        "👤",
        "active"
      );

      res.json({ id: id, success: true, changes: result.changes });
    } else {
      res
        .status(400)
        .json({ error: "NPC creation not supported via this endpoint" });
    }
  } catch (error) {
    console.error("Error creating character:", error);
    res.status(500).json({ error: "Failed to create character" });
  }
});

// Update character
app.put("/api/characters/:id", (req, res) => {
  try {
    const characterId = req.params.id;
    const { type, ...characterData } = req.body;

    if (type === "player") {
      // Update player character
      const {
        name,
        class: playerClass,
        level,
        background,
        race,
        description,
        backstory,
        goals,
        patron_spirits,
      } = characterData;

      const stmt = db.prepare(`
        UPDATE players 
        SET name = ?, class = ?, level = ?, background = ?, race = ?, description = ?, backstory = ?, goals = ?, patron_spirits = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        name,
        playerClass || "",
        level || 1,
        background || "",
        race || "",
        description || "",
        backstory || "",
        goals || "[]",
        patron_spirits || "",
        characterId
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "Player not found" });
      }

      res.json({ success: true, changes: result.changes });
    } else {
      res
        .status(400)
        .json({ error: "NPC updates not supported via this endpoint" });
    }
  } catch (error) {
    console.error("Error updating character:", error);
    res.status(500).json({ error: "Failed to update character" });
  }
});

// Delete character
app.delete("/api/characters/:id", (req, res) => {
  try {
    const characterId = req.params.id;

    // Try to delete as player
    const stmt = db.prepare(
      "UPDATE players SET status = 'inactive' WHERE id = ?"
    );
    const result = stmt.run(characterId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error deleting character:", error);
    res.status(500).json({ error: "Failed to delete character" });
  }
});

// ==========================================
// PLAYER ARCS API (Enhanced Player Management)
// ==========================================

app.get("/api/players/:playerId/arcs", (req, res) => {
  try {
    const arcs = db
      .prepare(
        "SELECT * FROM player_arcs WHERE player_id = ? ORDER BY arc_type, created_at DESC"
      )
      .all(req.params.playerId);
    res.json(arcs);
  } catch (error) {
    console.error("Error fetching player arcs:", error);
    res.status(500).json({ error: "Failed to fetch player arcs" });
  }
});

app.get("/api/players/:playerId/arcs/:arcType", (req, res) => {
  try {
    const arcs = db
      .prepare(
        "SELECT * FROM player_arcs WHERE player_id = ? AND arc_type = ? ORDER BY created_at DESC"
      )
      .all(req.params.playerId, req.params.arcType);
    res.json(arcs);
  } catch (error) {
    console.error("Error fetching player arcs by type:", error);
    res.status(500).json({ error: "Failed to fetch player arcs" });
  }
});

app.post("/api/players/:playerId/arcs", (req, res) => {
  try {
    const {
      arc_type,
      title,
      content,
      status,
      importance_weight,
      session_notes,
    } = req.body;
    const stmt = db.prepare(`
      INSERT INTO player_arcs (player_id, arc_type, title, content, status, importance_weight, session_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    const result = stmt.run(
      req.params.playerId,
      arc_type,
      title,
      content,
      status || "active",
      importance_weight || 50,
      session_notes || ""
    );

    res.json({
      id: result.lastInsertRowid,
      success: true,
      changes: result.changes,
    });
  } catch (error) {
    console.error("Error creating player arc:", error);
    res.status(500).json({ error: "Failed to create player arc" });
  }
});

app.put("/api/players/:playerId/arcs/:arcId", (req, res) => {
  try {
    const { title, content, status, importance_weight, session_notes } =
      req.body;
    const stmt = db.prepare(`
      UPDATE player_arcs 
      SET title = ?, content = ?, status = ?, importance_weight = ?, session_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND player_id = ?
    `);

    const result = stmt.run(
      title,
      content,
      status,
      importance_weight || 50,
      session_notes || "",
      req.params.arcId,
      req.params.playerId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Player arc not found" });
    }

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error updating player arc:", error);
    res.status(500).json({ error: "Failed to update player arc" });
  }
});

app.delete("/api/players/:playerId/arcs/:arcId", (req, res) => {
  try {
    const stmt = db.prepare(
      "DELETE FROM player_arcs WHERE id = ? AND player_id = ?"
    );
    const result = stmt.run(req.params.arcId, req.params.playerId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Player arc not found" });
    }

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error deleting player arc:", error);
    res.status(500).json({ error: "Failed to delete player arc" });
  }
});

// ==========================================
// CHARACTER NOTES API
// ==========================================

// Get character notes
app.get("/api/characters/:characterId/notes", (req, res) => {
  try {
    const { characterId } = req.params;
    const {
      character_type = "player",
      campaign_id,
    } = req.query;

    if (!campaign_id) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }

    const notes = db
      .prepare(
        `
      SELECT * FROM character_notes 
      WHERE character_id = ? AND character_type = ? AND campaign_id = ?
      ORDER BY created_at DESC
    `
      )
      .all(characterId, character_type, campaign_id);

    res.json(notes);
  } catch (error) {
    console.error("Error fetching character notes:", error);
    res.status(500).json({ error: "Failed to fetch character notes" });
  }
});

// Create character note
app.post("/api/characters/:characterId/notes", (req, res) => {
  try {
    const { characterId } = req.params;
    const {
      character_type = "player",
      campaign_id,
      category = "general",
      title,
      content,
      session_number,
      is_public = true,
    } = req.body;

    if (!campaign_id) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }

    const id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO character_notes (id, character_id, character_type, campaign_id, category, title, content, session_number, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const result = stmt.run(
      id,
      characterId,
      character_type,
      campaign_id,
      category,
      title,
      content,
      session_number,
      is_public
    );

    res.json({ id, success: true, changes: result.changes });
  } catch (error) {
    console.error("Error creating character note:", error);
    res.status(500).json({ error: "Failed to create character note" });
  }
});

// Update character note
app.put("/api/characters/:characterId/notes/:noteId", (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content, category, session_number, is_public } = req.body;

    const stmt = db.prepare(`
      UPDATE character_notes 
      SET title = ?, content = ?, category = ?, session_number = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      title,
      content,
      category,
      session_number,
      is_public,
      noteId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Character note not found" });
    }

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error updating character note:", error);
    res.status(500).json({ error: "Failed to update character note" });
  }
});

// Delete character note
app.delete("/api/characters/:characterId/notes/:noteId", (req, res) => {
  try {
    const { noteId } = req.params;

    const stmt = db.prepare("DELETE FROM character_notes WHERE id = ?");
    const result = stmt.run(noteId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Character note not found" });
    }

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error deleting character note:", error);
    res.status(500).json({ error: "Failed to delete character note" });
  }
});

// ==========================================
// QUESTS API
// ==========================================

app.get("/api/quests", (req, res) => {
  try {
    const campaignId = req.query.campaign_id;
    if (!campaignId) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    const quests = db
      .prepare("SELECT * FROM quests WHERE campaign_id = ? ORDER BY created_at DESC")
      .all(campaignId);
    res.json(quests);
  } catch (error) {
    console.error("Error fetching quests:", error);
    res.status(500).json({ error: "Failed to fetch quests" });
  }
});

app.post("/api/quests", (req, res) => {
  try {
    const {
      campaign_id,
      title,
      description,
      category,
      status,
      priority,
      assigned_players,
      location_id,
      session_id,
      objectives,
      rewards,
      notes,
    } = req.body;

    if (!campaign_id || !title) {
      return res
        .status(400)
        .json({ error: "Campaign ID and title are required" });
    }

    const id = `quest-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO quests (id, campaign_id, title, description, category, status, priority, assigned_players, location_id, session_id, objectives, rewards, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const result = stmt.run(
      id,
      campaign_id,
      title,
      description,
      category,
      status,
      priority,
      JSON.stringify(assigned_players || []),
      location_id,
      session_id,
      JSON.stringify(objectives || []),
      JSON.stringify(rewards || []),
      notes
    );

    res.json({ id, success: true, changes: result.changes });
  } catch (error) {
    console.error("Error creating quest:", error);
    res.status(500).json({ error: "Failed to create quest" });
  }
});

app.put("/api/quests/:id", (req, res) => {
  try {
    const {
      title,
      description,
      category,
      status,
      priority,
      assigned_players,
      location_id,
      session_id,
      objectives,
      rewards,
      notes,
    } = req.body;

    const stmt = db.prepare(`
      UPDATE quests 
      SET title = ?, description = ?, category = ?, status = ?, priority = ?, assigned_players = ?, location_id = ?, session_id = ?, objectives = ?, rewards = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      title,
      description,
      category,
      status,
      priority,
      JSON.stringify(assigned_players || []),
      location_id,
      session_id,
      JSON.stringify(objectives || []),
      JSON.stringify(rewards || []),
      notes,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Quest not found" });
    }

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error updating quest:", error);
    res.status(500).json({ error: "Failed to update quest" });
  }
});

app.delete("/api/quests/:id", (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM quests WHERE id = ?");
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Quest not found" });
    }
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error deleting quest:", error);
    res.status(500).json({ error: "Failed to delete quest" });
  }
});

// ==========================================
// NOTES API
// ==========================================

app.get("/api/notes", (req, res) => {
  try {
    const campaignId = req.query.campaign_id;
    if (!campaignId) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    const notes = db
      .prepare("SELECT * FROM notes WHERE campaign_id = ? ORDER BY updated_at DESC")
      .all(campaignId);
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

app.post("/api/notes", (req, res) => {
  try {
    const { campaign_id, title, content, category, tags, note_references } =
      req.body;

    if (!campaign_id || !title || !content) {
      return res
        .status(400)
        .json({ error: "Campaign ID, title, and content are required" });
    }

    const id = `note-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO notes (id, campaign_id, title, content, category, tags, note_references)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    const result = stmt.run(
      id,
      campaign_id,
      title,
      content,
      category,
      tags,
      note_references
    );

    res.json({ id, success: true, changes: result.changes });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

app.put("/api/notes/:id", (req, res) => {
  try {
    const { title, content, category, tags, note_references } = req.body;

    const stmt = db.prepare(`
      UPDATE notes 
      SET title = ?, content = ?, category = ?, tags = ?, note_references = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      title,
      content,
      category,
      tags,
      note_references,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
});

app.delete("/api/notes/:id", (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM notes WHERE id = ?");
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// ==========================================
// Ground Truth API
// ==========================================
app.get("/api/ground-truth", (req, res) => {
  try {
    const campaignId = req.query.campaign_id;
    if (!campaignId) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    const groundTruth = db
      .prepare("SELECT * FROM ground_truth WHERE campaign_id = ?")
      .all(campaignId);
    res.json(groundTruth);
  } catch (error) {
    console.error("Error fetching ground truth:", error);
    res.status(500).json({ error: "Failed to fetch ground truth" });
  }
});

app.post("/api/ground-truth", (req, res) => {
  try {
    const { campaign_id, source_type, source_id, content } = req.body;
    if (!campaign_id || !source_type || !content) {
      return res
        .status(400)
        .json({ error: "Campaign ID, source type, and content are required" });
    }
    const stmt = db.prepare(
      "INSERT INTO ground_truth (campaign_id, source_type, source_id, content) VALUES (?, ?, ?, ?)"
    );
    const result = stmt.run(campaign_id, source_type, source_id, content);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    console.error("Error creating ground truth:", error);
    res.status(500).json({ error: "Failed to create ground truth" });
  }
});

// Start server
app.listen(PORT, () => {
  createEnhancedTables(db);
  console.log(`Server is running on http://localhost:${PORT}`);
});