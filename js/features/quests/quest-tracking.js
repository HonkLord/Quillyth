/**
 * QuestTracking - Handles quest objectives, progress tracking, and analytics
 * Manages quest completion status, objectives, rewards, and progress insights
 */
export default class QuestTracking {
  constructor(questCore) {
    this.questCore = questCore;
  }

  /**
   * Add objective to quest
   */
  async addObjective(questId, objective) {
    const quest = this.questCore.getQuest(questId);
    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const newObjective = {
      id: this.questCore.generateObjectiveId(),
      text: objective.text,
      completed: objective.completed || false,
      created_at: new Date().toISOString(),
    };

    const updatedObjectives = [...quest.objectives, newObjective];
    return await this.questCore.updateQuest(questId, {
      objectives: updatedObjectives,
    });
  }

  /**
   * Update objective completion status
   */
  async updateObjective(questId, objectiveId, completed) {
    const quest = this.questCore.getQuest(questId);
    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const updatedObjectives = quest.objectives.map((obj) =>
      obj.id === objectiveId ? { ...obj, completed } : obj
    );

    return await this.questCore.updateQuest(questId, {
      objectives: updatedObjectives,
    });
  }

  /**
   * Remove objective from quest
   */
  async removeObjective(questId, objectiveId) {
    const quest = this.questCore.getQuest(questId);
    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const updatedObjectives = quest.objectives.filter(
      (obj) => obj.id !== objectiveId
    );
    return await this.questCore.updateQuest(questId, {
      objectives: updatedObjectives,
    });
  }

  /**
   * Add reward to quest
   */
  async addReward(questId, reward) {
    const quest = this.questCore.getQuest(questId);
    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const newReward = {
      id: this.questCore.generateRewardId(),
      type: reward.type || "item",
      description: reward.description,
      value: reward.value || 0,
      created_at: new Date().toISOString(),
    };

    const updatedRewards = [...quest.rewards, newReward];
    return await this.questCore.updateQuest(questId, {
      rewards: updatedRewards,
    });
  }

  /**
   * Remove reward from quest
   */
  async removeReward(questId, rewardId) {
    const quest = this.questCore.getQuest(questId);
    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    const updatedRewards = quest.rewards.filter(
      (reward) => reward.id !== rewardId
    );
    return await this.questCore.updateQuest(questId, {
      rewards: updatedRewards,
    });
  }

  /**
   * Toggle objective completion
   */
  async toggleObjective(questId, objectiveId, completed) {
    return await this.updateObjective(questId, objectiveId, completed);
  }

  /**
   * Calculate quest progress percentage
   */
  calculateQuestProgress(quest) {
    if (!quest.objectives || quest.objectives.length === 0) {
      return quest.status === "completed" ? 100 : 0;
    }

    const completedObjectives = quest.objectives.filter(
      (obj) => obj.completed
    ).length;
    const totalObjectives = quest.objectives.length;

    return Math.round((completedObjectives / totalObjectives) * 100);
  }

  /**
   * Get quest completion statistics
   */
  getQuestCompletionStats(quest) {
    const completedObjectives = quest.objectives.filter(
      (obj) => obj.completed
    ).length;
    const totalObjectives = quest.objectives.length;
    const progressPercent = this.calculateQuestProgress(quest);

    return {
      completedObjectives,
      totalObjectives,
      progressPercent,
      isCompleted: quest.status === "completed",
      hasObjectives: totalObjectives > 0,
    };
  }

