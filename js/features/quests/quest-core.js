/**
 * QuestCore - Data management and CRUD operations for quests
 * Handles API calls, data loading, and basic quest operations
 */
export default class QuestCore {
  constructor() {
    this.quests = new Map();
    this.questCategories = [
      "main",
      "side",
      "personal",
      "faction",
      "exploration",
      "investigation",
    ];
    this.questStatuses = [
      "not_started",
      "active",
      "completed",
      "failed",
      "on_hold",
      "abandoned",
    ];
    this.apiBase = "/api";
  }

  /**
   * Initialize the Quest Core
   */
  async init() {
    console.log("🎯 QuestCore: Initializing...");

    try {
      await this.loadQuests();
      console.log("✅ QuestCore: Initialized successfully");
    } catch (error) {
      console.error("❌ QuestCore: Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Load all quests from the database
   */
  async loadQuests() {
    try {
      const response = await fetch(`${this.apiBase}/quests`);
      if (!response.ok) {
        throw new Error(`Failed to load quests: ${response.status}`);
      }

      const quests = await response.json();
      this.quests.clear();

      quests.forEach((quest) => {
        this.quests.set(quest.id, quest);
      });

      console.log(`📋 Loaded ${quests.length} quests`);
      return quests;
    } catch (error) {
      console.error("❌ Error loading quests:", error);
      // Initialize with empty quest list if API fails
      this.quests.clear();
      return [];
    }
  }

  /**
   * Get all quests
   */
  getAllQuests() {
    return Array.from(this.quests.values());
  }

  /**
   * Get quests by status
   */
  getQuestsByStatus(status) {
    return this.getAllQuests().filter((quest) => quest.status === status);
  }

  /**
   * Get quests by category
   */
  getQuestsByCategory(category) {
    return this.getAllQuests().filter((quest) => quest.category === category);
  }

  /**
   * Get quests assigned to a specific player
   */
  getQuestsByPlayer(playerId) {
    return this.getAllQuests().filter(
      (quest) =>
        quest.assigned_players && quest.assigned_players.includes(playerId)
    );
  }

  /**
   * Get a specific quest by ID
   */
  getQuest(questId) {
    return this.quests.get(questId);
  }

  /**
   * Create a new quest
   */
  async createQuest(questData) {
    try {
      const quest = {
        id: questData.id || this.generateQuestId(),
        title: questData.title,
        description: questData.description || "",
        category: questData.category || "side",
        status: questData.status || "not_started",
        priority: questData.priority || "medium",
        assigned_players: questData.assigned_players || [],
        location_id: questData.location_id || null,
        session_id: questData.session_id || null,
        objectives: questData.objectives || [],
        rewards: questData.rewards || [],
        notes: questData.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(`${this.apiBase}/quests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quest),
      });

      if (!response.ok) {
        throw new Error(`Failed to create quest: ${response.status}`);
      }

      const savedQuest = await response.json();
      this.quests.set(savedQuest.id, savedQuest);

      console.log(`✅ Created quest: ${savedQuest.title}`);
      return savedQuest;
    } catch (error) {
      console.error("❌ Error creating quest:", error);
      throw error;
    }
  }

  /**
   * Update an existing quest
   */
  async updateQuest(questId, updates) {
    try {
      const existingQuest = this.quests.get(questId);
      if (!existingQuest) {
        throw new Error(`Quest not found: ${questId}`);
      }

      const updatedQuest = {
        ...existingQuest,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(`${this.apiBase}/quests/${questId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedQuest),
      });

      if (!response.ok) {
        throw new Error(`Failed to update quest: ${response.status}`);
      }

      const savedQuest = await response.json();
      this.quests.set(questId, savedQuest);

      console.log(`✅ Updated quest: ${savedQuest.title}`);
      return savedQuest;
    } catch (error) {
      console.error("❌ Error updating quest:", error);
      throw error;
    }
  }

  /**
   * Delete a quest
   */
  async deleteQuest(questId) {
    try {
      const response = await fetch(`${this.apiBase}/quests/${questId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete quest: ${response.status}`);
      }

      this.quests.delete(questId);
      console.log(`✅ Deleted quest: ${questId}`);
      return true;
    } catch (error) {
      console.error("❌ Error deleting quest:", error);
      throw error;
    }
  }

  /**
   * Update quest status
   */
  async updateQuestStatus(questId, newStatus) {
    if (!this.questStatuses.includes(newStatus)) {
      throw new Error(`Invalid quest status: ${newStatus}`);
    }

    return await this.updateQuest(questId, { status: newStatus });
  }

  /**
   * Assign quest to players
   */
  async assignQuestToPlayers(questId, playerIds) {
    const quest = this.getQuest(questId);
    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const currentPlayers = quest.assigned_players || [];
    const newPlayers = [...new Set([...currentPlayers, ...playerIds])];

    return await this.updateQuest(questId, { assigned_players: newPlayers });
  }

  /**
   * Unassign quest from players
   */
  async unassignQuestFromPlayers(questId, playerIds) {
    const quest = this.getQuest(questId);
    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const currentPlayers = quest.assigned_players || [];
    const updatedPlayers = currentPlayers.filter(
      (playerId) => !playerIds.includes(playerId)
    );

    return await this.updateQuest(questId, {
      assigned_players: updatedPlayers,
    });
  }

  /**
   * Filter quests based on criteria
   */
  filterQuests(filters) {
    let filteredQuests = this.getAllQuests();

    if (filters.status && filters.status !== "all") {
      filteredQuests = filteredQuests.filter(
        (quest) => quest.status === filters.status
      );
    }

    if (filters.category && filters.category !== "all") {
      filteredQuests = filteredQuests.filter(
        (quest) => quest.category === filters.category
      );
    }

    if (filters.priority && filters.priority !== "all") {
      filteredQuests = filteredQuests.filter(
        (quest) => quest.priority === filters.priority
      );
    }

    if (filters.player && filters.player !== "all") {
      filteredQuests = filteredQuests.filter(
        (quest) =>
          quest.assigned_players &&
          quest.assigned_players.includes(filters.player)
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredQuests = filteredQuests.filter(
        (quest) =>
          quest.title.toLowerCase().includes(searchTerm) ||
          quest.description.toLowerCase().includes(searchTerm)
      );
    }

    return filteredQuests;
  }

  /**
   * Get quest statistics
   */
  getQuestStats() {
    const allQuests = this.getAllQuests();

    const stats = {
      total: allQuests.length,
      byStatus: {},
      byCategory: {},
      byPriority: {},
    };

    // Count by status
    this.questStatuses.forEach((status) => {
      stats.byStatus[status] = allQuests.filter(
        (quest) => quest.status === status
      ).length;
    });

    // Count by category
    this.questCategories.forEach((category) => {
      stats.byCategory[category] = allQuests.filter(
        (quest) => quest.category === category
      ).length;
    });

    // Count by priority
    ["low", "medium", "high", "urgent"].forEach((priority) => {
      stats.byPriority[priority] = allQuests.filter(
        (quest) => quest.priority === priority
      ).length;
    });

    return stats;
  }

  /**
   * Generate unique quest ID
   */
  generateQuestId() {
    return `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique objective ID
   */
  generateObjectiveId() {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique reward ID
   */
  generateRewardId() {
    return `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get available quest categories
   */
  getQuestCategories() {
    return [...this.questCategories];
  }

  /**
   * Get available quest statuses
   */
  getQuestStatuses() {
    return [...this.questStatuses];
  }

  /**
   * Validate quest data
   */
  validateQuestData(questData) {
    const errors = [];

    if (!questData.title || questData.title.trim() === "") {
      errors.push("Quest title is required");
    }

    if (
      questData.category &&
      !this.questCategories.includes(questData.category)
    ) {
      errors.push(`Invalid quest category: ${questData.category}`);
    }

    if (questData.status && !this.questStatuses.includes(questData.status)) {
      errors.push(`Invalid quest status: ${questData.status}`);
    }

    return errors;
  }
}
