/**
 * PlayerArcManager - Coordinator for player arc management
 * Orchestrates PlayerArcCore, PlayerArcProgression, and PlayerArcUI modules
 * Provides clean public API for player arc functionality
 */
import PlayerArcCore from "./player-arc-core.js";
import PlayerArcProgression from "./player-arc-progression.js";
import PlayerArcUI from "./player-arc-ui.js";

export default class PlayerArcManager {
  constructor() {
    this.core = new PlayerArcCore();
    this.progression = new PlayerArcProgression(this.core);
    this.ui = new PlayerArcUI(this.core, this.progression);
    this.initialized = false;
  }

  /**
   * Initialize the Player Arc Manager
   */
  async init() {
    try {
      console.log("🎭 PlayerArcManager: Initializing...");

      await this.core.init();
      this.initialized = true;

      console.log("✅ PlayerArcManager: Initialized successfully");

      // Show initial overview
      this.showPlayerArcOverview();
    } catch (error) {
      console.error("❌ PlayerArcManager: Initialization failed:", error);
      throw error;
    }
  }

  // ===========================================
  // PUBLIC API - Core Operations
  // ===========================================

  /**
   * Show the player arc overview interface
   */
  showPlayerArcOverview() {
    this.ui.showPlayerArcOverview();
  }

  /**
   * Create a new player arc
   * @param {string} playerId - Unique player identifier
   * @param {Object} arcData - Player arc data
   * @returns {Promise<Object>} Created player arc
   */
  async createPlayerArc(playerId, arcData) {
    return await this.core.createPlayerArc(playerId, arcData);
  }

  /**
   * Get a player's arc data
   * @param {string} playerId - The player's unique identifier
   * @returns {Object|null} Player arc data
   */
  getPlayerArc(playerId) {
    return this.core.getPlayerArc(playerId);
  }

  /**
   * Get all player arcs
   * @returns {Array} Array of all player arcs
   */
  getAllPlayerArcs() {
    return this.core.getAllPlayerArcs();
  }

  /**
   * Update a player arc
   * @param {string} playerId - The player's unique identifier
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated player arc
   */
  async updatePlayerArc(playerId, updates) {
    return await this.core.updatePlayerArc(playerId, updates);
  }

  /**
   * Delete a player arc
   * @param {string} playerId - The player's unique identifier
   * @returns {Promise<boolean>} Success status
   */
  async deletePlayerArc(playerId) {
    return await this.core.deletePlayerArc(playerId);
  }

  // ===========================================
  // PUBLIC API - Goal Management
  // ===========================================

  /**
   * Add a goal to a player's arc
   * @param {string} playerId - The player's unique identifier
   * @param {Object} goalData - Goal data
   * @returns {Promise<Object>} Created goal
   */
  async addGoal(playerId, goalData) {
    return await this.progression.addGoal(playerId, goalData);
  }

  /**
   * Update a goal's status
   * @param {string} playerId - The player's unique identifier
   * @param {string} goalId - The goal's unique identifier
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated goal
   */
  async updateGoalStatus(playerId, goalId, status) {
    return await this.progression.updateGoalStatus(playerId, goalId, status);
  }

  /**
   * Update goal progress
   * @param {string} playerId - The player's unique identifier
   * @param {string} goalId - The goal's unique identifier
   * @param {number} progress - Progress percentage
   * @param {number} currentValue - Current value (optional)
   * @returns {Promise<Object>} Updated goal
   */
  async updateGoalProgress(playerId, goalId, progress, currentValue = null) {
    return await this.progression.updateGoalProgress(
      playerId,
      goalId,
      progress,
      currentValue
    );
  }

  /**
   * Remove a goal
   * @param {string} playerId - The player's unique identifier
   * @param {string} goalId - The goal's unique identifier
   * @returns {Promise<Object>} Removed goal
   */
  async removeGoal(playerId, goalId) {
    return await this.progression.removeGoal(playerId, goalId);
  }

  /**
   * Get goals by status
   * @param {string} playerId - The player's unique identifier
   * @param {string} status - Goal status
   * @returns {Array} Filtered goals
   */
  getGoalsByStatus(playerId, status) {
    return this.progression.getGoalsByStatus(playerId, status);
  }

  /**
   * Get overdue goals for a player
   * @param {string} playerId - The player's unique identifier
   * @returns {Array} Overdue goals
   */
  getOverdueGoals(playerId) {
    return this.progression.getOverdueGoals(playerId);
  }

  // ===========================================
  // PUBLIC API - Milestone Management
  // ===========================================

  /**
   * Add a milestone to a player's arc
   * @param {string} playerId - The player's unique identifier
   * @param {Object} milestoneData - Milestone data
   * @returns {Promise<Object>} Created milestone
   */
  async addMilestone(playerId, milestoneData) {
    return await this.progression.addMilestone(playerId, milestoneData);
  }

  /**
   * Remove a milestone
   * @param {string} playerId - The player's unique identifier
   * @param {string} milestoneId - The milestone's unique identifier
   * @returns {Promise<Object>} Removed milestone
   */
  async removeMilestone(playerId, milestoneId) {
    return await this.progression.removeMilestone(playerId, milestoneId);
  }

  /**
   * Get milestone timeline for a player
   * @param {string} playerId - The player's unique identifier
   * @returns {Array} Sorted milestones
   */
  getMilestoneTimeline(playerId) {
    return this.progression.getMilestoneTimeline(playerId);
  }

  /**
   * Get recent milestones across all players
   * @param {number} daysBack - Days to look back
   * @returns {Array} Recent milestones
   */
  getRecentMilestones(daysBack = 30) {
    return this.progression.getRecentMilestones(daysBack);
  }

  // ===========================================
  // PUBLIC API - UI Operations
  // ===========================================

