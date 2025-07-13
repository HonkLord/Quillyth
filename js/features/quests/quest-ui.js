import { uiNotificationService } from "../../services/ui-notification-service.js";
import { escapeHTML } from "../../shared/escape-html.js";

/**
 * QuestUI - Handles quest UI rendering, modal dialogs, and user interactions
 * Manages HTML generation, event handling, and user interface for quest management
 */
export default class QuestUI {
  constructor(questCore, questTracking) {
    this.questCore = questCore;
    this.questTracking = questTracking;
  }

  /**
   * Show quest management interface
   */
  showQuestManagement() {
    const overview = this.questTracking.generateQuestOverview();

    const content = `
      <div class="workspace-container">
        <div class="workspace-feature-header">
          <div class="workspace-feature-title">
            <i class="fas fa-scroll"></i>
            <div>
              <h2>Quest Management</h2>
              <p class="workspace-feature-subtitle">Track and manage campaign quests and objectives</p>
            </div>
          </div>
          <div class="workspace-feature-actions">
            <button class="btn btn-primary" data-action="create-quest">
              <i class="fas fa-plus"></i> New Quest
            </button>
            <button class="btn btn-secondary" data-action="refresh-quests">
              <i class="fas fa-sync"></i> Refresh
            </button>
          </div>
        </div>
        
        <div class="workspace-section">
          <div class="workspace-section-header">
            <h3 class="workspace-section-title">
              <i class="fas fa-chart-bar"></i>
              Quest Overview
            </h3>
          </div>
          <div class="workspace-stats-grid">
            <div class="card card-stat">
              <div class="stat-value">${overview.total}</div>
              <div class="stat-label">Total Quests</div>
            </div>
            <div class="card card-stat">
              <div class="stat-value">${overview.statusCounts.active || 0}</div>
              <div class="stat-label">Active</div>
            </div>
            <div class="card card-stat">
              <div class="stat-value">${
                overview.statusCounts.completed || 0
              }</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="card card-stat">
              <div class="stat-value">${
                overview.statusCounts.not_started || 0
              }</div>
              <div class="stat-label">Not Started</div>
            </div>
          </div>
        </div>
        
        <div class="workspace-section">
          <div class="workspace-section-header">
            <h3 class="workspace-section-title">
              <i class="fas fa-filter"></i>
              Filters
            </h3>
          </div>
          <div class="quest-filters">
            <div class="filter-group">
              <label>Status:</label>
              <select id="quest-status-filter">
                <option value="">All Statuses</option>
                ${this.questCore
                  .getQuestStatuses()
                  .map(
                    (status) =>
                      `<option value="${status}">${status.replace(
                        "_",
                        " "
                      )}</option>`
                  )
                  .join("")}
              </select>
            </div>
            
            <div class="filter-group">
              <label>Category:</label>
              <select id="quest-category-filter">
                <option value="">All Categories</option>
                ${this.questCore
                  .getQuestCategories()
                  .map(
                    (category) =>
                      `<option value="${category}">${category}</option>`
                  )
                  .join("")}
              </select>
            </div>
            
          </div>
        </div>
        
        <div class="workspace-section">
          <div class="workspace-section-header">
            <h3 class="workspace-section-title">
              <i class="fas fa-list"></i>
              Active Quests
            </h3>
          </div>
          <div id="quest-list-container">
            ${this.generateQuestListHTML()}
          </div>
        </div>
      </div>
    `;

    const questsContent = document.getElementById("quests-content");
    if (questsContent) {
      questsContent.innerHTML = content;
      this.setupQuestFilters();
    }
  }

  /**
   * Generate quest list HTML
   */
  generateQuestListHTML(filter = {}) {
    let quests = this.questCore.filterQuests(filter);

    // Sort by priority and updated date
    quests.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    if (quests.length === 0) {
      return `
        <div class="workspace-empty-state">
          <i class="fas fa-scroll"></i>
          <h3>No Quests Found</h3>
          <p>No quests match your current filters.</p>
          <button class="btn btn-primary" data-action="create-quest">
            <i class="fas fa-plus"></i> Create New Quest
          </button>
        </div>
      `;
    }

    return `
      <div class="workspace-cards-grid">
        ${quests.map((quest) => this.generateQuestCardHTML(quest)).join("")}
      </div>
    `;
  }

