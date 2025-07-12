import { uiNotificationService } from '../../services/ui-notification-service.js';

/**
 * PlayerArcUI - Handles player arc UI rendering, modal dialogs, and user interactions
 * Manages HTML generation, event handling, and user interface for player arc management
 */
export default class PlayerArcUI {
  constructor(playerArcCore, playerArcProgression) {
    this.core = playerArcCore;
    this.progression = playerArcProgression;
  }

  /**
   * Show player arc overview
   */
  showPlayerArcOverview() {
    const content = this.generatePlayerArcOverview();
    const playerArcsContent = document.getElementById("player-arcs-content");
    if (playerArcsContent) {
      playerArcsContent.innerHTML = content;
    }
  }

  /**
   * Generate HTML for player arc overview
   * @returns {string} HTML string for the player arc overview
   */
  generatePlayerArcOverview() {
    const arcs = this.core.getAllPlayerArcs();

    if (arcs.length === 0) {
      return `
        <div class="player-arc-empty">
          <h3>No Player Arcs Yet</h3>
          <p>Create player arcs to track character goals and development.</p>
          <button class="btn-primary" onclick="playerArcManager.showCreateArcModal()">
            <i class="fas fa-plus"></i> Create First Player Arc
          </button>
        </div>
      `;
    }

    const stats = this.core.getPlayerArcStats();

    return `
      <div class="player-arc-overview">
        <div class="arc-header">
          <h2>Player Character Arcs</h2>
          <button class="btn-primary" onclick="playerArcManager.showCreateArcModal()">
            <i class="fas fa-plus"></i> New Player Arc
          </button>
        </div>
        
        <div class="arc-stats">
          <div class="stat-card">
            <h3>${stats.totalArcs}</h3>
            <p>Total Arcs</p>
          </div>
          <div class="stat-card">
            <h3>${stats.totalGoals}</h3>
            <p>Total Goals</p>
          </div>
          <div class="stat-card">
            <h3>${stats.totalMilestones}</h3>
            <p>Milestones</p>
          </div>
          <div class="stat-card">
            <h3>${stats.goalsByStatus.completed}</h3>
            <p>Completed Goals</p>
          </div>
        </div>
        
        <div class="arc-grid">
          ${arcs.map((arc) => this.generateArcCard(arc)).join("")}
        </div>
      </div>
    `;
  }

