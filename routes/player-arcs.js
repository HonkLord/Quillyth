const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get all player arcs
  router.get("/", (req, res) => {
    try {
      const campaignId = req.query.campaign_id;
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const playerArcs = db
        .prepare(
          `SELECT 
            id,
            campaign_id,
            player_id,
            arc_type,
            title,
            content,
            status,
            importance_weight,
            session_notes,
            created_at,
            updated_at
          FROM player_arcs 
          WHERE campaign_id = ?
          ORDER BY created_at DESC`
        )
        .all(campaignId);

      // Parse JSON fields if they exist
      const processedArcs = playerArcs.map(arc => ({
        ...arc,
        // Try to parse session_notes as JSON if it's a JSON string, otherwise keep as text
        session_notes: (() => {
          try {
            return arc.session_notes ? JSON.parse(arc.session_notes) : [];
          } catch {
            return arc.session_notes || "";
          }
        })()
      }));

      res.json(processedArcs);
    } catch (error) {
      console.error("Error fetching player arcs:", error);
      res.status(500).json({ error: "Failed to fetch player arcs" });
    }
  });

  // Get specific player arc
  router.get("/:playerId", (req, res) => {
    try {
      const { playerId } = req.params;
      const campaignId = req.query.campaign_id;

      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const playerArc = db
        .prepare(
          `SELECT * FROM player_arcs 
          WHERE campaign_id = ? AND player_id = ?`
        )
        .get(campaignId, playerId);

      if (!playerArc) {
        return res.status(404).json({ error: "Player arc not found" });
      }

      // Parse JSON fields if they exist
      const processedArc = {
        ...playerArc,
        // Try to parse session_notes as JSON if it's a JSON string, otherwise keep as text
        session_notes: (() => {
          try {
            return playerArc.session_notes ? JSON.parse(playerArc.session_notes) : [];
          } catch {
            return playerArc.session_notes || "";
          }
        })()
      };

      res.json(processedArc);
    } catch (error) {
      console.error("Error fetching player arc:", error);
      res.status(500).json({ error: "Failed to fetch player arc" });
    }
  });

  // Create new player arc
  router.post("/", (req, res) => {
    try {
      const {
        campaign_id,
        player_id,
        arc_type = 'personal',
        title,
        content,
        status = 'active',
        importance_weight = 1,
        session_notes = ""
      } = req.body;

      if (!campaign_id || !player_id || !title) {
        return res.status(400).json({ 
          error: "Campaign ID, player ID, and title are required" 
        });
      }

      const result = db
        .prepare(
          `INSERT INTO player_arcs 
          (campaign_id, player_id, arc_type, title, content, status, importance_weight, session_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          campaign_id, player_id, arc_type, title, content, status, importance_weight,
          typeof session_notes === 'object' ? JSON.stringify(session_notes) : session_notes
        );

      res.status(201).json({
        id: result.lastInsertRowid,
        campaign_id,
        player_id,
        arc_type,
        title,
        content,
        status,
        importance_weight,
        session_notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error creating player arc:", error);
      res.status(500).json({ error: "Failed to create player arc" });
    }
  });

  // Update player arc
  router.put("/:playerId", (req, res) => {
    try {
      const { playerId } = req.params;
      const {
        campaign_id,
        arc_type,
        title,
        content,
        status,
        importance_weight,
        session_notes
      } = req.body;

      if (!campaign_id) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const result = db
        .prepare(
          `UPDATE player_arcs 
          SET arc_type = ?, title = ?, content = ?, status = ?,
              importance_weight = ?, session_notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE campaign_id = ? AND player_id = ?`
        )
        .run(
          arc_type, title, content, status, importance_weight,
          typeof session_notes === 'object' ? JSON.stringify(session_notes) : session_notes,
          campaign_id, playerId
        );

      if (result.changes === 0) {
        return res.status(404).json({ error: "Player arc not found" });
      }

      res.json({ message: "Player arc updated successfully" });
    } catch (error) {
      console.error("Error updating player arc:", error);
      res.status(500).json({ error: "Failed to update player arc" });
    }
  });

  // Delete player arc
  router.delete("/:playerId", (req, res) => {
    try {
      const { playerId } = req.params;
      const { campaign_id } = req.query;

      if (!campaign_id) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const result = db
        .prepare(
          `DELETE FROM player_arcs 
          WHERE campaign_id = ? AND player_id = ?`
        )
        .run(campaign_id, playerId);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Player arc not found" });
      }

      res.json({ message: "Player arc deleted successfully" });
    } catch (error) {
      console.error("Error deleting player arc:", error);
      res.status(500).json({ error: "Failed to delete player arc" });
    }
  });

  return router;
};