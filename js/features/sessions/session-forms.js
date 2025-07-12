/**
 * SessionForms - Form creation and modal HTML for sessions
 * Part of the modular session management architecture
 * Handles: form HTML generation, modal content creation
 */
export class SessionForms {
  constructor() {
    // No dependencies needed for form HTML generation
  }

  /**
   * Create session modal HTML
   */
  createSessionModalHTML() {
    return `
      <div class="session-modal">
        <div class="modal-header">
          <h3>
            <i class="fas fa-plus"></i>
            Create New Session
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="create-session-form">
          <div class="modal-body">
            ${this.createSessionFormFields()}
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-plus"></i> Create Session
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Create edit session modal HTML
   */
  createEditSessionModalHTML(session) {
    return `
      <div class="session-modal">
        <div class="modal-header">
          <h3>
            <i class="fas fa-edit"></i>
            Edit Session
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="edit-session-form">
          <input type="hidden" name="sessionId" value="${session.id}">
          
          <div class="modal-body">
            ${this.createSessionFormFields(session)}
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Update Session
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Create session form fields (reusable for create/edit)
   */
  createSessionFormFields(session = null) {
    const isEdit = session !== null;
    const idPrefix = isEdit ? "edit-" : "";

    return `
      <div class="form-row">
        <div class="form-group">
          <label for="${idPrefix}session-title">Session Title *</label>
          <input type="text" id="${idPrefix}session-title" name="title" required 
                 value="${
                   session?.title || ""
                 }" placeholder="Enter session title...">
        </div>
        
        <div class="form-group">
          <label for="${idPrefix}session-number">Session Number</label>
          <input type="number" id="${idPrefix}session-number" name="session_number" 
                 value="${session?.session_number || ""}" 
                 placeholder="${
                   isEdit ? "" : "Auto-generated if empty"
                 }" min="1">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="${idPrefix}session-date">Session Date</label>
          <input type="date" id="${idPrefix}session-date" name="date" 
                 value="${session?.date ? session.date.split("T")[0] : ""}">
        </div>
        
        <div class="form-group">
          <label for="${idPrefix}session-duration">Duration (hours)</label>
          <input type="number" id="${idPrefix}session-duration" name="duration" 
                 value="${
                   session?.duration || ""
                 }" placeholder="3" min="1" max="12" step="0.5">
        </div>
      </div>
      
      <div class="form-group">
        <label for="${idPrefix}session-summary">Session Summary</label>
        <textarea id="${idPrefix}session-summary" name="summary" rows="4" 
                  placeholder="Brief description of what will happen in this session...">${
                    session?.summary || ""
                  }</textarea>
      </div>
      
      <div class="form-group">
        <label for="${idPrefix}session-goals">Session Goals</label>
        <textarea id="${idPrefix}session-goals" name="goals" rows="3" 
                  placeholder="What do you want to accomplish in this session?">${
                    session?.goals || ""
                  }</textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="${idPrefix}session-status">Status</label>
          <select id="${idPrefix}session-status" name="status">
            <option value="draft" ${
              session?.status === "draft" ? "selected" : ""
            }>Draft</option>
            <option value="planned" ${
              session?.status === "planned" ? "selected" : ""
            }>Planned</option>
            <option value="scheduled" ${
              session?.status === "scheduled" ? "selected" : ""
            }>Scheduled</option>
            ${
              isEdit
                ? `
              <option value="in-progress" ${
                session?.status === "in-progress" ? "selected" : ""
              }>In Progress</option>
              <option value="completed" ${
                session?.status === "completed" ? "selected" : ""
              }>Completed</option>
              <option value="cancelled" ${
                session?.status === "cancelled" ? "selected" : ""
              }>Cancelled</option>
            `
                : ""
            }
          </select>
        </div>
        
        <div class="form-group">
          <label for="${idPrefix}session-type">Session Type</label>
          <select id="${idPrefix}session-type" name="session_type">
            <option value="regular" ${
              session?.session_type === "regular" ? "selected" : ""
            }>Regular Session</option>
            <option value="combat" ${
              session?.session_type === "combat" ? "selected" : ""
            }>Combat Heavy</option>
            <option value="roleplay" ${
              session?.session_type === "roleplay" ? "selected" : ""
            }>Roleplay Heavy</option>
            <option value="exploration" ${
              session?.session_type === "exploration" ? "selected" : ""
            }>Exploration</option>
            <option value="investigation" ${
              session?.session_type === "investigation" ? "selected" : ""
            }>Investigation</option>
            <option value="finale" ${
              session?.session_type === "finale" ? "selected" : ""
            }>Season Finale</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Create session details modal HTML
   */
  createSessionDetailsModalHTML(session, sessionCore) {
    return `
      <div class="session-details-modal">
        <div class="modal-header">
          <h3>
            <i class="fas fa-calendar-alt"></i>
            Session ${session.session_number || "N/A"}: ${
      session.title || "Untitled"
    }
          </h3>
          <div class="modal-header-actions">
            <button class="btn btn-sm btn-primary" onclick="sessionManager.editSession('${
              session.id
            }')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-success" onclick="sessionManager.planner.planSession('${
              session.id
            }')">
              <i class="fas fa-tasks"></i> Plan
            </button>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div class="modal-body session-details-body">
          <div class="session-meta-grid">
            <div class="meta-item">
              <label>Status</label>
              <span class="status-badge status-${
                session.status
              }">${sessionCore.getSessionStatus(session)}</span>
            </div>
            <div class="meta-item">
              <label>Date</label>
              <span>${
                session.date
                  ? new Date(session.date).toLocaleDateString()
                  : "Not scheduled"
              }</span>
            </div>
            <div class="meta-item">
              <label>Duration</label>
              <span>${
                session.duration ? `${session.duration} hours` : "Not set"
              }</span>
            </div>
            <div class="meta-item">
              <label>Type</label>
              <span>${session.session_type || "Regular"}</span>
            </div>
          </div>
          
