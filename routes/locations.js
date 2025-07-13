const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get("/", (req, res) => {
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

  router.get("/:id", (req, res) => {
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

  router.post("/", (req, res) => {
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

  router.put("/:id", (req, res) => {
    try {
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

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(req.body[field]);
        }
      }

      if (updateFields.length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update" });
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(req.params.id);

      const sql = `UPDATE locations SET ${updateFields.join(", ")} WHERE id = ?`;
      
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

  return router;
};
