const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");

module.exports = (db) => {
  // Get single scene
  router.get("/:id", (req, res) => {
    try {
      const sceneId = req.params.id;

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

  router.get("/", (req, res) => {
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
          currentOptions: [],
        };
      });

      res.json(scenesWithCharacters);
    } catch (error) {
      console.error("Error fetching scenes:", error);
      res.status(500).json({ error: "Failed to fetch scenes" });
    }
  });

  router.post("/", (req, res) => {
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

      // Validate location_id exists if provided
      if (location_id) {
        const locationExists = db
          .prepare("SELECT 1 FROM locations WHERE id = ?")
          .get(location_id);
        if (!locationExists) {
          return res
            .status(400)
            .json({ error: "Provided location_id does not exist" });
        }
      }

      const id =
        name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();

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

      if (characters && characters.length > 0) {
        const charStmt = db.prepare(`
          INSERT INTO scene_characters (
            scene_id, character_id, character_type, character_name, 
            role, motivation, favorability, history
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `);

        characters.forEach((char) => {
          let charId = char.id;
          if (!charId) {
            // Generate a unique character ID based on name, timestamp, and random string
            const base = char.name
              ? char.name.toLowerCase().replace(/[^a-z0-9]/g, "-")
              : "char";
            const uniqueSuffix =
              Date.now().toString() +
              "-" +
              Math.random().toString(36).substring(2, 8);
            charId = `${base}-${uniqueSuffix}`;
            // Fallback to UUID if still not unique enough
            // (in practice, this is extremely unlikely, but for completeness)
            // Optionally, you could check for collisions in the DB here if needed
          }
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

  router.put("/:id", (req, res) => {
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

      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Scene name is required" });
      }

      const existingScene = db
        .prepare("SELECT id FROM scenes WHERE id = ?")
        .get(sceneId);
      if (!existingScene) {
        return res.status(404).json({ error: "Scene not found" });
      }

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

      if (characters !== undefined) {
        const deleteCharStmt = db.prepare(
          "DELETE FROM scene_characters WHERE scene_id = ?"
        );
        deleteCharStmt.run(sceneId);

        if (characters && characters.length > 0) {
          const charStmt = db.prepare(`
            INSERT INTO scene_characters (
              scene_id, character_id, character_type, character_name, 
              role, motivation, favorability, history
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
          `);

          characters.forEach((char) => {
            let charId = char.id;
            if (!charId) {
              // Generate a unique character ID based on name, timestamp, and random string (same as POST)
              const base = char.name
                ? char.name.toLowerCase().replace(/[^a-z0-9]/g, "-")
                : "char";
              const uniqueSuffix =
                Date.now().toString() +
                "-" +
                Math.random().toString(36).substring(2, 8);
              charId = `${base}-${uniqueSuffix}`;
              // Optionally, fallback to UUID if needed (require('crypto').randomUUID())
            }
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

  router.delete("/:id", (req, res) => {
    try {
      const sceneId = req.params.id;

      const scene = db
        .prepare("SELECT * FROM scenes WHERE id = ?")
        .get(sceneId);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }

      const deleteTransaction = db.transaction(() => {
        const deleteCharacters = db.prepare(
          "DELETE FROM scene_characters WHERE scene_id = ?"
        );
        const charactersResult = deleteCharacters.run(sceneId);

        const deleteCards = db.prepare(
          "DELETE FROM scene_cards WHERE scene_id = ?"
        );
        const cardsResult = deleteCards.run(sceneId);

        const deleteActorStates = db.prepare(
          "DELETE FROM scene_actor_states WHERE scene_id = ?"
        );
        const actorStatesResult = deleteActorStates.run(sceneId);

        const deleteScene = db.prepare("DELETE FROM scenes WHERE id = ?");
        const sceneResult = deleteScene.run(sceneId);

        return {
          scene: sceneResult.changes,
          characters: charactersResult.changes,
          cards: cardsResult.changes,
          actorStates: actorStatesResult.changes,
        };
      });

      const results = deleteTransaction();

      if (results.scene > 0) {
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

  // Actor State Management Endpoints
  router.post("/:id/actor-states", (req, res) => {
    try {
      const sceneId = req.params.id;
      const { characterId, characterType, thought, action, metadata } =
        req.body;

      // Validate required fields
      if (!characterId || !characterType) {
        return res.status(400).json({
          error: "characterId and characterType are required",
        });
      }

      // Validate character type
      if (!["pc", "npc"].includes(characterType)) {
        return res.status(400).json({
          error: "characterType must be 'pc' or 'npc'",
        });
      }

      // Check if scene exists
      const scene = db
        .prepare("SELECT id FROM scenes WHERE id = ?")
        .get(sceneId);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }

      // Check if character belongs to this scene
      const characterInScene = db
        .prepare(
          "SELECT id FROM scene_characters WHERE scene_id = ? AND character_id = ?"
        )
        .get(sceneId, characterId);
      if (!characterInScene) {
        return res.status(404).json({
          error:
            "Character not found in this scene. Please add the character to the scene first.",
        });
      }

      // Insert actor state
      const insertStmt = db.prepare(`
        INSERT INTO scene_actor_states (
          scene_id, character_id, character_type, thought, action, metadata
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      // Validate metadata size before storing
      const metadataString = metadata ? JSON.stringify(metadata) : "{}";
      const MAX_METADATA_SIZE = 10000; // 10KB limit

      if (metadataString.length > MAX_METADATA_SIZE) {
        return res.status(400).json({
          error: `Metadata too large. Maximum size is ${MAX_METADATA_SIZE} characters, got ${metadataString.length}`,
        });
      }

      const result = insertStmt.run(
        sceneId,
        characterId,
        characterType,
        thought || null,
        action || null,
        metadataString
      );

      res.json({
        success: true,
        id: result.lastInsertRowid,
        message: "Actor state saved successfully",
      });
    } catch (error) {
      console.error("Error saving actor state:", error);
      res.status(500).json({ error: "Failed to save actor state" });
    }
  });

  router.get("/:id/actor-states", (req, res) => {
    try {
      const sceneId = req.params.id;
      const { characterId, limit, offset } = req.query;

      // Check if scene exists
      const scene = db
        .prepare("SELECT id FROM scenes WHERE id = ?")
        .get(sceneId);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }

      // Validate and parse pagination parameters
      let parsedLimit = 50; // Default limit
      let parsedOffset = 0; // Default offset

      if (limit !== undefined) {
        parsedLimit = parseInt(limit, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
          return res.status(400).json({
            error: "Limit must be a positive integer between 1 and 1000",
          });
        }
      }

      if (offset !== undefined) {
        parsedOffset = parseInt(offset, 10);
        if (isNaN(parsedOffset) || parsedOffset < 0) {
          return res.status(400).json({
            error: "Offset must be a non-negative integer",
          });
        }
      }

      let query = `
        SELECT id, character_id, character_type, thought, action, 
               timestamp, metadata
        FROM scene_actor_states 
        WHERE scene_id = ?
      `;
      const params = [sceneId];

      if (characterId) {
        query += " AND character_id = ?";
        params.push(characterId);
      }

      query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
      params.push(parsedLimit, parsedOffset);

      const actorStates = db.prepare(query).all(...params);

      // Parse metadata JSON
      const parsedStates = actorStates.map((state) => ({
        ...state,
        metadata: state.metadata ? JSON.parse(state.metadata) : {},
      }));

      // Get total count for pagination info
      let countQuery = `
        SELECT COUNT(*) as total
        FROM scene_actor_states 
        WHERE scene_id = ?
      `;
      const countParams = [sceneId];

      if (characterId) {
        countQuery += " AND character_id = ?";
        countParams.push(characterId);
      }

      const totalCount = db.prepare(countQuery).get(...countParams).total;

      res.json({
        data: parsedStates,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: totalCount,
          hasMore: parsedOffset + parsedLimit < totalCount,
        },
      });
    } catch (error) {
      console.error("Error fetching actor states:", error);
      res.status(500).json({ error: "Failed to fetch actor states" });
    }
  });

  router.delete("/:id/actor-states/:stateId", (req, res) => {
    try {
      const { id: sceneId, stateId } = req.params;

      // Check if scene exists
      const scene = db
        .prepare("SELECT id FROM scenes WHERE id = ?")
        .get(sceneId);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }

      // Delete specific actor state
      const deleteStmt = db.prepare(`
        DELETE FROM scene_actor_states 
        WHERE id = ? AND scene_id = ?
      `);

      const result = deleteStmt.run(stateId, sceneId);

      if (result.changes > 0) {
        res.json({
          success: true,
          message: "Actor state deleted successfully",
        });
      } else {
        res.status(404).json({ error: "Actor state not found" });
      }
    } catch (error) {
      console.error("Error deleting actor state:", error);
      res.status(500).json({ error: "Failed to delete actor state" });
    }
  });

  return router;
};
