/**
 * LocationUI - Handles location UI rendering, modal dialogs, and user interactions
 * Manages HTML generation, tree view, details panel, and user interface for location management
 */
import { escapeHTML } from "../../shared/escape-html.js";

export default class LocationUI {
  constructor(locationCore) {
    this.core = locationCore;
    this.currentLocation = null;
    this.expandedNodes = new Set();
  }

  /**
   * Render the main location management interface
   * @param {HTMLElement} container - Container element to render into
   */
  render(container) {
    container.innerHTML = this.createLocationManagerHTML();
    this.setupEventListeners();
    this.renderLocationList();
    this.updateLocationStats();
  }

  /**
   * Create the main location manager HTML structure
   * @returns {string} HTML string for the location manager
   */
  createLocationManagerHTML() {
    return `
      <div class="workspace-container">
        <div class="workspace-feature-header">
          <div class="workspace-feature-title">
            <i class="fas fa-map-marker-alt"></i>
            <div>
              <h2>Location Management</h2>
              <p class="workspace-feature-subtitle">Organize and manage your campaign world</p>
            </div>
          </div>
          <div class="workspace-feature-actions">
            <button class="btn btn-primary" onclick="locationManager.showCreateLocationModal()">
              <i class="fas fa-plus"></i> New Location
            </button>
            <button class="btn btn-secondary" onclick="locationManager.showLocationMapView()">
              <i class="fas fa-map"></i> Map View
            </button>
            <button class="btn btn-secondary" onclick="locationManager.exportLocations()">
              <i class="fas fa-download"></i> Export
            </button>
          </div>
        </div>

        <div class="workspace-section">
          <div class="workspace-section-header">
            <h3 class="workspace-section-title">
              <i class="fas fa-chart-bar"></i>
              Location Statistics
            </h3>
          </div>
          <div class="workspace-section-content">
            <div class="workspace-stats-grid">
              <div class="card card-stat">
                <div class="stat-value" id="total-locations">0</div>
                <div class="stat-label">Total Locations</div>
              </div>
              <div class="card card-stat">
                <div class="stat-value" id="region-count">0</div>
                <div class="stat-label">Regions</div>
              </div>
              <div class="card card-stat">
                <div class="stat-value" id="settlement-count">0</div>
                <div class="stat-label">Settlements</div>
              </div>
              <div class="card card-stat">
                <div class="stat-value" id="building-count">0</div>
                <div class="stat-label">Buildings</div>
              </div>
              <div class="card card-stat">
                <div class="stat-value" id="dungeon-count">0</div>
                <div class="stat-label">Dungeons</div>
              </div>
            </div>
          </div>
        </div>

        <div class="workspace-grid workspace-grid-2">
          <div class="workspace-panel workspace-panel-primary">
            <div class="workspace-panel-header">
              <h3 class="workspace-panel-title">
                <i class="fas fa-list"></i>
                Locations
              </h3>
              <div class="workspace-panel-actions">
                <select id="location-type-filter" class="filter-select">
                  <option value="">All Types</option>
                  <option value="region">Region</option>
                  <option value="settlement">Settlement</option>
                  <option value="building">Building</option>
                  <option value="room">Room</option>
                  <option value="landmark">Landmark</option>
                  <option value="dungeon">Dungeon</option>
                </select>
              </div>
            </div>
            
            <div class="location-tree" id="location-tree">
              <!-- Location hierarchy will be rendered here -->
            </div>
          </div>

          <div class="workspace-panel workspace-panel-secondary">
            <div id="location-details">
              <div class="workspace-empty-state">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Select a Location</h3>
                <p>Choose a location from the list to view and edit its details</p>
                <button class="btn btn-primary" onclick="locationManager.showCreateLocationModal()">
                  <i class="fas fa-plus"></i> Create First Location
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for the location manager
   */
  setupEventListeners() {
    // Type filter
    const typeFilter = document.getElementById("location-type-filter");
    if (typeFilter) {
      typeFilter.addEventListener("change", (e) => {
        this.filterLocationsByType(e.target.value);
      });
    }
  }

  /**
   * Render the location list/tree
   */
  renderLocationList() {
    const treeContainer = document.getElementById("location-tree");
    if (!treeContainer) return;

    const rootLocations = this.core.getRootLocations();

    if (rootLocations.length === 0) {
      treeContainer.innerHTML = `
        <div class="workspace-empty-state">
          <i class="fas fa-map-marker-alt"></i>
          <h3>No Locations Yet</h3>
          <p>Create your first location to start organizing your campaign world</p>
          <button class="btn btn-primary" onclick="locationManager.showCreateLocationModal()">
            <i class="fas fa-plus"></i> Create Location
          </button>
        </div>
      `;
      return;
    }

    const treeHTML = rootLocations
      .map((location) => this.renderLocationNode(location, 0))
      .join("");

    treeContainer.innerHTML = treeHTML;
  }

  /**
   * Render a single location node in the tree
   * @param {Object} location - Location data
   * @param {number} level - Nesting level for indentation
   * @returns {string} HTML string for the location node
   */
  renderLocationNode(location, level = 0) {
    const children = this.core.getLocationChildren(location.id);
    const hasChildren = children.length > 0;
    const isExpanded = this.expandedNodes.has(location.id);
    const icon = this.core.getLocationIcon(location.location_type);
    const isSelected =
      this.currentLocation && this.currentLocation.id === location.id;

    const nodeHTML = `
      <div class="location-node ${isSelected ? "selected" : ""}" 
           data-location-id="${location.id}" 
           data-level="${level}">
        <div class="location-node-content" style="padding-left: ${
          level * 20
        }px">
          ${
            hasChildren
              ? `
            <button class="tree-toggle ${isExpanded ? "expanded" : ""}" 
                    onclick="locationManager.toggleLocationNode('${
                      location.id
                    }')">
              <i class="fas fa-chevron-${isExpanded ? "down" : "right"}"></i>
            </button>
          `
              : '<span class="tree-spacer"></span>'
          }
          
