/**
 * LocationManager - Coordinator for location management
 * Orchestrates LocationCore and LocationUI modules
 * Provides clean public API for location functionality
 */
import LocationCore from "./location-core.js";
import LocationUI from "./location-ui.js";
import { DataManager } from "../../data-manager.js";

export default class LocationManager {
  constructor(
    apiService = null,
    dataManager = null
  ) {
    this.dataManager = dataManager || new DataManager();
    this.core = new LocationCore(this.dataManager.currentCampaignId);
    this.ui = new LocationUI(this.core);
    this.initialized = false;

    // Legacy compatibility
    this.apiService = apiService;
    this.campaignId = this.dataManager.currentCampaignId;
  }

  /**
   * Initialize the Location Manager
   */
  async init() {
    try {
      console.log("🗺️ LocationManager: Initializing...");

      await this.core.init();
      this.initialized = true;

      console.log("✅ LocationManager: Initialized successfully");
    } catch (error) {
      console.error("❌ LocationManager: Initialization failed:", error);
      throw error;
    }
  }

  // ===========================================
  // PUBLIC API - Core Operations
  // ===========================================

  /**
   * Render the location management interface
   * @param {HTMLElement} container - Container element to render into
   */
  render(container) {
    if (!this.isInitialized()) {
      console.warn(
        "LocationManager not initialized, attempting to initialize..."
      );
      this.init()
        .then(() => {
          this.ui.render(container);
        })
        .catch((error) => {
          console.error("Failed to initialize LocationManager:", error);
          container.innerHTML = `<div class="error">Failed to load location manager</div>`;
        });
      return;
    }

    this.ui.render(container);
  }

  /**
   * Get a location by ID
   * @param {string} locationId - The location's unique identifier
   * @returns {Object|null} Location data
   */
  getLocation(locationId) {
    return this.core.getLocation(locationId);
  }

  /**
   * Get all locations
   * @returns {Array} Array of all locations
   */
  getAllLocations() {
    return this.core.getAllLocations();
  }

  /**
   * Get root locations
   * @returns {Array} Array of root locations
   */
  getRootLocations() {
    return this.core.getRootLocations();
  }

  /**
   * Get location hierarchy
   * @returns {Map} Location hierarchy map
   */
  getLocationHierarchy() {
    return this.core.getLocationHierarchy();
  }

  /**
   * Create a new location
   * @param {Object} locationData - Location data
   * @returns {Promise<Object>} Created location
   */
  async createLocation(locationData) {
    return await this.core.createLocation(locationData);
  }

  /**
   * Update an existing location
   * @param {string} locationId - The location's unique identifier
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated location
   */
  async updateLocation(locationId, updates) {
    return await this.core.updateLocation(locationId, updates);
  }

  /**
   * Delete a location
   * @param {string} locationId - The location's unique identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteLocation(locationId) {
    // Check if location can be deleted
    if (!this.core.canDeleteLocation(locationId)) {
      const location = this.core.getLocation(locationId);
      const children = this.core.getLocationChildren(locationId);
      this.ui.showError(
        `Cannot delete "${location.name}" because it has ${children.length} child location(s). Please delete or move the child locations first.`
      );
      return false;
    }

    // Confirm deletion
    const location = this.core.getLocation(locationId);
    if (
      !confirm(
        `Are you sure you want to delete "${location.name}"? This action cannot be undone.`
      )
    ) {
      return false;
    }

    try {
      await this.core.deleteLocation(locationId);

      // Refresh UI
      this.ui.renderLocationList();
      this.ui.updateLocationStats();

      // Clear details if this location was selected
      if (
        this.ui.currentLocation &&
        this.ui.currentLocation.id === locationId
      ) {
        const detailsContainer = document.getElementById("location-details");
        if (detailsContainer) {
          detailsContainer.innerHTML = `
            <div class="no-location-selected">
              <div class="empty-state">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Select a Location</h3>
                <p>Choose a location from the list to view and edit its details</p>
              </div>
            </div>
          `;
        }
        this.ui.currentLocation = null;
      }

      this.ui.showSuccess("Location deleted successfully!");
      return true;
    } catch (error) {
      console.error("Error deleting location:", error);
      this.ui.showError("Failed to delete location: " + error.message);
      return false;
    }
  }

  // ===========================================
  // PUBLIC API - UI Operations
  // ===========================================

  /**
   * Show modal for creating a new location
   * @param {string} parentId - Optional parent location ID
   */
  showCreateLocationModal(parentId = null) {
    this.ui.showCreateLocationModal(parentId);
  }

