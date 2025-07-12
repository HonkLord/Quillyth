/**
 * QuestManager - Lean coordinator for quest management
 * Orchestrates QuestCore, QuestTracking, and QuestUI modules
 * Provides public API for quest management functionality
 */
import QuestCore from "./quest-core.js";
import QuestTracking from "./quest-tracking.js";
import QuestUI from "./quest-ui.js";

export default class QuestManager {
  constructor() {
    this.core = new QuestCore();
    this.tracking = new QuestTracking(this.core);
    this.ui = new QuestUI(this.core, this.tracking);
  }

  /**
   * Initialize the Quest Manager
   */
  async init() {
    console.log("🎯 QuestManager: Initializing...");

    try {
      await this.core.init();
      this.ui.setupEventListeners();
      console.log("✅ QuestManager: Initialized successfully");
    } catch (error) {
      console.error("❌ QuestManager: Initialization failed:", error);
      throw error;
    }
  }

  // === Core Data Methods ===

  /**
   * Get all quests
   */
  getAllQuests() {
    return this.core.getAllQuests();
  }

  /**
   * Get a specific quest by ID
   */
  getQuest(questId) {
    return this.core.getQuest(questId);
  }

  /**
   * Get quests by status
   */
  getQuestsByStatus(status) {
    return this.core.getQuestsByStatus(status);
  }

  /**
   * Get quests by category
   */
  getQuestsByCategory(category) {
    return this.core.getQuestsByCategory(category);
  }

  /**
   * Get quests assigned to a specific player
   */
  getQuestsByPlayer(playerId) {
    return this.core.getQuestsByPlayer(playerId);
  }

  /**
   * Create a new quest
   */
  async createQuest(questData) {
    return await this.core.createQuest(questData);
  }

  /**
   * Update an existing quest
   */
  async updateQuest(questId, updates) {
    return await this.core.updateQuest(questId, updates);
  }

  /**
   * Delete a quest
   */
  async deleteQuest(questId) {
    return await this.core.deleteQuest(questId);
  }

  /**
   * Update quest status
   */
  async updateQuestStatus(questId, newStatus) {
    return await this.core.updateQuestStatus(questId, newStatus);
  }

  /**
   * Assign quest to players
   */
  async assignQuestToPlayers(questId, playerIds) {
    return await this.core.assignQuestToPlayers(questId, playerIds);
  }

  /**
   * Unassign quest from players
   */
  async unassignQuestFromPlayers(questId, playerIds) {
    return await this.core.unassignQuestFromPlayers(questId, playerIds);
  }

  /**
   * Filter quests based on criteria
   */
  filterQuests(filters) {
    return this.core.filterQuests(filters);
  }

  // === Tracking Methods ===

  /**
   * Add objective to quest
   */
  async addObjective(questId, objective) {
    return await this.tracking.addObjective(questId, objective);
  }

  /**
   * Update objective completion status
   */
  async updateObjective(questId, objectiveId, completed) {
    return await this.tracking.updateObjective(questId, objectiveId, completed);
  }

  /**
   * Toggle objective completion
   */
  async toggleObjective(questId, objectiveId, completed) {
    return await this.tracking.toggleObjective(questId, objectiveId, completed);
  }

  /**
   * Add reward to quest
   */
  async addReward(questId, reward) {
    return await this.tracking.addReward(questId, reward);
  }

  /**
   * Calculate quest progress percentage
   */
  calculateQuestProgress(quest) {
    return this.tracking.calculateQuestProgress(quest);
  }

  /**
   * Get quest completion statistics
   */
  getQuestCompletionStats(quest) {
    return this.tracking.getQuestCompletionStats(quest);
  }

  /**
   * Generate quest overview for display
   */
  generateQuestOverview() {
    return this.tracking.generateQuestOverview();
  }

  /**
   * Get quests nearing completion
   */
  getQuestsNearingCompletion(threshold = 80) {
    return this.tracking.getQuestsNearingCompletion(threshold);
  }

  /**
   * Get stalled quests (not updated recently)
   */
  getStalledQuests(daysThreshold = 7) {
    return this.tracking.getStalledQuests(daysThreshold);
  }

  /**
   * Get high priority incomplete quests
   */
  getHighPriorityIncomplete() {
    return this.tracking.getHighPriorityIncomplete();
  }

