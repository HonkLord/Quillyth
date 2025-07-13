import { SceneManager } from "./features/scenes/scene-manager.js";
import { DataManager } from "./data-manager.js";
import CharacterManager from "./features/characters/character-manager.js";
import PlayerArcManager from "./features/player-arcs/player-arc-manager.js";
import QuestManager from "./features/quests/quest-manager.js";
import { NotesManager } from "./features/notes/notes-manager.js";
import { SessionManager } from "./features/sessions/session-manager-new.js";
// import { GlobalSearch } from "./components/global-search.js"; // DISABLED
import ExportImportPanel from "./components/export-import-panel.js";
import LocationManager from "./features/locations/location-manager.js";

// Main Application Logic

class CampaignManager {
  constructor() {
    // State
    this.currentWorkspace = "scenes";

    // Managers will be initialized in init()
    this.sceneManager = null;
    this.characterManager = null;
    this.dataManager = null;
    this.playerArcManager = null;
    this.questManager = null;
    this.notesManager = null;
    this.sessionManager = null;
    this.globalSearch = null;
    this.exportImportPanel = null;
    this.locationManager = null;
  }

  async init() {
    console.log("▶️ CampaignManager: Initializing...");

    // Debug: Check if campaign-content exists at startup
    const campaignContent = document.getElementById("campaign-content");
    console.log("🔍 Checking campaign-content at startup:", campaignContent);
    if (campaignContent) {
      console.log("✅ campaign-content found at startup");
    } else {
      console.error("❌ campaign-content NOT found at startup!");
    }
    
    

    // Initialize shared Data Manager first (load campaign once)
    this.dataManager = new DataManager();
    await this.dataManager.loadCurrentCampaign();

    // Initialize managers with shared DataManager
    this.sceneManager = new SceneManager(this.dataManager);
    await this.sceneManager.init();

    this.characterManager = new CharacterManager(this.dataManager);
    await this.characterManager.init();

    // Initialize Player Arc Manager
    this.playerArcManager = new PlayerArcManager(this.dataManager);
    await this.playerArcManager.init();

    // Initialize Quest Manager
    this.questManager = new QuestManager(this.dataManager);
    await this.questManager.init();

    // Initialize Notes Manager
    this.notesManager = new NotesManager(this.dataManager);
    await this.notesManager.init();

    // Initialize Session Manager
    this.sessionManager = new SessionManager(this.dataManager);
    await this.sessionManager.init();

    // Initialize Location Manager
    this.locationManager = new LocationManager(
      this.apiService,
      this.dataManager
    );
    await this.locationManager.init();

    // Initialize Global Search - DISABLED to prevent duplicate search interfaces
    // this.globalSearch = new GlobalSearch();

    // Initialize Export/Import Panel
    this.exportImportPanel = new ExportImportPanel();

    // Expose the managers to the window for any remaining inline handlers
    window.sceneManager = this.sceneManager;
    window.characterManager = this.characterManager;
    window.questManager = this.questManager;
    window.notesManager = this.notesManager;
    window.sessionManager = this.sessionManager;
    window.globalSearch = this.globalSearch;
    window.exportImportPanel = this.exportImportPanel;
    window.locationManager = this.locationManager;

    console.log("✅ CampaignManager: All managers ready.");

    // Setup UI
    this.setupMainUI();

    // Setup event listeners for navigation
    this.setupEventListeners();

    console.log("🚀 CampaignManager: Application started successfully!");
    console.log("🧪 Debug: Type 'testCharacterEdit()' in console to test character editing");
  }

  setupMainUI() {
    // This function sets up the main shell of the application
    console.log("🔄 Setting up main UI...");

    // Start with scenes workspace
    this.showScenesWorkspace();

    console.log("✅ Main UI setup complete");
  }