          <i class="fas ${icon} location-icon"></i>
          
          <span class="location-name" onclick="locationManager.selectLocation('${
            location.id
          }')">
            ${escapeHTML(location.name)}
          </span>
          
          <span class="location-type">${escapeHTML(
            location.location_type
          )}</span>
          
          <div class="location-actions">
            <button class="btn-icon" onclick="locationManager.editLocation('${
              location.id
            }')" 
                    title="Edit Location">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" onclick="locationManager.deleteLocation('${
              location.id
            }')" 
                    title="Delete Location">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        ${
          hasChildren && isExpanded
            ? `
          <div class="location-children">
            ${children
              .map((child) => this.renderLocationNode(child, level + 1))
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `;

    return nodeHTML;
  }

  /**
   * Toggle a location node's expanded state
   * @param {string} locationId - The location's unique identifier
   */
  toggleLocationNode(locationId) {
    if (this.expandedNodes.has(locationId)) {
      this.expandedNodes.delete(locationId);
    } else {
      this.expandedNodes.add(locationId);
    }
    this.renderLocationList();
  }

  /**
   * Select a location and show its details
   * @param {string} locationId - The location's unique identifier
   */
  selectLocation(locationId) {
    const location = this.core.getLocation(locationId);
    if (!location) {
      this.showError("Location not found");
      return;
    }

    this.currentLocation = location;
    this.renderLocationDetails(location);
    this.renderLocationList(); // Re-render to update selection
  }

  /**
   * Render location details panel
   * @param {Object} location - Location data
   */
  renderLocationDetails(location) {
    const detailsContainer = document.getElementById("location-details");
    if (!detailsContainer) return;

    const path = this.core.getLocationPath(location.id);
    const children = this.core.getLocationChildren(location.id);
    const siblings = this.core.getLocationSiblings(location.id);

    detailsContainer.innerHTML = `
      <div class="location-details-content">
        <!-- Location Header -->
        <div class="location-details-header">
          <div class="location-title">
            <i class="fas ${this.core.getLocationIcon(
              location.location_type
            )}"></i>
            <h3>${escapeHTML(location.name)}</h3>
            <span class="location-type-badge">${escapeHTML(
              location.location_type
            )}</span>
          </div>
          
          <div class="location-actions">
            <button class="btn btn-primary" onclick="locationManager.editLocation('${
              location.id
            }')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-secondary" onclick="locationManager.showCreateLocationModal('${
              location.id
            }')">
              <i class="fas fa-plus"></i> Add Child
            </button>
            <button class="btn btn-danger" onclick="locationManager.deleteLocation('${
              location.id
            }')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>

        <!-- Breadcrumb -->
        ${
          path.length > 1
            ? `
          <div class="location-breadcrumb">
            <i class="fas fa-map-signs"></i>
            ${path
              .map(
                (pathLocation, index) => `
              <span class="breadcrumb-item ${
                index === path.length - 1 ? "current" : ""
              }" 
                    ${
                      index < path.length - 1
                        ? `onclick="locationManager.selectLocation('${pathLocation.id}')"`
                        : ""
                    }>
                ${escapeHTML(pathLocation.name)}
              </span>
              ${
                index < path.length - 1
                  ? '<i class="fas fa-chevron-right"></i>'
                  : ""
              }
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        <!-- Location Information -->
        <div class="location-info">
          ${
            location.description
              ? `
            <div class="info-section">
              <h4>Description</h4>
              <p>${escapeHTML(location.description)}</p>
            </div>
          `
              : ""
          }

          ${
            location.notes
              ? `
            <div class="info-section">
              <h4>Notes</h4>
              <p>${escapeHTML(location.notes)}</p>
            </div>
          `
              : ""
          }

          ${
            location.tags && location.tags.length > 0
              ? `
            <div class="info-section">
              <h4>Tags</h4>
              <div class="tag-list">
                ${location.tags
                  .map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`)
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>

        <!-- Child Locations -->
        ${
          children.length > 0
            ? `
          <div class="child-locations">
            <h4>Child Locations (${children.length})</h4>
            <div class="child-location-grid">
              ${children
                .map(
                  (child) => `
                <div class="child-location-card" onclick="locationManager.selectLocation('${
                  child.id
                }')">
                  <i class="fas ${this.core.getLocationIcon(
                    child.location_type
                  )}"></i>
                  <span class="child-name">${escapeHTML(child.name)}</span>
                  <span class="child-type">${escapeHTML(
                    child.location_type
                  )}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Sibling Locations -->
        ${
          siblings.length > 0
            ? `
          <div class="sibling-locations">
            <h4>Nearby Locations (${siblings.length})</h4>
            <div class="sibling-location-list">
              ${siblings
                .slice(0, 5)
                .map(
                  (sibling) => `
                <div class="sibling-location-item" onclick="locationManager.selectLocation('${
                  sibling.id
                }')">
                  <i class="fas ${this.core.getLocationIcon(
                    sibling.location_type
                  )}"></i>
                  <span>${escapeHTML(sibling.name)}</span>
                </div>
              `
                )
                .join("")}
              ${
                siblings.length > 5
                  ? `<div class="more-siblings">... and ${
                      siblings.length - 5
                    } more</div>`
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  /**
   * Show modal for creating a new location
   * @param {string} parentId - Optional parent location ID
   */
  showCreateLocationModal(parentId = null) {
    const parentLocation = parentId ? this.core.getLocation(parentId) : null;
    const parentOptions = this.generateParentOptions(parentId);

    const modalContent = `
      <form id="create-location-form">
        <div class="form-group">
          <label for="location-name">Location Name *</label>
          <input type="text" id="location-name" name="name" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="location-type">Location Type *</label>
            <select id="location-type" name="location_type" required>
              <option value="">Select Type</option>
              <option value="region">Region</option>
              <option value="settlement">Settlement</option>
              <option value="building">Building</option>
              <option value="room">Room</option>
              <option value="landmark">Landmark</option>
              <option value="dungeon">Dungeon</option>
            </select>
          </div>

          <div class="form-group">
            <label for="parent-location">Parent Location</label>
            <select id="parent-location" name="parent_id">
              <option value="">None (Root Location)</option>
              ${parentOptions}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="location-description">Description</label>
          <textarea id="location-description" name="description" rows="4" 
                    placeholder="Describe this location..."></textarea>
        </div>

        <div class="form-group">
          <label for="location-notes">Notes</label>
          <textarea id="location-notes" name="notes" rows="3" 
                    placeholder="Additional notes and details..."></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn-primary">Create Location</button>
        </div>
      </form>
    `;

    this.showModal("Create Location", modalContent);

    // Set default parent if provided
    if (parentId) {
      const parentSelect = document.getElementById("parent-location");
      if (parentSelect) {
        parentSelect.value = parentId;
      }
    }

    // Setup form handler
    const form = document.getElementById("create-location-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreateLocation(e.target);
    });
  }

  /**
   * Show modal for editing a location
   * @param {string} locationId - The location's unique identifier
   */
  showEditLocationModal(locationId) {
    const location = this.core.getLocation(locationId);
    if (!location) {
      this.showError("Location not found");
      return;
    }

    const parentOptions = this.generateParentOptions(location.id);

    const modalContent = `
      <form id="edit-location-form">
        <input type="hidden" name="locationId" value="${location.id}">
        
        <div class="form-group">
          <label for="edit-location-name">Location Name *</label>
          <input type="text" id="edit-location-name" name="name" value="${escapeHTML(
            location.name
          )}" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="edit-location-type">Location Type *</label>
            <select id="edit-location-type" name="location_type" required>
              <option value="region" ${
                location.location_type === "region" ? "selected" : ""
              }>Region</option>
              <option value="settlement" ${
                location.location_type === "settlement" ? "selected" : ""
              }>Settlement</option>
              <option value="building" ${
                location.location_type === "building" ? "selected" : ""
              }>Building</option>
              <option value="room" ${
                location.location_type === "room" ? "selected" : ""
              }>Room</option>
              <option value="landmark" ${
                location.location_type === "landmark" ? "selected" : ""
              }>Landmark</option>
              <option value="dungeon" ${
                location.location_type === "dungeon" ? "selected" : ""
              }>Dungeon</option>
            </select>
          </div>

          <div class="form-group">
            <label for="edit-parent-location">Parent Location</label>
            <select id="edit-parent-location" name="parent_id">
              <option value="">None (Root Location)</option>
              ${parentOptions}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="edit-location-description">Description</label>
          <textarea id="edit-location-description" name="description" rows="4">${escapeHTML(
            location.description || ""
          )}</textarea>
        </div>

        <div class="form-group">
          <label for="edit-location-notes">Notes</label>
          <textarea id="edit-location-notes" name="notes" rows="3">${escapeHTML(
            location.notes || ""
          )}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn-primary">Update Location</button>
        </div>
      </form>
    `;

    this.showModal("Edit Location", modalContent);

    // Set current parent
    const parentSelect = document.getElementById("edit-parent-location");
    if (parentSelect && location.parent_id) {
      parentSelect.value = location.parent_id;
    }

    // Setup form handler
    const form = document.getElementById("edit-location-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleEditLocation(e.target);
    });
  }

  /**
   * Generate parent location options for dropdowns
   * @param {string} excludeId - Location ID to exclude (prevent circular references)
   * @returns {string} HTML options string
   */
  generateParentOptions(excludeId = null) {
    const locations = this.core
      .getAllLocations()
      .filter((loc) => loc.id !== excludeId)
      .sort((a, b) => a.name.localeCompare(b.name));

    return locations
      .map(
        (location) => `
        <option value="${location.id}">
          ${escapeHTML(location.name)} (${escapeHTML(location.location_type)})
        </option>
      `
      )
      .join("");
  }

  /**
   * Handle creation of a new location
   * @param {HTMLFormElement} form - The form element
   */
  async handleCreateLocation(form) {
    try {
      const formData = new FormData(form);

      const locationData = {
        name: escapeHTML(formData.get("name")),
        location_type: escapeHTML(formData.get("location_type")),
        parent_id: formData.get("parent_id") || null,
        description: escapeHTML(formData.get("description")),
        notes: escapeHTML(formData.get("notes")),
      };

      // Validate data
      const errors = this.core.validateLocationData(locationData);
      if (errors.length > 0) {
        this.showError(errors.join(", "));
        return;
      }

      const newLocation = await this.core.createLocation(locationData);

      // Close modal and refresh
      form.closest(".modal-overlay").remove();
      this.showSuccess("Location created successfully!");
      this.renderLocationList();
      this.updateLocationStats();

      // Select the new location
      this.selectLocation(newLocation.id);
    } catch (error) {
      console.error("Error creating location:", error);
      this.showError("Failed to create location: " + error.message);
    }
  }

  /**
   * Handle editing of a location
   * @param {HTMLFormElement} form - The form element
   */
  async handleEditLocation(form) {
    try {
      const formData = new FormData(form);
      const locationId = formData.get("locationId");

      const updates = {
        name: escapeHTML(formData.get("name")),
        location_type: escapeHTML(formData.get("location_type")),
        parent_id: formData.get("parent_id") || null,
        description: escapeHTML(formData.get("description")),
        notes: escapeHTML(formData.get("notes")),
      };

      // Validate data
      const errors = this.core.validateLocationData({
        ...updates,
        id: locationId,
      });
      if (errors.length > 0) {
        this.showError(errors.join(", "));
        return;
      }

      await this.core.updateLocation(locationId, updates);

      // Close modal and refresh
      form.closest(".modal-overlay").remove();
      this.showSuccess("Location updated successfully!");
      this.renderLocationList();
      this.updateLocationStats();

      // Refresh details if this location is selected
      if (this.currentLocation && this.currentLocation.id === locationId) {
        const updatedLocation = this.core.getLocation(locationId);
        this.renderLocationDetails(updatedLocation);
        this.currentLocation = updatedLocation;
      }
    } catch (error) {
      console.error("Error updating location:", error);
      this.showError("Failed to update location: " + error.message);
    }
  }

  /**
   * Filter locations by search term
   * @param {string} searchTerm - Text to search for
   */
  filterLocations(searchTerm) {
    const locationNodes = document.querySelectorAll(".location-node");
    const term = searchTerm.toLowerCase();

    locationNodes.forEach((node) => {
      const locationName = node
        .querySelector(".location-name")
        .textContent.toLowerCase();
      if (locationName.includes(term)) {
        node.style.display = "block";
      } else {
        node.style.display = "none";
      }
    });
  }

  /**
   * Filter locations by type
   * @param {string} locationType - Type to filter by
   */
  filterLocationsByType(locationType) {
    const locationNodes = document.querySelectorAll(".location-node");

    locationNodes.forEach((node) => {
      const locationTypeElement = node.querySelector(".location-type");
      const nodeType = locationTypeElement
        ? locationTypeElement.textContent
        : "";

      if (!locationType || nodeType === locationType) {
        node.style.display = "block";
      } else {
        node.style.display = "none";
      }
    });
  }

  /**
   * Update location statistics display
   */
  updateLocationStats() {
    const stats = this.core.getLocationStats();

    const elements = {
      "total-locations": stats.total,
      "region-count": stats.byType.region || 0,
      "settlement-count": stats.byType.settlement || 0,
      "building-count": stats.byType.building || 0,
      "dungeon-count": stats.byType.dungeon || 0,
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  }

  /**
   * Show a modal dialog
   * @param {string} title - Modal title
   * @param {string} content - Modal content HTML
   */
  showModal(title, content) {
    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${escapeHTML(title)}</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      </div>
    `;

    // Remove existing modals
    document
      .querySelectorAll(".modal-overlay")
      .forEach((modal) => modal.remove());

    // Add new modal
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Close on overlay click
    const overlay = document.querySelector(".modal-overlay");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.showNotification(message, "error");
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  /**
   * Show info message
   * @param {string} message - Info message
   */
  showInfo(message) {
    this.showNotification(message, "info");
  }

  /**
   * Show notification toast
   * @param {string} message - Message to display
   * @param {string} type - Notification type (success, error, info)
   */
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification toast ${type}`;

    const icon =
      type === "success"
        ? "check-circle"
        : type === "error"
        ? "exclamation-circle"
        : "info-circle";

    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${icon}"></i>
        <span>${escapeHTML(message)}</span>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add to page
    let container = document.getElementById("notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "notification-container";
      container.className = "notification-container";
      document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);

    // Animate in
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);
  }
}