  /**
   * Generate quest analytics report
   */
  generateQuestAnalytics() {
    return this.tracking.generateQuestAnalytics();
  }

  /**
   * Auto-complete quest if all objectives are done
   */
  async checkAutoComplete(questId) {
    return await this.tracking.checkAutoComplete(questId);
  }

  // === UI Methods ===

  /**
   * Show quest management interface
   */
  showQuestManagement() {
    return this.ui.showQuestManagement();
  }

  /**
   * Show create quest modal
   */
  async showCreateQuestModal() {
    return await this.ui.showCreateQuestModal();
  }

  /**
   * Show quest details modal
   */
  showQuestDetails(questId) {
    return this.ui.showQuestDetails(questId);
  }

  /**
   * Show edit quest modal
   */
  async showEditQuestModal(questId) {
    return await this.ui.showEditQuestModal(questId);
  }

  /**
   * Confirm quest deletion
   */
  confirmDeleteQuest(questId) {
    return this.ui.confirmDeleteQuest(questId);
  }

  // === Utility Methods ===

  /**
   * Get quest statistics
   */
  getQuestStats() {
    return this.core.getQuestStats();
  }

  /**
   * Get available quest categories
   */
  getQuestCategories() {
    return this.core.getQuestCategories();
  }

  /**
   * Get available quest statuses
   */
  getQuestStatuses() {
    return this.core.getQuestStatuses();
  }

  /**
   * Validate quest data
   */
  validateQuestData(questData) {
    return this.core.validateQuestData(questData);
  }

  /**
   * Show error message
   */
  showError(message) {
    return this.ui.showError(message);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    return this.ui.showSuccess(message);
  }

  // === Legacy Compatibility Methods ===
  // These methods maintain compatibility with existing code

  /**
   * Generate quest list HTML (legacy compatibility)
   */
  generateQuestListHTML(filter = {}) {
    return this.ui.generateQuestListHTML(filter);
  }

  /**
   * Generate quest card HTML (legacy compatibility)
   */
  generateQuestCardHTML(quest) {
    return this.ui.generateQuestCardHTML(quest);
  }

  /**
   * Setup event listeners (legacy compatibility)
   */
  setupEventListeners() {
    return this.ui.setupEventListeners();
  }

  /**
   * Filter quests UI (legacy compatibility)
   */
  filterQuestsUI(filters) {
    return this.ui.filterQuests(filters);
  }

  // === Advanced Analytics ===

  /**
   * Get player quest load
   */
  getPlayerQuestLoad() {
    return this.tracking.getPlayerQuestLoad();
  }

  /**
   * Get quest timeline
   */
  getQuestTimeline(questId) {
    return this.tracking.getQuestTimeline(questId);
  }

  /**
   * Validate objective data
   */
  validateObjective(objective) {
    return this.tracking.validateObjective(objective);
  }

  /**
   * Validate reward data
   */
  validateReward(reward) {
    return this.tracking.validateReward(reward);
  }

  // === Bulk Operations ===

  /**
   * Bulk update quest statuses
   */
  async bulkUpdateQuestStatus(questIds, newStatus) {
    const results = [];
    for (const questId of questIds) {
      try {
        const result = await this.core.updateQuestStatus(questId, newStatus);
        results.push({ questId, success: true, result });
      } catch (error) {
        results.push({ questId, success: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Bulk assign quests to players
   */
  async bulkAssignQuests(questIds, playerIds) {
    const results = [];
    for (const questId of questIds) {
      try {
        const result = await this.core.assignQuestToPlayers(questId, playerIds);
        results.push({ questId, success: true, result });
      } catch (error) {
        results.push({ questId, success: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Export quest data
   */
  exportQuestData(questIds = null) {
    const quests = questIds
      ? questIds.map((id) => this.core.getQuest(id)).filter(Boolean)
      : this.core.getAllQuests();

    return {
      exportDate: new Date().toISOString(),
      questCount: quests.length,
      quests: quests,
      analytics: this.tracking.generateQuestAnalytics(),
    };
  }

  /**
   * Import quest data
   */
  async importQuestData(questData) {
    const results = [];

    for (const quest of questData.quests || []) {
      try {
        // Remove ID to force creation of new quest
        const { id, ...questWithoutId } = quest;
        const result = await this.core.createQuest(questWithoutId);
        results.push({ originalId: id, newId: result.id, success: true });
      } catch (error) {
        results.push({
          originalId: quest.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}