  /**
   * Generate individual quest card HTML
   */
  generateQuestCardHTML(quest) {
    const statusClass = `quest-status-${quest.status.replace("_", "-")}`;
    const priorityClass = `quest-priority-${quest.priority}`;
    const stats = this.questTracking.getQuestCompletionStats(quest);

    return `
      <div class="card card-quest clickable status-${quest.status.replace(
        "_",
        "-"
      )} priority-${quest.priority}" data-quest-id="${quest.id}">
        <div class="card-header">
          <div class="card-title-info">
            <h4 class="card-title">${escapeHTML(quest.title)}</h4>
            <div class="card-meta">
              <span class="card-category">${quest.category}</span>
              <span class="card-status">${quest.status.replace("_", " ")}</span>
              <span class="quest-priority">${quest.priority} priority</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-outline-primary" data-action="view-quest" data-quest-id="${
              quest.id
            }" title="View Quest">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary" data-action="edit-quest" data-quest-id="${
              quest.id
            }" title="Edit Quest">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete-quest" data-quest-id="${
              quest.id
            }" title="Delete Quest">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        ${
          quest.description
            ? `
          <div class="card-body">
            <p class="card-description">${escapeHTML(quest.description)}</p>
          </div>
        `
            : ""
        }
        
        ${
          quest.objectives.length > 0
            ? `
          <div class="quest-objectives">
            <h5>Objectives (${stats.completedObjectives}/${
                stats.totalObjectives
              })</h5>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${
                stats.progressPercent
              }%"></div>
            </div>
            <ul class="objective-list">
              ${quest.objectives
                .map(
                  (obj) => `
                <li class="objective-item ${obj.completed ? "completed" : ""}">
                  <input type="checkbox" 
                         ${obj.completed ? "checked" : ""} 
                         data-action="toggle-objective"
                         data-quest-id="${quest.id}"
                         data-objective-id="${obj.id}">
                  <span class="objective-text">${escapeHTML(obj.text)}</span>
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
        
        ${
          quest.rewards.length > 0
            ? `
          <div class="quest-rewards">
            <h5>Rewards</h5>
            <ul class="reward-list">
              ${quest.rewards
                .map(
                  (reward) => `
                <li class="reward-item">
                  <span class="reward-type">${reward.type}</span>: 
                  <span class="reward-description">${escapeHTML(
                    reward.description
                  )}</span>
                  ${
                    reward.value
                      ? `<span class="reward-value">(${reward.value})</span>`
                      : ""
                  }
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
        
        ${
          quest.assigned_players && quest.assigned_players.length > 0
            ? `
          <div class="quest-players">
            <h5>Assigned Players</h5>
            <div class="player-list">
              ${quest.assigned_players
                .map(
                  (playerId) => `
                <span class="player-tag">${playerId}</span>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        
        <div class="quest-footer">
          <span class="quest-dates">
            Created: ${new Date(quest.created_at).toLocaleDateString()}
            ${
              quest.updated_at !== quest.created_at
                ? `• Updated: ${new Date(
                    quest.updated_at
                  ).toLocaleDateString()}`
                : ""
            }
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Setup quest filter event listeners
   */
  setupQuestFilters() {
    const statusFilter = document.getElementById("quest-status-filter");
    const categoryFilter = document.getElementById("quest-category-filter");

    const applyFilters = () => {
      const filters = {
        status: statusFilter?.value || "",
        category: categoryFilter?.value || "",
        search: "",
      };

      this.filterQuests(filters);
    };

    statusFilter?.addEventListener("change", applyFilters);
    categoryFilter?.addEventListener("change", applyFilters);
  }

  /**
   * Apply filters to quest list
   */
  filterQuests(filters) {
    const container = document.getElementById("quest-list-container");
    if (container) {
      container.innerHTML = this.generateQuestListHTML(filters);
    }
  }

  /**
   * Show create quest modal
   */
  async showCreateQuestModal() {
    console.log("🎯 Showing create quest modal");

    try {
      // Load locations and sessions for dropdowns
      const [locationsResponse, sessionsResponse] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/sessions"),
      ]);

      const locations = await locationsResponse.json();
      const sessions = await sessionsResponse.json();

      // Show create quest modal
      this.displayCreateQuestModal(locations, sessions);
    } catch (error) {
      console.error("Error loading data for quest creation:", error);
      this.showError("Failed to load quest creation data");
    }
  }

  /**
   * Display create quest modal
   */
  displayCreateQuestModal(locations, sessions) {
    const modalContent = `
      <div class="create-quest-modal">
        <h3>Create New Quest</h3>
        <form id="create-quest-form">
          <div class="form-group">
            <label for="quest-title">Quest Title *</label>
            <input type="text" id="quest-title" name="title" required 
                   placeholder="Enter quest title..." />
          </div>
          
          <div class="form-group">
            <label for="quest-description">Description</label>
            <textarea id="quest-description" name="description" 
                      placeholder="Describe the quest..." rows="3"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="quest-category">Category</label>
              <select id="quest-category" name="category">
                ${this.questCore
                  .getQuestCategories()
                  .map(
                    (category) =>
                      `<option value="${category}" ${
                        category === "side" ? "selected" : ""
                      }>${category}</option>`
                  )
                  .join("")}
              </select>
            </div>
            
            <div class="form-group">
              <label for="quest-priority">Priority</label>
              <select id="quest-priority" name="priority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="quest-location">Location</label>
              <select id="quest-location" name="location_id">
                <option value="">Select location...</option>
                ${locations
                  .map(
                    (loc) => `<option value="${loc.id}">${loc.name}</option>`
                  )
                  .join("")}
              </select>
            </div>
            
            <div class="form-group">
              <label for="quest-session">Session</label>
              <select id="quest-session" name="session_id">
                <option value="">Select session...</option>
                ${sessions
                  .map(
                    (session) =>
                      `<option value="${session.id}">Session ${
                        session.session_number || session.id
                      } - ${session.title || "Untitled"}</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="quest-objectives">Objectives</label>
            <div id="quest-objectives-container">
              <div class="objective-item">
                <input type="text" placeholder="Enter objective..." class="objective-input" />
                <button type="button" class="btn btn-danger btn-sm remove-objective">Remove</button>
              </div>
            </div>
            <button type="button" id="add-objective" class="btn btn-secondary btn-sm">
              <i class="fas fa-plus"></i> Add Objective
            </button>
          </div>
          
          <div class="form-group">
            <label for="quest-rewards">Rewards</label>
            <div id="quest-rewards-container">
              <div class="reward-item">
                <input type="text" placeholder="Enter reward..." class="reward-input" />
                <button type="button" class="btn btn-danger btn-sm remove-reward">Remove</button>
              </div>
            </div>
            <button type="button" id="add-reward" class="btn btn-secondary btn-sm">
              <i class="fas fa-plus"></i> Add Reward
            </button>
          </div>
          
          <div class="form-group">
            <label for="quest-notes">Notes</label>
            <textarea id="quest-notes" name="notes" 
                      placeholder="Additional notes..." rows="3"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Create Quest
            </button>
          </div>
        </form>
      </div>
    `;

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = modalContent;

    // Add modal to page
    document.body.appendChild(modalOverlay);

    // Setup modal event listeners
    this.setupCreateQuestModalEvents(modalOverlay);

    // Focus on title field
    setTimeout(() => {
      const titleInput = modalOverlay.querySelector("#quest-title");
      if (titleInput) titleInput.focus();
    }, 100);
  }

  /**
   * Setup event listeners for create quest modal
   */
  setupCreateQuestModalEvents(modalOverlay) {
    const form = modalOverlay.querySelector("#create-quest-form");
    const addObjectiveBtn = modalOverlay.querySelector("#add-objective");
    const addRewardBtn = modalOverlay.querySelector("#add-reward");

    // Handle form submission
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreateQuestSubmit(form, modalOverlay);
    });

    // Handle adding objectives
    addObjectiveBtn.addEventListener("click", () => {
      this.addObjectiveField();
    });

    // Handle adding rewards
    addRewardBtn.addEventListener("click", () => {
      this.addRewardField();
    });

    // Handle removing objectives and rewards
    modalOverlay.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-objective")) {
        e.target.closest(".objective-item").remove();
      }
      if (e.target.classList.contains("remove-reward")) {
        e.target.closest(".reward-item").remove();
      }
    });

    // Close modal on overlay click
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.contains(modalOverlay)) {
        modalOverlay.remove();
      }
    });
  }

