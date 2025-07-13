/**
 * PlayerArcCore - Data management and CRUD operations for player arcs
 * Handles API calls, data loading, and basic player arc operations
 */
import { DataManager } from "../../data-manager.js";

export default class PlayerArcCore {
  constructor(dataManager = null) {
    this.dataManager = dataManager || new DataManager();
    this.playerArcs = new Map();
    this.apiBase = "/api";
    this.initialized = false;
  }

  /**
   * Initialize the Player Arc Core
   */
  async init() {
    console.log("🎭 PlayerArcCore: Initializing...");

    try {
      // Load current campaign to get campaign context (only if not already loaded)
      if (!this.dataManager.currentCampaignId) {
        await this.dataManager.loadCurrentCampaign();
      }
      
      await this.loadPlayerArcs();
      this.initialized = true;
      console.log("✅ PlayerArcCore: Initialized successfully");
    } catch (error) {
      console.error("❌ PlayerArcCore: Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Load all player arcs from the database
   */
  async loadPlayerArcs() {
    try {
      console.log("🔄 Loading player arcs from API...");

      const response = await fetch(`${this.apiBase}/player-arcs?campaign_id=${this.dataManager.currentCampaignId}`);
      if (!response.ok) {
        if (response.status === 500) {
          console.log("📝 Player arcs API server error (500), using empty data - server may need restart");
        } else {
          throw new Error(`Failed to load player arcs: ${response.status}`);
        }
        // Initialize with empty data if server error
        this.playerArcs.clear();
        return [];
      }

      const arcs = await response.json();

      // Store arcs in the map
      this.playerArcs.clear();
      arcs.forEach((arc) => {
        this.playerArcs.set(arc.player_id, arc);
      });

      console.log(`✅ Loaded ${arcs.length} player arcs`);
      return arcs;
    } catch (error) {
      console.log("📝 Player arcs API error, using empty data:", error.message);
      // Initialize with empty data if API fails
      this.playerArcs.clear();
      return [];
    }
  }

  /**
   * Get a player's arc data
   * @param {string} playerId - The player's unique identifier
   * @returns {Object|null} Player arc data or null if not found
   */
  getPlayerArc(playerId) {
    return this.playerArcs.get(playerId) || null;
  }

  /**
   * Get all player arcs
   * @returns {Array} Array of all player arc objects
   */
  getAllPlayerArcs() {
    return Array.from(this.playerArcs.values());
  }

  /**
   * Create or update a player arc
   * @param {string} playerId - The player's unique identifier
   * @param {Object} arcData - The arc data to save
   */
  async savePlayerArc(playerId, arcData) {
    try {
      console.log(`🔄 Saving player arc for ${playerId}...`);

      const response = await fetch(`${this.apiBase}/player-arcs/${playerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arcData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save player arc: ${response.status}`);
      }

      const savedArc = await response.json();
      this.playerArcs.set(playerId, savedArc);

      console.log(`✅ Player arc saved for ${playerId}`);
      return savedArc;
    } catch (error) {
      console.error(`❌ Error saving player arc for ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new player arc
   * @param {string} playerId - The player's unique identifier
   * @param {Object} arcData - The initial arc data
   */
  async createPlayerArc(playerId, arcData) {
    const newArc = {
      playerId,
      playerName: arcData.playerName || "",
      characterName: arcData.characterName || "",
      backstory: arcData.backstory || "",
      personalityTraits: arcData.personalityTraits || "",
      goals: arcData.goals || [],
      milestones: arcData.milestones || [],
      relationships: arcData.relationships || [],
      notes: arcData.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.savePlayerArc(playerId, newArc);
  }

  /**
   * Update an existing player arc
   * @param {string} playerId - The player's unique identifier
   * @param {Object} updates - Partial updates to apply
   */
  async updatePlayerArc(playerId, updates) {
    const existingArc = this.getPlayerArc(playerId);
    if (!existingArc) {
      throw new Error(`Player arc not found for ${playerId}`);
    }

    const updatedArc = {
      ...existingArc,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return await this.savePlayerArc(playerId, updatedArc);
  }

  /**
   * Delete a player arc
   * @param {string} playerId - The player's unique identifier
   */
  async deletePlayerArc(playerId) {
    try {
      const response = await fetch(`${this.apiBase}/player-arcs/${playerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete player arc: ${response.status}`);
      }

      this.playerArcs.delete(playerId);
      console.log(`✅ Deleted player arc for ${playerId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting player arc for ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a player arc exists
   * @param {string} playerId - The player's unique identifier
   * @returns {boolean} True if arc exists
   */
  hasPlayerArc(playerId) {
    return this.playerArcs.has(playerId);
  }

  /**
   * Get player arcs by status (based on goals)
   * @param {string} status - Goal status to filter by
   * @returns {Array} Array of player arcs with goals matching the status
   */
  getPlayerArcsByGoalStatus(status) {
    return this.getAllPlayerArcs().filter((arc) => {
      if (!arc.goals || arc.goals.length === 0) return false;
      return arc.goals.some((goal) => goal.status === status);
    });
  }

  /**
   * Get player arcs with recent activity
   * @param {number} daysThreshold - Number of days to consider recent
   * @returns {Array} Array of recently updated player arcs
   */
  getRecentlyUpdatedArcs(daysThreshold = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    return this.getAllPlayerArcs().filter((arc) => {
      const updatedDate = new Date(arc.updatedAt);
      return updatedDate >= cutoffDate;
    });
  }

  /**
   * Search player arcs by text
   * @param {string} searchTerm - Text to search for
   * @returns {Array} Array of matching player arcs
   */
  searchPlayerArcs(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return this.getAllPlayerArcs();
    }

    const term = searchTerm.toLowerCase();
    return this.getAllPlayerArcs().filter((arc) => {
      return (
        arc.playerName?.toLowerCase().includes(term) ||
        arc.characterName?.toLowerCase().includes(term) ||
        arc.backstory?.toLowerCase().includes(term) ||
        arc.personalityTraits?.toLowerCase().includes(term) ||
        arc.notes?.toLowerCase().includes(term) ||
        arc.goals?.some(
          (goal) =>
            goal.title?.toLowerCase().includes(term) ||
            goal.description?.toLowerCase().includes(term)
        ) ||
        arc.milestones?.some(
          (milestone) =>
            milestone.title?.toLowerCase().includes(term) ||
            milestone.description?.toLowerCase().includes(term)
        )
      );
    });
  }

  /**
   * Get player arc statistics
   * @returns {Object} Statistics about player arcs
   */
  getPlayerArcStats() {
    const allArcs = this.getAllPlayerArcs();

    const stats = {
      totalArcs: allArcs.length,
      totalGoals: 0,
      totalMilestones: 0,
      goalsByStatus: {
        active: 0,
        completed: 0,
        failed: 0,
        paused: 0,
      },
      arcsWithGoals: 0,
      arcsWithMilestones: 0,
      averageGoalsPerArc: 0,
      averageMilestonesPerArc: 0,
    };

    allArcs.forEach((arc) => {
      if (arc.goals && arc.goals.length > 0) {
        stats.arcsWithGoals++;
        stats.totalGoals += arc.goals.length;

        arc.goals.forEach((goal) => {
          if (stats.goalsByStatus[goal.status] !== undefined) {
            stats.goalsByStatus[goal.status]++;
          }
        });
      }

      if (arc.milestones && arc.milestones.length > 0) {
        stats.arcsWithMilestones++;
        stats.totalMilestones += arc.milestones.length;
      }
    });

    stats.averageGoalsPerArc =
      allArcs.length > 0
        ? Math.round((stats.totalGoals / allArcs.length) * 10) / 10
        : 0;

    stats.averageMilestonesPerArc =
      allArcs.length > 0
        ? Math.round((stats.totalMilestones / allArcs.length) * 10) / 10
        : 0;

    return stats;
  }

  /**
   * Validate player arc data
   * @param {Object} arcData - Arc data to validate
   * @returns {Array} Array of validation errors
   */
  validatePlayerArcData(arcData) {
    const errors = [];

    if (!arcData.playerName || arcData.playerName.trim() === "") {
      errors.push("Player name is required");
    }

    if (!arcData.characterName || arcData.characterName.trim() === "") {
      errors.push("Character name is required");
    }

    if (arcData.playerName && arcData.playerName.length > 100) {
      errors.push("Player name must be less than 100 characters");
    }

    if (arcData.characterName && arcData.characterName.length > 100) {
      errors.push("Character name must be less than 100 characters");
    }

    if (arcData.backstory && arcData.backstory.length > 5000) {
      errors.push("Backstory must be less than 5000 characters");
    }

    if (arcData.personalityTraits && arcData.personalityTraits.length > 2000) {
      errors.push("Personality traits must be less than 2000 characters");
    }

    if (arcData.notes && arcData.notes.length > 5000) {
      errors.push("Notes must be less than 5000 characters");
    }

    return errors;
  }

  /**
   * Export player arc data
   * @param {string} playerId - Optional specific player ID, or null for all
   * @returns {Object} Exported data
   */
  exportPlayerArcData(playerId = null) {
    const arcs = playerId
      ? [this.getPlayerArc(playerId)].filter(Boolean)
      : this.getAllPlayerArcs();

    return {
      exportDate: new Date().toISOString(),
      arcCount: arcs.length,
      arcs: arcs,
      stats: this.getPlayerArcStats(),
    };
  }

  /**
   * Get all unique player IDs
   * @returns {Array} Array of player IDs
   */
  getAllPlayerIds() {
    return Array.from(this.playerArcs.keys());
  }

  /**
   * Check if system is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Refresh data from API
   * @returns {Promise<Array>} Updated player arcs
   */
  async refresh() {
    return await this.loadPlayerArcs();
  }
}
