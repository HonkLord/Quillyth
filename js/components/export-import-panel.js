/**
 * Export/Import Panel Component
 * Provides UI for campaign data export and import functionality
 */

import ExportImportService from "../services/export-import-service.js";
import { DataManager } from "../data-manager.js";

class ExportImportPanel {
  constructor() {
    this.exportImportService = new ExportImportService();
    this.dataManager = new DataManager();
    this.currentCampaignId = null;
  }

  /**
   * Initialize the export/import panel
   */
  async initialize() {
    await this.dataManager.loadCurrentCampaign();
    this.currentCampaignId = this.dataManager.currentCampaignId;
    this.createPanel();
    this.attachEventListeners();
  }

  /**
   * Set the current campaign ID
   * @param {string} campaignId
   */
  setCampaignId(campaignId) {
    this.currentCampaignId = campaignId;
    this.updateCampaignDisplay();
  }

  /**
   * Create the export/import panel UI
   */
  createPanel() {
    const panel = document.createElement("div");
    panel.id = "export-import-panel";
    panel.className = "export-import-panel";
    panel.innerHTML = `
      <div class="panel-header">
        <h2>📦 Export / Import Campaign Data</h2>
        <p class="panel-description">
          Backup your campaign data or import data from another campaign.
        </p>
      </div>

      <div class="panel-content">
        <!-- Current Campaign Info -->
        <div class="current-campaign-section">
          <h3>Current Campaign</h3>
          <div class="campaign-info" id="current-campaign-info">
            <div class="loading">Loading campaign information...</div>
          </div>
        </div>

        <!-- Export Section -->
        <div class="export-section">
          <h3>🔄 Export Campaign</h3>
          <p class="section-description">
            Export all campaign data to a JSON file that can be imported later or shared with others.
          </p>
          
          <div class="export-controls">
            <button id="export-campaign-btn" class="btn btn-primary">
              <span class="btn-icon">📤</span>
              Export Campaign Data
            </button>
            <button id="preview-export-btn" class="btn btn-secondary">
              <span class="btn-icon">👁️</span>
              Preview Export
            </button>
          </div>

          <div class="export-info">
            <h4>What gets exported:</h4>
            <ul class="export-items">
              <li>📝 All sessions and session notes</li>
              <li>🗺️ All locations and location details</li>
              <li>🎭 All scenes with setup and DM notes</li>
              <li>👥 All NPCs and character relationships</li>
              <li>🎲 All player characters and their data</li>
              <li>⚔️ All quests and quest progress</li>
              <li>📋 All notes and documentation</li>
              <li>🔗 All relationships and connections</li>
            </ul>
          </div>
        </div>

        <!-- Import Section -->
        <div class="import-section">
          <h3>📥 Import Campaign</h3>
          <p class="section-description">
            Import campaign data from a previously exported JSON file. This will create a new campaign.
          </p>

          <div class="import-controls">
            <div class="file-input-container">
              <input type="file" id="import-file-input" accept=".json" style="display: none;">
              <button id="select-file-btn" class="btn btn-secondary">
                <span class="btn-icon">📁</span>
                Select Import File
              </button>
              <span id="selected-file-name" class="selected-file"></span>
            </div>
            
            <button id="import-campaign-btn" class="btn btn-primary" disabled>
              <span class="btn-icon">📥</span>
              Import Campaign Data
            </button>
          </div>

          <div class="import-warnings">
            <div class="warning-box">
              <h4>⚠️ Important Notes:</h4>
              <ul>
                <li>Import creates a <strong>new campaign</strong> - it won't overwrite existing data</li>
                <li>If a campaign with the same ID exists, import will fail</li>
                <li>Only import files exported from this Campaign Manager</li>
                <li>Large campaigns may take a few moments to import</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Recent Operations -->
        <div class="recent-operations-section">
          <h3>📊 Export/Import History</h3>
          <div id="recent-operations" class="recent-operations">
            <p class="no-operations">No recent export/import operations</p>
          </div>
        </div>
      </div>
    `;

    return panel;
  }

