/**
 * Notes Manager - Handles note creation, organization, and management
 * Integrates with SQLite backend for persistence
 */

import { DataManager } from "../../data-manager.js";
import { escapeHTML } from "../../shared/escape-html.js";

export class NotesManager {
  constructor() {
    this.notes = new Map();
    this.dataManager = new DataManager();
    this.noteCategories = [
      "session",
      "character",
      "location",
      "plot",
      "worldbuilding",
      "rules",
      "personal",
      "other",
    ];
    this.noteTags = [
      "important",
      "follow-up",
      "secret",
      "public",
      "combat",
      "roleplay",
      "lore",
      "reminder",
    ];
    this.apiBase = "/api";
  }

  /**
   * Initialize the Notes Manager
   */
  async init() {
    console.log("📝 NotesManager: Initializing...");

    try {
      await this.dataManager.loadCurrentCampaign();
      await this.loadNotes();
      this.setupEventListeners();
      console.log("✅ NotesManager: Initialized successfully");
    } catch (error) {
      console.error("❌ NotesManager: Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Load all notes from the API
   */
  async loadNotes() {
    try {
      const response = await fetch(
        `${this.apiBase}/notes?campaign_id=${this.dataManager.currentCampaignId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const notes = await response.json();
      this.notes.clear();

      notes.forEach((note) => {
        this.notes.set(note.id, note);
      });

      console.log(`📝 Loaded ${notes.length} notes`);
      return notes;
    } catch (error) {
      console.error("❌ Failed to load notes:", error);
      throw error;
    }
  }

  /**
   * Get notes statistics
   */
  getNoteStats() {
    const notes = Array.from(this.notes.values());
    const stats = {
      total: notes.length,
      byCategory: {},
      byTag: {},
      recent: notes.filter((note) => {
        const noteDate = new Date(note.updated_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return noteDate > weekAgo;
      }).length,
    };

    // Count by category
    this.noteCategories.forEach((category) => {
      stats.byCategory[category] = notes.filter(
        (note) => note.category === category
      ).length;
    });

    return stats;
  }

  /**
   * Show the notes management interface
   */
  showNotesManagement() {
    const notesContent = document.getElementById("notes-content");
    if (!notesContent) return;

    notesContent.innerHTML = this.generateNotesManagementHTML();
    this.setupNotesEventListeners();
    this.renderNotesList();
  }

  /**
   * Generate the notes management HTML
   */
  generateNotesManagementHTML() {
    const stats = this.getNoteStats();

    return `
      <div class="notes-management">
        <div class="notes-header">
          <h2><i class="fas fa-sticky-note"></i> Notes Management</h2>
          <button class="btn btn-primary" id="create-note-btn">
            <i class="fas fa-plus"></i> Create Note
          </button>
        </div>

        <!-- Notes Overview -->
        <div class="notes-overview">
          <div class="overview-stats">
            <div class="stat-card">
              <h3>${stats.total}</h3>
              <p>Total Notes</p>
            </div>
            <div class="stat-card">
              <h3>${stats.recent}</h3>
              <p>Recent (7 days)</p>
            </div>
            <div class="stat-card">
              <h3>${stats.byCategory.session || 0}</h3>
              <p>Session Notes</p>
            </div>
            <div class="stat-card">
              <h3>${stats.byCategory.character || 0}</h3>
              <p>Character Notes</p>
            </div>
          </div>
        </div>

        <!-- Notes List -->
        <div class="notes-list" id="notes-list">
          <!-- Notes will be rendered here -->
        </div>

        <!-- Empty State -->
        <div class="notes-empty-state" id="notes-empty-state" style="display: none;">
          <i class="fas fa-sticky-note"></i>
          <h3>No Notes Found</h3>
          <p>Create your first note to start organizing your campaign information.</p>
          <button class="btn btn-primary" onclick="document.getElementById('create-note-btn').click()">
            <i class="fas fa-plus"></i> Create First Note
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for notes interface
   */
  setupNotesEventListeners() {
    // Create note button
    const createBtn = document.getElementById("create-note-btn");
    if (createBtn) {
      createBtn.addEventListener("click", () => this.showNoteModal());
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    console.log("📝 NotesManager: Event listeners setup complete");
  }

  /**
   * Render the notes list
   */
  renderNotesList(notes = null) {
    const notesList = document.getElementById("notes-list");
    const emptyState = document.getElementById("notes-empty-state");

    if (!notesList) return;

    const notesToRender = notes || Array.from(this.notes.values());

    if (notesToRender.length === 0) {
      notesList.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    notesList.style.display = "block";
    if (emptyState) emptyState.style.display = "none";

    // Sort notes by updated date (most recent first)
    notesToRender.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    notesList.innerHTML = notesToRender
      .map((note) => this.generateNoteCard(note))
      .join("");
  }

  /**
   * Generate HTML for a note card
   */
  generateNoteCard(note) {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    const getCategoryIcon = (category) => {
      const icons = {
        session: "fas fa-dice-d20",
        character: "fas fa-user",
        location: "fas fa-map-marker-alt",
        plot: "fas fa-scroll",
        worldbuilding: "fas fa-globe",
        rules: "fas fa-book",
        personal: "fas fa-user-circle",
        other: "fas fa-sticky-note",
      };
      return icons[category] || "fas fa-sticky-note";
    };

    const truncateContent = (content, maxLength = 150) => {
      if (!content) return "";
      if (content.length <= maxLength) return content;
      return content.substring(0, maxLength) + "...";
    };

    const tagsHTML =
      note.tags && typeof note.tags === "string"
        ? note.tags
            .split(",")
            .map((tag) => `<span class="note-card__tag">${tag.trim()}</span>`)
            .join("")
        : "";

    return `
      <div class="note-card note-card--${note.category}" data-note-id="${
      note.id
    }">
        <div class="note-card__header">
          <div class="note-card__title-section">
            <h3 class="note-card__title">
              <i class="${getCategoryIcon(note.category)}"></i>
              ${escapeHTML(note.title)}
            </h3>
            <div class="note-card__meta">
              <span class="note-card__category note-card__category--${
                note.category
              }">${escapeHTML(note.category)}</span>
              <span class="note-card__date">Updated: ${formatDate(
                note.updated_at
              )}</span>
            </div>
          </div>
          <div class="note-card__actions">
            <button class="btn btn-sm btn-outline-primary" onclick="notesManager.showNoteDetails('${
              note.id
            }')" title="View Note">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary" onclick="notesManager.showNoteModal('${
              note.id
            }')" title="Edit Note">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="notesManager.confirmDeleteNote('${
              note.id
            }')" title="Delete Note">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="note-card__content">
          <p>${escapeHTML(truncateContent(note.content))}</p>
        </div>
        
        ${tagsHTML ? `<div class="note-card__tags">${tagsHTML}</div>` : ""}
      </div>
    `;
  }

  /**
   * Show note creation/editing modal
   */
  showNoteModal(noteId = null) {
    const isEdit = noteId !== null;
    const note = isEdit ? this.notes.get(noteId) : null;

    const modalTitle = isEdit ? "Edit Note" : "Create New Note";
    const submitText = isEdit ? "Update Note" : "Create Note";

    const modalContent = `
      <div class="note-modal">
        <h3>${escapeHTML(modalTitle)}</h3>
        <form id="note-form" data-note-id="${noteId || ""}">
          <div class="form-group">
            <label for="note-title">Title *</label>
            <input 
              type="text" 
              id="note-title" 
              name="title" 
              required 
              value="${escapeHTML(note ? note.title : "")}"
              placeholder="Enter note title..."
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="note-category">Category</label>
              <select id="note-category" name="category">
                ${this.noteCategories
                  .map(
                    (category) =>
                      `<option value="${escapeHTML(category)}" ${
                        note && note.category === category ? "selected" : ""
                      }>${escapeHTML(
                        category.charAt(0).toUpperCase() + category.slice(1)
                      )}</option>`
                  )
                  .join("")}
              </select>
            </div>
            
            <div class="form-group">
              <label for="note-tags">Tags</label>
              <input 
                type="text" 
                id="note-tags" 
                name="tags" 
                value="${escapeHTML(note ? note.tags || "" : "")}"
                placeholder="important, follow-up, secret..."
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="note-content">Content</label>
            <textarea 
              id="note-content" 
              name="content" 
              rows="10"
              placeholder="Enter your note content..."
            >${escapeHTML(note ? note.content || "" : "")}</textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              ${escapeHTML(submitText)}
            </button>
          </div>
        </form>
      </div>
    `;

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = `
      <div class="modal-content">
        ${modalContent}
      </div>
    `;

    // Add form submit handler
    const form = modalOverlay.querySelector("#note-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isEdit) {
        await this.handleEditNote(noteId, e.target);
      } else {
        await this.handleCreateNote(e.target);
      }
    });

    document.body.appendChild(modalOverlay);

    // Focus on title input
    setTimeout(() => {
      document.getElementById("note-title").focus();
    }, 100);
  }

  /**
   * Add a tag to the tags input
   */
  addTag(tagValue) {
    const tagsInput = document.getElementById("note-tags");
    if (!tagsInput || !tagValue) return;

    const currentTags = tagsInput.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    if (!currentTags.includes(tagValue)) {
      currentTags.push(tagValue);
      tagsInput.value = currentTags.join(", ");
    }
  }

  /**
   * Handle note creation
   */
  async handleCreateNote(form) {
    try {
      const formData = new FormData(form);
      const noteData = {
        title: formData.get("title"),
        content: formData.get("content"),
        category: formData.get("category"),
        tags: formData.get("tags"),
        campaign_id: this.dataManager.currentCampaignId,
      };

      const response = await fetch(`${this.apiBase}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        const createdNote = await response.json();
        this.notes.set(createdNote.id, createdNote);
        this.showSuccessMessage("Note created successfully!");
        this.renderNotesList();
        form.closest(".modal-overlay").remove();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create note");
      }
    } catch (error) {
      console.error("Error creating note:", error);
      this.showErrorMessage("Failed to create note: " + error.message);
    }
  }

  /**
   * Handle note editing
   */
  async handleEditNote(noteId, form) {
    try {
      const formData = new FormData(form);
      const noteData = {
        title: formData.get("title"),
        content: formData.get("content"),
        category: formData.get("category"),
        tags: formData.get("tags"),
      };

      const response = await fetch(`${this.apiBase}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        this.notes.set(noteId, updatedNote);
        this.showSuccessMessage("Note updated successfully!");
        this.renderNotesList();
        form.closest(".modal-overlay").remove();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update note");
      }
    } catch (error) {
      console.error("Error updating note:", error);
      this.showErrorMessage("Failed to update note: " + error.message);
    }
  }

  /**
   * Show detailed note view
   */
  showNoteDetails(noteId) {
    const note = this.notes.get(noteId);
    if (!note) return;

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const getCategoryIcon = (category) => {
      const icons = {
        session: "fas fa-dice-d20",
        character: "fas fa-user",
        location: "fas fa-map-marker-alt",
        plot: "fas fa-scroll",
        worldbuilding: "fas fa-globe",
        rules: "fas fa-book",
        personal: "fas fa-user-circle",
        other: "fas fa-sticky-note",
      };
      return icons[category] || "fas fa-sticky-note";
    };

    const tagsHTML = note.tags
      ? note.tags
          .split(",")
          .map((tag) => `<span class="note-tag">${tag.trim()}</span>`)
          .join("")
      : "<em>No tags</em>";

    const modalContent = `
      <div class="note-details">
        <div class="note-details-header">
          <div class="note-title-section">
            <i class="${getCategoryIcon(note.category)}"></i>
            <h3>${escapeHTML(note.title)}</h3>
            <span class="note-category">${escapeHTML(note.category)}</span>
          </div>
          <div class="note-actions">
            <button class="btn btn-primary" onclick="notesManager.showNoteModal('${
              note.id
            }'); this.closest('.modal-overlay').remove();">
              <i class="fas fa-edit"></i> Edit
            </button>
          </div>
        </div>
        
        <div class="note-meta-info">
          <div class="meta-item">
            <strong>Created:</strong> ${formatDate(note.created_at)}
          </div>
          <div class="meta-item">
            <strong>Updated:</strong> ${formatDate(note.updated_at)}
          </div>
          <div class="meta-item">
            <strong>Tags:</strong> ${tagsHTML}
          </div>
        </div>
        
        <div class="note-content-full">
          ${this.formatNoteContent(escapeHTML(note.content))}
        </div>
        
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
            Close
          </button>
        </div>
      </div>
    `;

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    modalOverlay.innerHTML = `
      <div class="modal-content modal-large">
        ${modalContent}
      </div>
    `;

    document.body.appendChild(modalOverlay);
  }

  /**
   * Format note content for display
   */
  formatNoteContent(content) {
    if (!content) return "<em>No content</em>";
    return content.replace(/\n/g, "<br>");
  }

  /**
   * Confirm note deletion
   */
  confirmDeleteNote(noteId) {
    const note = this.notes.get(noteId);
    if (!note) return;

    const confirmed = confirm(
      `Are you sure you want to delete the note "${escapeHTML(
        note.title
      )}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      this.deleteNote(noteId);
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId) {
    try {
      const response = await fetch(`${this.apiBase}/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        this.notes.delete(noteId);
        this.showSuccessMessage("Note deleted successfully!");
        this.renderNotesList();
      } else {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      this.showErrorMessage("Failed to delete note: " + error.message);
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    this.showNotification(message, "success");
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    this.showNotification(message, "error");
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${
        type === "success"
          ? "check-circle"
          : type === "error"
          ? "exclamation-circle"
          : "info-circle"
      }"></i>
      <span>${escapeHTML(message)}</span>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Update dashboard count (if dashboard exists)
   */
  updateDashboardCount() {
    const countElement = document.querySelector('[data-count="notes"]');
    if (countElement) {
      countElement.textContent = this.notes.size;
    }
  }
}
