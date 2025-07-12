/**
 * Export/Import Service
 * Handles campaign data export and import functionality
 */

class ExportImportService {
  constructor() {
    this.apiBaseUrl = "/api";
  }

  /**
   * Export campaign data
   * @param {string} campaignId - Campaign to export
   * @returns {Promise<void>}
   */
  async exportCampaign(campaignId) {
    try {
      // Get export summary first
      const summary = await this.getExportSummary(campaignId);

      // Show confirmation dialog
      const confirmed = await this.showExportConfirmation(summary);
      if (!confirmed) return;

      // Show loading state
      this.showLoadingState("Exporting campaign data...");

      // Trigger download
      const response = await fetch(`${this.apiBaseUrl}/export/${campaignId}`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the filename from headers
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `campaign_${campaignId}_${
        new Date().toISOString().split("T")[0]
      }.json`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.hideLoadingState();
      this.showSuccessMessage("Campaign exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      this.hideLoadingState();
      this.showErrorMessage(`Export failed: ${error.message}`);
    }
  }

  /**
   * Import campaign data
   * @param {File} file - JSON file to import
   * @returns {Promise<void>}
   */
  async importCampaign(file) {
    try {
      // Validate file
      if (!file || file.type !== "application/json") {
        throw new Error("Please select a valid JSON file");
      }

      this.showLoadingState("Reading campaign data...");

      // Read file content
      const fileContent = await this.readFileAsText(file);
      let importData;

      try {
        importData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error("Invalid JSON file format");
      }

      // Validate import data structure
      this.validateImportData(importData);

      // Show import confirmation
      const confirmed = await this.showImportConfirmation(importData);
      if (!confirmed) {
        this.hideLoadingState();
        return;
      }

      this.showLoadingState("Importing campaign data...");

      // Send import request
      const response = await fetch(`${this.apiBaseUrl}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      this.hideLoadingState();
      this.showImportSuccess(result);
    } catch (error) {
      console.error("Import error:", error);
      this.hideLoadingState();
      this.showErrorMessage(`Import failed: ${error.message}`);
    }
  }

  /**
   * Get export summary for a campaign
   * @param {string} campaignId
   * @returns {Promise<Object>}
   */
  async getExportSummary(campaignId) {
    const response = await fetch(
      `${this.apiBaseUrl}/export-summary/${campaignId}`
    );
    if (!response.ok) {
      throw new Error("Failed to get export summary");
    }
    return await response.json();
  }

  /**
   * Validate import data structure
   * @param {Object} importData
   */
  validateImportData(importData) {
    if (!importData.metadata) {
      throw new Error("Missing metadata in import file");
    }

    if (!importData.campaign) {
      throw new Error("Missing campaign data in import file");
    }

    if (!importData.campaign.id) {
      throw new Error("Missing campaign ID in import file");
    }

    // Check version compatibility
    const supportedVersions = ["1.0.0"];
    if (!supportedVersions.includes(importData.metadata.version)) {
      throw new Error(
        `Unsupported file version: ${importData.metadata.version}`
      );
    }
  }

  /**
   * Read file as text
   * @param {File} file
   * @returns {Promise<string>}
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  /**
   * Show export confirmation dialog
   * @param {Object} summary
   * @returns {Promise<boolean>}
   */
  async showExportConfirmation(summary) {
    const stats = summary.stats;
    const totalItems = Object.values(stats).reduce(
      (sum, count) => sum + count,
      0
    );

    const message = `
      <div class="export-confirmation">
        <h3>Export Campaign: ${summary.campaign.name || "Unknown Campaign"}</h3>
        <p>This will export the following data:</p>
        <ul class="export-stats">
          <li>📝 ${stats.sessions} Sessions</li>
          <li>🗺️ ${stats.locations} Locations</li>
          <li>🎭 ${stats.scenes} Scenes</li>
          <li>👥 ${stats.characters} Characters</li>
          <li>🎲 ${stats.players} Players</li>
          <li>⚔️ ${stats.quests} Quests</li>
          <li>📋 ${stats.notes} Notes</li>
        </ul>
        <p><strong>Total: ${totalItems} items</strong></p>
        <p>Continue with export?</p>
      </div>
    `;

    return this.showConfirmDialog("Export Campaign", message);
  }

  /**
   * Show import confirmation dialog
   * @param {Object} importData
   * @returns {Promise<boolean>}
   */
  async showImportConfirmation(importData) {
    const stats = {
      sessions: importData.sessions?.length || 0,
      locations: importData.locations?.length || 0,
      scenes: importData.scenes?.length || 0,
      characters: importData.characters?.length || 0,
      players: importData.players?.length || 0,
      quests: importData.quests?.length || 0,
      notes: importData.notes?.length || 0,
    };

    const totalItems = Object.values(stats).reduce(
      (sum, count) => sum + count,
      0
    );

    const message = `
      <div class="import-confirmation">
        <h3>Import Campaign: ${importData.metadata.campaignName}</h3>
        <p><strong>Campaign ID:</strong> ${importData.campaign.id}</p>
        <p><strong>Exported:</strong> ${new Date(
          importData.metadata.exportedAt
        ).toLocaleString()}</p>
        <p>This will import the following data:</p>
        <ul class="import-stats">
          <li>📝 ${stats.sessions} Sessions</li>
          <li>🗺️ ${stats.locations} Locations</li>
          <li>🎭 ${stats.scenes} Scenes</li>
          <li>👥 ${stats.characters} Characters</li>
          <li>🎲 ${stats.players} Players</li>
          <li>⚔️ ${stats.quests} Quests</li>
          <li>📋 ${stats.notes} Notes</li>
        </ul>
        <p><strong>Total: ${totalItems} items</strong></p>
        <div class="import-warning">
          <p>⚠️ <strong>Warning:</strong> This will create a new campaign. If a campaign with this ID already exists, the import will fail.</p>
        </div>
        <p>Continue with import?</p>
      </div>
    `;

    return this.showConfirmDialog("Import Campaign", message);
  }

  /**
   * Show import success message
   * @param {Object} result
   */
  showImportSuccess(result) {
    const stats = result.stats;
    const totalItems = Object.values(stats).reduce(
      (sum, count) => sum + count,
      0
    );

    const message = `
      <div class="import-success">
        <h3>✅ Import Successful!</h3>
        <p><strong>Campaign ID:</strong> ${result.campaignId}</p>
        <p><strong>Imported:</strong> ${new Date(
          result.importedAt
        ).toLocaleString()}</p>
        <p>Successfully imported:</p>
        <ul class="import-results">
          <li>📝 ${stats.sessions} Sessions</li>
          <li>🗺️ ${stats.locations} Locations</li>
          <li>🎭 ${stats.scenes} Scenes</li>
          <li>👥 ${stats.characters} Characters</li>
          <li>🎲 ${stats.players} Players</li>
          <li>⚔️ ${stats.quests} Quests</li>
          <li>📋 ${stats.notes} Notes</li>
          <li>🔗 ${stats.sceneCharacters} Scene Character Links</li>
        </ul>
        <p><strong>Total: ${totalItems} items imported</strong></p>
      </div>
    `;

    this.showSuccessDialog("Import Complete", message);
  }

  /**
   * Show confirmation dialog
   * @param {string} title
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  showConfirmDialog(title, message) {
    return new Promise((resolve) => {
      const modal = this.createModal(title, message, [
        {
          text: "Cancel",
          class: "btn-secondary",
          action: () => resolve(false),
        },
        {
          text: "Confirm",
          class: "btn-primary",
          action: () => resolve(true),
        },
      ]);
      document.body.appendChild(modal);
    });
  }

  /**
   * Show success dialog
   * @param {string} title
   * @param {string} message
   */
  showSuccessDialog(title, message) {
    const modal = this.createModal(title, message, [
      {
        text: "OK",
        class: "btn-primary",
        action: () => document.body.removeChild(modal),
      },
    ]);
    document.body.appendChild(modal);
  }

  /**
   * Create modal dialog
   * @param {string} title
   * @param {string} message
   * @param {Array} buttons
   * @returns {HTMLElement}
   */
  createModal(title, message, buttons) {
    const modal = document.createElement("div");
    modal.className = "modal export-import-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
        </div>
        <div class="modal-body">
          ${message}
        </div>
        <div class="modal-footer">
          ${buttons
            .map(
              (btn) => `
            <button class="btn ${
              btn.class
            }" data-action="${btn.text.toLowerCase()}">
              ${btn.text}
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    // Add event listeners
    buttons.forEach((btn) => {
      const buttonEl = modal.querySelector(
        `[data-action="${btn.text.toLowerCase()}"]`
      );
      buttonEl.addEventListener("click", () => {
        document.body.removeChild(modal);
        btn.action();
      });
    });

    // Close on background click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        if (buttons[0]) buttons[0].action(); // Default to first button (usually cancel)
      }
    });

    return modal;
  }

  /**
   * Show loading state
   * @param {string} message
   */
  showLoadingState(message) {
    const existing = document.querySelector(".export-import-loading");
    if (existing) existing.remove();

    const loading = document.createElement("div");
    loading.className = "export-import-loading";
    loading.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(loading);
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const loading = document.querySelector(".export-import-loading");
    if (loading) {
      loading.remove();
    }
  }

  /**
   * Show success message
   * @param {string} message
   */
  showSuccessMessage(message) {
    this.showToast(message, "success");
  }

  /**
   * Show error message
   * @param {string} message
   */
  showErrorMessage(message) {
    this.showToast(message, "error");
  }

  /**
   * Show toast notification
   * @param {string} message
   * @param {string} type
   */
  showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === "success" ? "✅" : "❌"}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);

    // Click to dismiss
    toast.addEventListener("click", () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }
}

// Export for use in other modules
export default ExportImportService;
