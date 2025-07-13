/**
 * CharacterUI - User interface rendering and interactions for character management
 * Handles HTML generation, modal dialogs, event listeners, and UI state management
 */
import { escapeHTML } from "../../shared/escape-html.js";

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
          </div>
        </div>

        <div class="workspace-panel">
          <div id="character-detail-content" class="character-detail-content">
            ${this.renderCharacterGridView()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render character grid view (combines PCs and NPCs in one grid)
   */
  renderCharacterGridView() {
    const allCharacters = [
      ...this.characterCore.playerCharacters,
      ...this.characterCore.importantNPCs,
    ];

    if (allCharacters.length === 0) {
      return `
        <div class="character-grid-empty">
          <i class="fas fa-users"></i>
          <h3>No Characters Yet</h3>
          <p>Add player characters and NPCs to start managing your campaign.</p>
          <div class="empty-actions">
            <button class="btn btn-primary" data-action="add-character">
              <i class="fas fa-user-plus"></i> Add Player Character
            </button>
            <button class="btn btn-secondary" data-action="add-npc">
              <i class="fas fa-users"></i> Add NPC
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="character-grid-view">
        ${this.renderCharacterFilters()}
        <div class="character-grid workspace-cards-grid" id="character-grid-container">
          ${allCharacters
            .map((character) => this.renderCharacterCard(character))
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Render character filters UI
   */
  renderCharacterFilters() {
    return `
      <div class="character-filters">
        <div class="filter-group">
          <label for="character-type-filter">Character Type:</label>
          <select id="character-type-filter" class="filter-select" data-filter="character-type">
            <option value="all">All Characters</option>
            <option value="pc">Player Characters</option>
            <option value="npc">NPCs</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-sm btn-outline-secondary" data-action="clear-filters">
            <i class="fas fa-times"></i> Clear Filters
          </button>
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
              <div class="card card-character clickable" data-character-id="${escapeHTML(
                String(character.id)
              )}">
                <div class="card-header">
                  <div class="character-avatar">
                    ${escapeHTML(character.name.charAt(0).toUpperCase())}
                  </div>
                  <div class="card-title-info">
                    <h4 class="card-title">${escapeHTML(character.name)}</h4>
                    <div class="card-meta">
                      <span class="card-class-level">${escapeHTML(
                        character.class || "Unknown"
                      )}${
              character.subclass ? ` (${escapeHTML(character.subclass)})` : ""
            } ${escapeHTML(String(character.level || 1))}</span>
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
                  <p class="card-description">${escapeHTML(
                    character.description ||
                      character.personality ||
                      "No description available."
                  )}</p>
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
              <div class="card card-character clickable" data-character-id="${escapeHTML(
                String(npc.id)
              )}">
                <div class="card-header">
                  <div class="character-avatar">
                    ${escapeHTML(npc.name.charAt(0).toUpperCase())}
                  </div>
                  <div class="card-title-info">
                    <h4 class="card-title">${escapeHTML(npc.name)}</h4>
                    <div class="card-meta">
                      <span class="card-role-location">${escapeHTML(
                        npc.role || "Unknown Role"
                      )}${
              npc.location ? ` • ${escapeHTML(npc.location)}` : ""
            }</span>
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
                  <div class="npc-relationships">${this.characterRelationships.renderNPCRelationshipTags(
                    npc
                  )}</div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  /**
   * Render a unified character card (works for both PCs and NPCs)
   */
  renderCharacterCard(character) {
    const isPlayerCharacter =
      character.type === "pc" ||
      character.isPlayerCharacter ||
      character.player_character;

    // Determine actions based on character type
    const actions = isPlayerCharacter
      ? `
        <button class="btn btn-xs btn-outline-secondary" data-action="edit-character" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-xs btn-outline-info" data-action="character-notes" title="Notes">
          <i class="fas fa-sticky-note"></i>
        </button>
      `
      : `
        <button class="btn btn-xs btn-outline-secondary" data-action="edit-npc" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
      `;

    // Determine meta info based on character type
    const metaInfo = isPlayerCharacter
      ? `<span class="card-class-level">${escapeHTML(
          character.class || "Unknown"
        )}${
          character.subclass ? ` (${escapeHTML(character.subclass)})` : ""
        } ${escapeHTML(String(character.level || 1))}</span>`
      : `<span class="card-role-location">${escapeHTML(
          character.role || "Unknown Role"
        )}${
          character.location ? ` • ${escapeHTML(character.location)}` : ""
        }</span>`;

    // Determine body content based on character type
    const bodyContent = isPlayerCharacter
      ? `<p class="card-description">${escapeHTML(
          character.description ||
            character.personality ||
            "No description available."
        )}</p>`
      : `<div class="npc-relationships">${this.characterRelationships.renderNPCRelationshipTags(
          character
        )}</div>`;

    return `
      <div class="card card-character clickable" data-character-id="${escapeHTML(
        String(character.id)
      )}">
        <div class="card-header">
          <div class="character-avatar">
            ${escapeHTML(character.name.charAt(0).toUpperCase())}
          </div>
          <div class="card-title-info">
            <h4 class="card-title">${escapeHTML(character.name)}</h4>
            <div class="card-meta">
              ${metaInfo}
            </div>
          </div>
          <div class="card-actions">
            ${actions}
          </div>
        </div>
        <div class="card-body">
          ${bodyContent}
        </div>
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
   * Setup event listeners for character overview (event delegation)
   */
  setupCharacterOverviewListeners() {
    // Remove any existing listeners to prevent duplicates
    this.removeCharacterListeners();

    // Bind unified handlers
    this.handleCharacterUIClick = this.handleCharacterUIClick.bind(this);
    this.handleCharacterUIChange = this.handleCharacterUIChange.bind(this);

    // Add unified event delegation listeners
    document.addEventListener("click", this.handleCharacterUIClick);
    document.addEventListener("change", this.handleCharacterUIChange);

    console.log("🎭 CharacterUI: Unified event delegation setup complete");
  }

  removeCharacterListeners() {
    if (this.handleCharacterUIClick) {
      document.removeEventListener("click", this.handleCharacterUIClick);
    }
    if (this.handleCharacterUIChange) {
      document.removeEventListener("change", this.handleCharacterUIChange);
    }
  }

  /**
   * Unified click event handler for all character UI actions
   */
  handleCharacterUIClick(event) {
    // Handle character view toggle buttons first (they don't have data-action)
    const viewToggleEl = event.target.closest(".character-view-toggle");
    if (viewToggleEl) {
      const viewType = viewToggleEl.getAttribute("data-view");
      if (viewType) {
        this.switchCharacterView(viewType);
        return;
      }
    }

    // Find the closest element with a data-action attribute
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) {
      // Handle card selection (clicking on card, not on action buttons)
      const characterCard = event.target.closest(".card-character");
      if (characterCard && !event.target.closest("[data-action]")) {
        const characterId = characterCard.dataset.characterId;
        this.selectCharacter(characterId);
      }
      // Handle relationship card quick-add/edit (not on buttons/selects)
      const relationshipCard = event.target.closest(".relationship-card");
      if (
        relationshipCard &&
        !event.target.closest("button") &&
        !event.target.closest("select") &&
        !event.target.closest(".card-actions")
      ) {
        const fromCharacterId = relationshipCard.dataset.fromCharacterId;
        const toCharacterId = relationshipCard.dataset.toCharacterId;
        const hasRelationship =
          relationshipCard.querySelector(".relationship-type-select") !== null;
        if (!hasRelationship) {
          this.showAddRelationshipDialog(fromCharacterId, toCharacterId);
        } else {
          this.showEditRelationshipDialog(fromCharacterId, toCharacterId);
        }
      }
      return;
    }
    const action = actionEl.getAttribute("data-action");
    switch (action) {
      case "add-character":
        this.showAddCharacterDialog();
        break;
      case "add-npc":
        this.showAddNPCDialog();
        break;
      case "edit-character":
        this.showEditCharacterDialog(actionEl.dataset.characterId);
        break;
      case "edit-npc":
        this.showEditCharacterDialog(actionEl.dataset.characterId);
        break;
      case "character-notes":
        this.showCharacterNotesDialog(actionEl.dataset.characterId);
        break;
      case "view-character":
        this.showCharacterDetails(
          actionEl.closest(".card-character").dataset.characterId
        );
        break;
      case "view-npc":
        this.showCharacterDetails(
          actionEl.closest(".card-character").dataset.characterId
        );
        break;
      case "back-to-characters":
        this.showCharacterGrid();
        break;
      case "clear-filters":
        this.clearCharacterFilters();
        break;
      case "switch-tab":
        if (actionEl.hasAttribute("data-tab")) {
          // Used for both main and detail tab switching
          const tabName = actionEl.getAttribute("data-tab");
          if (actionEl.classList.contains("character-tab")) {
            this.switchCharacterTab(tabName);
          } else {
            this.switchCharacterDetailTab(tabName);
          }
        }
        break;
      case "add-relationship":
        this.showAddRelationshipDialog(
          actionEl.dataset.fromCharacterId,
          actionEl.dataset.toCharacterId
        );
        break;
      case "edit-relationship":
        this.showEditRelationshipDialog(
          actionEl.dataset.fromCharacterId,
          actionEl.dataset.toCharacterId
        );
        break;
      case "delete-relationship":
        {
          const fromCharacterId = actionEl.dataset.fromCharacterId;
          const toCharacterId = actionEl.dataset.toCharacterId;
          if (confirm("Are you sure you want to delete this relationship?")) {
            (async () => {
              try {
                await this.characterRelationships.deleteRelationship(
                  fromCharacterId,
                  toCharacterId
                );
                this.switchCharacterDetailTab("relationships");
                this.showSuccessMessage("Relationship deleted successfully");
              } catch (error) {
                this.showError(
                  `Failed to delete relationship: ${error.message}`
                );
              }
            })();
          }
        }
        break;
      // Add more data-action cases as needed
      default:
        break;
    }
  }

  /**
   * Unified change event handler for all character UI actions
   */
  handleCharacterUIChange(event) {
    // Handle filter selects
    if (event.target.classList.contains("filter-select")) {
      // Check for data-action="filter-relationships"
      if (event.target.getAttribute("data-action") === "filter-relationships") {
        if (
          window.characterManager &&
          window.characterManager.filterRelationships
        ) {
          window.characterManager.filterRelationships();
        }
        return;
      }
      this.applyCharacterFilters();
      return;
    }
    // Handle relationship type select changes
    if (event.target.classList.contains("relationship-type-select")) {
      if (
        window.characterManager &&
        window.characterManager.updateRelationshipType
      ) {
        window.characterManager.updateRelationshipType(event.target);
      }
      return;
    }
  }

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

    // Update active state on header buttons
    document
      .querySelectorAll('[data-action="switch-tab"]')
      .forEach((button) => {
        button.classList.remove("active");
      });
    const targetButton = document.querySelector(
      `[data-action="switch-tab"][data-tab="${tabName}"]`
    );
    if (targetButton) {
      targetButton.classList.add("active");
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
        if (
          !centerPanel.innerHTML.includes("character-details-view") &&
          !centerPanel.innerHTML.includes("npc-details-view")
        ) {
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
   * Switch character view within the character detail page
   */
  switchCharacterView(viewType) {
    console.log("🎭 UI: switchCharacterView called with:", viewType);

    if (!this.selectedCharacter) {
      console.warn("🎭 UI: No character selected for view switching");
      return;
    }

    // Update active state on toggle buttons
    document.querySelectorAll(".character-view-toggle").forEach((button) => {
      button.classList.remove("active");
    });
    const targetButton = document.querySelector(
      `.character-view-toggle[data-view="${viewType}"]`
    );
    if (targetButton) {
      targetButton.classList.add("active");
    }

    // Update the character content area
    const contentArea = document.getElementById("character-content-area");
    if (!contentArea) {
      console.error("🎭 UI: character-content-area not found");
      return;
    }

    // Determine if this is a player character or NPC
    const isPlayerCharacter =
      this.selectedCharacter.type === "player" ||
      this.selectedCharacter.isPlayerCharacter;

    switch (viewType) {
      case "details":
        if (isPlayerCharacter) {
          contentArea.innerHTML = this.renderCharacterDetailsContent(
            this.selectedCharacter
          );
        } else {
          contentArea.innerHTML = this.renderNPCDetailsContent(
            this.selectedCharacter
          );
        }
        break;
      case "relationships":
        contentArea.innerHTML = this.renderCharacterRelationshipsContent(
          this.selectedCharacter
        );
        this.setupRelationshipsListeners();
        break;
      case "progression":
        if (isPlayerCharacter) {
          contentArea.innerHTML = this.renderCharacterProgressionContent(
            this.selectedCharacter
          );
          this.setupProgressionViewListeners();
        } else {
          // NPCs don't have progression, show message or different content
          contentArea.innerHTML = `
            <div class="npc-section">
              <p class="text-muted"><em>Progression tracking is not available for NPCs.</em></p>
            </div>
          `;
        }
        break;
      default:
        console.warn("🎭 UI: Unknown view type:", viewType);
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
          <div class="character-header-info">
            <h4>${escapeHTML(character.name)}</h4>
            <div class="character-meta">
              <span class="character-class">${escapeHTML(
                character.class || "Unknown Class"
              )}${
      character.subclass ? ` (${escapeHTML(character.subclass)})` : ""
    }</span>
              <span class="character-level">Level ${escapeHTML(
                String(character.level || 1)
              )}</span>
              <span class="character-race">${escapeHTML(
                character.race || "Unknown Race"
              )}</span>
            </div>
          </div>
          <div class="character-header-actions">
            <button class="btn btn-outline-secondary" data-action="back-to-characters">
              <i class="fas fa-arrow-left"></i> Back to Characters
            </button>
            <button class="btn btn-outline-primary character-view-toggle active" data-view="details">
              <i class="fas fa-user"></i> Details
            </button>
            <button class="btn btn-outline-primary character-view-toggle" data-view="relationships">
              <i class="fas fa-project-diagram"></i> Relationships
            </button>
            <button class="btn btn-outline-secondary character-view-toggle" data-view="progression">
              <i class="fas fa-chart-line"></i> Progression
            </button>
          </div>
        </div>

        <div class="character-content" id="character-content-area">
          ${this.renderCharacterDetailsContent(character)}
        </div>

        <div class="character-actions">
          <button class="btn btn-primary" data-action="edit-character" data-character-id="${escapeHTML(
            String(character.id)
          )}">
            <i class="fas fa-edit"></i> Edit Character
          </button>
          <button class="btn btn-secondary" data-action="character-notes" data-character-id="${escapeHTML(
            String(character.id)
          )}">
            <i class="fas fa-sticky-note"></i> Notes
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render character details content (the main info section)
   */
  renderCharacterDetailsContent(character) {
    return `
      <div class="character-section">
        <h5>Background</h5>
        <p>${escapeHTML(character.background || "No background specified.")}</p>
      </div>

      <div class="character-section">
        <h5>Description</h5>
        <p>${escapeHTML(
          character.description || "No description available."
        )}</p>
      </div>

      <div class="character-section">
        <h5>Backstory</h5>
        <p>${escapeHTML(character.backstory || "No backstory recorded.")}</p>
      </div>

      <div class="character-section">
        <h5>Goals</h5>
        <div class="character-goals">
          ${this.renderCharacterGoals(character)}
        </div>
      </div>
    `;
  }

  /**
   * Render character relationships content
   */
  renderCharacterRelationshipsContent(character) {
    const allCharacters = this.characterCore.getAllCharacters();
    const otherCharacters = allCharacters.filter(
      (char) => char.id !== character.id
    );
    const relationships = character.relationships || {};

    if (otherCharacters.length === 0) {
      return `
        <div class="character-relationships">
          <div class="relationships-empty">
            <i class="fas fa-users"></i>
            <p>No other characters available for relationships.</p>
            <small>Add more characters to track relationships.</small>
          </div>
        </div>
      `;
    }

    const characterCards = otherCharacters
      .map((targetChar) =>
        this.characterRelationships.renderCharacterRelationshipCard(
          character,
          targetChar,
          relationships[targetChar.id]
        )
      )
      .join("");

    return `
      <div class="character-relationships">
        <div class="relationships-header">
          <div class="relationships-header-left">
            <h5>${escapeHTML(character.name)}'s Relationships</h5>
          </div>
          <div class="relationships-filters">
            <select class="filter-select" data-filter="character-type" data-action="filter-relationships">
              <option value="all">All Characters</option>
              <option value="pc">Player Characters</option>
              <option value="npc">NPCs</option>
            </select>
            <select class="filter-select" data-filter="relationship-type" data-action="filter-relationships">
              <option value="all">All Relationships</option>
              <option value="undefined">Undefined</option>
              <option value="neutral">Neutral</option>
              <option value="friend">Friends</option>
              <option value="ally">Allies</option>
              <option value="rival">Rivals</option>
              <option value="enemy">Enemies</option>
              <option value="family">Family</option>
              <option value="romantic">Romantic</option>
              <option value="mentor">Mentors</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>
        <div class="relationships-grid">
          ${characterCards}
        </div>
      </div>
    `;
  }

  /**
   * Render character progression content
   */
  renderCharacterProgressionContent(character) {
    return this.characterProgression.renderCharacterProgressionView(character);
  }

  /**
   * Render NPC details content (the main info section)
   */
  renderNPCDetailsContent(npc) {
    return `
      <div class="npc-section">
        <h5>Motivation</h5>
        <p>${escapeHTML(npc.motivation || "No motivation recorded.")}</p>
      </div>

      <div class="npc-section">
        <h5>Description</h5>
        <p>${escapeHTML(npc.description || "No description available.")}</p>
      </div>

      <div class="npc-section">
        <h5>Party Favorability</h5>
        <div class="favorability-meter">
          <div class="favorability-bar">
            <div class="favorability-fill" style="width: ${escapeHTML(
              String(npc.favorability || 50)
            )}%"></div>
          </div>
          <span class="favorability-value">${escapeHTML(
            String(npc.favorability || 50)
          )}/100</span>
        </div>
        <small class="favorability-note">How this NPC feels about the party overall</small>
      </div>

      <div class="npc-section">
        <h5>Scenes</h5>
        <div class="npc-scenes">
          ${
            npc.scenes && Array.isArray(npc.scenes)
              ? npc.scenes
                  .map(
                    (scene) =>
                      `<span class="scene-tag clickable" data-action="navigate-to-scene" data-scene-id="${escapeHTML(
                        String(scene)
                      )}" title="Click to view scene">${escapeHTML(
                        String(scene)
                      )}</span>`
                  )
                  .join("")
              : "<em>No scenes recorded</em>"
          }
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
          // If JSON parsing fails, treat as plain text goal
          goals = character.goals
            ? [{ text: character.goals, status: "active" }]
            : [];
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
          <span class="goal-text">${escapeHTML(goal.text || goal)}</span>
          <span class="goal-status ${escapeHTML(
            goal.status || "active"
          )}">${escapeHTML(goal.status || "active")}</span>
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
          <div class="npc-header-info">
            <h4>${escapeHTML(npc.name)}</h4>
            <div class="npc-meta">
              <span class="npc-role">${escapeHTML(
                npc.role || "Unknown Role"
              )}</span>
              <span class="npc-importance">${escapeHTML(
                npc.importance || "Unknown"
              )} importance</span>
            </div>
          </div>
          <div class="npc-header-actions">
            <button class="btn btn-outline-secondary" data-action="back-to-characters">
              <i class="fas fa-arrow-left"></i> Back to Characters
            </button>
            <button class="btn btn-outline-primary character-view-toggle active" data-view="details">
              <i class="fas fa-user"></i> Details
            </button>
            <button class="btn btn-outline-primary character-view-toggle" data-view="relationships">
              <i class="fas fa-project-diagram"></i> Relationships
            </button>
          </div>
        </div>

        <div class="character-content" id="character-content-area">
          ${this.renderNPCDetailsContent(npc)}
        </div>

        <div class="npc-actions">
          <button class="btn btn-primary" data-action="edit-character" data-character-id="${escapeHTML(
            String(npc.id)
          )}">
            <i class="fas fa-edit"></i> Edit NPC
          </button>
          <button class="btn btn-secondary" data-action="export-character" data-character-id="${escapeHTML(
            String(npc.id)
          )}">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Go back to character grid view
   */
  showCharacterGrid() {
    // Clear selected character
    this.selectedCharacter = null;

    // Update the content area with character grid
    const centerPanel = document.getElementById("character-detail-content");
    if (centerPanel) {
      centerPanel.innerHTML = this.renderCharacterGridView();
    }
  }

  /**
   * Apply character filters to the grid
   */
  applyCharacterFilters() {
    const characterTypeFilter =
      document.getElementById("character-type-filter")?.value || "all";

    const cards = document.querySelectorAll(
      "#character-grid-container .card-character"
    );

    cards.forEach((card) => {
      const characterId = card.dataset.characterId;
      const { character, isPlayerCharacter } =
        this.characterCore.getCharacterById(characterId);

      if (!character) return;

      let showCard = true;

      // Character type filter
      if (characterTypeFilter !== "all") {
        if (characterTypeFilter === "pc" && !isPlayerCharacter) {
          showCard = false;
        } else if (characterTypeFilter === "npc" && isPlayerCharacter) {
          showCard = false;
        }
      }

      card.style.display = showCard ? "" : "none";
    });

    // Show/hide empty state if needed
    this.updateEmptyState();
  }

  /**
   * Clear all character filters
   */
  clearCharacterFilters() {
    // Reset all filter selects
    const filters = document.querySelectorAll(".filter-select");
    filters.forEach((filter) => {
      filter.value = "all";
    });

    // Show all cards
    const cards = document.querySelectorAll(
      "#character-grid-container .card-character"
    );
    cards.forEach((card) => {
      card.style.display = "";
    });

    // Update empty state
    this.updateEmptyState();
  }

  /**
   * Update empty state visibility based on visible cards
   */
  updateEmptyState() {
    const cards = document.querySelectorAll(
      "#character-grid-container .card-character"
    );
    const visibleCards = Array.from(cards).filter(
      (card) => card.style.display !== "none"
    );

    // Create or update no results message
    let noResultsMsg = document.getElementById("no-filter-results");

    if (visibleCards.length === 0) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement("div");
        noResultsMsg.id = "no-filter-results";
        noResultsMsg.className = "character-grid-empty";
        noResultsMsg.innerHTML = `
          <i class="fas fa-filter"></i>
          <h3>No Characters Match Filters</h3>
          <p>Try adjusting your filters to see more characters.</p>
          <button class="btn btn-outline-secondary" data-action="clear-filters">
            <i class="fas fa-times"></i> Clear Filters
          </button>
        `;
        const gridContainer = document.getElementById(
          "character-grid-container"
        );
        if (gridContainer) {
          // Use DocumentFragment to batch DOM updates
          const fragment = document.createDocumentFragment();
          fragment.appendChild(noResultsMsg);
          gridContainer.appendChild(fragment);
        }
      }
      noResultsMsg.style.display = "";
    } else if (noResultsMsg) {
      noResultsMsg.style.display = "none";
    }
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
  showRelationshipModal(
    relationship = null,
    fromCharacterId = null,
    toCharacterId = null
  ) {
    console.log("🎭 showRelationshipModal called with:", {
      relationship,
      fromCharacterId,
      toCharacterId,
    });
    const allCharacters = this.characterCore.getAllCharacters();
    const isEditing = relationship !== null;

    const fromCharacterOptions = allCharacters
      .map(
        (char) =>
          `<option value="${char.id}" ${
            fromCharacterId === char.id ? "selected" : ""
          }>${escapeHTML(char.name)}</option>`
      )
      .join("");

    const toCharacterOptions = allCharacters
      .map(
        (char) =>
          `<option value="${char.id}" ${
            toCharacterId === char.id ? "selected" : ""
          }>${escapeHTML(char.name)}</option>`
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
                isEditing || toCharacterId
                  ? "readonly style='pointer-events: none; background-color: #f8f9fa;'"
                  : ""
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
      console.log(
        "🎭 Form submitted for character:",
        character?.id,
        "isEdit:",
        isEdit
      );

      // Resolve characterManager once
      const characterManager = window.characterManager || null;
      let result;

      if (isEdit) {
        if (characterManager) {
          console.log("🎭 Calling characterManager.handleEditCharacter");
          result = await characterManager.handleEditCharacter(
            form,
            character.id,
            isPlayerCharacter
          );
        } else {
          console.log("🎭 Calling this.handleEditCharacter as fallback");
          result = await this.handleEditCharacter(
            form,
            character.id,
            isPlayerCharacter
          );
        }

        // Re-select the character after successful edit to maintain selection
        setTimeout(() => {
          this.selectCharacter(character.id);
        }, 100);
      } else {
        if (characterManager) {
          result = isPlayerCharacter
            ? await characterManager.handleAddCharacter(form)
            : await characterManager.handleAddNPC(form);
        } else {
          result = isPlayerCharacter
            ? await this.handleAddCharacter(form)
            : await this.handleAddNPC(form);
        }
      }

      return result;
    });
  }

  /**
   * Show notes modal for character
   */
  showNotesModal(character) {
    const modalContent = `
      <div class="character-notes-modal">
        <h3>Notes for ${escapeHTML(character.name)}</h3>
        <div class="notes-content">
          <div class="form-group">
            <label for="character-notes">Character Notes</label>
            <textarea 
              id="character-notes" 
              name="notes" 
              rows="10"
              placeholder="Add notes about this character..."
            >${escapeHTML(character.notes || "")}</textarea>
          </div>
          
          <div class="form-group">
            <label for="character-backstory">Backstory</label>
            <textarea 
              id="character-backstory" 
              name="backstory" 
              rows="6"
              placeholder="Character backstory and history..."
            >${escapeHTML(character.backstory || "")}</textarea>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
            Close
          </button>
          <button type="button" class="btn btn-primary" data-action="save-character-notes" data-character-id="${
            character.id
          }">
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
    const addRelationshipBtns = centerPanel.querySelectorAll(
      '[data-action="add-relationship"]'
    );
    addRelationshipBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const fromCharacterId = btn.dataset.fromCharacterId;
        const toCharacterId = btn.dataset.toCharacterId;
        this.showAddRelationshipDialog(fromCharacterId, toCharacterId);
      });
    });

    // Handle clicking on relationship cards to quick-add relationships
    const relationshipCards =
      centerPanel.querySelectorAll(".relationship-card");
    relationshipCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        // Don't trigger card click if clicking on buttons, selects, or card actions
        if (
          e.target.closest("button") ||
          e.target.closest("select") ||
          e.target.closest(".card-actions")
        ) {
          return;
        }

        const fromCharacterId = card.dataset.fromCharacterId;
        const toCharacterId = card.dataset.toCharacterId;
        const hasRelationship =
          card.querySelector(".relationship-type-select") !== null;

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
    const relationshipSelects = centerPanel.querySelectorAll(
      ".relationship-type-select"
    );
    relationshipSelects.forEach((select) => {
      select.addEventListener("change", async (e) => {
        e.stopPropagation(); // Prevent card click
        await window.characterManager.updateRelationshipType(select);
      });
    });

    // Handle Edit Relationship button clicks
    const editRelationshipBtns = centerPanel.querySelectorAll(
      '[data-action="edit-relationship"]'
    );
    editRelationshipBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const fromCharacterId = btn.dataset.fromCharacterId;
        const toCharacterId = btn.dataset.toCharacterId;
        this.showEditRelationshipDialog(fromCharacterId, toCharacterId);
      });
    });

    // Handle Delete Relationship button clicks
    const deleteRelationshipBtns = centerPanel.querySelectorAll(
      '[data-action="delete-relationship"]'
    );
    deleteRelationshipBtns.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const fromCharacterId = btn.dataset.fromCharacterId;
        const toCharacterId = btn.dataset.toCharacterId;

        if (confirm("Are you sure you want to delete this relationship?")) {
          try {
            await this.characterRelationships.deleteRelationship(
              fromCharacterId,
              toCharacterId
            );
            // Refresh the relationships view
            this.switchCharacterDetailTab("relationships");
            this.showSuccessMessage("Relationship deleted successfully");
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
            value="${escapeHTML(character?.class || "")}"
            placeholder="Fighter, Wizard, etc..."
          />
        </div>
        <div class="form-group">
          <label for="character-subclass">Subclass</label>
          <input 
            type="text" 
            id="character-subclass" 
            name="subclass" 
            value="${escapeHTML(character?.subclass || "")}"
            placeholder="Champion, Evocation, etc..."
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
            value="${escapeHTML(String(character?.level || 1))}"
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
            value="${escapeHTML(character?.race || "")}"
            placeholder="Human, Elf, Dwarf, etc..."
          />
        </div>
        <div class="form-group">
          <label for="character-background">Background</label>
          <input 
            type="text" 
            id="character-background" 
            name="background" 
            value="${escapeHTML(character?.background || "")}"
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
        >${escapeHTML(character?.description || "")}</textarea>
      </div>
      
      <div class="form-group">
        <label for="character-personality">Personality</label>
        <textarea 
          id="character-personality" 
          name="personality" 
          rows="2"
          placeholder="Character traits and personality..."
        >${escapeHTML(character?.personality || "")}</textarea>
      </div>
      
      <div class="form-group">
        <label for="character-goals">Goals</label>
        <textarea 
          id="character-goals" 
          name="goals" 
          rows="2"
          placeholder="Character goals and objectives..."
        >${escapeHTML(character?.goals || "")}</textarea>
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
            value="${escapeHTML(character?.role || "")}"
            placeholder="Merchant, Guard, Noble, etc..."
          />
        </div>
        <div class="form-group">
          <label for="npc-location">Location</label>
          <input 
            type="text" 
            id="npc-location" 
            name="location" 
            value="${escapeHTML(character?.location || "")}"
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
        >${escapeHTML(character?.description || "")}</textarea>
      </div>
      
      <div class="form-group">
        <label for="npc-motivation">Motivation</label>
        <textarea 
          id="npc-motivation" 
          name="motivation" 
          rows="2"
          placeholder="What drives this NPC..."
        >${escapeHTML(
          character?.motivation || character?.motivations || ""
        )}</textarea>
      </div>
      
      <div class="form-group">
        <label for="npc-secrets">Secrets</label>
        <textarea 
          id="npc-secrets" 
          name="secrets" 
          rows="2"
          placeholder="Hidden information about this NPC..."
        >${escapeHTML(character?.secrets || "")}</textarea>
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
    modalOverlay.addEventListener("click", (e) => {
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
      modalOverlay.classList.add("show");
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

    // Character list will refresh automatically
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

    // Character list will refresh automatically
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

    // Character list will refresh automatically
    return result;
  }
}