  /**
   * Edit a location
   * @param {string} locationId - The location's unique identifier
   */
  editLocation(locationId) {
    this.ui.showEditLocationModal(locationId);
  }

  /**
   * Select a location and show its details
   * @param {string} locationId - The location's unique identifier
   */
  selectLocation(locationId) {
    this.ui.selectLocation(locationId);
  }

  /**
   * Toggle a location node's expanded state
   * @param {string} locationId - The location's unique identifier
   */
  toggleLocationNode(locationId) {
    this.ui.toggleLocationNode(locationId);
  }

  // ===========================================
  // PUBLIC API - Search & Filter
  // ===========================================

  /**
   * Search locations by text
   * @param {string} searchTerm - Text to search for
   * @returns {Array} Matching locations
   */
  searchLocations(searchTerm) {
    return this.core.searchLocations(searchTerm);
  }

  /**
   * Get locations by type
   * @param {string} locationType - Type to filter by
   * @returns {Array} Filtered locations
   */
  getLocationsByType(locationType) {
    return this.core.getLocationsByType(locationType);
  }

  /**
   * Filter locations by search term (UI)
   * @param {string} searchTerm - Text to search for
   */
  filterLocations(searchTerm) {
    this.ui.filterLocations(searchTerm);
  }

  /**
   * Filter locations by type (UI)
   * @param {string} locationType - Type to filter by
   */
  filterLocationsByType(locationType) {
    this.ui.filterLocationsByType(locationType);
  }

  // ===========================================
  // PUBLIC API - Analytics & Export
  // ===========================================

  /**
   * Get location statistics
   * @returns {Object} Location statistics
   */
  getLocationStats() {
    return this.core.getLocationStats();
  }

