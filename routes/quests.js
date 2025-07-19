const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get("/", (req, res) => {
    try {
      const campaignId = req.query.campaign_id;
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }
      const quests = db
        .prepare(
          "SELECT * FROM quests WHERE campaign_id = ? ORDER BY created_at DESC"
        )
        .all(campaignId);

      const parsedQuests = quests.map((quest) => ({
        ...quest,
        assigned_players: JSON.parse(quest.assigned_players || "[]"),
        objectives: JSON.parse(quest.objectives || "[]"),
        rewards: JSON.parse(quest.rewards || "[]"),
      }));

      res.json(parsedQuests);
    } catch (error) {
      console.error("Error fetching quests:", error);
      res.status(500).json({ error: "Failed to fetch quests" });
    }
  });

  router.get("/:id", (req, res) => {
    try {
      const quest = db
        .prepare("SELECT * FROM quests WHERE id = ?")
        .get(req.params.id);
      if (!quest) {
        return res.status(404).json({ error: "Quest not found" });
      }

      quest.assigned_players = JSON.parse(quest.assigned_players || "[]");
      quest.objectives = JSON.parse(quest.objectives || "[]");
      quest.rewards = JSON.parse(quest.rewards || "[]");

      res.json(quest);
    } catch (error) {
      console.error("Error fetching quest:", error);
      res.status(500).json({ error: "Failed to fetch quest" });
    }
  });

  router.post("/", (req, res) => {
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

      // Return the created quest with full data
      const createdQuest = db
        .prepare("SELECT * FROM quests WHERE id = ?")
        .get(id);
      if (createdQuest) {
        createdQuest.assigned_players = JSON.parse(
          createdQuest.assigned_players || "[]"
        );
        createdQuest.objectives = JSON.parse(createdQuest.objectives || "[]");
        createdQuest.rewards = JSON.parse(createdQuest.rewards || "[]");
        res.json(createdQuest);
      } else {
        res.json({ id, success: true, changes: result.changes });
      }
    } catch (error) {
      console.error("Error creating quest:", error);
      res.status(500).json({ error: "Failed to create quest" });
    }
  });

  router.put("/:id", (req, res) => {
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

      // Return the updated quest with full data
      const updatedQuest = db
        .prepare("SELECT * FROM quests WHERE id = ?")
        .get(req.params.id);
      if (updatedQuest) {
        updatedQuest.assigned_players = JSON.parse(
          updatedQuest.assigned_players || "[]"
        );
        updatedQuest.objectives = JSON.parse(updatedQuest.objectives || "[]");
        updatedQuest.rewards = JSON.parse(updatedQuest.rewards || "[]");
        res.json(updatedQuest);
      } else {
        res.json({ success: true, changes: result.changes });
      }
    } catch (error) {
      console.error("Error updating quest:", error);
      res.status(500).json({ error: "Failed to update quest" });
    }
  });

  router.delete("/:id", (req, res) => {
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

  return router;
};
