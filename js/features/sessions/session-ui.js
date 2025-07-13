import { SessionCore } from "./session-core.js";
import { SessionForms } from "./session-forms.js";
import { uiNotificationService } from '../../services/ui-notification-service.js';

/**
 * SessionUI - UI rendering and modal interactions for sessions
 * Part of the modular session management architecture
 * Handles: modals, toasts, and UI rendering (under 400 lines)
 */
export class SessionUI {
  constructor(sessionCore) {
    this.core = sessionCore;
    this.forms = new SessionForms();
  }

  /**
   * Create the main session manager HTML
   */
  createSessionManagerHTML() {
    return `
      <div class="workspace-container">
        <div class="workspace-feature-header">
          <div class="workspace-feature-title">
            <i class="fas fa-calendar-alt"></i>
            <div>
              <h2>Session Management</h2>
              <p class="workspace-feature-subtitle">Plan and organize your campaign sessions with scenes, participants, and notes</p>
            </div>
          </div>
          <div class="workspace-feature-actions">
            <button class="btn btn-primary" onclick="sessionManager.showCreateSessionModal()">
              <i class="fas fa-plus"></i> New Session
            </button>
            <button class="btn btn-secondary" onclick="sessionManager.showSessionPlanner()">
              <i class="fas fa-tasks"></i> Session Planner
            </button>
          </div>
        </div>

        <div class="workspace-section">
          <div class="workspace-section-header">
            <h3 class="workspace-section-title">
              <i class="fas fa-chart-bar"></i>
              Session Statistics
            </h3>
          </div>
          <div class="workspace-section-content">
            <div class="workspace-stats-grid" id="session-stats">
              <!-- Stats will be populated by updateSessionStats() -->
            </div>
          </div>
        </div>

        <div class="workspace-section">
          <div class="workspace-section-header">
            <h3 class="workspace-section-title">
              <i class="fas fa-list"></i>
              Sessions
            </h3>
            <div class="workspace-section-actions">
              <select class="form-control" id="session-filter" onchange="sessionManager.filterSessions(this.value)">
                <option value="all">All Sessions</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>
          </div>
          <div class="workspace-section-content">
            <div class="workspace-cards-grid" id="session-list">
              <div class="loading-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading sessions...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create empty sessions HTML
   */
  createEmptySessionsHTML() {
    return `
      <div class="workspace-empty-state">
        <i class="fas fa-calendar-plus"></i>
        <h3>No Sessions Yet</h3>
        <p>Create your first session to start planning your campaign</p>
        <button class="btn btn-primary" onclick="sessionManager.showCreateSessionModal()">
          <i class="fas fa-plus"></i> Create First Session
        </button>
      </div>
    `;
  }

  /**
   * Create session card HTML
   */
  createSessionCardHTML(session) {
    const status = this.core.getSessionStatus(session);
    const statusClass = status.toLowerCase().replace(/\s+/g, "-");

    return `
      <div class="card card-session clickable" data-session-id="${session.id}">
        <div class="card-header">
          <div class="card-title-info">
            <h4 class="card-title">Session ${
              session.session_number || "N/A"
            }: ${session.title || "Untitled"}</h4>
            <div class="card-meta">
              <span class="card-status status-${statusClass}">${status}</span>
              <span class="card-category">
                <i class="fas fa-calendar"></i>
                ${
                  session.date
                    ? new Date(session.date).toLocaleDateString()
                    : "No date set"
                }
              </span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-primary" data-action="plan" title="Plan Session">
              <i class="fas fa-tasks"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary" data-action="edit" title="Edit Session">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
        ${
          session.summary
            ? `
          <div class="card-body">
            <p class="card-description">${session.summary}</p>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  /**
   * Update session statistics display
   */
  updateSessionStats() {
    const stats = this.core.getSessionStats();
    const statsContainer = document.getElementById("session-stats");

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="card card-stat">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
        <div class="card card-stat">
          <div class="stat-value">${stats.upcoming}</div>
          <div class="stat-label">Upcoming</div>
        </div>
        <div class="card card-stat">
          <div class="stat-value">${stats.completed}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="card card-stat">
          <div class="stat-value">${stats.draft}</div>
          <div class="stat-label">Draft</div>
        </div>
      `;
    }
  }

