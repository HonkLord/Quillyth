
const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/campaigns
  router.get("/", (req, res) => {
    try {
      const campaigns = db.prepare("SELECT * FROM campaigns").all();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // GET /api/campaigns/current
  router.get("/current", (req, res) => {
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

  // GET /api/campaigns/:id
  router.get("/:id", (req, res) => {
    try {
      const campaign = db
        .prepare("SELECT * FROM campaigns WHERE id = ?")
        .get(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

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

  // PUT /api/campaigns/:id
  router.put("/:id", (req, res) => {
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

  // POST /api/campaigns
  router.post("/", (req, res) => {
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

      stmt.run(
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

  return router;
};
