const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

module.exports = (db) => {
  // Get all characters (players + NPCs)
  router.get("/", (req, res) => {
    try {
      const campaignId = req.query.campaign_id;
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const players = db
        .prepare(
          "SELECT * FROM players WHERE campaign_id = ? AND status = 'active' ORDER BY name"
        )
        .all(campaignId);

      // Get NPCs from dedicated table
      const npcs = db
        .prepare(
          "SELECT * FROM npcs WHERE campaign_id = ? AND status = 'active' ORDER BY importance_level DESC, name"
        )
        .all(campaignId);

      // Fallback: Get NPCs from scene_characters for backwards compatibility
      const sceneNpcs = db
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

      const characters = {
        players: players.map((p) => ({
          id: p.id,
          name: p.name,
          class: p.class,
          subclass: p.subclass,
          level: p.level,
          race: p.race,
          background: p.background,
          description: p.description,
          type: "player",
          isPlayerCharacter: true,
        })),
        npcs: [
          // Dedicated NPCs with proper IDs
          ...npcs.map((n) => ({
            id: n.id,
            name: n.name,
            role: n.role,
            motivation: n.motivation,
            description: n.description,
            favorability: n.favorability,
            importance_level: n.importance_level,
            status: n.status,
            type: "npc",
            isPlayerCharacter: false,
          })),
          // Legacy NPCs from scene_characters (with generated IDs for compatibility)
          ...sceneNpcs
            .filter(
              (sn) =>
                !npcs.some(
                  (n) => n.name.toLowerCase() === sn.name.toLowerCase()
                )
            )
            .map((n) => ({
              id: `legacy-npc-${n.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-")}`,
              name: n.name,
              role: n.role,
              motivation: n.motivation,
              favorability: Math.round(n.favorability || 50),
              type: "npc",
              isPlayerCharacter: false,
              isLegacy: true,
            })),
        ],
      };

      res.json(characters);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  // Get important NPCs
  router.get("/important-npcs", (req, res) => {
    try {
      const campaignId = req.query.campaign_id;
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

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
      res.json([]);
    }
  });

  // Get character progression data
  router.get("/progression", (req, res) => {
    try {
      const campaignId = req.query.campaign_id;
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

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
      res.json({});
    }
  });

  // Get specific character by ID
  router.get("/:id", (req, res) => {
    try {
      const characterId = req.params.id;

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

      // Look up NPC in dedicated NPCs table
      const npc = db
        .prepare("SELECT * FROM npcs WHERE id = ?")
        .get(characterId);

      if (npc) {
        res.json({
          ...npc,
          type: "npc",
          isPlayerCharacter: false,
        });
        return;
      }

      // Fallback: Look up NPC in scene_characters for backwards compatibility
      const sceneNpc = db
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
          WHERE sc.character_id = ? AND sc.character_type = 'npc'
          GROUP BY sc.character_name
        `
        )
        .get(characterId);

      if (sceneNpc) {
        res.json({
          id: characterId,
          name: sceneNpc.name,
          role: sceneNpc.role,
          motivation: sceneNpc.motivation,
          favorability: Math.round(sceneNpc.favorability || 50),
          type: "npc",
          isPlayerCharacter: false,
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
  router.post("/", (req, res) => {
    try {
      const { type, ...characterData } = req.body;

      if (type === "player") {
        const {
          campaign_id,
          name,
          class: playerClass,
          subclass,
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
          INSERT INTO players (id, campaign_id, name, class, subclass, level, background, race, description, backstory, goals, patron_spirits, icon, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);

        const id = `player-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const result = stmt.run(
          id,
          campaign_id,
          name,
          playerClass || "",
          subclass || "",
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
  router.put("/:id", (req, res) => {
    try {
      const characterId = req.params.id;
      const { type, ...characterData } = req.body;

      if (type === "player") {
        const {
          name,
          class: playerClass,
          subclass,
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
          SET name = ?, class = ?, subclass = ?, level = ?, background = ?, race = ?, description = ?, backstory = ?, goals = ?, patron_spirits = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        const result = stmt.run(
          name,
          playerClass || "",
          subclass || "",
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
  router.delete("/:id", (req, res) => {
    try {
      const characterId = req.params.id;

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
  // PLAYER ARCS API
  // ==========================================

  router.get("/:playerId/arcs", (req, res) => {
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

  router.get("/:playerId/arcs/:arcType", (req, res) => {
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

  router.post("/:playerId/arcs", (req, res) => {
    try {
      console.log(`[ARCS] Creating new arc for player ${req.params.playerId}`);
      console.log(`[ARCS] Body:`, req.body);
      const {
        campaign_id,
        arc_type,
        title,
        content,
        status,
        importance_weight,
        session_notes,
      } = req.body;

      if (!campaign_id) {
        console.error("[ARCS] Missing campaign_id");
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const stmt = db.prepare(`
        INSERT INTO player_arcs (player_id, campaign_id, arc_type, title, content, status, importance_weight, session_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `);

      const result = stmt.run(
        req.params.playerId,
        campaign_id,
        arc_type,
        title,
        content,
        status || "active",
        importance_weight || 50,
        session_notes || ""
      );

      console.log(`[ARCS] Insert successful, ID: ${result.lastInsertRowid}`);
      res.json({
        id: result.lastInsertRowid,
        success: true,
        changes: result.changes,
      });
    } catch (error) {
      console.error("CRITICAL ERROR", error);
      res
        .status(500)
        .json({ error: "Failed to create player arc", details: error.message });
    }
  });

  router.put("/:playerId/arcs/:arcId", (req, res) => {
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

  router.delete("/:playerId/arcs/:arcId", (req, res) => {
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

  router.get("/:characterId/notes", (req, res) => {
    try {
      const { characterId } = req.params;
      const { character_type = "player", campaign_id } = req.query;

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

  router.post("/:characterId/notes", (req, res) => {
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

      const id = uuidv4();

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

  router.put("/:characterId/notes/:noteId", (req, res) => {
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

  router.delete("/:characterId/notes/:noteId", (req, res) => {
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

  // ===== NPC MANAGEMENT ENDPOINTS =====

  // Create new NPC
  router.post("/npcs", (req, res) => {
    try {
      const {
        campaign_id,
        name,
        role,
        motivation,
        description,
        favorability = 50,
        importance_level = "minor",
        first_appearance_scene = null,
      } = req.body;

      // Favorability validation
      const favorabilityNum = Number(favorability);
      if (
        isNaN(favorabilityNum) ||
        favorabilityNum < 0 ||
        favorabilityNum > 100
      ) {
        return res.status(400).json({
          error: "Favorability must be a number between 0 and 100",
        });
      }

      if (!name || !campaign_id) {
        return res
          .status(400)
          .json({ error: "Name and campaign_id are required" });
      }

      const id = `npc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const stmt = db.prepare(`
        INSERT INTO npcs (
          id, campaign_id, name, role, motivation, description, 
          favorability, importance_level, first_appearance_scene
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        id,
        campaign_id,
        name,
        role,
        motivation,
        description,
        favorabilityNum,
        importance_level,
        first_appearance_scene
      );

      const newNPC = {
        id,
        campaign_id,
        name,
        role,
        motivation,
        description,
        favorability: favorabilityNum,
        importance_level,
        status: "active",
        first_appearance_scene,
        type: "npc",
        isPlayerCharacter: false,
      };

      res.status(201).json(newNPC);
    } catch (error) {
      console.error("Error creating NPC:", error);
      res.status(500).json({ error: "Failed to create NPC" });
    }
  });

  // Update existing NPC
  router.put("/npcs/:npcId", (req, res) => {
    try {
      const { npcId } = req.params;
      const {
        name,
        role,
        motivation,
        description,
        favorability,
        importance_level,
        status,
      } = req.body;

      // Favorability validation
      const favorabilityNum = Number(favorability);
      if (
        isNaN(favorabilityNum) ||
        favorabilityNum < 0 ||
        favorabilityNum > 100
      ) {
        return res.status(400).json({
          error: "Favorability must be a number between 0 and 100",
        });
      }

      const stmt = db.prepare(`
        UPDATE npcs 
        SET name = ?, role = ?, motivation = ?, description = ?, 
            favorability = ?, importance_level = ?, status = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        name,
        role,
        motivation,
        description,
        favorabilityNum,
        importance_level,
        status,
        npcId
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "NPC not found" });
      }

      // Return updated NPC
      const updatedNPC = db
        .prepare("SELECT * FROM npcs WHERE id = ?")
        .get(npcId);
      res.json({ ...updatedNPC, type: "npc", isPlayerCharacter: false });
    } catch (error) {
      console.error("Error updating NPC:", error);
      res.status(500).json({ error: "Failed to update NPC" });
    }
  });

  // Delete NPC
  router.delete("/npcs/:npcId", (req, res) => {
    try {
      const { npcId } = req.params;

      // Soft delete by setting status to 'inactive'
      const stmt = db.prepare(`
        UPDATE npcs 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(npcId);

      if (result.changes === 0) {
        return res.status(404).json({ error: "NPC not found" });
      }

      res.json({ success: true, message: "NPC deactivated successfully" });
    } catch (error) {
      console.error("Error deleting NPC:", error);
      res.status(500).json({ error: "Failed to delete NPC" });
    }
  });

  return router;
};