  /**
   * Handle create quest form submission
   */
  async handleCreateQuestSubmit(form, modalOverlay) {
    try {
      const formData = new FormData(form);

      // Collect objectives
      const objectiveInputs = form.querySelectorAll(".objective-input");
      const objectives = Array.from(objectiveInputs)
        .map((input) => input.value.trim())
        .filter((text) => text)
        .map((text) => ({ text, completed: false }));

      // Collect rewards
      const rewardInputs = form.querySelectorAll(".reward-input");
      const rewards = Array.from(rewardInputs)
        .map((input) => input.value.trim())
        .filter((text) => text)
        .map((description) => ({ description, type: "item" }));

      const questData = {
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        priority: formData.get("priority"),
        location_id: formData.get("location_id") || null,
        session_id: formData.get("session_id") || null,
        objectives,
        rewards,
        notes: formData.get("notes"),
      };

      // Validate quest data
      const errors = this.questCore.validateQuestData(questData);
      if (errors.length > 0) {
        this.showError(errors.join(", "));
        return;
      }

      // Create quest
      await this.questCore.createQuest(questData);

      // Close modal and refresh list
      modalOverlay.remove();
      this.showSuccess("Quest created successfully!");
      this.showQuestManagement(); // Refresh the quest list
    } catch (error) {
      console.error("Error creating quest:", error);
      this.showError("Failed to create quest: " + error.message);
    }
  }