  /**
   * Render the panel in the specified container
   * @param {HTMLElement} container
   */
  render(container) {
    const panel = this.createPanel();
    container.innerHTML = "";
    container.appendChild(panel);

    this.attachEventListeners();
    this.loadCampaignInfo();
    this.loadRecentOperations();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Export buttons
    const exportBtn = document.getElementById("export-campaign-btn");
    const previewBtn = document.getElementById("preview-export-btn");

    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.handleExport());
    }

    if (previewBtn) {
      previewBtn.addEventListener("click", () => this.handlePreviewExport());
    }

    // Import controls
    const selectFileBtn = document.getElementById("select-file-btn");
    const fileInput = document.getElementById("import-file-input");
    const importBtn = document.getElementById("import-campaign-btn");

    if (selectFileBtn && fileInput) {
      selectFileBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => this.handleFileSelection(e));
    }

    if (importBtn) {
      importBtn.addEventListener("click", () => this.handleImport());
    }
  }

  /**
   * Load current campaign information
   */
  async loadCampaignInfo() {
    try {
      const summary = await this.exportImportService.getExportSummary(
        this.currentCampaignId
      );
      this.displayCampaignInfo(summary);
    } catch (error) {
      console.error("Error loading campaign info:", error);
      this.displayCampaignError();
    }
  }

  /**
   * Display campaign information
   * @param {Object} summary
   */
  displayCampaignInfo(summary) {
    const container = document.getElementById("current-campaign-info");
    if (!container) return;

    const stats = summary.stats;
    const totalItems = Object.values(stats).reduce(
      (sum, count) => sum + count,
      0
    );

    container.innerHTML = `
      <div class="campaign-details">
        <div class="campaign-header">
          <h4>${summary.campaign.name || "Unknown Campaign"}</h4>
          <span class="campaign-id">ID: ${summary.campaign.id}</span>
        </div>
        
        <div class="campaign-stats">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">${stats.sessions}</span>
              <span class="stat-label">Sessions</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${stats.locations}</span>
              <span class="stat-label">Locations</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${stats.scenes}</span>
              <span class="stat-label">Scenes</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${stats.characters}</span>
              <span class="stat-label">Characters</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${stats.players}</span>
              <span class="stat-label">Players</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${stats.quests}</span>
              <span class="stat-label">Quests</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${stats.notes}</span>
              <span class="stat-label">Notes</span>
            </div>
            <div class="stat-item total">
              <span class="stat-number">${totalItems}</span>
              <span class="stat-label">Total Items</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Display campaign error
   */
  displayCampaignError() {
    const container = document.getElementById("current-campaign-info");
    if (!container) return;

    container.innerHTML = `
      <div class="campaign-error">
        <p>❌ Unable to load campaign information</p>
        <p>Campaign ID: ${this.currentCampaignId}</p>
      </div>
    `;
  }

  /**
   * Update campaign display when campaign ID changes
   */
  updateCampaignDisplay() {
    this.loadCampaignInfo();
  }

  /**
   * Handle export button click
   */
  async handleExport() {
    await this.exportImportService.exportCampaign(this.currentCampaignId);
    this.addRecentOperation("export", this.currentCampaignId);
  }

  /**
   * Handle preview export button click
   */
  async handlePreviewExport() {
    try {
      const summary = await this.exportImportService.getExportSummary(
        this.currentCampaignId
      );
      await this.exportImportService.showExportConfirmation(summary);
    } catch (error) {
      this.exportImportService.showErrorMessage(
        `Preview failed: ${error.message}`
      );
    }
  }

  /**
   * Handle file selection for import
   * @param {Event} event
   */
  handleFileSelection(event) {
    const file = event.target.files[0];
    const fileNameSpan = document.getElementById("selected-file-name");
    const importBtn = document.getElementById("import-campaign-btn");

    if (file) {
      fileNameSpan.textContent = file.name;
      fileNameSpan.style.display = "inline";
      importBtn.disabled = false;
      this.selectedFile = file;
    } else {
      fileNameSpan.textContent = "";
      fileNameSpan.style.display = "none";
      importBtn.disabled = true;
      this.selectedFile = null;
    }
  }

  /**
   * Handle import button click
   */
  async handleImport() {
    if (!this.selectedFile) {
      this.exportImportService.showErrorMessage(
        "Please select a file to import"
      );
      return;
    }

    await this.exportImportService.importCampaign(this.selectedFile);
    this.addRecentOperation("import", this.selectedFile.name);

    // Reset file selection
    const fileInput = document.getElementById("import-file-input");
    const fileNameSpan = document.getElementById("selected-file-name");
    const importBtn = document.getElementById("import-campaign-btn");

    if (fileInput) fileInput.value = "";
    if (fileNameSpan) {
      fileNameSpan.textContent = "";
      fileNameSpan.style.display = "none";
    }
    if (importBtn) importBtn.disabled = true;
    this.selectedFile = null;
  }

  /**
   * Load recent operations from localStorage
   */
  loadRecentOperations() {
    const operations = this.getRecentOperations();
    const container = document.getElementById("recent-operations");

    if (!container) return;

    if (operations.length === 0) {
      container.innerHTML =
        '<p class="no-operations">No recent export/import operations</p>';
      return;
    }

    container.innerHTML = `
      <div class="operations-list">
        ${operations
          .map(
            (op) => `
          <div class="operation-item">
            <div class="operation-icon">${
              op.type === "export" ? "📤" : "📥"
            }</div>
            <div class="operation-details">
              <div class="operation-type">${
                op.type === "export" ? "Export" : "Import"
              }</div>
              <div class="operation-target">${op.target}</div>
              <div class="operation-time">${new Date(
                op.timestamp
              ).toLocaleString()}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  /**
   * Add a recent operation
   * @param {string} type - 'export' or 'import'
   * @param {string} target - Campaign ID or filename
   */
  addRecentOperation(type, target) {
    const operations = this.getRecentOperations();
    operations.unshift({
      type,
      target,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 10 operations
    const recentOps = operations.slice(0, 10);
    localStorage.setItem(
      "campaign-export-import-history",
      JSON.stringify(recentOps)
    );

    this.loadRecentOperations();
  }

  /**
   * Get recent operations from localStorage
   * @returns {Array}
   */
  getRecentOperations() {
    try {
      const stored = localStorage.getItem("campaign-export-import-history");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading recent operations:", error);
      return [];
    }
  }
}

export default ExportImportPanel;
