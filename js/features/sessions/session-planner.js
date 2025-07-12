/**
 * SessionPlanner - Advanced session planning functionality
 * Extracted from the massive SessionManager to improve modularity
 */
export class SessionPlanner {
  constructor(sessionCore) {
    this.sessionCore = sessionCore;
    this.apiBase = "/api";
    this.currentPlanningSession = null;
  }

  /**
   * Show session planner for a specific session
   */
  async planSession(sessionId) {
    try {
      const session = this.sessionCore.findSessionById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Load necessary data for planning
      const [scenesResponse, questsResponse, locationsResponse] =
        await Promise.all([
          fetch(`${this.apiBase}/scenes`),
          fetch(`${this.apiBase}/quests`),
          fetch(`${this.apiBase}/locations`),
        ]);

      const scenes = scenesResponse.ok ? await scenesResponse.json() : [];
      const quests = questsResponse.ok ? await questsResponse.json() : [];
      const locations = locationsResponse.ok
        ? await locationsResponse.json()
        : [];

      this.displaySessionPlannerModal(session, { scenes, quests, locations });
    } catch (error) {
      console.error("Error loading session planner:", error);
      this.showError("Failed to load session planner: " + error.message);
    }
  }

  /**
   * Display the session planner modal
   */
  displaySessionPlannerModal(session, data) {
    const { scenes, quests, locations } = data;

    // Get assigned scenes and quests for this session
    const assignedScenes = scenes.filter(
      (scene) => scene.session_id === session.id
    );
    const assignedQuests = quests.filter(
      (quest) => quest.session_id === session.id
    );

    const modalContent = `
      <div class="session-planner-modal">
        <div class="modal-header">
          <h3>
            <i class="fas fa-tasks"></i> 
            Session Planner: ${session.title || "Untitled Session"}
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body planner-body">
          <!-- Planning Tabs -->
          <div class="planner-tabs">
            <button class="planner-tab active" data-tab="scenes">
              <i class="fas fa-theater-masks"></i> Scenes
            </button>
            <button class="planner-tab" data-tab="quests">
              <i class="fas fa-scroll"></i> Quests
            </button>
            <button class="planner-tab" data-tab="notes">
              <i class="fas fa-sticky-note"></i> Notes & Goals
            </button>
            <button class="planner-tab" data-tab="timeline">
              <i class="fas fa-clock"></i> Session Timeline
            </button>
          </div>

          <!-- Scene Planning Tab -->
          <div class="planner-content active" data-content="scenes">
            <div class="planning-section">
              <h4><i class="fas fa-theater-masks"></i> Scene Organization & Planning</h4>
              
              <!-- Scene Organization Sub-sections -->
              <div class="scene-organization">
                
                <!-- Opener Scene -->
                <div class="scene-subsection opener-subsection">
                  <div class="subsection-header">
                    <h5><i class="fas fa-play-circle"></i> Session Opener</h5>
                    <p>The opening scene that hooks players and sets the tone</p>
                  </div>
                  <div class="subsection-content">
                    <div class="opener-scene-slot" id="opener-scene-slot">
                      ${this.renderOpenerSceneSlot(assignedScenes)}
                    </div>
                  </div>
                </div>

                <!-- Potential Scenes -->
                <div class="scene-subsection potential-subsection">
                  <div class="subsection-header">
                    <h5><i class="fas fa-dice-d20"></i> Potential Scenes</h5>
                    <p>Flexible scenes that can be used as needed during the session</p>
                  </div>
                  <div class="subsection-content">
                    <div class="potential-scenes-list" id="potential-scenes-list">
                      ${this.renderPotentialScenes(assignedScenes)}
                    </div>
                  </div>
                </div>

                <!-- Climax Scene -->
                <div class="scene-subsection climax-subsection">
                  <div class="subsection-header">
                    <h5><i class="fas fa-crown"></i> Session Climax</h5>
                    <p>The high-energy finale that provides satisfying conclusion</p>
                  </div>
                  <div class="subsection-content">
                    <div class="climax-scene-slot" id="climax-scene-slot">
                      ${this.renderClimaxSceneSlot(assignedScenes)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quest Planning Tab -->
          <div class="planner-content" data-content="quests">
            <div class="planning-section">
              <h4><i class="fas fa-scroll"></i> Quest Integration</h4>
              <div class="assigned-quests">
                ${this.renderAssignedQuests(assignedQuests)}
              </div>
            </div>
          </div>

          <!-- Notes & Goals Tab -->
          <div class="planner-content" data-content="notes">
            <div class="planning-section">
              <h4><i class="fas fa-sticky-note"></i> Session Goals & Notes</h4>
              <div class="session-goals-form">
                ${this.renderSessionGoalsForm(session)}
              </div>
            </div>
          </div>

          <!-- Timeline Tab -->
          <div class="planner-content" data-content="timeline">
            <div class="planning-section">
              <h4><i class="fas fa-clock"></i> Session Timeline</h4>
              <div class="session-timeline">
                ${this.generateSessionTimeline(assignedScenes, assignedQuests)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
            Cancel
          </button>
          <button type="button" class="btn btn-success" onclick="sessionPlanner.finalizeSessionPlan('${
            session.id
          }')">
            <i class="fas fa-check"></i> Finalize Plan
          </button>
        </div>
      </div>
    `;

    // Create and show modal
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay session-planner-overlay";
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);

