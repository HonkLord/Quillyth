const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get("/", (req, res) => {
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

  router.post("/", (req, res) => {
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

  router.put("/:id", (req, res) => {
    try {
      const sessionId = req.params.id;
      const updates = req.body;

      const currentSession = db
        .prepare("SELECT * FROM sessions WHERE id = ?")
        .get(sessionId);
      if (!currentSession) {
        return res.status(404).json({ error: "Session not found" });
      }

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

  return router;
};