  /**
   * Generate HTML for a single player arc card
   * @param {Object} arc - Player arc data
   * @returns {string} HTML string for the arc card
   */
  generateArcCard(arc) {
    const goalStats = this.progression.calculateGoalCompletionRate(
      arc.playerId
    );
    const recentMilestones = this.progression
      .getMilestoneTimeline(arc.playerId)
      .slice(0, 3);

    return `
      <div class="arc-card" data-player-id="${arc.playerId}">
        <div class="arc-card-header">
          <h4>${arc.characterName || "Unnamed Character"}</h4>
          <p class="player-name">played by ${
            arc.playerName || "Unknown Player"
          }</p>
          <div class="arc-actions">
            <button class="btn-sm" onclick="playerArcManager.viewArcDetails('${
              arc.playerId
            }')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-sm" onclick="playerArcManager.editArc('${
              arc.playerId
            }')">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
        
        <div class="arc-progress">
          <div class="goal-progress">
            <span>Goals: ${goalStats.completedGoals}/${
      goalStats.totalGoals
    }</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${
                goalStats.completionRate
              }%"></div>
            </div>
          </div>
        </div>
        
        ${
          recentMilestones.length > 0
            ? `
          <div class="recent-milestones">
            <h5>Recent Milestones</h5>
            <ul>
              ${recentMilestones
                .map(
                  (milestone) => `
                <li>${milestone.title}</li>
              `
                )
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
        
        <div class="arc-card-footer">
          <span class="last-updated">Updated: ${new Date(
            arc.updatedAt
          ).toLocaleDateString()}</span>
        </div>
      </div>
    `;
  }

  /**
   * View detailed arc information
   * @param {string} playerId - The player's unique identifier
   */
  viewArcDetails(playerId) {
    const arc = this.core.getPlayerArc(playerId);
    if (!arc) {
      this.showError("Player arc not found");
      return;
    }

    const content = this.generateArcDetails(arc);
    this.showModal("Player Arc Details", content);
  }

  /**
   * Generate detailed view HTML for a player arc
   * @param {Object} arc - Player arc data
   * @returns {string} HTML string for detailed arc view
   */
  generateArcDetails(arc) {
    const goalStats = this.progression.calculateGoalCompletionRate(
      arc.playerId
    );
    const milestones = this.progression.getMilestoneTimeline(arc.playerId);
    const overdueGoals = this.progression.getOverdueGoals(arc.playerId);
    const upcomingGoals = this.progression.getUpcomingGoals(arc.playerId);

    return `
      <div class="arc-details">
        <div class="arc-info">
          <h3>${arc.characterName}</h3>
          <p><strong>Player:</strong> ${arc.playerName}</p>
          ${
            arc.backstory
              ? `<p><strong>Backstory:</strong> ${arc.backstory}</p>`
              : ""
          }
          ${
            arc.personalityTraits
              ? `<p><strong>Personality:</strong> ${arc.personalityTraits}</p>`
              : ""
          }
          ${arc.notes ? `<p><strong>Notes:</strong> ${arc.notes}</p>` : ""}
        </div>
        
        <div class="goal-section">
          <div class="section-header">
            <h4>Goals (${goalStats.totalGoals})</h4>
            <button class="btn-primary" onclick="playerArcManager.showAddGoalModal('${
              arc.playerId
            }')">
              <i class="fas fa-plus"></i> Add Goal
            </button>
          </div>
          
          <div class="goal-stats">
            <span class="stat">Active: ${goalStats.activeGoals}</span>
            <span class="stat">Completed: ${goalStats.completedGoals}</span>
            <span class="stat">Failed: ${goalStats.failedGoals}</span>
            <span class="stat">Completion Rate: ${
              goalStats.completionRate
            }%</span>
          </div>
          
          ${
            overdueGoals.length > 0
              ? `
            <div class="overdue-goals">
              <h5>⚠️ Overdue Goals</h5>
              <ul>
                ${overdueGoals
                  .map(
                    (goal) => `
                  <li>${goal.title} (due ${new Date(
                      goal.deadline
                    ).toLocaleDateString()})</li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }
          
          ${
            upcomingGoals.length > 0
              ? `
            <div class="upcoming-goals">
              <h5>📅 Upcoming Deadlines</h5>
              <ul>
                ${upcomingGoals
                  .map(
                    (goal) => `
                  <li>${goal.title} (due ${new Date(
                      goal.deadline
                    ).toLocaleDateString()})</li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }
          
          <div class="goals-list">
            ${
              arc.goals && arc.goals.length > 0
                ? arc.goals
                    .map(
                      (goal) => `
              <div class="goal-item status-${goal.status}">
                <h5>${goal.title}</h5>
                <p>${goal.description}</p>
                <div class="goal-meta">
                  <span class="goal-type">${goal.type}</span>
                  <span class="goal-priority">${goal.priority}</span>
                  <span class="goal-status">${goal.status}</span>
                  <span class="goal-progress">${goal.progress}%</span>
                </div>
              </div>
            `
                    )
                    .join("")
                : "<p>No goals yet.</p>"
            }
          </div>
        </div>
        
        <div class="milestone-section">
          <div class="section-header">
            <h4>Milestones (${milestones.length})</h4>
            <button class="btn-primary" onclick="playerArcManager.showAddMilestoneModal('${
              arc.playerId
            }')">
              <i class="fas fa-plus"></i> Add Milestone
            </button>
          </div>
          
