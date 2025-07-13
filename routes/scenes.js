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

  return router;
};