  /**
   * Render the session list
   */
  renderSessionList() {
    const sessionList = document.getElementById("session-list");
    const sessions = this.core.getAllSessions();

    if (!sessionList) return;

    if (sessions.length === 0) {
      sessionList.innerHTML = this.createEmptySessionsHTML();
      return;
    }

    sessionList.innerHTML = sessions
      .map((session) => this.createSessionCardHTML(session))
      .join("");
  }

  /**
   * Display filtered sessions
   */
  displayFilteredSessions(sessions) {
    const sessionList = document.getElementById("session-list");
    if (!sessionList) return;

    if (sessions.length === 0) {
      sessionList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>No sessions found matching your criteria</p>
        </div>
      `;
      return;
    }

    sessionList.innerHTML = sessions
      .map((session) => this.createSessionCardHTML(session))
      .join("");
  }

  /**
   * Show create session modal
   */
  showCreateSessionModal() {
    console.log("🎯 Opening create session modal");

    const modalContent = this.forms.createSessionModalHTML();
    const modalOverlay = this.createModalOverlay(modalContent);

    // Setup form submission
    const form = document.getElementById("create-session-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      window.sessionManager.handleCreateSession(form);
    });

    // Set default session number
    this.setDefaultSessionNumber();
    this.setupModalCloseHandlers(modalOverlay);
  }

  /**
   * Show edit session modal
   */
  showEditSessionModal(session) {
    console.log(
      `🎯 Opening edit modal for session ${session.id}:`,
      session.title
    );

    const modalContent = this.forms.createEditSessionModalHTML(session);
    const modalOverlay = this.createModalOverlay(modalContent);

    // Setup form submission
    const form = document.getElementById("edit-session-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      window.sessionManager.handleEditSession(form);
    });

    this.setupModalCloseHandlers(modalOverlay);
  }

  /**
   * Show session details modal
   */
  showSessionDetailsModal(session) {
    console.log(`🎯 Show session details ${session.id}:`, session.title);

    const modalContent = this.forms.createSessionDetailsModalHTML(
      session,
      this.core
    );
    const modalOverlay = this.createModalOverlay(modalContent);
    this.setupModalCloseHandlers(modalOverlay);
  }

  /**
   * Show session planner selection modal
   */
  showSessionPlannerModal() {
    console.log("🎯 Show session planner selection");

    const sessions = this.core
      .getAllSessions()
      .filter((s) => s.status !== "completed" && s.status !== "cancelled");

    if (sessions.length === 0) {
      this.showError(
        "No sessions available for planning. Create a session first."
      );
      return;
    }

    const modalContent = this.forms.createSessionPlannerSelectionHTML(
      sessions,
      this.core
    );
    const modalOverlay = this.createModalOverlay(modalContent);
    this.setupModalCloseHandlers(modalOverlay);
  }

  /**
   * Set default session number based on existing sessions
   */
  setDefaultSessionNumber() {
    const sessions = this.core.getAllSessions();
    const maxSessionNumber = Math.max(
      0,
      ...sessions.map((s) => s.session_number || 0)
    );
    const nextNumber = maxSessionNumber + 1;

    const sessionNumberInput = document.getElementById("session-number");
    if (sessionNumberInput) {
      sessionNumberInput.value = nextNumber;
    }
  }

  /**
   * Create modal overlay element
   */
  createModalOverlay(content) {
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = content;
    document.body.appendChild(modalOverlay);
    return modalOverlay;
  }

  /**
   * Setup modal close handlers
   */
  setupModalCloseHandlers(modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });
  }

  /**
   * Show success toast
   */
  showSuccess(message) {
    uiNotificationService.showToast(message, "success");
  }

  /**
   * Show error toast
   */
  showError(message) {
    uiNotificationService.showToast(message, "error", 5000);
  }
}