          <div class="milestones-list">
            ${
              milestones.length > 0
                ? milestones
                    .map(
                      (milestone) => `
              <div class="milestone-item significance-${
                milestone.significance
              }">
                <h5>${milestone.title}</h5>
                <p>${milestone.description}</p>
                <div class="milestone-meta">
                  <span class="milestone-type">${milestone.type}</span>
                  <span class="milestone-significance">${
                    milestone.significance
                  }</span>
                  <span class="milestone-date">${new Date(
                    milestone.achievedAt
                  ).toLocaleDateString()}</span>
                </div>
              </div>
            `
                    )
                    .join("")
                : "<p>No milestones yet.</p>"
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show modal for creating a new player arc
   */
  async showCreateArcModal() {
    const playerOptions = await this.getPlayerOptions();

    const modalContent = `
      <form id="create-arc-form">
        <div class="form-group">
          <label for="player-name">Player Name *</label>
          <input type="text" id="player-name" name="playerName" required>
        </div>
        
        <div class="form-group">
          <label for="character-name">Character Name *</label>
          <input type="text" id="character-name" name="characterName" required>
        </div>
        
        <div class="form-group">
          <label for="backstory">Backstory</label>
          <textarea id="backstory" name="backstory" rows="4" placeholder="Character's background and history..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="personality-traits">Personality Traits</label>
          <textarea id="personality-traits" name="personalityTraits" rows="3" placeholder="Key personality traits and quirks..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes" rows="3" placeholder="Additional notes and observations..."></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn-primary">Create Player Arc</button>
        </div>
      </form>
    `;

    this.showModal("Create Player Arc", modalContent);

    // Setup form handler
    const form = document.getElementById("create-arc-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreateArc(e.target);
    });
  }