  /**
   * Generate quest overview for display
   */
  generateQuestOverview() {
    const quests = this.questCore.getAllQuests();
    const statusCounts = this.questCore
      .getQuestStatuses()
      .reduce((counts, status) => {
        counts[status] = quests.filter((q) => q.status === status).length;
        return counts;
      }, {});

    const categoryCounts = this.questCore
      .getQuestCategories()
      .reduce((counts, category) => {
        counts[category] = quests.filter((q) => q.category === category).length;
        return counts;
      }, {});

    return {
      total: quests.length,
      statusCounts,
      categoryCounts,
      recentQuests: quests
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5),
    };
  }

  /**
   * Get quests nearing completion
   */
  getQuestsNearingCompletion(threshold = 80) {
    return this.questCore.getAllQuests().filter((quest) => {
      const progress = this.calculateQuestProgress(quest);
      return progress >= threshold && quest.status !== "completed";
    });
  }

  /**
   * Get stalled quests (not updated recently)
   */
  getStalledQuests(daysThreshold = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    return this.questCore.getAllQuests().filter((quest) => {
      const updatedDate = new Date(quest.updated_at);
      return quest.status === "active" && updatedDate < cutoffDate;
    });
  }

  /**
   * Get high priority incomplete quests
   */
  getHighPriorityIncomplete() {
    return this.questCore
      .getAllQuests()
      .filter(
        (quest) =>
          quest.priority === "high" &&
          quest.status !== "completed" &&
          quest.status !== "failed"
      );
  }

  /**
   * Get player quest load (number of active quests per player)
   */
  getPlayerQuestLoad() {
    const playerQuestCount = {};

    this.questCore
      .getAllQuests()
      .filter((quest) => quest.status === "active")
      .forEach((quest) => {
        if (quest.assigned_players) {
          quest.assigned_players.forEach((playerId) => {
            playerQuestCount[playerId] = (playerQuestCount[playerId] || 0) + 1;
          });
        }
      });

    return playerQuestCount;
  }

  /**
   * Generate quest analytics report
   */
  generateQuestAnalytics() {
    const allQuests = this.questCore.getAllQuests();
    const completedQuests = allQuests.filter((q) => q.status === "completed");
    const activeQuests = allQuests.filter((q) => q.status === "active");

    // Calculate average completion time for completed quests
    const completionTimes = completedQuests
      .map((quest) => {
        const created = new Date(quest.created_at);
        const updated = new Date(quest.updated_at);
        return (updated - created) / (1000 * 60 * 60 * 24); // days
      })
      .filter((time) => time > 0);

    const avgCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, time) => sum + time, 0) /
          completionTimes.length
        : 0;

    // Calculate progress distribution
    const progressDistribution = {
      "0-25%": 0,
      "26-50%": 0,
      "51-75%": 0,
      "76-99%": 0,
      "100%": 0,
    };

    activeQuests.forEach((quest) => {
      const progress = this.calculateQuestProgress(quest);
      if (progress === 0) progressDistribution["0-25%"]++;
      else if (progress <= 25) progressDistribution["0-25%"]++;
      else if (progress <= 50) progressDistribution["26-50%"]++;
      else if (progress <= 75) progressDistribution["51-75%"]++;
      else if (progress < 100) progressDistribution["76-99%"]++;
      else progressDistribution["100%"]++;
    });

    return {
      totalQuests: allQuests.length,
      completedQuests: completedQuests.length,
      activeQuests: activeQuests.length,
      completionRate:
        allQuests.length > 0
          ? (completedQuests.length / allQuests.length) * 100
          : 0,
      averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      progressDistribution,
      questsNearingCompletion: this.getQuestsNearingCompletion().length,
      stalledQuests: this.getStalledQuests().length,
      highPriorityIncomplete: this.getHighPriorityIncomplete().length,
      playerQuestLoad: this.getPlayerQuestLoad(),
    };
  }

  /**
   * Auto-complete quest if all objectives are done
   */
  async checkAutoComplete(questId) {
    const quest = this.questCore.getQuest(questId);
    if (!quest || quest.status === "completed") {
      return false;
    }

    const stats = this.getQuestCompletionStats(quest);

    // Auto-complete if all objectives are done and quest is active
    if (
      stats.hasObjectives &&
      stats.progressPercent === 100 &&
      quest.status === "active"
    ) {
      await this.questCore.updateQuestStatus(questId, "completed");
      console.log(`✅ Auto-completed quest: ${quest.title}`);
      return true;
    }

    return false;
  }

  /**
   * Get quest timeline (creation, major updates, completion)
   */
  getQuestTimeline(questId) {
    const quest = this.questCore.getQuest(questId);
    if (!quest) {
      return [];
    }

    const timeline = [
      {
        date: quest.created_at,
        event: "Quest Created",
        description: `Quest "${quest.title}" was created`,
        type: "creation",
      },
    ];

    // Add objective completion events (if we track this in the future)
    quest.objectives.forEach((objective) => {
      if (objective.completed && objective.completed_at) {
        timeline.push({
          date: objective.completed_at,
          event: "Objective Completed",
          description: `Completed: ${objective.text}`,
          type: "progress",
        });
      }
    });

    // Add completion event
    if (quest.status === "completed") {
      timeline.push({
        date: quest.updated_at,
        event: "Quest Completed",
        description: `Quest "${quest.title}" was completed`,
        type: "completion",
      });
    }

    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Validate objective data
   */
  validateObjective(objective) {
    const errors = [];

    if (!objective.text || objective.text.trim() === "") {
      errors.push("Objective text is required");
    }

    if (objective.text && objective.text.length > 500) {
      errors.push("Objective text must be less than 500 characters");
    }

    return errors;
  }

  /**
   * Validate reward data
   */
  validateReward(reward) {
    const errors = [];

    if (!reward.description || reward.description.trim() === "") {
      errors.push("Reward description is required");
    }

    if (
      reward.type &&
      !["item", "experience", "gold", "reputation", "other"].includes(
        reward.type
      )
    ) {
      errors.push("Invalid reward type");
    }

    if (reward.value && (isNaN(reward.value) || reward.value < 0)) {
      errors.push("Reward value must be a positive number");
    }

    return errors;
  }
}