  setupEventListeners() {
    // Setup player tabs for any existing content
    this.setupPlayerTabs();

    // Setup hash navigation
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hash.startsWith("scene/")) {
        const sceneId = hash.replace("scene/", "");
        this.sceneManager.navigateToScene(sceneId);
      }
    });

    // Setup main navigation event delegation
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action]");
      const action = target?.dataset.action;
      if (!action) return;

      // Add debug logging for character actions
      if (action.includes("character") || action.includes("edit") || action.includes("npc")) {
        console.log(`🎭 Character action triggered: ${action}`, {
          target: target,
          originalTarget: event.target,
          eventType: event.type,
          characterManager: !!this.characterManager,
          characterManagerUI: !!this.characterManager?.ui
        });
      } else {
        console.log(`🔘 Navigation action triggered: ${action}`, {
          target: target,
          originalTarget: event.target,
          eventType: event.type,
        });
      }

      switch (action) {
        case "edit-campaign-title":
          this.editCampaignTitle(event.target.closest(".campaign-title"));
          break;
        case "show-dashboard":
          this.showMainDashboard();
          break;
        case "show-scenes":
          this.showScenesWorkspace();
          break;
        case "show-characters":
          this.showCharactersWorkspace();
          break;
        case "show-relationships":
          this.showRelationshipsWorkspace();
          break;
        case "show-locations":
          this.showLocationsWorkspace();
          break;
        case "show-quests":
          this.showQuestsWorkspace();
          break;
        case "show-notes":
          this.showNotesWorkspace();
          break;
        case "show-sessions":
          this.showSessionsWorkspace();
          break;
        case "show-campaign":
          this.showCampaignWorkspace();
          break;
        case "show-export-import":
          this.showExportImportWorkspace();
          break;
        case "show-quick-actions":
          this.sceneManager?.showQuickActionsModal();
          break;
        case "toggle-scene-tree":
          this.toggleSceneTreePanel();
          break;
        // Character actions
        case "add-character":
          this.characterManager?.ui?.showAddCharacterDialog();
          break;
        case "add-npc":
          this.characterManager?.ui?.showAddNPCDialog();
          break;
        case "edit-character":
        case "edit-npc":
          const characterCard = event.target.closest(".card-character");
          const characterId = characterCard?.dataset.characterId;
          if (characterId && this.characterManager?.ui) {
            console.log("🎭 App.js: Edit character action for:", characterId);
            this.characterManager.ui.showEditCharacterDialog(characterId);
          }
          break;
        case "view-character":
        case "view-npc":
          const viewCharacterCard = event.target.closest(".card-character");
          const viewCharacterId = viewCharacterCard?.dataset.characterId;
          if (viewCharacterId && this.characterManager?.ui) {
            this.characterManager.ui.showCharacterDetails(viewCharacterId);
          }
          break;
        case "character-notes":
          const notesCharacterCard = event.target.closest(".card-character");
          const notesCharacterId = notesCharacterCard?.dataset.characterId;
          if (notesCharacterId && this.characterManager?.ui) {
            this.characterManager.ui.showCharacterNotesDialog(notesCharacterId);
          }
          break;
        case "view-relationships":
          this.characterManager?.ui?.switchCharacterDetailTab("relationships");
          break;
        case "view-progression":
          this.characterManager?.ui?.switchCharacterDetailTab("progression");
          break;
        case "switch-tab":
          const tabName = event.target.closest('[data-tab]')?.dataset.tab;
          if (tabName && this.characterManager?.ui) {
            this.characterManager.ui.switchCharacterDetailTab(tabName);
          }
          break;
        case "export-character":
          const exportCharacterId = event.target.closest('[data-character-id]')?.dataset.characterId;
          if (exportCharacterId && this.characterManager?.ui) {
            const { character } = this.characterManager.core.getCharacterById(exportCharacterId);
            if (character) {
              this.characterManager.ui.showCharacterExportDialog(character);
            }
          }
          break;
        case "save-character-notes":
          const notesModal = event.target.closest('.modal-overlay');
          const saveCharacterId = event.target.dataset.characterId;
          if (saveCharacterId && this.characterManager && notesModal) {
            this.characterManager.saveCharacterNotes(saveCharacterId, notesModal);
          }
          break;
      }
    });
  }

  setupPlayerTabs() {
    document.addEventListener("click", (event) => {
      if (event.target.classList.contains("player-tab")) {
        this.handleTabClick(event);
      }
    });
  }

  handleTabClick(event) {
    const clickedTab = event.target;
    const player = clickedTab.dataset.player;
    const currentLocContent = clickedTab.closest(".location-content");

    if (!currentLocContent) return;

    const wrapper = currentLocContent.querySelector(".player-content-wrapper");
    if (!wrapper) return;

    const currentlyActiveTab =
      currentLocContent.querySelector(".player-tab.active");
    const contentToShow = wrapper.querySelector(
      `.player-content[data-player="${player}"]`
    );

    // Toggle behavior: if clicking the active tab, hide content
    if (
      currentlyActiveTab === clickedTab &&
      contentToShow &&
      !contentToShow.classList.contains("hidden")
    ) {
      contentToShow.classList.add("hidden");
      clickedTab.classList.remove("active");
    } else {
      // Hide all content and remove all active states
      wrapper.querySelectorAll(".player-content").forEach((content) => {
        content.classList.add("hidden");
      });

      currentLocContent.querySelectorAll(".player-tab").forEach((tab) => {
        tab.classList.remove("active");
      });

      // Show selected content and set active state
      if (contentToShow) {
        contentToShow.classList.remove("hidden");
      }
      clickedTab.classList.add("active");
    }
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className =
      "fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50";
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  showFatalError(error) {
    const body = document.querySelector("body");
    body.innerHTML = `
      <div class="fatal-error-container">
        <h2>Critical Error</h2>
        <p>The application could not start.</p>
        <p><em>${error.message}</em></p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }

  // --- Workspace Management ---
  showScenesWorkspace() {
    // Use the workspace system properly
    this.switchWorkspace("scenes", "Scenes", "Scene management and overview");
    this.updateMainNavigation("nav-scenes");

    // Hide the redundant workspace header since scene overview has its own
    const workspaceHeader = document.getElementById("workspace-header");
    if (workspaceHeader) {
      workspaceHeader.style.display = "none";
    }

    // Hide the sidebar navigation tree since we're using cards now
    const navTree = document.getElementById("nav-content-tree");
    if (navTree) {
      navTree.classList.add("hidden");
    }

    // Show scene overview in the scenes workspace
    if (this.sceneManager && this.sceneManager.isReady()) {
      this.sceneManager.showSceneOverview();
    } else {
      // Show loading state in scenes-content workspace
      const scenesContent = document.getElementById("scenes-content");
      if (scenesContent) {
        scenesContent.innerHTML = `
          <div class="loading-state">
            <i class="fas fa-magic fa-spin"></i>
            <p>Loading scenes...</p>
          </div>
        `;
      }

      // Try to initialize if not ready
      if (this.sceneManager && !this.sceneManager.isReady()) {
        console.log("🔄 SceneManager not ready, attempting to initialize...");
        this.sceneManager
          .init()
          .then(() => {
            console.log("✅ SceneManager initialized, showing overview");
            this.sceneManager.showSceneOverview();
          })
          .catch((error) => {
            console.error("❌ Failed to initialize SceneManager:", error);
          });
      }
    }
  }

  switchWorkspace(workspaceId, title, subtitle) {
    console.log(`🔄 Switching to workspace: ${workspaceId}`);

    // Clear any content that might be injected directly into content-area
    const contentArea = document.getElementById("content-area");
    if (contentArea) {
      // Find any content that's not in a workspace-content container
      const directChildren = Array.from(contentArea.children);
      directChildren.forEach((child) => {
        if (!child.classList.contains("workspace-content")) {
          console.log(`   🧹 Removing direct content: ${child.className}`);
          child.remove();
        }
      });
    }

    // Hide all workspace content
    document.querySelectorAll(".workspace-content").forEach((content) => {
      content.classList.remove("active");
      console.log(`   Hiding: ${content.id}`);
    });

    // Show target workspace
    const workspace = document.getElementById(workspaceId + "-content");
    if (workspace) {
      workspace.classList.add("active");
      console.log(`   ✅ Showing: ${workspace.id}`);
    } else {
      console.error(`   ❌ Workspace not found: ${workspaceId + "-content"}`);
    }

    // Hide workspace header for all workspaces (redundant UI element)
    const workspaceHeader = document.getElementById("workspace-header");
    if (workspaceHeader) {
      workspaceHeader.style.display = "none";
    }

    // Update header
    const workspaceTitle = document.getElementById("workspace-title");
    const workspaceSubtitle = document.getElementById("workspace-subtitle");

    if (workspaceTitle) {
      workspaceTitle.textContent = title;
    } else {
      console.warn("⚠️ workspace-title element not found");
    }

    if (workspaceSubtitle) {
      workspaceSubtitle.textContent = subtitle;
    } else {
      console.warn("⚠️ workspace-subtitle element not found");
    }

    this.currentWorkspace = workspaceId;
    console.log(`   Current workspace set to: ${this.currentWorkspace}`);
  }

  updateMainNavigation(activeId) {
    // Remove active class from all main nav tabs
    document.querySelectorAll(".main-nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Add active class to the selected tab
    const activeTab = document.getElementById(activeId);
    if (activeTab) {
      activeTab.classList.add("active");
    }
  }

  showMainDashboard() {
    this.switchWorkspace(
      "dashboard",
      "Dashboard",
      "Campaign overview and statistics"
    );
    this.updateMainNavigation("nav-dashboard");
  }

  showCharactersWorkspace() {
    console.log("🎭 Switching to Characters workspace");
    this.switchWorkspace(
      "characters",
      "Character Management",
      "Manage NPCs, player characters, and relationships"
    );
    this.updateMainNavigation("nav-characters");

    // Initialize character tabs
    const tabsHTML = `
      <button class="workspace-tab active" data-tab="npcs">
        <i class="fas fa-mask"></i> NPCs
      </button>
      <button class="workspace-tab" data-tab="players">
        <i class="fas fa-user-friends"></i> Players
      </button>
      <button class="workspace-tab" data-tab="progression">
        <i class="fas fa-chart-line"></i> Progression
      </button>
    `;

    const actionsHTML = `
      <button class="btn btn-primary" onclick="window.campaignManager.characterManager.showAddCharacterDialog()">
        <i class="fas fa-plus"></i> New Character
      </button>
      <button class="btn btn-secondary" onclick="window.campaignManager.characterManager.showProgressionView()">
        <i class="fas fa-chart-line"></i> View Progression
      </button>
    `;

    document.getElementById("workspace-tabs").innerHTML = tabsHTML;
    document.getElementById("workspace-actions").innerHTML = actionsHTML;

    // Load character manager
    const container = document.getElementById("characters-content");
    this.characterManager.render(container);

    // Character manager handles its own tab setup internally
  }

  showRelationshipsWorkspace() {
    console.log("🤝 Switching to Relationships workspace");
    this.switchWorkspace(
      "relationships",
      "Character Relationships",
      "View and manage all character relationships and social dynamics"
    );
    this.updateMainNavigation("nav-relationships");

    // Initialize with relationships matrix interface
    if (this.characterManager && this.characterManager.relationships) {
      const relationshipsContent = document.getElementById("relationships-content");
      if (relationshipsContent) {
        relationshipsContent.innerHTML = 
          this.characterManager.relationships.renderRelationshipsMatrixView();
        
        // Set up event listeners for the matrix view
        this.setupRelationshipsWorkspaceListeners();
      }
    }
  }

  showLocationsWorkspace() {
    console.log("🗺️ Switching to Locations workspace");
    this.switchWorkspace(
      "locations",
      "Location Management",
      "Organize and manage your campaign world"
    );
    this.updateMainNavigation("nav-locations");

    // Initialize location actions
    const actionsHTML = `
      <button class="btn btn-primary" onclick="locationManager.showCreateLocationModal()">
        <i class="fas fa-plus"></i> New Location
      </button>
      <button class="btn btn-secondary" onclick="locationManager.showLocationMapView()">
        <i class="fas fa-map"></i> Map View
      </button>
      <button class="btn btn-secondary" onclick="locationManager.exportLocations()">
        <i class="fas fa-download"></i> Export
      </button>
    `;

    document.getElementById("workspace-tabs").innerHTML = ""; // No tabs for locations
    document.getElementById("workspace-actions").innerHTML = actionsHTML;

    // Load location manager
    const container = document.getElementById("locations-content");
    this.locationManager.render(container);
  }

  showCharacterTab(tabName) {
    // Update tab active states
    document.querySelectorAll(".workspace-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document
      .querySelector(`[data-tab="character-${tabName}"]`)
      ?.classList.add("active");

    const tabContent = document.getElementById("character-tab-content");
    if (!tabContent) return;

    switch (tabName) {
      case "overview":
        if (this.characterManager) {
          this.characterManager.showCharacterOverview();
        }
        break;
      case "arcs":
        if (this.playerArcManager) {
          tabContent.innerHTML =
            this.playerArcManager.generatePlayerArcOverview();
        }
        break;
    }
  }

  showQuestsWorkspace() {
    this.switchWorkspace("quests", "Quests", "Quest tracking and management");
    this.updateMainNavigation("nav-quests");

    // Show quest management content
    if (this.questManager) {
      this.questManager.showQuestManagement();
    }

    // Hide the navigation tree
    const navTree = document.getElementById("nav-content-tree");
    if (navTree) {
      navTree.classList.add("hidden");
    }
  }

  showNotesWorkspace() {
    console.log("📝 showNotesWorkspace called");
    this.switchWorkspace("notes", "Notes", "Notes management and organization");
    this.updateMainNavigation("nav-notes");

    // Show notes management content
    if (this.notesManager) {
      this.notesManager.showNotesManagement();
    }

    // Hide the navigation tree
    const navTree = document.getElementById("nav-content-tree");
    if (navTree) {
      navTree.classList.add("hidden");
    }
  }

  showSessionsWorkspace() {
    console.log("🗓️ showSessionsWorkspace called");
    this.switchWorkspace(
      "sessions",
      "Sessions",
      "Session management and planning"
    );
    this.updateMainNavigation("nav-sessions");

    // Render session management content
    const sessionsContent = document.getElementById("sessions-content");
    if (sessionsContent && this.sessionManager) {
      this.sessionManager.render(sessionsContent);
    }

    // Hide the navigation tree
    const navTree = document.getElementById("nav-content-tree");
    if (navTree) {
      navTree.classList.add("hidden");
    }
  }

  showCampaignWorkspace() {
    console.log("🏛️ showCampaignWorkspace called");

    // Debug: Check all workspace content divs
    const allWorkspaceContent = document.querySelectorAll(".workspace-content");
    console.log(
      "🔍 All workspace-content divs found:",
      allWorkspaceContent.length
    );
    allWorkspaceContent.forEach((div, index) => {
      console.log(`   ${index + 1}. ${div.id} - exists: ${div ? "yes" : "no"}`);
    });

    // Specifically check campaign-content
    const campaignContent = document.getElementById("campaign-content");
    console.log("🔍 campaign-content check:", campaignContent);

    this.switchWorkspace("campaign", "Campaign", "Campaign notes and lore");
    this.updateMainNavigation("nav-campaign");

    // Hide the navigation tree
    const navTree = document.getElementById("nav-content-tree");
    if (navTree) {
      navTree.classList.add("hidden");
    }

    // Load campaign content
    console.log("📊 Loading campaign content...");
    this.loadCampaignContent();
  }

  showExportImportWorkspace() {
    console.log("📦 showExportImportWorkspace called");
    this.switchWorkspace(
      "export-import",
      "Export / Import",
      "Campaign data backup and restore"
    );
    this.updateMainNavigation("nav-export-import");

    // Show export/import panel
    const exportImportContent = document.getElementById(
      "export-import-content"
    );
    if (exportImportContent && this.exportImportPanel) {
      this.exportImportPanel.render(exportImportContent);
    }

    // Hide the navigation tree
    const navTree = document.getElementById("nav-content-tree");
    if (navTree) {
      navTree.classList.add("hidden");
    }
  }

  async loadCampaignContent() {
    console.log("📊 loadCampaignContent called");
    const campaignContent = document.getElementById("campaign-content");
    if (!campaignContent) {
      console.error("❌ campaign-content element not found!");
      return;
    }

    console.log("✅ Found campaign-content element, loading content...");
    console.log("📍 Campaign content element:", campaignContent);

    try {
      // Try to load the new campaign manager
      if (!window.campaignManager) {
        const { campaignManager } = await import(
          "./features/campaigns/campaign-manager.js"
        );
        window.campaignManager = campaignManager;
      }

      const workspaceHtml =
        await window.campaignManager.renderCampaignWorkspace();
      campaignContent.innerHTML = workspaceHtml;
      console.log("✅ Campaign content loaded with new manager!");
      return;
    } catch (error) {
      console.warn("⚠️ Campaign manager failed, using fallback:", error);
      // Fall back to static content
    }
  }

  editCampaignTitle(element) {
    const currentTitle = element.textContent.trim();
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentTitle;
    input.className = "campaign-title-edit";
    input.style.cssText = `
      background: transparent;
      border: 2px solid var(--cm-primary);
      color: var(--cm-primary);
      font-size: 1.25rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      outline: none;
    `;

    element.replaceWith(input);
    input.focus();
    input.select();

    const saveTitle = () => {
      const newTitle = input.value.trim() || "D&D Campaign";
      const newElement = document.createElement("h1");
      newElement.className = "campaign-title";
      newElement.setAttribute("data-action", "edit-campaign-title");
      newElement.title = "Click to edit campaign title";
      newElement.innerHTML = `<i class="fas fa-dragon"></i> ${newTitle}`;
      input.replaceWith(newElement);
    };

    input.addEventListener("blur", saveTitle);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveTitle();
      }
    });
  }

  setupRelationshipsWorkspaceListeners() {
    console.log("🤝 Setting up relationships workspace event listeners");
    
    const relationshipsContent = document.getElementById("relationships-content");
    if (!relationshipsContent) return;

    // Handle Add Relationship button clicks in the matrix view
    const addRelationshipBtns = relationshipsContent.querySelectorAll('[data-action="add-relationship"]');
    addRelationshipBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const fromCharacterId = btn.dataset.fromCharacterId;
        this.characterManager.showAddRelationshipDialog(fromCharacterId);
      });
    });

    console.log("🤝 Relationships workspace event listeners setup complete");
  }

  toggleSceneTreePanel() {
    const panel = document.getElementById("scene-tree-panel");
    if (panel) {
      panel.classList.toggle("visible");
      panel.classList.toggle("hidden");
    }
  }
}

// --- Application Entry Point ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM Content Loaded - Starting Campaign Manager");
  try {
    const campaignManager = new CampaignManager();
    window.campaignManager = campaignManager; // Make it globally accessible for debugging

    // Expose managers globally for onclick handlers
    window.playerArcManager = campaignManager.playerArcManager;

    console.log("✅ Campaign Manager created, starting initialization...");
    campaignManager.init();
  } catch (error) {
    console.error("❌ Fatal error during Campaign Manager startup:", error);
  }
});