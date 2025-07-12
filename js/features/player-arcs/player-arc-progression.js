/**
 * PlayerArcProgression - Handles goals, milestones, and character development tracking
 * Manages progression tracking, goal completion, and milestone achievements
 */
export default class PlayerArcProgression {
  constructor(playerArcCore) {
    this.core = playerArcCore;
  }

  /**
   * Add a new goal to a player's arc
   * @param {string} playerId - The player's unique identifier
   * @param {Object} goal - The goal object to add
   */
  async addGoal(playerId, goal) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc) {
      throw new Error(`Player arc not found for ${playerId}`);
    }

    if (!arc.goals) {
      arc.goals = [];
    }

    const newGoal = {
      id: this.generateGoalId(),
      title: goal.title || "",
      description: goal.description || "",
      type: goal.type || "personal", // personal, story, combat, social, etc.
      priority: goal.priority || "medium", // low, medium, high, urgent
      status: "active",
      progress: 0,
      targetValue: goal.targetValue || null,
      currentValue: goal.currentValue || 0,
      deadline: goal.deadline || null,
      rewards: goal.rewards || [],
      relatedCharacters: goal.relatedCharacters || [],
      relatedLocations: goal.relatedLocations || [],
      notes: goal.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    arc.goals.push(newGoal);
    await this.core.savePlayerArc(playerId, arc);

    console.log(`✅ Added goal "${newGoal.title}" to ${playerId}`);
    return newGoal;
  }

  /**
   * Update a goal's status
   * @param {string} playerId - The player's unique identifier
   * @param {string} goalId - The goal's unique identifier
   * @param {string} status - New status ('active', 'completed', 'failed', 'paused')
   */
  async updateGoalStatus(playerId, goalId, status) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.goals) {
      throw new Error(`Player arc or goals not found for ${playerId}`);
    }

    const goal = arc.goals.find((g) => g.id === goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found for player ${playerId}`);
    }

    const oldStatus = goal.status;
    goal.status = status;
    goal.updatedAt = new Date().toISOString();

    // Auto-set progress based on status
    if (status === "completed") {
      goal.progress = 100;
      goal.completedAt = new Date().toISOString();
    } else if (status === "failed") {
      goal.failedAt = new Date().toISOString();
    }

    await this.core.savePlayerArc(playerId, arc);

    console.log(
      `✅ Updated goal "${goal.title}" status: ${oldStatus} → ${status}`
    );
    return goal;
  }

  /**
   * Update goal progress
   * @param {string} playerId - The player's unique identifier
   * @param {string} goalId - The goal's unique identifier
   * @param {number} progress - Progress percentage (0-100)
   * @param {number} currentValue - Current value if tracking numeric progress
   */
  async updateGoalProgress(playerId, goalId, progress, currentValue = null) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.goals) {
      throw new Error(`Player arc or goals not found for ${playerId}`);
    }

    const goal = arc.goals.find((g) => g.id === goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found for player ${playerId}`);
    }

    goal.progress = Math.max(0, Math.min(100, progress));
    if (currentValue !== null) {
      goal.currentValue = currentValue;
    }
    goal.updatedAt = new Date().toISOString();

    // Auto-complete if progress reaches 100%
    if (goal.progress >= 100 && goal.status === "active") {
      goal.status = "completed";
      goal.completedAt = new Date().toISOString();
    }

    await this.core.savePlayerArc(playerId, arc);

    console.log(`✅ Updated goal "${goal.title}" progress: ${goal.progress}%`);
    return goal;
  }

  /**
   * Remove a goal from a player's arc
   * @param {string} playerId - The player's unique identifier
   * @param {string} goalId - The goal's unique identifier
   */
  async removeGoal(playerId, goalId) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.goals) {
      throw new Error(`Player arc or goals not found for ${playerId}`);
    }

    const goalIndex = arc.goals.findIndex((g) => g.id === goalId);
    if (goalIndex === -1) {
      throw new Error(`Goal ${goalId} not found for player ${playerId}`);
    }

    const removedGoal = arc.goals.splice(goalIndex, 1)[0];
    await this.core.savePlayerArc(playerId, arc);

    console.log(`✅ Removed goal "${removedGoal.title}" from ${playerId}`);
    return removedGoal;
  }

  /**
   * Add a milestone to a player's arc
   * @param {string} playerId - The player's unique identifier
   * @param {Object} milestone - The milestone object to add
   */
  async addMilestone(playerId, milestone) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc) {
      throw new Error(`Player arc not found for ${playerId}`);
    }

    if (!arc.milestones) {
      arc.milestones = [];
    }

    const newMilestone = {
      id: this.generateMilestoneId(),
      title: milestone.title || "",
      description: milestone.description || "",
      type: milestone.type || "story", // story, character, combat, social, etc.
      significance: milestone.significance || "minor", // minor, major, critical
      sessionId: milestone.sessionId || null,
      achievedAt: milestone.achievedAt || new Date().toISOString(),
      relatedGoals: milestone.relatedGoals || [],
      impact: milestone.impact || "",
      notes: milestone.notes || "",
      createdAt: new Date().toISOString(),
    };

    arc.milestones.push(newMilestone);
    await this.core.savePlayerArc(playerId, arc);

    console.log(`✅ Added milestone "${newMilestone.title}" to ${playerId}`);
    return newMilestone;
  }

  /**
   * Remove a milestone from a player's arc
   * @param {string} playerId - The player's unique identifier
   * @param {string} milestoneId - The milestone's unique identifier
   */
  async removeMilestone(playerId, milestoneId) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.milestones) {
      throw new Error(`Player arc or milestones not found for ${playerId}`);
    }

    const milestoneIndex = arc.milestones.findIndex(
      (m) => m.id === milestoneId
    );
    if (milestoneIndex === -1) {
      throw new Error(
        `Milestone ${milestoneId} not found for player ${playerId}`
      );
    }

    const removedMilestone = arc.milestones.splice(milestoneIndex, 1)[0];
    await this.core.savePlayerArc(playerId, arc);

    console.log(
      `✅ Removed milestone "${removedMilestone.title}" from ${playerId}`
    );
    return removedMilestone;
  }

  /**
   * Get goals by status for a player
   * @param {string} playerId - The player's unique identifier
   * @param {string} status - Goal status to filter by
   * @returns {Array} Array of goals with the specified status
   */
  getGoalsByStatus(playerId, status) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.goals) {
      return [];
    }

    return arc.goals.filter((goal) => goal.status === status);
  }

  /**
   * Get goals by type for a player
   * @param {string} playerId - The player's unique identifier
   * @param {string} type - Goal type to filter by
   * @returns {Array} Array of goals with the specified type
   */
  getGoalsByType(playerId, type) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.goals) {
      return [];
    }

    return arc.goals.filter((goal) => goal.type === type);
  }

  /**
   * Get overdue goals for a player
   * @param {string} playerId - The player's unique identifier
   * @returns {Array} Array of overdue goals
   */
  getOverdueGoals(playerId) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.goals) {
      return [];
    }

    const now = new Date();
    return arc.goals.filter((goal) => {
      return (
        goal.status === "active" &&
        goal.deadline &&
        new Date(goal.deadline) < now
      );
    });
  }

  /**
   * Get upcoming goals with deadlines
   * @param {string} playerId - The player's unique identifier
   * @param {number} daysAhead - Number of days to look ahead
   * @returns {Array} Array of upcoming goals
   */
  getUpcomingGoals(playerId, daysAhead = 7) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.goals) {
      return [];
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    return arc.goals.filter((goal) => {
      if (!goal.deadline || goal.status !== "active") {
        return false;
      }
      const deadline = new Date(goal.deadline);
      return deadline >= now && deadline <= futureDate;
    });
  }

  /**
   * Calculate goal completion rate for a player
   * @param {string} playerId - The player's unique identifier
   * @returns {Object} Completion statistics
   */
  calculateGoalCompletionRate(playerId) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.goals || arc.goals.length === 0) {
      return {
        totalGoals: 0,
        completedGoals: 0,
        activeGoals: 0,
        failedGoals: 0,
        pausedGoals: 0,
        completionRate: 0,
        averageProgress: 0,
      };
    }

    const stats = {
      totalGoals: arc.goals.length,
      completedGoals: 0,
      activeGoals: 0,
      failedGoals: 0,
      pausedGoals: 0,
      completionRate: 0,
      averageProgress: 0,
    };

    let totalProgress = 0;

    arc.goals.forEach((goal) => {
      totalProgress += goal.progress || 0;

      switch (goal.status) {
        case "completed":
          stats.completedGoals++;
          break;
        case "active":
          stats.activeGoals++;
          break;
        case "failed":
          stats.failedGoals++;
          break;
        case "paused":
          stats.pausedGoals++;
          break;
      }
    });

    stats.completionRate = Math.round(
      (stats.completedGoals / stats.totalGoals) * 100
    );
    stats.averageProgress = Math.round(totalProgress / stats.totalGoals);

    return stats;
  }

  /**
   * Get milestone timeline for a player
   * @param {string} playerId - The player's unique identifier
   * @returns {Array} Array of milestones sorted by achievement date
   */
  getMilestoneTimeline(playerId) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc || !arc.milestones) {
      return [];
    }

    return arc.milestones
      .slice()
      .sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt));
  }

  /**
   * Get recent milestones across all players
   * @param {number} daysBack - Number of days to look back
   * @returns {Array} Array of recent milestones with player info
   */
  getRecentMilestones(daysBack = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const recentMilestones = [];

    this.core.getAllPlayerArcs().forEach((arc) => {
      if (arc.milestones) {
        arc.milestones.forEach((milestone) => {
          const achievedDate = new Date(milestone.achievedAt);
          if (achievedDate >= cutoffDate) {
            recentMilestones.push({
              ...milestone,
              playerId: arc.playerId,
              playerName: arc.playerName,
              characterName: arc.characterName,
            });
          }
        });
      }
    });

    return recentMilestones.sort(
      (a, b) => new Date(b.achievedAt) - new Date(a.achievedAt)
    );
  }

  /**
   * Generate progression report for a player
   * @param {string} playerId - The player's unique identifier
   * @returns {Object} Comprehensive progression report
   */
  generateProgressionReport(playerId) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc) {
      throw new Error(`Player arc not found for ${playerId}`);
    }

    const goalStats = this.calculateGoalCompletionRate(playerId);
    const milestoneTimeline = this.getMilestoneTimeline(playerId);
    const overdueGoals = this.getOverdueGoals(playerId);
    const upcomingGoals = this.getUpcomingGoals(playerId);

    return {
      playerId: arc.playerId,
      playerName: arc.playerName,
      characterName: arc.characterName,
      goalStatistics: goalStats,
      milestoneCount: milestoneTimeline.length,
      recentMilestones: milestoneTimeline.slice(0, 5),
      overdueGoals: overdueGoals,
      upcomingGoals: upcomingGoals,
      lastUpdated: arc.updatedAt,
      reportGeneratedAt: new Date().toISOString(),
    };
  }

  /**
   * Link a goal to a milestone
   * @param {string} playerId - The player's unique identifier
   * @param {string} goalId - The goal's unique identifier
   * @param {string} milestoneId - The milestone's unique identifier
   */
  async linkGoalToMilestone(playerId, goalId, milestoneId) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc) {
      throw new Error(`Player arc not found for ${playerId}`);
    }

    const milestone = arc.milestones?.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    if (!milestone.relatedGoals) {
      milestone.relatedGoals = [];
    }

    if (!milestone.relatedGoals.includes(goalId)) {
      milestone.relatedGoals.push(goalId);
      await this.core.savePlayerArc(playerId, arc);
      console.log(`✅ Linked goal ${goalId} to milestone ${milestoneId}`);
    }
  }

  /**
   * Generate unique goal ID
   * @returns {string} Unique goal identifier
   */
  generateGoalId() {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique milestone ID
   * @returns {string} Unique milestone identifier
   */
  generateMilestoneId() {
    return `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate goal data
   * @param {Object} goalData - Goal data to validate
   * @returns {Array} Array of validation errors
   */
  validateGoalData(goalData) {
    const errors = [];

    if (!goalData.title || goalData.title.trim() === "") {
      errors.push("Goal title is required");
    }

    if (goalData.title && goalData.title.length > 200) {
      errors.push("Goal title must be less than 200 characters");
    }

    if (goalData.description && goalData.description.length > 2000) {
      errors.push("Goal description must be less than 2000 characters");
    }

    if (
      goalData.priority &&
      !["low", "medium", "high", "urgent"].includes(goalData.priority)
    ) {
      errors.push("Invalid goal priority");
    }

    if (goalData.deadline && isNaN(new Date(goalData.deadline))) {
      errors.push("Invalid deadline date");
    }

    return errors;
  }

  /**
   * Validate milestone data
   * @param {Object} milestoneData - Milestone data to validate
   * @returns {Array} Array of validation errors
   */
  validateMilestoneData(milestoneData) {
    const errors = [];

    if (!milestoneData.title || milestoneData.title.trim() === "") {
      errors.push("Milestone title is required");
    }

    if (milestoneData.title && milestoneData.title.length > 200) {
      errors.push("Milestone title must be less than 200 characters");
    }

    if (milestoneData.description && milestoneData.description.length > 2000) {
      errors.push("Milestone description must be less than 2000 characters");
    }

    if (
      milestoneData.significance &&
      !["minor", "major", "critical"].includes(milestoneData.significance)
    ) {
      errors.push("Invalid milestone significance");
    }

    return errors;
  }
}
