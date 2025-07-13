const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get all character relationships
  router.get("/", (req, res) => {
    try {
      const campaignId = req.query.campaign_id;
      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const relationships = db
        .prepare(
          `SELECT 
            from_character_id,
            to_character_id,
            relationship_type,
            description,
            created_at,
            updated_at
          FROM character_relationships 
          WHERE campaign_id = ?
          ORDER BY from_character_id, to_character_id`
        )
        .all(campaignId);

      res.json(relationships);
    } catch (error) {
      console.error("Error fetching character relationships:", error);
      res.status(500).json({ error: "Failed to fetch character relationships" });
    }
  });

  // Save bulk character relationships (from frontend relationship matrix)
  router.post("/", (req, res) => {
    try {
      const relationshipMatrix = req.body;
      const campaignId = req.query.campaign_id || 'campaign-4-old-cistern'; // Fallback for now
      
      // Check if this is a single relationship or bulk data
      if (relationshipMatrix.campaign_id && relationshipMatrix.from_character_id) {
        // Single relationship format
        const { 
          campaign_id, 
          from_character_id, 
          to_character_id, 
          relationship_type, 
          description 
        } = relationshipMatrix;

        if (!campaign_id || !from_character_id || !to_character_id || !relationship_type) {
          return res.status(400).json({ 
            error: "Campaign ID, from/to character IDs, and relationship type are required" 
          });
        }

        const relationshipId = `rel_${from_character_id}_${to_character_id}_${Date.now()}`;
        const result = db
          .prepare(
            `INSERT OR REPLACE INTO character_relationships 
            (id, campaign_id, from_character_id, from_character_type, to_character_id, to_character_type, relationship_type, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(relationshipId, campaign_id, from_character_id, 'player', to_character_id, 'player', relationship_type, description || null);

        return res.status(201).json({
          id: result.lastInsertRowid,
          campaign_id,
          from_character_id,
          to_character_id,
          relationship_type,
          description
        });
      }

      // Bulk relationship matrix format
      // Clear existing relationships for this campaign first
      db.prepare(`DELETE FROM character_relationships WHERE campaign_id = ?`).run(campaignId);
      
      // Insert new relationships
      const insertStmt = db.prepare(
        `INSERT INTO character_relationships 
        (id, campaign_id, from_character_id, from_character_type, to_character_id, to_character_type, relationship_type, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );

      let insertedCount = 0;
      Object.entries(relationshipMatrix).forEach(([fromCharId, relationships]) => {
        Object.entries(relationships).forEach(([toCharId, relationship]) => {
          const relationshipId = `rel_${fromCharId}_${toCharId}_${Date.now()}`;
          insertStmt.run(
            relationshipId,
            campaignId,
            fromCharId,
            'player', // Default to player for now, could be enhanced later
            toCharId,
            'player', // Default to player for now, could be enhanced later
            relationship.type || 'neutral',
            relationship.description || null
          );
          insertedCount++;
        });
      });

      res.json({ 
        message: `Successfully saved ${insertedCount} relationships`,
        campaign_id: campaignId 
      });
    } catch (error) {
      console.error("Error saving character relationships:", error);
      res.status(500).json({ error: "Failed to save character relationships" });
    }
  });

  // Update character relationship
  router.put("/:fromId/:toId", (req, res) => {
    try {
      const { fromId, toId } = req.params;
      const { relationship_type, description, campaign_id } = req.body;

      if (!campaign_id) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const result = db
        .prepare(
          `UPDATE character_relationships 
          SET relationship_type = ?, description = ?, updated_at = CURRENT_TIMESTAMP
          WHERE campaign_id = ? AND from_character_id = ? AND to_character_id = ?`
        )
        .run(relationship_type, description || null, campaign_id, fromId, toId);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Character relationship not found" });
      }

      res.json({ message: "Character relationship updated successfully" });
    } catch (error) {
      console.error("Error updating character relationship:", error);
      res.status(500).json({ error: "Failed to update character relationship" });
    }
  });

  // Delete character relationship
  router.delete("/:fromId/:toId", (req, res) => {
    try {
      const { fromId, toId } = req.params;
      const { campaign_id } = req.query;

      if (!campaign_id) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      const result = db
        .prepare(
          `DELETE FROM character_relationships 
          WHERE campaign_id = ? AND from_character_id = ? AND to_character_id = ?`
        )
        .run(campaign_id, fromId, toId);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Character relationship not found" });
      }

      res.json({ message: "Character relationship deleted successfully" });
    } catch (error) {
      console.error("Error deleting character relationship:", error);
      res.status(500).json({ error: "Failed to delete character relationship" });
    }
  });

  return router;
};