    // Store session data for reference
    this.currentPlanningSession = session;

    // Setup tab switching
    this.setupPlannerTabs();
  }

  /**
   * Render opener scene slot
   */
  renderOpenerSceneSlot(assignedScenes) {
    const openerScene = assignedScenes.find(
      (scene) => scene.scene_role === "opener"
    );

    if (openerScene) {
      return `
        <div class="assigned-scene-item opener-scene">
          <div class="scene-info">
            <h6>${openerScene.name}</h6>
            <p>${openerScene.description || "No description"}</p>
            <div class="scene-meta">
              <span class="scene-type">${
                openerScene.scene_type || "General"
              }</span>
              <span class="scene-status">${
                openerScene.scene_status || "planned"
              }</span>
            </div>
          </div>
          <div class="scene-actions">
            <button class="btn btn-sm btn-secondary" onclick="sessionPlanner.clearSceneRole('${
              openerScene.id
            }')">
              <i class="fas fa-times"></i> Remove
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="empty-scene-slot">
          <p>No opener scene assigned</p>
          <button class="btn btn-sm btn-primary" onclick="sessionPlanner.showSceneSelector('opener')">
            <i class="fas fa-plus"></i> Assign Scene
          </button>
        </div>
      `;
    }
  }

  /**
   * Render potential scenes list
   */
  renderPotentialScenes(assignedScenes) {
    const potentialScenes = assignedScenes.filter(
      (scene) => scene.scene_role === "potential" || !scene.scene_role
    );

    if (potentialScenes.length === 0) {
      return `
        <div class="empty-scenes-list">
          <p>No potential scenes assigned</p>
          <button class="btn btn-sm btn-primary" onclick="sessionPlanner.showSceneSelector('potential')">
            <i class="fas fa-plus"></i> Add Scenes
          </button>
        </div>
      `;
    }

    return (
      potentialScenes
        .map(
          (scene) => `
      <div class="assigned-scene-item potential-scene">
        <div class="scene-info">
          <h6>${scene.name}</h6>
          <p>${scene.description || "No description"}</p>
          <div class="scene-meta">
            <span class="scene-type">${scene.scene_type || "General"}</span>
            <span class="scene-status">${scene.scene_status || "planned"}</span>
          </div>
        </div>
        <div class="scene-actions">
          <button class="btn btn-sm btn-secondary" onclick="sessionPlanner.setSceneRole('${
            scene.id
          }', 'opener')">
            <i class="fas fa-play"></i> Make Opener
          </button>
          <button class="btn btn-sm btn-secondary" onclick="sessionPlanner.setSceneRole('${
            scene.id
          }', 'climax')">
            <i class="fas fa-crown"></i> Make Climax
          </button>
          <button class="btn btn-sm btn-danger" onclick="sessionPlanner.unassignScene('${
            scene.id
          }')">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
      </div>
    `
        )
        .join("") +
      `
      <div class="add-more-scenes">
        <button class="btn btn-sm btn-primary" onclick="sessionPlanner.showSceneSelector('potential')">
          <i class="fas fa-plus"></i> Add More Scenes
        </button>
      </div>
    `
    );
  }

  /**
   * Render assigned quests
   */
  renderAssignedQuests(assignedQuests) {
    if (!assignedQuests || assignedQuests.length === 0) {
      return `
        <div class="empty-quests-list">
          <p>No quests assigned to this session</p>
          <button class="btn btn-sm btn-primary" onclick="sessionPlanner.showQuestSelector()">
            <i class="fas fa-plus"></i> Assign Quests
          </button>
        </div>
      `;
    }

    return (
      assignedQuests
        .map(
          (quest) => `
      <div class="assigned-quest-item">
        <div class="quest-info">
          <h6>${quest.title || quest.name}</h6>
          <p>${quest.description || "No description"}</p>
          <div class="quest-meta">
            <span class="quest-status">${quest.status || "active"}</span>
            <span class="quest-priority">${quest.priority || "normal"}</span>
          </div>
        </div>
        <div class="quest-actions">
          <button class="btn btn-sm btn-danger" onclick="sessionPlanner.unassignQuest('${
            quest.id
          }')">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
      </div>
    `
        )
        .join("") +
      `
      <div class="add-more-quests">
        <button class="btn btn-sm btn-primary" onclick="sessionPlanner.showQuestSelector()">
          <i class="fas fa-plus"></i> Add More Quests
        </button>
      </div>
    `
    );
  }

  /**
   * Render climax scene slot
   */
  renderClimaxSceneSlot(assignedScenes) {
    const climaxScene = assignedScenes.find(
      (scene) => scene.scene_role === "climax"
    );

    if (climaxScene) {
      return `
        <div class="assigned-scene-item climax-scene">
          <div class="scene-info">
            <h6>${climaxScene.name}</h6>
            <p>${climaxScene.description || "No description"}</p>
            <div class="scene-meta">
              <span class="scene-type">${
                climaxScene.scene_type || "General"
              }</span>
              <span class="scene-status">${
                climaxScene.scene_status || "planned"
              }</span>
            </div>
          </div>
          <div class="scene-actions">
            <button class="btn btn-sm btn-secondary" onclick="sessionPlanner.clearSceneRole('${
              climaxScene.id
            }')">
              <i class="fas fa-times"></i> Remove
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="empty-scene-slot">
          <p>No climax scene assigned</p>
          <button class="btn btn-sm btn-primary" onclick="sessionPlanner.showSceneSelector('climax')">
            <i class="fas fa-plus"></i> Assign Scene
          </button>
        </div>
      `;
    }
  }

  /**
   * Setup planner tabs functionality
   */
  setupPlannerTabs() {
    const tabs = document.querySelectorAll(".planner-tab");
    const contents = document.querySelectorAll(".planner-content");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;

        // Update active tab
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        // Update active content
        contents.forEach((content) => {
          content.classList.remove("active");
          if (content.dataset.content === targetTab) {
            content.classList.add("active");
          }
        });
      });
    });
  }

  /**
   * Generate session timeline
   */
  generateSessionTimeline(scenes, quests) {
    const timeline = [];

    // Add opener
    const opener = scenes.find((s) => s.scene_role === "opener");
    if (opener) {
      timeline.push({
        time: "0:00",
        type: "scene",
        title: opener.name,
        description: "Session opener - hook and engagement",
      });
    }

    // Add potential scenes (estimated timing)
    const potentialScenes = scenes.filter(
      (s) => s.scene_role === "potential" || !s.scene_role
    );
    potentialScenes.forEach((scene, index) => {
      const estimatedTime = 30 + index * 45; // 30min start + 45min per scene
      timeline.push({
        time: `${Math.floor(estimatedTime / 60)}:${(estimatedTime % 60)
          .toString()
          .padStart(2, "0")}`,
        type: "scene",
        title: scene.name,
        description: "Flexible scene - use as needed",
      });
    });

    // Add climax
    const climax = scenes.find((s) => s.scene_role === "climax");
    if (climax) {
      const climaxTime = 180; // Estimate 3 hours in
      timeline.push({
        time: `${Math.floor(climaxTime / 60)}:${(climaxTime % 60)
          .toString()
          .padStart(2, "0")}`,
        type: "scene",
        title: climax.name,
        description: "Session climax - memorable conclusion",
      });
    }

    return timeline
      .map(
        (item) => `
      <div class="timeline-item">
        <div class="timeline-time">${item.time}</div>
        <div class="timeline-content">
          <h6>${item.title}</h6>
          <p>${item.description}</p>
        </div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Show quest selector modal (placeholder)
   */
  showQuestSelector() {
    console.log("🎯 Show quest selector - to be implemented");
    alert("Quest selector will be implemented in a future update.");
  }

  /**
   * Unassign quest from session (placeholder)
   */
  unassignQuest(questId) {
    console.log(`🎯 Unassign quest ${questId} - to be implemented`);
    alert("Quest unassignment will be implemented in a future update.");
  }

  /**
   * Render session goals form
   */
  renderSessionGoalsForm(session) {
    return `
      <div class="session-goals-form">
        <div class="form-group">
          <label for="session-objectives">Session Objectives</label>
          <textarea 
            id="session-objectives" 
            name="objectives" 
            rows="3"
            placeholder="What should the players accomplish this session?"
          >${session.objectives || ""}</textarea>
        </div>
        
        <div class="form-group">
          <label for="session-prep-notes">Prep Notes</label>
          <textarea 
            id="session-prep-notes" 
            name="prep_notes" 
            rows="4"
            placeholder="Important notes for session preparation..."
          >${session.prep_notes || ""}</textarea>
        </div>
        
        <div class="form-group">
          <label for="session-hooks">Hooks & Motivations</label>
          <textarea 
            id="session-hooks" 
            name="hooks" 
            rows="3"
            placeholder="How to draw players into the session content..."
          >${session.hooks || ""}</textarea>
        </div>
        
        <div class="form-group">
          <label for="session-contingencies">Contingencies</label>
          <textarea 
            id="session-contingencies" 
            name="contingencies" 
            rows="3"
            placeholder="Backup plans if things go differently..."
          >${session.contingencies || ""}</textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="sessionPlanner.saveSessionGoals('${
            session.id
          }')">
            <i class="fas fa-save"></i> Save Goals & Notes
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Save session goals (placeholder)
   */
  saveSessionGoals(sessionId) {
    console.log(`🎯 Save session goals for ${sessionId} - to be implemented`);
    alert("Session goals saving will be implemented in a future update.");
  }

  /**
   * Show error message
   */
  showError(message) {
    // Simple error display - could be enhanced with toast notifications
    alert(message);
  }
}
