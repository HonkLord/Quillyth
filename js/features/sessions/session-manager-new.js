import { SessionCore } from "./session-core.js";
import { SessionPlanner } from "./session-planner.js";
import { SessionUI } from "./session-ui.js";
import { DataManager } from "../../data-manager.js";

/**
 * SessionManager - Lean coordinator for session management
 * Part of the modular session management architecture
 * Handles: feature coordination & public API (under 300 lines)
 */
export class SessionManager {
  constructor() {
    // Initialize core modules
    this.dataManager = new DataManager();
    this.core = new SessionCore();
    this.planner = new SessionPlanner(this.core);
    this.ui = new SessionUI(this.core);

    // State
    this.isInitialized = false;
  }

  /**
   * Initialize the session manager
   */
  async init() {
    console.log("🎯 SessionManager: Initializing modular version...");
    try {
      await this.dataManager.loadCurrentCampaign();
      this.core.campaignId = this.dataManager.currentCampaignId;
      await this.core.init();
      this.isInitialized = true;
      console.log(
        "✅ SessionManager: Modular version initialized successfully"
      );
    } catch (error) {
      console.error("❌ SessionManager: Initialization failed:", error);
    }
  }

  /**
   * Render the session management interface
   */
  render(container) {
    if (!container) {
      console.error("❌ SessionManager: Container element not found");
      return;
    }

    container.innerHTML = this.ui.createSessionManagerHTML();
    this.setupEventListeners();
    this.loadSessionsData();
  }

  /**
   * Setup event listeners for session management
   */
  setupEventListeners() {
    const sessionList = document.getElementById("session-list");
    if (sessionList) {
      sessionList.addEventListener("click", (e) => {
        const sessionCard = e.target.closest(".session-card");
        if (sessionCard) {
          const sessionId = sessionCard.dataset.sessionId;
          if (e.target.closest(".session-actions")) {
            const action = e.target.closest("button").dataset.action;
            this.handleSessionAction(sessionId, action);
          } else {
            this.showSessionDetails(sessionId);
          }
        }
      });
    }
  }

  /**
   * Load and display sessions data
   */
  async loadSessionsData() {
    try {
      await this.core.loadSessions();
      this.ui.updateSessionStats();
      this.ui.renderSessionList();
    } catch (error) {
      console.error("Error loading sessions data:", error);
      this.ui.showError("Failed to load sessions data");
    }
  }

  /**
   * Handle session action buttons
   */
  handleSessionAction(sessionId, action) {
    switch (action) {
      case "plan":
        this.planner.planSession(sessionId);
        break;
      case "edit":
        this.editSession(sessionId);
        break;
      default:
        console.warn(`Unknown session action: ${action}`);
    }
  }

  /**
   * Filter sessions by status
   */
  filterSessions(status) {
    const filteredSessions = this.core.filterSessionsByStatus(status);
    this.ui.displayFilteredSessions(filteredSessions);
  }

  /**
   * Search sessions by text
   */
  searchSessions(query) {
    const filteredSessions = this.core.searchSessions(query);
    this.ui.displayFilteredSessions(filteredSessions);
  }

  /**
   * Show create session modal
   */
  showCreateSessionModal() {
    this.ui.showCreateSessionModal();
  }

  /**
   * Edit session
   */
  editSession(sessionId) {
    const session = this.core.findSessionById(sessionId);
    if (!session) {
      this.ui.showError(`Session ${sessionId} not found`);
      return;
    }
    this.ui.showEditSessionModal(session);
  }

  /**
   * Show session details
   */
  showSessionDetails(sessionId) {
    const session = this.core.findSessionById(sessionId);
    if (!session) {
      this.ui.showError(`Session ${sessionId} not found`);
      return;
    }
    this.ui.showSessionDetailsModal(session);
  }

  /**
   * Show session planner selection
   */
  showSessionPlanner() {
    this.ui.showSessionPlannerModal();
  }

  /**
   * Handle session creation form submission
   */
  async handleCreateSession(form) {
    try {
      const formData = new FormData(form);

      const sessionData = {
        title: formData.get("title"),
        session_number: formData.get("session_number") || null,
        date: formData.get("date") || null,
        duration: formData.get("duration") || null,
        summary: formData.get("summary") || null,
        goals: formData.get("goals") || null,
        status: formData.get("status") || "draft",
        session_type: formData.get("session_type") || "regular",
        campaign_id: this.core.campaignId,
      };

      // Create session via core
      const newSession = await this.core.createSession(sessionData);

      // Refresh data and UI
      await this.loadSessionsData();

      // Close modal and show success
      form.closest(".modal-overlay").remove();
      this.ui.showSuccess("Session created successfully!");

      console.log("✅ Session created:", newSession);
    } catch (error) {
      console.error("Error creating session:", error);
      this.ui.showError("Failed to create session: " + error.message);
    }
  }

  /**
   * Handle session editing form submission
   */
  async handleEditSession(form) {
    try {
      const formData = new FormData(form);
      const sessionId = formData.get("sessionId");

      const sessionData = {
        title: formData.get("title"),
        session_number: formData.get("session_number") || null,
        date: formData.get("date") || null,
        duration: formData.get("duration") || null,
        summary: formData.get("summary") || null,
        goals: formData.get("goals") || null,
        status: formData.get("status"),
        session_type: formData.get("session_type"),
      };

      // Update session via core
      const updatedSession = await this.core.updateSession(
        sessionId,
        sessionData
      );

      // Refresh data and UI
      await this.loadSessionsData();

      // Close modal and show success
      form.closest(".modal-overlay").remove();
      this.ui.showSuccess("Session updated successfully!");

      console.log("✅ Session updated:", updatedSession);
    } catch (error) {
      console.error("Error updating session:", error);
      this.ui.showError("Failed to update session: " + error.message);
    }
  }

  /**
   * Get all sessions (delegate to core)
   */
  getAllSessions() {
    return this.core.getAllSessions();
  }

  /**
   * Find session by ID (delegate to core)
   */
  findSessionById(sessionId) {
    return this.core.findSessionById(sessionId);
  }
}