  /**
   * Show modal for adding a new goal
   * @param {string} playerId - The player's unique identifier
   */
  showAddGoalModal(playerId) {
    const modalContent = `
      <form id="add-goal-form">
        <input type="hidden" name="playerId" value="${playerId}">
        
        <div class="form-group">
          <label for="goal-title">Goal Title *</label>
          <input type="text" id="goal-title" name="title" required>
        </div>
        
        <div class="form-group">
          <label for="goal-description">Description</label>
          <textarea id="goal-description" name="description" rows="3"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="goal-type">Type</label>
            <select id="goal-type" name="type">
              <option value="personal">Personal</option>
              <option value="story">Story</option>
              <option value="combat">Combat</option>
              <option value="social">Social</option>
              <option value="exploration">Exploration</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="goal-priority">Priority</label>
            <select id="goal-priority" name="priority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="goal-deadline">Deadline (optional)</label>
          <input type="date" id="goal-deadline" name="deadline">
        </div>
        
        <div class="form-group">
          <label for="goal-notes">Notes</label>
          <textarea id="goal-notes" name="notes" rows="2"></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn-primary">Add Goal</button>
        </div>
      </form>
    `;

    this.showModal("Add Goal", modalContent);

    // Setup form handler
    const form = document.getElementById("add-goal-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAddGoal(e.target, playerId);
    });
  }

  /**
   * Show modal for adding a new milestone
   * @param {string} playerId - The player's unique identifier
   */
  showAddMilestoneModal(playerId) {
    const modalContent = `
      <form id="add-milestone-form">
        <input type="hidden" name="playerId" value="${playerId}">
        
        <div class="form-group">
          <label for="milestone-title">Milestone Title *</label>
          <input type="text" id="milestone-title" name="title" required>
        </div>
        
        <div class="form-group">
          <label for="milestone-description">Description</label>
          <textarea id="milestone-description" name="description" rows="3"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="milestone-type">Type</label>
            <select id="milestone-type" name="type">
              <option value="story">Story</option>
              <option value="character">Character Development</option>
              <option value="combat">Combat Achievement</option>
              <option value="social">Social Achievement</option>
              <option value="exploration">Exploration</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="milestone-significance">Significance</label>
            <select id="milestone-significance" name="significance">
              <option value="minor">Minor</option>
              <option value="major" selected>Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="milestone-achieved">Achievement Date</label>
          <input type="datetime-local" id="milestone-achieved" name="achievedAt" 
                 value="${new Date().toISOString().slice(0, 16)}">
        </div>
        
        <div class="form-group">
          <label for="milestone-impact">Impact</label>
          <textarea id="milestone-impact" name="impact" rows="2" 
                    placeholder="How this milestone affected the character..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="milestone-notes">Notes</label>
          <textarea id="milestone-notes" name="notes" rows="2"></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn-primary">Add Milestone</button>
        </div>
      </form>
    `;

    this.showModal("Add Milestone", modalContent);

    // Setup form handler
    const form = document.getElementById("add-milestone-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAddMilestone(e.target, playerId);
    });
  }

  /**
   * Handle creation of a new player arc
   * @param {HTMLFormElement} form - The form element
   */
  async handleCreateArc(form) {
    try {
      const formData = new FormData(form);
      const playerId = `player_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const arcData = {
        playerName: formData.get("playerName"),
        characterName: formData.get("characterName"),
        backstory: formData.get("backstory"),
        personalityTraits: formData.get("personalityTraits"),
        notes: formData.get("notes"),
      };

      // Validate data
      const errors = this.core.validatePlayerArcData(arcData);
      if (errors.length > 0) {
        this.showError(errors.join(", "));
        return;
      }

      await this.core.createPlayerArc(playerId, arcData);

      // Close modal and refresh
      form.closest(".modal-overlay").remove();
      this.showSuccess("Player arc created successfully!");
      this.showPlayerArcOverview();
    } catch (error) {
      console.error("Error creating player arc:", error);
      this.showError("Failed to create player arc: " + error.message);
    }
  }

  /**
   * Handle adding a new goal
   * @param {HTMLFormElement} form - The form element
   * @param {string} playerId - The player's unique identifier
   */
  async handleAddGoal(form, playerId) {
    try {
      const formData = new FormData(form);

      const goalData = {
        title: formData.get("title"),
        description: formData.get("description"),
        type: formData.get("type"),
        priority: formData.get("priority"),
        deadline: formData.get("deadline") || null,
        notes: formData.get("notes"),
      };

      // Validate data
      const errors = this.progression.validateGoalData(goalData);
      if (errors.length > 0) {
        this.showError(errors.join(", "));
        return;
      }

      await this.progression.addGoal(playerId, goalData);

      // Close modal and refresh
      form.closest(".modal-overlay").remove();
      this.showSuccess("Goal added successfully!");
      this.viewArcDetails(playerId); // Refresh the details view
    } catch (error) {
      console.error("Error adding goal:", error);
      this.showError("Failed to add goal: " + error.message);
    }
  }

  /**
   * Handle adding a new milestone
   * @param {HTMLFormElement} form - The form element
   * @param {string} playerId - The player's unique identifier
   */
  async handleAddMilestone(form, playerId) {
    try {
      const formData = new FormData(form);

      const milestoneData = {
        title: formData.get("title"),
        description: formData.get("description"),
        type: formData.get("type"),
        significance: formData.get("significance"),
        achievedAt: formData.get("achievedAt"),
        impact: formData.get("impact"),
        notes: formData.get("notes"),
      };

      // Validate data
      const errors = this.progression.validateMilestoneData(milestoneData);
      if (errors.length > 0) {
        this.showError(errors.join(", "));
        return;
      }

      await this.progression.addMilestone(playerId, milestoneData);

      // Close modal and refresh
      form.closest(".modal-overlay").remove();
      this.showSuccess("Milestone added successfully!");
      this.viewArcDetails(playerId); // Refresh the details view
    } catch (error) {
      console.error("Error adding milestone:", error);
      this.showError("Failed to add milestone: " + error.message);
    }
  }

  /**
   * Edit an existing player arc
   * @param {string} playerId - The player's unique identifier
   */
  editArc(playerId) {
    // For now, just show details. Full edit would be similar to create modal
    this.viewArcDetails(playerId);
  }

  /**
   * Get player options for dropdowns
   * @returns {Promise<Array>} Array of player options
   */
  async getPlayerOptions() {
    try {
      const response = await fetch("/api/characters");
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Error loading player options:", error);
    }
    return [];
  }

  /**
   * Show a modal dialog
   * @param {string} title - Modal title
   * @param {string} content - Modal content HTML
   */
  showModal(title, content) {
    uiNotificationService.showModal(title, content, [{ text: 'Close', class: 'btn-secondary', action: () => {} }]);
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    uiNotificationService.showToast(message, 'error');
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    uiNotificationService.showToast(message, 'success');
  }
}