  /**
   * Export locations
   * @param {string} locationId - Optional specific location ID
   */
  exportLocations(locationId = null) {
    const exportData = this.core.exportLocationData(locationId);
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `campaign-locations-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.ui.showSuccess("Locations exported successfully!");
  }

  /**
   * Show location map view
   */
  showLocationMapView() {
    this.ui.showInfo("Location map view coming soon!");
  }

  // ===========================================
  // PUBLIC API - Hierarchy Operations
  // ===========================================

  /**
   * Get location children
   * @param {string} locationId - The parent location's ID
   * @returns {Array} Array of child locations
   */
  getLocationChildren(locationId) {
    return this.core.getLocationChildren(locationId);
  }

  /**
   * Get location path (breadcrumb)
   * @param {string} locationId - The location's unique identifier
   * @returns {Array} Array of locations from root to target
   */
  getLocationPath(locationId) {
    return this.core.getLocationPath(locationId);
  }

  /**
   * Get location siblings
   * @param {string} locationId - The reference location's ID
   * @returns {Array} Array of sibling locations
   */
  getLocationSiblings(locationId) {
    return this.core.getLocationSiblings(locationId);
  }

  /**
   * Get location descendants
   * @param {string} locationId - The parent location's ID
   * @returns {Array} Array of all descendant locations
   */
  getLocationDescendants(locationId) {
    return this.core.getLocationDescendants(locationId);
  }

  // ===========================================
  // PUBLIC API - Validation & Utilities
  // ===========================================

  /**
   * Validate location data
   * @param {Object} locationData - Location data to validate
   * @returns {Array} Array of validation errors
   */
  validateLocationData(locationData) {
    return this.core.validateLocationData(locationData);
  }

  /**
   * Check if a location can be deleted
   * @param {string} locationId - The location's unique identifier
   * @returns {boolean} True if location can be deleted
   */
  canDeleteLocation(locationId) {
    return this.core.canDeleteLocation(locationId);
  }

  /**
   * Get location icon based on type
   * @param {string} locationType - The location type
   * @returns {string} Font Awesome icon class
   */
  getLocationIcon(locationType) {
    return this.core.getLocationIcon(locationType);
  }

  // ===========================================
  // PUBLIC API - Data Management
  // ===========================================

  /**
   * Refresh data from API
   * @returns {Promise<Array>} Updated locations
   */
  async refresh() {
    const locations = await this.core.refresh();

    // Refresh UI if rendered
    if (this.ui && document.getElementById("location-tree")) {
      this.ui.renderLocationList();
      this.ui.updateLocationStats();
    }

    return locations;
  }

  /**
   * Reload locations and rebuild hierarchy
   */
  async loadLocations() {
    return await this.core.loadLocations();
  }

  /**
   * Build location hierarchy
   */
  buildLocationHierarchy() {
    this.core.buildLocationHierarchy();
  }

  /**
   * Check if system is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized && this.core.isInitialized();
  }

  // ===========================================
  // INTEGRATION METHODS
  // ===========================================

  /**
   * Get location summary for dashboard
   * @returns {Object} Summary data for dashboard display
   */
  getDashboardSummary() {
    const stats = this.getLocationStats();
    const recentLocations = this.getAllLocations()
      .sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at) -
          new Date(a.updated_at || a.created_at)
      )
      .slice(0, 5);

    return {
      totalLocations: stats.total,
      locationsByType: stats.byType,
      recentLocations: recentLocations,
      hierarchyDepth: this.calculateHierarchyDepth(),
    };
  }

  /**
   * Calculate maximum hierarchy depth
   * @returns {number} Maximum depth of location hierarchy
   */
  calculateHierarchyDepth() {
    let maxDepth = 0;

    const calculateDepth = (locationId, currentDepth = 0) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      const children = this.getLocationChildren(locationId);
      children.forEach((child) => {
        calculateDepth(child.id, currentDepth + 1);
      });
    };

    this.getRootLocations().forEach((root) => {
      calculateDepth(root.id, 1);
    });

    return maxDepth;
  }

  /**
   * Handle navigation to locations section
   */
  handleNavigation() {
    if (!this.isInitialized()) {
      console.warn(
        "LocationManager not initialized, attempting to initialize..."
      );
      this.init().catch((error) => {
        console.error("Failed to initialize LocationManager:", error);
      });
      return;
    }

    // If already rendered, just refresh
    const container = document.getElementById("location-tree");
    if (container) {
      this.ui.renderLocationList();
      this.ui.updateLocationStats();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.initialized = false;
    this.ui.currentLocation = null;
    this.ui.expandedNodes.clear();
    console.log("🗺️ LocationManager: Destroyed");
  }

  // ===========================================
  // LEGACY COMPATIBILITY METHODS
  // ===========================================

  /**
   * Legacy method compatibility
   */
  get locations() {
    return this.core.getAllLocations();
  }

  get currentLocation() {
    return this.ui.currentLocation;
  }

  get locationHierarchy() {
    return this.core.getLocationHierarchy();
  }

  /**
   * Legacy render location list method
   */
  renderLocationList() {
    this.ui.renderLocationList();
  }

  /**
   * Legacy update stats method
   */
  updateLocationStats() {
    this.ui.updateLocationStats();
  }

  /**
   * Legacy show success message
   * @param {string} message - Success message
   */
  showSuccessMessage(message) {
    this.ui.showSuccess(message);
  }

  /**
   * Legacy show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.ui.showError(message);
  }

  /**
   * Legacy show info message
   * @param {string} message - Info message
   */
  showInfo(message) {
    this.ui.showInfo(message);
  }
}