  /**
   * Add objective field
   */
  addObjectiveField() {
    const container = document.getElementById("quest-objectives-container");
    const objectiveItem = document.createElement("div");
    objectiveItem.className = "objective-item";
    objectiveItem.innerHTML = `
      <input type="text" placeholder="Enter objective..." class="objective-input" />
      <button type="button" class="btn btn-danger btn-sm remove-objective">Remove</button>
    `;
    container.appendChild(objectiveItem);
  }

  /**
   * Add reward field
   */
  addRewardField() {
    const container = document.getElementById("quest-rewards-container");
    const rewardItem = document.createElement("div");
    rewardItem.className = "reward-item";
    rewardItem.innerHTML = `
      <input type="text" placeholder="Enter reward..." class="reward-input" />
      <button type="button" class="btn btn-danger btn-sm remove-reward">Remove</button>
    `;
    container.appendChild(rewardItem);
  }

  /**
   * Show quest details modal
   */
  showQuestDetails(questId) {
    const quest = this.questCore.getQuest(questId);
    if (!quest) {
      this.showError("Quest not found");
      return;
    }

    const stats = this.questTracking.getQuestCompletionStats(quest);

    const modalContent = `
      <div class="quest-details-modal">
        <h3>${quest.title}</h3>
        <div class="quest-detail-content">
          <div class="quest-info">
            <p><strong>Category:</strong> ${quest.category}</p>
            <p><strong>Status:</strong> ${quest.status.replace("_", " ")}</p>
            <p><strong>Priority:</strong> ${quest.priority}</p>
            ${
              quest.description
                ? `<p><strong>Description:</strong> ${quest.description}</p>`
                : ""
            }
            ${
              quest.notes ? `<p><strong>Notes:</strong> ${quest.notes}</p>` : ""
            }
          </div>
          
          ${
            quest.objectives.length > 0
              ? `
            <div class="quest-objectives">
              <h4>Objectives (${stats.completedObjectives}/${
                  stats.totalObjectives
                })</h4>
              <ul>
                ${quest.objectives
                  .map(
                    (obj) => `
                  <li class="${obj.completed ? "completed" : ""}">
                    ${obj.completed ? "✓" : "○"} ${obj.text}
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }
          
          ${
            quest.rewards.length > 0
              ? `
            <div class="quest-rewards">
              <h4>Rewards</h4>
              <ul>
                ${quest.rewards
                  .map(
                    (reward) => `
                  <li>${reward.description} ${
                      reward.value ? `(${reward.value})` : ""
                    }</li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
            Close
          </button>
          <button type="button" class="btn btn-primary" data-action="edit-quest" data-quest-id="${questId}">
            Edit Quest
          </button>
        </div>
      </div>
    `;

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = modalContent;

    // Add modal to page
    document.body.appendChild(modalOverlay);

    // Close modal on overlay click
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });
  }

  /**
   * Confirm quest deletion
   */
  async confirmDeleteQuest(questId) {
    const quest = this.questCore.getQuest(questId);
    if (!quest) {
      this.showError("Quest not found");
      return;
    }

    const confirmed = await uiNotificationService.showConfirmation(
      "Delete Quest",
      `Are you sure you want to delete the quest "${quest.title}"? This action cannot be undone.`
    );

    if (confirmed) {
      this.deleteQuest(questId);
    }
  }

  /**
   * Delete quest
   */
  async deleteQuest(questId) {
    try {
      await this.questCore.deleteQuest(questId);
      this.showSuccess("Quest deleted successfully!");
      this.showQuestManagement(); // Refresh the quest list
    } catch (error) {
      console.error("Error deleting quest:", error);
      this.showError("Failed to delete quest: " + error.message);
    }
  }

  /**
   * Toggle objective completion
   */
  async toggleObjective(questId, objectiveId, completed) {
    try {
      await this.questTracking.toggleObjective(questId, objectiveId, completed);

      // Check for auto-completion
      await this.questTracking.checkAutoComplete(questId);

      // Refresh the quest list
      this.showQuestManagement();
    } catch (error) {
      console.error("Error toggling objective:", error);
      this.showError("Failed to update objective");
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    uiNotificationService.showToast(message, "error");
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    uiNotificationService.showToast(message, "success");
  }

  /**
   * Setup event listeners for quest management
   */
  setupEventListeners() {
    document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;

      switch (action) {
        case "create-quest":
          this.showCreateQuestModal();
          break;
        case "edit-quest":
          const questId =
            event.target.closest("[data-quest-id]")?.dataset.questId;
          if (questId) this.showEditQuestModal(questId);
          break;
        case "delete-quest":
          const deleteQuestId =
            event.target.closest("[data-quest-id]")?.dataset.questId;
          if (deleteQuestId) this.confirmDeleteQuest(deleteQuestId);
          break;
        case "view-quest":
          const viewQuestId =
            event.target.closest("[data-quest-id]")?.dataset.questId;
          if (viewQuestId) this.showQuestDetails(viewQuestId);
          break;
        case "toggle-objective":
          const toggleQuestId = event.target.dataset.questId;
          const objectiveId = event.target.dataset.objectiveId;
          if (toggleQuestId && objectiveId) {
            this.toggleObjective(
              toggleQuestId,
              objectiveId,
              event.target.checked
            );
          }
          break;
      }
    });
  }

  /**
   * Show edit quest modal with pre-populated data
   */
  async showEditQuestModal(questId) {
    console.log("🎯 Showing edit quest modal for quest:", questId);

    try {
      const quest = this.questCore.getQuest(questId);
      if (!quest) {
        this.showError("Quest not found");
        return;
      }

      // Load locations and sessions for dropdowns
      const [locationsResponse, sessionsResponse] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/sessions"),
      ]);

      const locations = await locationsResponse.json();
      const sessions = await sessionsResponse.json();

      // Show edit quest modal with pre-populated data
      this.displayEditQuestModal(quest, locations, sessions);
    } catch (error) {
      console.error("Error loading data for quest editing:", error);
      this.showError("Failed to load quest editing data");
    }
  }

  /**
   * Display edit quest modal with pre-populated form
   */
  displayEditQuestModal(quest, locations, sessions) {
    const modalContent = `
      <div class="modal-content create-quest-modal">
        <div class="modal-header">
          <h3>Edit Quest</h3>
          <button type="button" class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="edit-quest-form">
          <input type="hidden" name="questId" value="${quest.id}">
          
          <div class="form-row">
            <div class="form-group">
              <label for="edit-quest-title">Quest Title *</label>
              <input type="text" id="edit-quest-title" name="title" value="${
                quest.title
              }" required>
            </div>
            
            <div class="form-group">
              <label for="edit-quest-category">Category *</label>
              <select id="edit-quest-category" name="category" required>
                <option value="main" ${
                  quest.category === "main" ? "selected" : ""
                }>Main Quest</option>
                <option value="side" ${
                  quest.category === "side" ? "selected" : ""
                }>Side Quest</option>
                <option value="personal" ${
                  quest.category === "personal" ? "selected" : ""
                }>Personal Quest</option>
                <option value="faction" ${
                  quest.category === "faction" ? "selected" : ""
                }>Faction Quest</option>
                <option value="exploration" ${
                  quest.category === "exploration" ? "selected" : ""
                }>Exploration</option>
                <option value="investigation" ${
                  quest.category === "investigation" ? "selected" : ""
                }>Investigation</option>
                <option value="combat" ${
                  quest.category === "combat" ? "selected" : ""
                }>Combat</option>
                <option value="social" ${
                  quest.category === "social" ? "selected" : ""
                }>Social</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="edit-quest-status">Status *</label>
              <select id="edit-quest-status" name="status" required>
                <option value="not_started" ${
                  quest.status === "not_started" ? "selected" : ""
                }>Not Started</option>
                <option value="active" ${
                  quest.status === "active" ? "selected" : ""
                }>Active</option>
                <option value="completed" ${
                  quest.status === "completed" ? "selected" : ""
                }>Completed</option>
                <option value="failed" ${
                  quest.status === "failed" ? "selected" : ""
                }>Failed</option>
                <option value="on_hold" ${
                  quest.status === "on_hold" ? "selected" : ""
                }>On Hold</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="edit-quest-priority">Priority *</label>
              <select id="edit-quest-priority" name="priority" required>
                <option value="low" ${
                  quest.priority === "low" ? "selected" : ""
                }>Low</option>
                <option value="medium" ${
                  quest.priority === "medium" ? "selected" : ""
                }>Medium</option>
                <option value="high" ${
                  quest.priority === "high" ? "selected" : ""
                }>High</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="edit-quest-description">Description</label>
            <textarea id="edit-quest-description" name="description" rows="4">${
              quest.description || ""
            }</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="edit-quest-location">Location</label>
              <select id="edit-quest-location" name="location_id">
                <option value="">No specific location</option>
                ${locations
                  .map(
                    (loc) =>
                      `<option value="${loc.id}" ${
                        quest.location_id === loc.id ? "selected" : ""
                      }>${loc.name} (${loc.location_type})</option>`
                  )
                  .join("")}
              </select>
            </div>
            
            <div class="form-group">
              <label for="edit-quest-session">Related Session</label>
              <select id="edit-quest-session" name="session_id">
                <option value="">No specific session</option>
                ${sessions
                  .map(
                    (session) =>
                      `<option value="${session.id}" ${
                        quest.session_id === session.id ? "selected" : ""
                      }>${session.title} (${new Date(
                        session.date
                      ).toLocaleDateString()})</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Objectives</label>
            <div id="edit-objectives-container">
              ${quest.objectives
                .map(
                  (obj, index) => `
                <div class="objective-item" data-objective-index="${index}">
                  <input type="text" name="objectives[]" value="${
                    obj.text
                  }" placeholder="Objective description" class="objective-input">
                  <label class="objective-completed-label">
                    <input type="checkbox" name="objective_completed[]" ${
                      obj.completed ? "checked" : ""
                    }>
                    Completed
                  </label>
                  <button type="button" class="btn btn-xs btn-outline-danger remove-objective">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              `
                )
                .join("")}
            </div>
            <button type="button" id="edit-add-objective" class="btn btn-sm btn-outline-primary">
              <i class="fas fa-plus"></i> Add Objective
            </button>
          </div>
          
          <div class="form-group">
            <label>Rewards</label>
            <div id="edit-rewards-container">
              ${quest.rewards
                .map(
                  (reward, index) => `
                <div class="reward-item" data-reward-index="${index}">
                  <select name="reward_types[]" class="reward-type-select">
                    <option value="experience" ${
                      reward.type === "experience" ? "selected" : ""
                    }>Experience</option>
                    <option value="gold" ${
                      reward.type === "gold" ? "selected" : ""
                    }>Gold</option>
                    <option value="item" ${
                      reward.type === "item" ? "selected" : ""
                    }>Item</option>
                    <option value="reputation" ${
                      reward.type === "reputation" ? "selected" : ""
                    }>Reputation</option>
                    <option value="other" ${
                      reward.type === "other" ? "selected" : ""
                    }>Other</option>
                  </select>
                  <input type="text" name="reward_descriptions[]" value="${
                    reward.description
                  }" placeholder="Reward description" class="reward-input">
                  <input type="text" name="reward_values[]" value="${
                    reward.value || ""
                  }" placeholder="Value (optional)" class="reward-value">
                  <button type="button" class="btn btn-xs btn-outline-danger remove-reward">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              `
                )
                .join("")}
            </div>
            <button type="button" id="edit-add-reward" class="btn btn-sm btn-outline-primary">
              <i class="fas fa-plus"></i> Add Reward
            </button>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Update Quest</button>
          </div>
        </form>
      </div>
    `;

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = modalContent;

    // Add modal to page
    document.body.appendChild(modalOverlay);

    // Setup modal events
    this.setupEditQuestModalEvents(modalOverlay);

    // Close modal on overlay click
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });
  }

  /**
   * Setup edit quest modal event listeners
   */
  setupEditQuestModalEvents(modalOverlay) {
    const form = modalOverlay.querySelector("#edit-quest-form");
    const addObjectiveBtn = modalOverlay.querySelector("#edit-add-objective");
    const addRewardBtn = modalOverlay.querySelector("#edit-add-reward");

    // Form submission
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleEditQuestSubmit(form, modalOverlay);
    });

    // Add objective button
    addObjectiveBtn.addEventListener("click", () => {
      this.addEditObjectiveField();
    });

    // Add reward button
    addRewardBtn.addEventListener("click", () => {
      this.addEditRewardField();
    });

    // Remove objective buttons
    modalOverlay.addEventListener("click", (e) => {
      if (e.target.closest(".remove-objective")) {
        e.target.closest(".objective-item").remove();
      }
      if (e.target.closest(".remove-reward")) {
        e.target.closest(".reward-item").remove();
      }
    });
  }

  /**
   * Add objective field to edit form
   */
  addEditObjectiveField() {
    const container = document.getElementById("edit-objectives-container");
    const objectiveItem = document.createElement("div");
    objectiveItem.className = "objective-item";
    objectiveItem.innerHTML = `
      <input type="text" name="objectives[]" placeholder="Objective description" class="objective-input">
      <label class="objective-completed-label">
        <input type="checkbox" name="objective_completed[]">
        Completed
      </label>
      <button type="button" class="btn btn-xs btn-outline-danger remove-objective">
        <i class="fas fa-trash"></i>
      </button>
    `;
    container.appendChild(objectiveItem);
  }

  /**
   * Add reward field to edit form
   */
  addEditRewardField() {
    const container = document.getElementById("edit-rewards-container");
    const rewardItem = document.createElement("div");
    rewardItem.className = "reward-item";
    rewardItem.innerHTML = `
      <select name="reward_types[]" class="reward-type-select">
        <option value="experience">Experience</option>
        <option value="gold">Gold</option>
        <option value="item">Item</option>
        <option value="reputation">Reputation</option>
        <option value="other">Other</option>
      </select>
      <input type="text" name="reward_descriptions[]" placeholder="Reward description" class="reward-input">
      <input type="text" name="reward_values[]" placeholder="Value (optional)" class="reward-value">
      <button type="button" class="btn btn-xs btn-outline-danger remove-reward">
        <i class="fas fa-trash"></i>
      </button>
    `;
    container.appendChild(rewardItem);
  }

  /**
   * Handle edit quest form submission
   */
  async handleEditQuestSubmit(form, modalOverlay) {
    try {
      const formData = new FormData(form);
      const questId = formData.get("questId");

      // Collect objectives
      const objectives = [];
      const objectiveTexts = formData.getAll("objectives[]");
      const objectiveCompleted = formData.getAll("objective_completed[]");

      objectiveTexts.forEach((text, index) => {
        if (text.trim()) {
          objectives.push({
            text: text.trim(),
            completed: objectiveCompleted.includes(index.toString()),
          });
        }
      });

      // Collect rewards
      const rewards = [];
      const rewardTypes = formData.getAll("reward_types[]");
      const rewardDescriptions = formData.getAll("reward_descriptions[]");
      const rewardValues = formData.getAll("reward_values[]");

      rewardTypes.forEach((type, index) => {
        const description = rewardDescriptions[index];
        if (description && description.trim()) {
          rewards.push({
            type: type,
            description: description.trim(),
            value: rewardValues[index] || null,
          });
        }
      });

      const questData = {
        title: formData.get("title"),
        category: formData.get("category"),
        status: formData.get("status"),
        priority: formData.get("priority"),
        description: formData.get("description"),
        location_id: formData.get("location_id") || null,
        session_id: formData.get("session_id") || null,
        objectives: objectives,
        rewards: rewards,
      };

      // Update quest
      await this.questCore.updateQuest(questId, questData);

      // Close modal and refresh
      modalOverlay.remove();
      this.showSuccess("Quest updated successfully!");
      this.showQuestManagement();
    } catch (error) {
      console.error("Error updating quest:", error);
      this.showError("Failed to update quest: " + error.message);
    }
  }
}
