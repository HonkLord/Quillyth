/**
 * SessionCore - Core session data management and CRUD operations
 * Extracted from the massive SessionManager to improve modularity
 */
export class SessionCore {
  constructor() {
    this.sessions = [];
    this.currentSession = null;
    this.apiBase = "/api";
  }

  /**
   * Initialize the session core
   */
  async init() {
    console.log("🎯 SessionCore: Initializing...");
    try {
      await this.loadSessions();
      console.log("✅ SessionCore: Initialized successfully");
    } catch (error) {
      console.error("❌ SessionCore: Initialization failed:", error);
    }
  }

  /**
   * Load all sessions from the database
   */
  async loadSessions() {
    try {
      const response = await fetch(`${this.apiBase}/sessions`);
      if (!response.ok) throw new Error("Failed to fetch sessions");

      this.sessions = await response.json();
      console.log(`📊 Loaded ${this.sessions.length} sessions`);
    } catch (error) {
      console.error("Error loading sessions:", error);
      this.sessions = [];
    }
  }

  /**
   * Get all sessions
   */
  getAllSessions() {
    return this.sessions;
  }

  /**
   * Find session by ID
   */
  findSessionById(sessionId) {
    return this.sessions.find((session) => session.id === sessionId);
  }

  /**
   * Get session status
   */
  getSessionStatus(session) {
    if (!session.date) return "Draft";

    const sessionDate = new Date(session.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Reset time parts for comparison
    sessionDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === today.getTime()) {
      return "Today";
    } else if (sessionDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else if (sessionDate > today) {
      return "Upcoming";
    } else {
      return session.status === "completed" ? "Completed" : "Past";
    }
  }

  /**
   * Get next session number
   */
  getNextSessionNumber() {
    if (this.sessions.length === 0) return 1;
    const maxSession = Math.max(
      ...this.sessions.map((s) => s.session_number || 0)
    );
    return maxSession + 1;
  }

  /**
   * Create new session
   */
  async createSession(sessionData) {
    try {
      const response = await fetch(`${this.apiBase}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) throw new Error("Failed to create session");

      const newSession = await response.json();
      this.sessions.push(newSession);
      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }

  /**
   * Update session
   */
  async updateSession(sessionId, updates) {
    try {
      const response = await fetch(`${this.apiBase}/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update session");

      const updatedSession = await response.json();

      // Update local session data
      const index = this.sessions.findIndex((s) => s.id === sessionId);
      if (index !== -1) {
        this.sessions[index] = updatedSession;
      }

      return updatedSession;
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    try {
      const response = await fetch(`${this.apiBase}/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete session");

      // Remove from local sessions
      this.sessions = this.sessions.filter((s) => s.id !== sessionId);

      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  }

  /**
   * Filter sessions by status
   */
  filterSessionsByStatus(status) {
    if (status === "all") return this.sessions;

    return this.sessions.filter((session) => {
      const sessionStatus = this.getSessionStatus(session);
      return sessionStatus.toLowerCase() === status.toLowerCase();
    });
  }

  /**
   * Search sessions by text
   */
  searchSessions(query) {
    if (!query.trim()) return this.sessions;

    const searchTerm = query.toLowerCase();
    return this.sessions.filter(
      (session) =>
        (session.title || "").toLowerCase().includes(searchTerm) ||
        (session.summary || "").toLowerCase().includes(searchTerm) ||
        (session.notes || "").toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get sessions statistics
   */
  getSessionStats() {
    const total = this.sessions.length;
    const completed = this.sessions.filter(
      (s) => this.getSessionStatus(s) === "Completed"
    ).length;
    const upcoming = this.sessions.filter((s) =>
      ["Upcoming", "Today", "Tomorrow"].includes(this.getSessionStatus(s))
    ).length;

    return {
      total,
      completed,
      upcoming,
      draft: total - completed - upcoming,
    };
  }
}
