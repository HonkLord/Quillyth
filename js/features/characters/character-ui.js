/**
 * CharacterUI - User interface rendering and interactions for character management
 * Handles HTML generation, modal dialogs, event listeners, and UI state management
 */
export class CharacterUI {
  constructor(characterCore, characterProgression, characterRelationships) {
    this.characterCore = characterCore;
    this.characterProgression = characterProgression;
    this.characterRelationships = characterRelationships;
    this.selectedCharacter = null; // Track currently selected character
  }

  /**
   * Show character overview - main entry point for character workspace
   */
  showCharacterOverview() {
    // Instead of overwriting the entire content-area, inject into the characters-content div
    const charactersContent = document.getElementById("characters-content");
    if (!charactersContent) {
      console.error("characters-content div not found!");
      return;
    }

    charactersContent.innerHTML = this.createCharacterOverviewContent();
    this.setupCharacterOverviewListeners();
  }

  /**
   * Create character overview content
   */
  createCharacterOverviewContent() {
    return `
      <div class="workspace-container">
        <div class="workspace-feature-header">
          <div class="workspace-feature-title">
            <i class="fas fa-users"></i>
            <div>
              <h2>Characters</h2>
              <p class="workspace-feature-subtitle">Manage player characters and important NPCs</p>
            </div>
          </div>
          <div class="workspace-feature-actions">
            <button class="btn btn-primary" data-action="add-character" title="Add Player Character">
              <i class="fas fa-user-plus"></i> Add Character
            </button>
            <button class="btn btn-secondary" data-action="add-npc" title="Add NPC">
              <i class="fas fa-users"></i> Add NPC
            </button>
            <button class="btn btn-outline-info" data-action="view-relationships" title="View All Relationships">
              <i class="fas fa-project-diagram"></i> Relationships
            </button>
            <button class="btn btn-outline-success" data-action="view-progression" title="Campaign Progression">
              <i class="fas fa-chart-line"></i> Progression
            </button>
          </div>
        </div>

        <div class="workspace-grid workspace-grid-2">
          <div class="workspace-panel workspace-panel-primary">
            ${this.renderCharacterSections()}
          </div>
          
          <div class="workspace-panel workspace-panel-secondary">
            ${this.renderCharacterDetailTabs()}
            <div id="character-detail-content" class="character-detail-content">
              ${this.renderCharacterDetailsPlaceholder()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render character sections (player characters and NPCs)
   */
  renderCharacterSections() {
    return `
      <div class="workspace-section">
        <div class="workspace-section-header">
          <h3 class="workspace-section-title">
            <i class="fas fa-user-friends"></i>
            Player Characters
          </h3>
          <div class="workspace-section-actions">
            <button class="btn btn-sm btn-primary" data-action="add-character">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <div class="workspace-section-content">
          ${this.renderPlayerCharactersList()}
        </div>
      </div>

      <div class="workspace-section">
        <div class="workspace-section-header">
          <h3 class="workspace-section-title">
            <i class="fas fa-users"></i>
            Important NPCs
          </h3>
          <div class="workspace-section-actions">
            <button class="btn btn-sm btn-primary" data-action="add-npc">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <div class="workspace-section-content">
          ${this.renderImportantNPCsList()}
        </div>
      </div>
    `;
  }

  /**
   * Render player characters list
   */
  renderPlayerCharactersList() {
    if (this.characterCore.playerCharacters.length === 0) {
      return `
        <div class="workspace-empty-state">
          <i class="fas fa-user-plus"></i>
          <h3>No Player Characters</h3>
          <p>Add player characters to start tracking their progress.</p>
          <button class="btn btn-primary" data-action="add-character">
            <i class="fas fa-plus"></i> Add Character
          </button>
        </div>
      `;
    }

    return `
      <div class="workspace-cards-grid">
        ${this.characterCore.playerCharacters
          .map((character) => {
            return `
              <div class="card card-character clickable" data-character-id="${
                character.id
              }">
                <div class="card-header">
                  <div class="character-avatar">
                    ${character.name.charAt(0).toUpperCase()}
                  </div>
                  <div class="card-title-info">
                    <h4 class="card-title">${character.name}</h4>
                    <div class="card-meta">
                      <span class="card-class-level">${
                        character.class || "Unknown"
                      } ${character.level || 1}</span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <button class="btn btn-xs btn-outline-primary" data-action="view-character" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-secondary" data-action="edit-character" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-info" data-action="character-notes" title="Notes">
                      <i class="fas fa-sticky-note"></i>
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <p class="card-description">${
                    character.description || character.personality ||
                    "No description available."
                  }</p>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  /**
   * Render important NPCs list
   */
  renderImportantNPCsList() {
    if (this.characterCore.importantNPCs.length === 0) {
      return `
        <div class="workspace-empty-state">
          <i class="fas fa-user-plus"></i>
          <h3>No Important NPCs</h3>
          <p>Add NPCs to track important non-player characters.</p>
          <button class="btn btn-primary" data-action="add-npc">
            <i class="fas fa-plus"></i> Add NPC
          </button>
        </div>
      `;
    }

    return `
      <div class="workspace-cards-grid">
        ${this.characterCore.importantNPCs
          .map((npc) => {
            return `
              <div class="card card-character clickable" data-character-id="${
                npc.id
              }">
                <div class="card-header">
                  <div class="character-avatar">
                    ${npc.name.charAt(0).toUpperCase()}
                  </div>
                  <div class="card-title-info">
                    <h4 class="card-title">${npc.name}</h4>
                    <div class="card-meta">
                      <span class="card-role-location">${
                        npc.role || "Unknown Role"
                      }${npc.location ? ` • ${npc.location}` : ""}</span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <button class="btn btn-xs btn-outline-primary" data-action="view-npc" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-secondary" data-action="edit-npc" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <div class="npc-relationships">
                    ${this.characterRelationships.renderNPCRelationshipTags(
                      npc
                    )}
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  /**
   * Render character details placeholder
   */
  renderCharacterDetailsPlaceholder() {
    return `
      <div class="character-details-placeholder">
        <div class="placeholder-content">
          <i class="fas fa-user-circle"></i>
          <h4>Select a Character</h4>
          <p>Choose a character from the list to view their details, relationships, and progression.</p>
          <div class="placeholder-actions">
            <button class="btn btn-outline-info" onclick="characterManager.ui.switchCharacterDetailTab('relationships')">
              <i class="fas fa-project-diagram"></i> View All Relationships
            </button>
            <button class="btn btn-outline-success" onclick="characterManager.ui.switchCharacterDetailTab('progression')">
              <i class="fas fa-chart-line"></i> View Campaign Progression
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render character tools panel
   */
  renderCharacterTools() {
    return `
      <div class="character-tools">
        <h5>Character Management</h5>
        <div class="tool-group">
          <button class="btn btn-outline-primary btn-block" data-action="add-character">
            <i class="fas fa-user-plus"></i> Add Player Character
          </button>
          <button class="btn btn-outline-secondary btn-block" data-action="add-npc">
            <i class="fas fa-users"></i> Add NPC
          </button>
        </div>
        
        <div class="tool-group">
          <button class="btn btn-outline-info btn-block" data-action="view-relationships">
            <i class="fas fa-project-diagram"></i> Relationship Matrix
          </button>
          <button class="btn btn-outline-success btn-block" data-action="view-progression">
            <i class="fas fa-chart-line"></i> Campaign Progression
          </button>
        </div>

        ${this.renderCharacterActivitySummary()}
      </div>
    `;
  }

  /**
   * Render character detail tabs
   */
  renderCharacterDetailTabs() {
    return `
      <div class="character-detail-tabs">
        <button class="character-detail-tab active" data-tab="overview">
          <i class="fas fa-eye"></i> Character Details
        </button>
        <button class="character-detail-tab" data-tab="relationships">
          <i class="fas fa-project-diagram"></i> Character Relationships
        </button>
        <button class="character-detail-tab" data-tab="progression">
          <i class="fas fa-chart-line"></i> Character Progression
        </button>
      </div>
    `;
  }

  /**
   * Render session tracker
   */
  renderSessionTracker() {
    const currentSession = this.characterCore.getCurrentSessionNumber();

    return `
      <div class="session-tracker">
        <h5>Session Tracker</h5>
        <div class="current-session">
          <div class="session-number">Session ${currentSession}</div>
          <div class="session-status">Active</div>
        </div>
        <div class="session-actions">
          <button class="btn btn-sm btn-outline-primary" data-action="add-session-notes">
            <i class="fas fa-plus"></i> Add Notes
          </button>
          <button class="btn btn-sm btn-outline-secondary" data-action="session-recap">
            <i class="fas fa-list"></i> Session Recap
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render character activity summary
   */
  renderCharacterActivitySummary() {
    const totalCharacters =
      this.characterCore.playerCharacters.length +
      this.characterCore.importantNPCs.length;
    const totalRelationships =
      this.characterRelationships.getTotalRelationships();

    return `
      <div class="activity-summary">
        <h6>Campaign Summary</h6>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-value">${this.characterCore.playerCharacters.length}</span>
            <span class="stat-label">Players</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${this.characterCore.importantNPCs.length}</span>
            <span class="stat-label">NPCs</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${totalRelationships}</span>
            <span class="stat-label">Relationships</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for character overview
   */
  setupCharacterOverviewListeners() {
    // Only setup tab switching and card selection listeners
    // Character actions are handled by main app.js event delegation
    
    // Remove any existing listeners to prevent duplicates
    this.removeCharacterListeners();
    
    // Create bound methods for event handling
    this.handleCharacterTabClick = this.handleCharacterTabClick.bind(this);
    this.handleCharacterDetailTabClick = this.handleCharacterDetailTabClick.bind(this);
    this.handleCharacterCardClick = this.handleCharacterCardClick.bind(this);

    // Add event listeners (character actions are handled by app.js)
    document.addEventListener("click", this.handleCharacterTabClick);
    document.addEventListener("click", this.handleCharacterDetailTabClick);
    document.addEventListener("click", this.handleCharacterCardClick);
    
    console.log("🎭 CharacterUI: Event listeners setup complete");
  }

  removeCharacterListeners() {
    if (this.handleCharacterTabClick) {
      document.removeEventListener("click", this.handleCharacterTabClick);
    }
    if (this.handleCharacterDetailTabClick) {
      document.removeEventListener("click", this.handleCharacterDetailTabClick);
    }
    if (this.handleCharacterCardClick) {
      document.removeEventListener("click", this.handleCharacterCardClick);
    }
  }

  handleCharacterTabClick(event) {
    if (event.target.classList.contains("character-tab")) {
      const tabName = event.target.dataset.tab;
      this.switchCharacterTab(tabName);
    }
  }

  handleCharacterDetailTabClick(event) {
    if (event.target.classList.contains("character-detail-tab")) {
      const tabName = event.target.dataset.tab;
      this.switchCharacterDetailTab(tabName);
    }
  }

  handleCharacterCardClick(event) {
    const characterCard = event.target.closest(".card-character");
    if (characterCard && !event.target.closest("[data-action]")) {
      // Only handle character selection if not clicking on an action button
      const characterId = characterCard.dataset.characterId;
      this.selectCharacter(characterId);
      return;
    }
  }

  // Character actions are now handled by main app.js event delegation

  /**
   * Switch character tab (main workspace tabs)
   */
  switchCharacterTab(tabName) {
    // Update active tab
    document.querySelectorAll(".character-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update content based on tab
    const centerPanel = document.getElementById("character-detail-content");
    if (!centerPanel) return;

    // Clear selected character when switching to campaign-wide views
    if (tabName !== "overview") {
      this.selectedCharacter = null;
    }

    switch (tabName) {
      case "overview":
        centerPanel.innerHTML = this.renderCharacterDetailsPlaceholder();
        break;
      case "relationships":
        centerPanel.innerHTML =
          this.characterRelationships.renderRelationshipsMatrixView();
        this.setupRelationshipsListeners();
        break;
      case "progression":
        centerPanel.innerHTML =
          this.characterProgression.renderCampaignProgressionView();
        this.setupProgressionViewListeners();
        break;
    }
  }

  /**
   * Switch character detail tab (overview, relationships, progression)
   */
  switchCharacterDetailTab(tabName) {
    console.log("🎭 UI: switchCharacterDetailTab called with:", tabName);

    // Update active tab
    document.querySelectorAll(".character-detail-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetTab) {
      targetTab.classList.add("active");
    }

    // Update content based on tab
    const centerPanel = document.getElementById("character-detail-content");
    if (!centerPanel) {
      console.error(
        "🎭 UI: character-detail-content not found in switchCharacterDetailTab"
      );
      return;
    }

    console.log("🎭 UI: Switching to tab content for:", tabName);

    switch (tabName) {
      case "overview":
        // Don't reset to placeholder if we have character details already
        if (!centerPanel.innerHTML.includes("character-details-view")) {
          console.log("🎭 UI: Setting overview placeholder");
          centerPanel.innerHTML = this.renderCharacterDetailsPlaceholder();
        } else {
          console.log("🎭 UI: Keeping existing character details view");
        }
        break;
      case "relationships":
        console.log("🎭 UI: Setting character relationships view");
        if (this.selectedCharacter) {
          // Show character-specific relationships
          centerPanel.innerHTML =
            this.characterRelationships.renderCharacterRelationships(
              this.selectedCharacter
            );
        } else {
          // Fallback message if no character selected
          centerPanel.innerHTML = `
            <div class="character-relationships">
              <div class="relationships-empty">
                <i class="fas fa-users"></i>
                <p>Select a character to view their relationships.</p>
              </div>
            </div>
          `;
        }
        this.setupRelationshipsListeners();
        break;
      case "progression":
        console.log("🎭 UI: Setting progression view");
        if (this.selectedCharacter) {
          // Show character-specific progression
          centerPanel.innerHTML =
            this.characterProgression.renderCharacterProgressionView(
              this.selectedCharacter
            );
        } else {
          // Show campaign-wide progression if no character selected
          centerPanel.innerHTML =
            this.characterProgression.renderCampaignProgressionView();
        }
        this.setupProgressionViewListeners();
        break;
    }
  }

  /**
   * Select a character and show their details
   */
  selectCharacter(characterId) {
    // Update visual selection
    document.querySelectorAll(".character-item").forEach((item) => {
      item.classList.remove("selected");
    });

    const selectedItem = document.querySelector(
      `[data-character-id="${characterId}"]`
    );
    if (selectedItem) {
      selectedItem.classList.add("selected");
    }

    // Show character details
    this.showCharacterDetails(characterId);
  }

  /**
   * Show character details
   */
  showCharacterDetails(characterId) {
    console.log("🎭 UI: showCharacterDetails called with ID:", characterId);

    const { character, isPlayerCharacter } =
      this.characterCore.getCharacterById(characterId);

    if (!character) {
      console.log("🎭 UI: Character not found");
      this.showError(`Character with ID ${characterId} not found`);
      return;
    }

    // Store the selected character for tab switching
    this.selectedCharacter = character;

    console.log("🎭 UI: Character found, preparing to render");

    // Update the center panel with character details
    const centerPanel = document.getElementById("character-detail-content");
    if (!centerPanel) {
      console.error("🎭 UI: character-detail-content element not found!");
      return;
    }

    console.log(
      "🎭 UI: Center panel found, current content starts with:",
      centerPanel.innerHTML.substring(0, 50)
    );

    if (isPlayerCharacter) {
      const renderedHTML = this.renderPlayerCharacterDetailsView(character);
      console.log(
        "🎭 UI: Generated player character HTML, length:",
        renderedHTML.length
      );
      centerPanel.innerHTML = renderedHTML;
      console.log("🎭 UI: Set innerHTML for player character");
    } else {
      const renderedHTML = this.renderNPCDetailsView(character);
      console.log("🎭 UI: Generated NPC HTML, length:", renderedHTML.length);
      centerPanel.innerHTML = renderedHTML;
      console.log("🎭 UI: Set innerHTML for NPC");
    }

    console.log(
      "🎭 UI: After setting innerHTML, content starts with:",
      centerPanel.innerHTML.substring(0, 50)
    );

    // Switch to overview tab
    console.log("🎭 UI: Switching to overview tab");
    this.switchCharacterDetailTab("overview");

    console.log(
      "🎭 UI: Final content starts with:",
      centerPanel.innerHTML.substring(0, 50)
    );
  }

  /**
   * Render player character details view
   */
  renderPlayerCharacterDetailsView(character) {
    return `
      <div class="character-details-view">
        <div class="character-header">
          <h4>${character.name}</h4>
          <div class="character-meta">
            <span class="character-class">${
              character.class || "Unknown Class"
            }</span>
            <span class="character-level">Level ${character.level || 1}</span>
            <span class="character-race">${
              character.race || "Unknown Race"
            }</span>
          </div>
        </div>

        <div class="character-content">
          <div class="character-section">
            <h5>Background</h5>
            <p>${character.background || "No background specified."}</p>
          </div>

          <div class="character-section">
            <h5>Description</h5>
            <p>${character.description || "No description available."}</p>
          </div>

          <div class="character-section">
            <h5>Backstory</h5>
            <p>${character.backstory || "No backstory recorded."}</p>
          </div>

          <div class="character-section">
            <h5>Goals</h5>
            <div class="character-goals">
              ${this.renderCharacterGoals(character)}
            </div>
          </div>
        </div>

        <div class="character-actions">
          <button class="btn btn-primary" onclick="characterManager.showEditCharacterDialog('${
            character.id
          }')">
            <i class="fas fa-edit"></i> Edit Character
          </button>
          <button class="btn btn-secondary" onclick="characterManager.showCharacterNotesDialog('${
            character.id
          }')">
            <i class="fas fa-sticky-note"></i> Notes
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render character goals
   */
  renderCharacterGoals(character) {
    if (!character.goals || character.goals.length === 0) {
      return "<p><em>No goals set</em></p>";
    }

    try {
      // Handle both string and array formats
      let goals;
      if (typeof character.goals === "string") {
        // Try to parse JSON, fallback to empty array if parsing fails
        try {
          goals = JSON.parse(character.goals || "[]");
        } catch (parseError) {
          console.warn(
            "🎭 UI: Failed to parse character goals JSON for",
            character.name,
            ":",
            parseError
          );
          console.warn("🎭 UI: Raw goals data:", character.goals);
          // If JSON parsing fails, treat as plain text
          goals = [{ text: character.goals, status: "active" }];
        }
      } else {
        goals = character.goals;
      }

      // Ensure goals is an array
      if (!Array.isArray(goals)) {
        console.warn(
          "🎭 UI: Goals is not an array for",
          character.name,
          ":",
          goals
        );
        return "<p><em>Invalid goals data</em></p>";
      }

      return goals
        .map(
          (goal) => `
        <div class="character-goal">
          <span class="goal-text">${goal.text || goal}</span>
          <span class="goal-status ${goal.status || "active"}">${
            goal.status || "active"
          }</span>
        </div>
      `
        )
        .join("");
    } catch (error) {
      console.error(
        "🎭 UI: Error rendering character goals for",
        character.name,
        ":",
        error
      );
      return "<p><em>Error displaying goals</em></p>";
    }
  }

  /**
   * Render NPC details view
   */
  renderNPCDetailsView(npc) {
    return `
      <div class="npc-details-view">
        <div class="npc-header">
          <h4>${npc.name}</h4>
          <div class="npc-meta">
            <span class="npc-role">${npc.role || "Unknown Role"}</span>
            <span class="npc-importance">${
              npc.importance || "Unknown"
            } importance</span>
          </div>
        </div>

        <div class="npc-content">
          <div class="npc-section">
            <h5>Motivation</h5>
            <p>${npc.motivation || "No motivation recorded."}</p>
          </div>

          <div class="npc-section">
            <h5>Favorability</h5>
            <div class="favorability-meter">
              <div class="favorability-bar">
                <div class="favorability-fill" style="width: ${
                  npc.favorability || 50
                }%"></div>
              </div>
              <span class="favorability-value">${
                npc.favorability || 50
              }/100</span>
            </div>
          </div>

          <div class="npc-section">
            <h5>Scenes</h5>
            <div class="npc-scenes">
              ${
                npc.scenes && Array.isArray(npc.scenes)
                  ? npc.scenes
                      .map((scene) => `<span class="scene-tag">${scene}</span>`)
                      .join("")
                  : "<em>No scenes recorded</em>"
              }
            </div>
          </div>

          <div class="npc-section">
            <h5>Relationships</h5>
            <div class="npc-relationships">
              ${this.characterRelationships.renderNPCRelationshipTags(npc)}
            </div>
          </div>
        </div>

        <div class="npc-actions">
          <button class="btn btn-primary" onclick="characterManager.showEditCharacterDialog('${
            npc.id
          }')">
            <i class="fas fa-edit"></i> Edit NPC
          </button>
          <button class="btn btn-secondary" onclick="characterManager.showCharacterExportDialog(${JSON.stringify(
            npc
          ).replace(/"/g, "&quot;")})">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error("❌ CharacterUI Error:", message);
    // This would typically show a toast notification
    alert(`Error: ${message}`);
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    console.log("✅ CharacterUI Success:", message);
    // This would typically show a toast notification
    // For now, we'll just log it
  }

  // Modal dialog methods
  showAddCharacterDialog() {
    console.log("🎭 Show add character dialog");
    this.showCharacterModal();
  }

  showAddNPCDialog() {
    console.log("🎭 Show add NPC dialog");
    this.showCharacterModal(null, false);
  }

  showEditCharacterDialog(characterId) {
    console.log("🎭 Show edit character dialog for:", characterId);
    console.log("🎭 CharacterCore available:", !!this.characterCore);
    
    if (!this.characterCore) {
      console.error("🎭 CharacterCore not available!");
      alert("Character system not initialized. Please refresh the page.");
      return;
    }
    
    const result = this.characterCore.getCharacterById(characterId);
    console.log("🎭 Character lookup result:", result);
    
    if (result && result.character) {
      console.log("🎭 Showing character modal for:", result.character.name);
      this.showCharacterModal(result.character, result.isPlayerCharacter);
    } else {
      console.error("🎭 Character not found with ID:", characterId);
      alert(`Character with ID ${characterId} not found.`);
    }
  }

  showCharacterNotesDialog(characterId) {
    console.log("🎭 Show character notes dialog for:", characterId);
    const { character } = this.characterCore.getCharacterById(characterId);
    if (character) {
      this.showNotesModal(character);
    }
  }

  /**
   * Show add relationship dialog
   */
  showAddRelationshipDialog(fromCharacterId = null, toCharacterId = null) {
    this.showRelationshipModal(null, fromCharacterId, toCharacterId);
  }

  /**
   * Show edit relationship dialog
   */
  showEditRelationshipDialog(fromCharacterId, toCharacterId) {
    this.showRelationshipModal({ fromCharacterId, toCharacterId });
  }

  /**
   * Show relationship modal (add or edit)
   */
  showRelationshipModal(relationship = null, fromCharacterId = null, toCharacterId = null) {
    console.log("🎭 showRelationshipModal called with:", { relationship, fromCharacterId, toCharacterId });
    const allCharacters = this.characterCore.getAllCharacters();
    const isEditing = relationship !== null;

    const fromCharacterOptions = allCharacters
      .map(
        (char) =>
          `<option value="${char.id}" ${
            fromCharacterId === char.id ? "selected" : ""
          }>${char.name}</option>`
      )
      .join("");

    const toCharacterOptions = allCharacters
      .map(
        (char) =>
          `<option value="${char.id}" ${
            toCharacterId === char.id ? "selected" : ""
          }>${char.name}</option>`
      )
      .join("");

    const content = `
      <div class="relationship-modal">
        <div class="modal-header">
          <h3>
            <i class="fas fa-heart"></i>
            ${isEditing ? "Edit Relationship" : "Add Relationship"}
          </h3>
          <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="relationship-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="fromCharacter">From Character</label>
              <select id="fromCharacter" name="fromCharacter" required ${
                isEditing ? "disabled" : ""
              }>
                <option value="">Select character...</option>
                ${fromCharacterOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="toCharacter">To Character</label>
              <select id="toCharacter" name="toCharacter" required ${
                isEditing || toCharacterId ? "readonly style='pointer-events: none; background-color: #f8f9fa;'" : ""
              }>
                <option value="">Select character...</option>
                ${toCharacterOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="relationshipType">Relationship Type</label>
              <select id="relationshipType" name="relationshipType" required>
                <option value="neutral" ${
                  relationship?.type === "neutral" ? "selected" : ""
                }>Neutral</option>
                <option value="friend" ${
                  relationship?.type === "friend" ? "selected" : ""
                }>Friend</option>
                <option value="ally" ${
                  relationship?.type === "ally" ? "selected" : ""
                }>Ally</option>
                <option value="rival" ${
                  relationship?.type === "rival" ? "selected" : ""
                }>Rival</option>
                <option value="enemy" ${
                  relationship?.type === "enemy" ? "selected" : ""
                }>Enemy</option>
                <option value="family" ${
                  relationship?.type === "family" ? "selected" : ""
                }>Family</option>
                <option value="romantic" ${
                  relationship?.type === "romantic" ? "selected" : ""
                }>Romantic</option>
                <option value="mentor" ${
                  relationship?.type === "mentor" ? "selected" : ""
                }>Mentor</option>
                <option value="student" ${
                  relationship?.type === "student" ? "selected" : ""
                }>Student</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label for="description">Description</label>
              <textarea id="description" name="description" rows="3" placeholder="Describe the relationship...">${
                relationship?.description || ""
              }</textarea>
            </div>
            ${
              !isEditing
                ? `
            <div class="form-group full-width">
              <label>
                <input type="checkbox" name="reciprocal" checked>
                Create reciprocal relationship
              </label>
            </div>
            `
                : ""
            }
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i>
              ${isEditing ? "Update" : "Add"} Relationship
            </button>
          </div>
        </form>
      </div>
    `;

    this.showModal(content, (form) =>
      this.handleRelationshipForm(form, isEditing)
    );
  }

  /**
   * Handle relationship form submission
   */
  async handleRelationshipForm(form, isEditing) {
    try {
      if (isEditing) {
        // Handle edit relationship
        console.log("🤝 Edit relationship:", form);
      } else {
        // Handle add relationship
        const result = await this.characterCore.addRelationship(form);
        this.showSuccessMessage(result.message);
        this.switchCharacterDetailTab("relationships"); // Refresh the relationships view
      }
    } catch (error) {
      this.showError(
        `Failed to ${isEditing ? "update" : "add"} relationship: ${
          error.message
        }`
      );
    }
  }

  /**
   * Show character creation/editing modal
   */
  showCharacterModal(character = null, isPlayerCharacter = true) {
    const isEdit = character !== null;
    const modalTitle = isEdit
      ? `Edit ${isPlayerCharacter ? "Character" : "NPC"}`
      : `Add New ${isPlayerCharacter ? "Character" : "NPC"}`;

    const modalContent = `
      <div class="character-modal">
        <h3>${modalTitle}</h3>
        <form id="character-form" data-character-id="${
          character?.id || ""
        }" data-is-player="${isPlayerCharacter}">
          <div class="form-group">
            <label for="character-name">Name *</label>
            <input 
              type="text" 
              id="character-name" 
              name="name" 
              required 
              value="${character?.name || ""}"
              placeholder="Enter character name..."
            />
          </div>
          
          ${
            isPlayerCharacter
              ? this.renderPlayerCharacterFields(character)
              : this.renderNPCFields(character)
          }
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? "Update" : "Create"} ${
      isPlayerCharacter ? "Character" : "NPC"
    }
            </button>
          </div>
        </form>
      </div>
    `;

    this.showModal(modalContent, async (form) => {
      if (isEdit) {
        // Get the character manager reference
        const characterManager = window.characterManager;
        if (characterManager) {
          return await characterManager.handleEditCharacter(form, character.id, isPlayerCharacter);
        } else {
          return await this.handleEditCharacter(form, character.id, isPlayerCharacter);
        }
      } else {
        const characterManager = window.characterManager;
        if (characterManager) {
          return isPlayerCharacter
            ? await characterManager.handleAddCharacter(form)
            : await characterManager.handleAddNPC(form);
        } else {
          return isPlayerCharacter
            ? await this.handleAddCharacter(form)
            : await this.handleAddNPC(form);
        }
      }
    });
  }

  /**
   * Show notes modal for character
   */
  showNotesModal(character) {
    const modalContent = `
      <div class="character-notes-modal">
        <h3>Notes for ${character.name}</h3>
        <div class="notes-content">
          <div class="form-group">
            <label for="character-notes">Character Notes</label>
            <textarea 
              id="character-notes" 
              name="notes" 
              rows="10"
              placeholder="Add notes about this character..."
            >${character.notes || ""}</textarea>
          </div>
          
          <div class="form-group">
            <label for="character-backstory">Backstory</label>
            <textarea 
              id="character-backstory" 
              name="backstory" 
              rows="6"
              placeholder="Character backstory and history..."
            >${character.backstory || ""}</textarea>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
            Close
          </button>
          <button type="button" class="btn btn-primary" onclick="characterManager.saveCharacterNotes('${
            character.id
          }', this.closest('.modal-overlay'))">
            Save Notes
          </button>
        </div>
      </div>
    `;

    this.showModal(modalContent);
  }

  showCharacterExportDialog(character) {
    // Implementation would create and show export modal
    console.log("🎭 Show character export dialog for:", character.name);
  }

  setupRelationshipsListeners() {
    console.log("🎭 Setup relationships listeners");
    
    // Set up event listeners for relationship forms and buttons in the character-specific relationships view
    const centerPanel = document.getElementById("character-detail-content");
    if (!centerPanel) return;

    // Handle Add Relationship button clicks (for character-specific relationships)
    const addRelationshipBtns = centerPanel.querySelectorAll('[data-action="add-relationship"]');
    addRelationshipBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const fromCharacterId = btn.dataset.fromCharacterId;
        const toCharacterId = btn.dataset.toCharacterId;
        this.showAddRelationshipDialog(fromCharacterId, toCharacterId);
      });
    });

    // Handle clicking on relationship cards to quick-add relationships
    const relationshipCards = centerPanel.querySelectorAll('.card-character');
    relationshipCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger card click if clicking on buttons, selects, or card actions
        if (e.target.closest('button') || e.target.closest('select') || e.target.closest('.card-actions')) {
          return;
        }
        
        const fromCharacterId = card.dataset.fromCharacterId;
        const toCharacterId = card.dataset.toCharacterId;
        const hasRelationship = card.querySelector('.relationship-type-select') !== null;
        
        if (!hasRelationship) {
          // Quick-add relationship for cards with no relationship
          this.showAddRelationshipDialog(fromCharacterId, toCharacterId);
        } else {
          // Edit existing relationship (show modal with current details)
          this.showEditRelationshipDialog(fromCharacterId, toCharacterId);
        }
      });
    });

