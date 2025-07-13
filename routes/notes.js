const express = require('express');
const router = express.Router();

function safeJsonParse(jsonString, defaultValue = []) {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

module.exports = (db) => {
  router.get("/", (req, res) => {
    try {
      const campaignId = req.query.campaign_id;
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }
      const notes = db
        .prepare("SELECT * FROM notes WHERE campaign_id = ? ORDER BY updated_at DESC")
        .all(campaignId);

      const parsedNotes = notes.map(note => ({
        ...note,
        tags: safeJsonParse(note.tags, []),
        note_references: safeJsonParse(note.note_references, []),
      }));

      res.json(parsedNotes.map(n => ({...n, tags: Array.isArray(n.tags) ? n.tags : [n.tags]})));
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  router.get("/:id", (req, res) => {
    try {
      const note = db.prepare("SELECT * FROM notes WHERE id = ?").get(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      note.tags = safeJsonParse(note.tags, []);
      note.note_references = safeJsonParse(note.note_references, []);

      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  router.post("/", (req, res) => {
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
        JSON.stringify(tags || []),
        JSON.stringify(note_references || [])
      );

      res.json({ id, success: true, changes: result.changes });
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  router.put("/:id", (req, res) => {
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
        JSON.stringify(tags || []),
        JSON.stringify(note_references || []),
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

  router.delete("/:id", (req, res) => {
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

  return router;
};