  /**
   * View detailed arc information
   * @param {string} playerId - The player's unique identifier
   */
  viewArcDetails(playerId) {
    this.ui.viewArcDetails(playerId);
  }

  /**
   * Show modal for creating a new player arc
   */
  showCreateArcModal() {
    this.ui.showCreateArcModal();
  }

  /**
   * Show modal for adding a goal
   * @param {string} playerId - The player's unique identifier
   */
  showAddGoalModal(playerId) {
    this.ui.showAddGoalModal(playerId);
  }

  /**
   * Show modal for adding a milestone
   * @param {string} playerId - The player's unique identifier
   */
  showAddMilestoneModal(playerId) {
    this.ui.showAddMilestoneModal(playerId);
  }

  /**
   * Edit an existing player arc
   * @param {string} playerId - The player's unique identifier
   */
  editArc(playerId) {
    this.ui.editArc(playerId);
  }

  // ===========================================
  // PUBLIC API - Analytics & Reports
  // ===========================================

  /**
   * Get player arc statistics
   * @returns {Object} Comprehensive statistics
   */
  getPlayerArcStats() {
    return this.core.getPlayerArcStats();
  }

  /**
   * Calculate goal completion rate for a player
   * @param {string} playerId - The player's unique identifier
   * @returns {Object} Completion statistics
   */
  calculateGoalCompletionRate(playerId) {
    return this.progression.calculateGoalCompletionRate(playerId);
  }

  /**
   * Generate progression report for a player
   * @param {string} playerId - The player's unique identifier
   * @returns {Object} Comprehensive progression report
   */
  generateProgressionReport(playerId) {
    return this.progression.generateProgressionReport(playerId);
  }

  /**
   * Search player arcs by text
   * @param {string} searchTerm - Search term
   * @returns {Array} Matching player arcs
   */
  searchPlayerArcs(searchTerm) {
    return this.core.searchPlayerArcs(searchTerm);
  }

  /**
   * Get player arcs with recent activity
   * @param {number} daysThreshold - Days threshold
   * @returns {Array} Recently updated arcs
   */
  getRecentlyUpdatedArcs(daysThreshold = 7) {
    return this.core.getRecentlyUpdatedArcs(daysThreshold);
  }

  // ===========================================
  // PUBLIC API - Data Management
  // ===========================================

  /**
   * Export player arc data
   * @param {string} playerId - Optional specific player ID
   * @returns {Object} Exported data
   */
  exportPlayerArcData(playerId = null) {
    return this.core.exportPlayerArcData(playerId);
  }

  /**
   * Refresh data from API
   * @returns {Promise<Array>} Updated player arcs
   */
  async refresh() {
    return await this.core.refresh();
  }

  /**
   * Check if system is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this.initialized && this.core.isInitialized();
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Validate player arc data
   * @param {Object} arcData - Arc data to validate
   * @returns {Array} Validation errors
   */
  validatePlayerArcData(arcData) {
    return this.core.validatePlayerArcData(arcData);
  }

  /**
   * Validate goal data
   * @param {Object} goalData - Goal data to validate
   * @returns {Array} Validation errors
   */
  validateGoalData(goalData) {
    return this.progression.validateGoalData(goalData);
  }

  /**
   * Validate milestone data
   * @param {Object} milestoneData - Milestone data to validate
   * @returns {Array} Validation errors
   */
  validateMilestoneData(milestoneData) {
    return this.progression.validateMilestoneData(milestoneData);
  }

  /**
   * Link a goal to a milestone
   * @param {string} playerId - The player's unique identifier
   * @param {string} goalId - The goal's unique identifier
   * @param {string} milestoneId - The milestone's unique identifier
   * @returns {Promise<void>}
   */
  async linkGoalToMilestone(playerId, goalId, milestoneId) {
    return await this.progression.linkGoalToMilestone(
      playerId,
      goalId,
      milestoneId
    );
  }

  // ===========================================
  // INTEGRATION METHODS
  // ===========================================

  /**
   * Get player arc summary for dashboard
   * @returns {Object} Summary data for dashboard display
   */
  getDashboardSummary() {
    const stats = this.getPlayerArcStats();
    const recentMilestones = this.getRecentMilestones(7);
    const recentlyUpdated = this.getRecentlyUpdatedArcs(7);

    return {
      totalArcs: stats.totalArcs,
      totalGoals: stats.totalGoals,
      completedGoals: stats.goalsByStatus.completed,
      recentMilestones: recentMilestones.slice(0, 5),
      recentlyUpdatedArcs: recentlyUpdated.slice(0, 3),
      needsAttention: this.getArcsNeedingAttention(),
    };
  }

  /**
   * Get arcs that need attention (overdue goals, etc.)
   * @returns {Array} Arcs needing attention
   */
  getArcsNeedingAttention() {
    const needsAttention = [];

    this.getAllPlayerArcs().forEach((arc) => {
      const overdueGoals = this.getOverdueGoals(arc.playerId);
      if (overdueGoals.length > 0) {
        needsAttention.push({
          playerId: arc.playerId,
          playerName: arc.playerName,
          characterName: arc.characterName,
          issue: `${overdueGoals.length} overdue goal(s)`,
          overdueGoals: overdueGoals,
        });
      }
    });

    return needsAttention;
  }

  /**
   * Handle navigation to player arcs section
   */
  handleNavigation() {
    if (!this.isInitialized()) {
      console.warn(
        "PlayerArcManager not initialized, attempting to initialize..."
      );
      this.init().catch((error) => {
        console.error("Failed to initialize PlayerArcManager:", error);
      });
      return;
    }

    this.showPlayerArcOverview();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.initialized = false;
    console.log("🎭 PlayerArcManager: Destroyed");
  }
}