    // Handle relationship type select changes
    const relationshipSelects = centerPanel.querySelectorAll('.relationship-type-select');
    relationshipSelects.forEach(select => {
      select.addEventListener('change', async (e) => {
        e.stopPropagation(); // Prevent card click
        await window.characterManager.updateRelationshipType(select);
      });
    });

    // Handle Edit Relationship button clicks
    const editRelationshipBtns = centerPanel.querySelectorAll('[data-action="edit-relationship"]');
    editRelationshipBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const fromCharacterId = btn.dataset.fromCharacterId;
        const toCharacterId = btn.dataset.toCharacterId;
        this.showEditRelationshipDialog(fromCharacterId, toCharacterId);
      });
    });

    // Handle Delete Relationship button clicks
    const deleteRelationshipBtns = centerPanel.querySelectorAll('[data-action="delete-relationship"]');
    deleteRelationshipBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const fromCharacterId = btn.dataset.fromCharacterId;
        const toCharacterId = btn.dataset.toCharacterId;
        
        if (confirm('Are you sure you want to delete this relationship?')) {
          try {
            await this.characterRelationships.deleteRelationship(fromCharacterId, toCharacterId);
            // Refresh the relationships view
            this.switchCharacterDetailTab("relationships");
            this.showSuccessMessage('Relationship deleted successfully');
          } catch (error) {
            this.showError(`Failed to delete relationship: ${error.message}`);
          }
        }
      });
    });

    console.log("🎭 Relationship event listeners setup complete");
  }

  setupProgressionViewListeners() {
    // Setup listeners for progression view
    console.log("🎭 Setup progression view listeners");
  }

  /**
   * Render player character specific form fields
   */
  renderPlayerCharacterFields(character) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label for="character-class">Class</label>
          <input 
            type="text" 
            id="character-class" 
            name="class" 
            value="${character?.class || ""}"
            placeholder="Fighter, Wizard, etc..."
          />
        </div>
        <div class="form-group">
          <label for="character-level">Level</label>
          <input 
            type="number" 
            id="character-level" 
            name="level" 
            min="1" 
            max="20"
            value="${character?.level || 1}"
          />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="character-race">Race</label>
          <input 
            type="text" 
            id="character-race" 
            name="race" 
            value="${character?.race || ""}"
            placeholder="Human, Elf, Dwarf, etc..."
          />
        </div>
        <div class="form-group">
          <label for="character-background">Background</label>
          <input 
            type="text" 
            id="character-background" 
            name="background" 
            value="${character?.background || ""}"
            placeholder="Acolyte, Criminal, etc..."
          />
        </div>
      </div>
      
      <div class="form-group">
        <label for="character-description">Description</label>
        <textarea 
          id="character-description" 
          name="description" 
          rows="3"
          placeholder="Physical description and personality..."
        >${character?.description || ""}</textarea>
      </div>
      
      <div class="form-group">
        <label for="character-personality">Personality</label>
        <textarea 
          id="character-personality" 
          name="personality" 
          rows="2"
          placeholder="Character traits and personality..."
        >${character?.personality || ""}</textarea>
      </div>
      
      <div class="form-group">
        <label for="character-goals">Goals</label>
        <textarea 
          id="character-goals" 
          name="goals" 
          rows="2"
          placeholder="Character goals and objectives..."
        >${character?.goals || ""}</textarea>
      </div>
    `;
  }

  /**
   * Render NPC specific form fields
   */
  renderNPCFields(character) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label for="npc-role">Role</label>
          <input 
            type="text" 
            id="npc-role" 
            name="role" 
            value="${character?.role || ""}"
            placeholder="Merchant, Guard, Noble, etc..."
          />
        </div>
        <div class="form-group">
          <label for="npc-location">Location</label>
          <input 
            type="text" 
            id="npc-location" 
            name="location" 
            value="${character?.location || ""}"
            placeholder="Where they can be found..."
          />
        </div>
      </div>
      
      <div class="form-group">
        <label for="npc-description">Description</label>
        <textarea 
          id="npc-description" 
          name="description" 
          rows="3"
          placeholder="Physical description and personality..."
        >${character?.description || ""}</textarea>
      </div>
      
      <div class="form-group">
        <label for="npc-motivation">Motivation</label>
        <textarea 
          id="npc-motivation" 
          name="motivation" 
          rows="2"
          placeholder="What drives this NPC..."
        >${character?.motivation || character?.motivations || ""}</textarea>
      </div>
      
      <div class="form-group">
        <label for="npc-secrets">Secrets</label>
        <textarea 
          id="npc-secrets" 
          name="secrets" 
          rows="2"
          placeholder="Hidden information about this NPC..."
        >${character?.secrets || ""}</textarea>
      </div>
    `;
  }

  /**
   * Show modal with content and optional form handler
   */
  showModal(content, formHandler = null) {
    console.log("💬 Creating modal with content length:", content.length);
    
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        ${content}
      </div>
    `;

    // Add click handler to close modal when clicking overlay
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });

    if (formHandler) {
      const form = modalOverlay.querySelector("form");
      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          try {
            await formHandler(form);
            modalOverlay.remove();
          } catch (error) {
            console.error("Form submission error:", error);
          }
        });
      }
    }

    document.body.appendChild(modalOverlay);
    console.log("💬 Modal appended to body, now showing...");

    // Show the modal with animation
    requestAnimationFrame(() => {
      modalOverlay.classList.add('show');
      console.log("💬 Modal show class added");
    });

    // Focus on first input
    setTimeout(() => {
      const firstInput = modalOverlay.querySelector("input, textarea");
      if (firstInput) {
        firstInput.focus();
        console.log("💬 Focus set to first input:", firstInput.tagName);
      }
    }, 150);
  }

  /**
   * Handle character form submission
   */
  async handleAddCharacter(form) {
    const formData = new FormData(form);
    const characterData = Object.fromEntries(formData.entries());

    // Call the character manager to handle the actual creation
    const result = await this.characterCore.handleAddCharacter(form);
    this.showSuccessMessage(
      `Character ${characterData.name} created successfully!`
    );

    // Refresh the character display
    this.showCharacterOverview();
    return result;
  }

  /**
   * Handle NPC form submission
   */
  async handleAddNPC(form) {
    const formData = new FormData(form);
    const npcData = Object.fromEntries(formData.entries());

    // Call the character manager to handle the actual creation
    const result = await this.characterCore.handleAddNPC(form);
    this.showSuccessMessage(`NPC ${npcData.name} created successfully!`);

    // Refresh the character display
    this.showCharacterOverview();
    return result;
  }

  /**
   * Handle character edit form submission
   */
  async handleEditCharacter(form, characterId, isPlayerCharacter) {
    const formData = new FormData(form);
    const characterData = Object.fromEntries(formData.entries());

    // Call the character core to handle the actual update
    const result = await this.characterCore.handleEditCharacter(
      form,
      characterId,
      isPlayerCharacter
    );
    this.showSuccessMessage(`Character updated successfully!`);

    // Refresh the character display
    this.showCharacterOverview();
    return result;
  }
}