          ${
            session.summary
              ? `
            <div class="session-section">
              <h4>Summary</h4>
              <p>${session.summary}</p>
            </div>
          `
              : ""
          }
          
          ${
            session.goals
              ? `
            <div class="session-section">
              <h4>Goals</h4>
              <p>${session.goals}</p>
            </div>
          `
              : ""
          }
          
          <div class="session-section">
            <h4>Quick Actions</h4>
            <div class="action-buttons">
              <button class="btn btn-outline-primary" onclick="sessionManager.planner.planSession('${
                session.id
              }')">
                <i class="fas fa-tasks"></i> Plan Session
              </button>
              <button class="btn btn-outline-secondary" onclick="sessionManager.editSession('${
                session.id
              }')">
                <i class="fas fa-edit"></i> Edit Details
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create session planner selection HTML
   */
  createSessionPlannerSelectionHTML(sessions, sessionCore) {
    return `
      <div class="session-planner-selection-modal">
        <div class="modal-header">
          <h3>
            <i class="fas fa-tasks"></i>
            Select Session to Plan
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <p>Choose which session you'd like to plan:</p>
          <div class="session-selection-list">
            ${sessions
              .map(
                (session) => `
              <div class="session-selection-item" onclick="sessionManager.planner.planSession('${
                session.id
              }')">
                <div class="session-info">
                  <h4>Session ${session.session_number || "N/A"}: ${
                  session.title || "Untitled"
                }</h4>
                  <div class="session-meta">
                    <span class="status-badge status-${
                      session.status
                    }">${sessionCore.getSessionStatus(session)}</span>
                    <span class="session-date">
                      <i class="fas fa-calendar"></i>
                      ${
                        session.date
                          ? new Date(session.date).toLocaleDateString()
                          : "No date set"
                      }
                    </span>
                  </div>
                  ${
                    session.summary
                      ? `<p class="session-summary">${session.summary}</p>`
                      : ""
                  }
                </div>
                <div class="session-actions">
                  <i class="fas fa-arrow-right"></i>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }
}
