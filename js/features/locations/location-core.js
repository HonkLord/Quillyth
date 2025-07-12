/**
 * LocationCore - Data management and CRUD operations for locations
 * Handles API calls, data loading, hierarchy building, and basic location operations
 */
import { DataManager } from "../../data-manager.js";

export default class LocationCore {
  constructor() {
    this.apiBase = "/api";
    this.dataManager = new DataManager();
    this.campaignId = null;
    this.locations = [];
    this.locationHierarchy = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the Location Core
   */
  async init() {
    console.log("🗺️ LocationCore: Initializing...");

    try {
      await this.dataManager.loadCurrentCampaign();
      this.campaignId = this.dataManager.currentCampaignId;
      await this.loadLocations();
      this.buildLocationHierarchy();
      this.initialized = true;
      console.log("✅ LocationCore: Initialized successfully");
    } catch (error) {
      console.error("❌ LocationCore: Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Load all locations from the API
   */
  async loadLocations() {
    try {
      console.log("🔄 Loading locations from API...");

      const response = await fetch(`${this.apiBase}/locations?campaign_id=${this.campaignId}`);
      if (!response.ok) {
        throw new Error(`Failed to load locations: ${response.status}`);
      }

      this.locations = await response.json();
      console.log(`📍 Loaded ${this.locations.length} locations`);
      return this.locations;
    } catch (error) {
      console.error("❌ Error loading locations:", error);
      this.locations = [];
      return [];
    }
  }

  /**
   * Build location hierarchy for tree view
   */
  buildLocationHierarchy() {
    this.locationHierarchy.clear();

    // First pass: create all nodes
    this.locations.forEach((location) => {
      this.locationHierarchy.set(location.id, {
        ...location,
        children: [],
      });
    });

    // Second pass: build parent-child relationships
    this.locations.forEach((location) => {
      if (location.parent_id) {
        const parent = this.locationHierarchy.get(location.parent_id);
        const child = this.locationHierarchy.get(location.id);
        if (parent && child) {
          parent.children.push(child);
        }
      }
    });

    console.log(`🌳 Built hierarchy with ${this.locationHierarchy.size} nodes`);
  }

  /**
   * Get a location by ID
   * @param {string} locationId - The location's unique identifier
   * @returns {Object|null} Location data or null if not found
   */
  getLocation(locationId) {
    return this.locations.find((loc) => loc.id === locationId) || null;
  }

  /**
   * Get all locations
   * @returns {Array} Array of all location objects
   */
  getAllLocations() {
    return this.locations;
  }

  /**
   * Get root locations (no parent)
   * @returns {Array} Array of root location objects sorted by name
   */
  getRootLocations() {
    return Array.from(this.locationHierarchy.values())
      .filter((location) => !location.parent_id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get location hierarchy
   * @returns {Map} Location hierarchy map
   */
  getLocationHierarchy() {
    return this.locationHierarchy;
  }

  /**
   * Get children of a location
   * @param {string} locationId - The parent location's ID
   * @returns {Array} Array of child locations
   */
  getLocationChildren(locationId) {
    const location = this.locationHierarchy.get(locationId);
    return location ? location.children : [];
  }

  /**
   * Create a new location
   * @param {Object} locationData - Location data
   * @returns {Promise<Object>} Created location
   */
  async createLocation(locationData) {
    try {
      console.log("🔄 Creating new location...");

      const response = await fetch(`${this.apiBase}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...locationData,
          campaign_id: this.campaignId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create location: ${response.status}`);
      }

      const newLocation = await response.json();

      // Refresh data
      await this.loadLocations();
      this.buildLocationHierarchy();

      console.log(`✅ Created location: ${newLocation.name}`);
      return newLocation;
    } catch (error) {
      console.error("❌ Error creating location:", error);
      throw error;
    }
  }

  /**
   * Update an existing location
   * @param {string} locationId - The location's unique identifier
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated location
   */
  async updateLocation(locationId, updates) {
    try {
      console.log(`🔄 Updating location ${locationId}...`);

      const response = await fetch(`${this.apiBase}/locations/${locationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update location: ${response.status}`);
      }

      const updatedLocation = await response.json();

      // Refresh data
      await this.loadLocations();
      this.buildLocationHierarchy();

      console.log(`✅ Updated location: ${updatedLocation.name}`);
      return updatedLocation;
    } catch (error) {
      console.error(`❌ Error updating location ${locationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a location
   * @param {string} locationId - The location's unique identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteLocation(locationId) {
    try {
      const location = this.getLocation(locationId);
      if (!location) {
        throw new Error("Location not found");
      }

      console.log(`🔄 Deleting location: ${location.name}...`);

      const response = await fetch(`${this.apiBase}/locations/${locationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete location");
      }

      // Refresh data
      await this.loadLocations();
      this.buildLocationHierarchy();

      console.log(`✅ Deleted location: ${location.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting location ${locationId}:`, error);
      throw error;
    }
  }

  /**
   * Get locations by type
   * @param {string} locationType - Type to filter by
   * @returns {Array} Filtered locations
   */
  getLocationsByType(locationType) {
    return this.locations.filter((loc) => loc.location_type === locationType);
  }

  /**
   * Search locations by text
   * @param {string} searchTerm - Text to search for
   * @returns {Array} Array of matching locations
   */
  searchLocations(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return this.locations;
    }

    const term = searchTerm.toLowerCase();
    return this.locations.filter((location) => {
      return (
        location.name?.toLowerCase().includes(term) ||
        location.description?.toLowerCase().includes(term) ||
        location.location_type?.toLowerCase().includes(term) ||
        location.notes?.toLowerCase().includes(term)
      );
    });
  }

  /**
   * Get location statistics
   * @returns {Object} Statistics about locations
   */
  getLocationStats() {
    const stats = {
      total: this.locations.length,
      byType: {},
      byParent: {
        root: 0,
        children: 0,
      },
    };

    // Count by type
    this.locations.forEach((location) => {
      const type = location.location_type || "unknown";
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count hierarchy levels
      if (location.parent_id) {
        stats.byParent.children++;
      } else {
        stats.byParent.root++;
      }
    });

    return stats;
  }

  /**
   * Get location path (breadcrumb)
   * @param {string} locationId - The location's unique identifier
   * @returns {Array} Array of locations from root to target
   */
  getLocationPath(locationId) {
    const path = [];
    let currentLocation = this.getLocation(locationId);

    while (currentLocation) {
      path.unshift(currentLocation);

      if (currentLocation.parent_id) {
        currentLocation = this.getLocation(currentLocation.parent_id);
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Check if a location can be deleted (no children)
   * @param {string} locationId - The location's unique identifier
   * @returns {boolean} True if location can be deleted
   */
  canDeleteLocation(locationId) {
    const children = this.getLocationChildren(locationId);
    return children.length === 0;
  }

  /**
   * Get descendant locations (all children recursively)
   * @param {string} locationId - The parent location's ID
   * @returns {Array} Array of all descendant locations
   */
  getLocationDescendants(locationId) {
    const descendants = [];
    const children = this.getLocationChildren(locationId);

    children.forEach((child) => {
      descendants.push(child);
      descendants.push(...this.getLocationDescendants(child.id));
    });

    return descendants;
  }

  /**
   * Validate location data
   * @param {Object} locationData - Location data to validate
   * @returns {Array} Array of validation errors
   */
  validateLocationData(locationData) {
    const errors = [];

    if (!locationData.name || locationData.name.trim() === "") {
      errors.push("Location name is required");
    }

    if (locationData.name && locationData.name.length > 200) {
      errors.push("Location name must be less than 200 characters");
    }

    if (!locationData.location_type) {
      errors.push("Location type is required");
    }

    const validTypes = [
      "region",
      "settlement",
      "building",
      "room",
      "landmark",
      "dungeon",
    ];
    if (
      locationData.location_type &&
      !validTypes.includes(locationData.location_type)
    ) {
      errors.push("Invalid location type");
    }

    if (locationData.description && locationData.description.length > 5000) {
      errors.push("Description must be less than 5000 characters");
    }

    if (locationData.notes && locationData.notes.length > 5000) {
      errors.push("Notes must be less than 5000 characters");
    }

    // Check for circular parent reference
    if (locationData.parent_id && locationData.id === locationData.parent_id) {
      errors.push("Location cannot be its own parent");
    }

    return errors;
  }

  /**
   * Export location data
   * @param {string} locationId - Optional specific location ID, or null for all
   * @returns {Object} Exported data
   */
  exportLocationData(locationId = null) {
    const locations = locationId
      ? [this.getLocation(locationId)].filter(Boolean)
      : this.locations;

    return {
      exportDate: new Date().toISOString(),
      campaignId: this.campaignId,
      locationCount: locations.length,
      locations: locations,
      hierarchy: this.buildExportHierarchy(locations),
      stats: this.getLocationStats(),
    };
  }

  /**
   * Build hierarchy for export
   * @param {Array} locations - Locations to include in hierarchy
   * @returns {Object} Hierarchical structure
   */
  buildExportHierarchy(locations) {
    const locationMap = new Map();
    const hierarchy = {};

    // Create location map
    locations.forEach((location) => {
      locationMap.set(location.id, { ...location, children: [] });
    });

    // Build hierarchy
    locations.forEach((location) => {
      const locationNode = locationMap.get(location.id);

      if (location.parent_id && locationMap.has(location.parent_id)) {
        const parent = locationMap.get(location.parent_id);
        parent.children.push(locationNode);
      } else {
        hierarchy[location.id] = locationNode;
      }
    });

    return hierarchy;
  }

  /**
   * Get locations by proximity (same parent)
   * @param {string} locationId - The reference location's ID
   * @returns {Array} Array of sibling locations
   */
  getLocationSiblings(locationId) {
    const location = this.getLocation(locationId);
    if (!location) return [];

    if (location.parent_id) {
      return this.getLocationChildren(location.parent_id).filter(
        (sibling) => sibling.id !== locationId
      );
    } else {
      return this.getRootLocations().filter(
        (sibling) => sibling.id !== locationId
      );
    }
  }

  /**
   * Check if system is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Refresh data from API
   * @returns {Promise<Array>} Updated locations
   */
  async refresh() {
    await this.loadLocations();
    this.buildLocationHierarchy();
    return this.locations;
  }

  /**
   * Get location icon based on type
   * @param {string} locationType - The location type
   * @returns {string} Font Awesome icon class
   */
  getLocationIcon(locationType) {
    const iconMap = {
      region: "fa-globe",
      settlement: "fa-city",
      building: "fa-building",
      room: "fa-door-open",
      landmark: "fa-monument",
      dungeon: "fa-dungeon",
    };

    return iconMap[locationType] || "fa-map-marker-alt";
  }
}
