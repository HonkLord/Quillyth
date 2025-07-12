/**
 * Campaign Forms - Form HTML generation and modals
 * Handles all campaign form rendering and modal functionality
 */
export class CampaignForms {
  constructor(campaignCore) {
    this.core = campaignCore;
  }

  /**
   * Show campaign edit modal
   */
  showEditCampaignModal() {
    const campaign = this.core.getCampaignData();
    const modalHtml = this.generateEditCampaignModal(campaign);
    this.showModal(modalHtml);
  }

    /**
   * Generate edit campaign modal HTML
   */
  generateEditCampaignModal(campaign) {
    const statusOptions = this.core.getStatusOptions();
    let statusOptionsHtml = '';
    statusOptions.forEach(option => {
      const selected = campaign?.status === option.value ? 'selected' : '';
      statusOptionsHtml += `<option value="${option.value}" ${selected}>${option.label}</option>`;
    });

    return `
      <div class="modal-overlay" id="edit-campaign-modal">
        <div class="modal modal--large">
          <div class="modal__header">
            <h3 class="modal__title">
              <i class="fas fa-edit"></i>
              Edit Campaign
            </h3>
            <button class="modal__close" data-action="close-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form class="modal__content" id="edit-campaign-form">
            <div class="form-grid form-grid--2-col">
              <!-- Campaign Name -->
              <div class="form-group">
                <label for="campaign-name" class="form-label">
                  <i class="fas fa-dragon"></i>
                  Campaign Name *
                </label>
                <input
                  type="text"
                  id="campaign-name"
                  name="name"
                  class="form-input"
                  value="${campaign?.name || ''}"
                  placeholder="Enter campaign name"
                  required
                />
              </div>

              <!-- Campaign Status -->
              <div class="form-group">
                <label for="campaign-status" class="form-label">
                  <i class="fas fa-flag"></i>
                  Campaign Status
                </label>
                <select id="campaign-status" name="status" class="form-select">
                  ${statusOptionsHtml}
                </select>
              </div>

              <!-- Setting -->
              <div class="form-group">
                <label for="campaign-setting" class="form-label">
                  <i class="fas fa-globe"></i>
                  Setting
                </label>
                <input
                  type="text"
                  id="campaign-setting"
                  name="setting"
                  class="form-input"
                  value="${campaign?.setting || ''}"
                  placeholder="Campaign world or setting"
                />
              </div>

              <!-- Current Session -->
              <div class="form-group">
                <label for="campaign-session" class="form-label">
                  <i class="fas fa-calendar-alt"></i>
                  Current Session
                </label>
                <input
                  type="number"
                  id="campaign-session"
                  name="current_session"
                  class="form-input"
                  value="${campaign?.current_session || 1}"
                  min="1"
                  placeholder="Session number"
                />
              </div>

              <!-- Current Location -->
              <div class="form-group form-group--full-width">
                <label for="campaign-location" class="form-label">
                  <i class="fas fa-map-marker-alt"></i>
                  Current Location
                </label>
                <input
                  type="text"
                  id="campaign-location"
                  name="current_location"
                  class="form-input"
                  value="${campaign?.current_location || ''}"
                  placeholder="Where the party currently is"
                />
              </div>

              <!-- DM Name -->
              <div class="form-group">
                <label for="campaign-dm" class="form-label">
                  <i class="fas fa-user-crown"></i>
                  Dungeon Master
                </label>
                <input
                  type="text"
                  id="campaign-dm"
                  name="dm_name"
                  class="form-input"
                  value="${campaign?.dm_name || ''}"
                  placeholder="DM name"
                />
              </div>

              <!-- Description -->
              <div class="form-group form-group--full-width">
                <label for="campaign-description" class="form-label">
                  <i class="fas fa-scroll"></i>
                  Campaign Description
                </label>
                <textarea
                  id="campaign-description"
                  name="description"
                  class="form-textarea"
                  rows="4"
                  placeholder="Brief description of the campaign"
                >${campaign?.description || ''}</textarea>
              </div>
            </div>

            <!-- Advanced Settings -->
            <div class="form-section">
              <h4 class="form-section__title">
                <i class="fas fa-cogs"></i>
                Advanced Settings
              </h4>
              
              <div class="form-grid form-grid--3-col">
                <!-- Theme -->
                <div class="form-group">
                  <label for="campaign-theme" class="form-label">
                    <i class="fas fa-palette"></i>
                    Theme
                  </label>
                  <select id="campaign-theme" name="theme" class="form-select">
                    <option value="">Select theme...</option>
                    <option value="classic" ${campaign?.metadata?.theme === 'classic' ? 'selected' : ''}>Classic Fantasy</option>
                    <option value="dark_fantasy" ${campaign?.metadata?.theme === 'dark_fantasy' ? 'selected' : ''}>Dark Fantasy</option>
                    <option value="mystery" ${campaign?.metadata?.theme === 'mystery' ? 'selected' : ''}>Mystery</option>
                    <option value="horror" ${campaign?.metadata?.theme === 'horror' ? 'selected' : ''}>Horror</option>
                    <option value="adventure" ${campaign?.metadata?.theme === 'adventure' ? 'selected' : ''}>Adventure</option>
                    <option value="political" ${campaign?.metadata?.theme === 'political' ? 'selected' : ''}>Political Intrigue</option>
                  </select>
                </div>

                <!-- Tone -->
                <div class="form-group">
                  <label for="campaign-tone" class="form-label">
                    <i class="fas fa-theater-masks"></i>
                    Tone
                  </label>
                  <select id="campaign-tone" name="tone" class="form-select">
                    <option value="">Select tone...</option>
                    <option value="lighthearted" ${campaign?.metadata?.tone === 'lighthearted' ? 'selected' : ''}>Lighthearted</option>
                    <option value="serious" ${campaign?.metadata?.tone === 'serious' ? 'selected' : ''}>Serious</option>
                    <option value="dark" ${campaign?.metadata?.tone === 'dark' ? 'selected' : ''}>Dark</option>
                    <option value="comedic" ${campaign?.metadata?.tone === 'comedic' ? 'selected' : ''}>Comedic</option>
                    <option value="dramatic" ${campaign?.metadata?.tone === 'dramatic' ? 'selected' : ''}>Dramatic</option>
                  </select>
                </div>

                <!-- Session Length -->
                <div class="form-group">
                  <label for="campaign-session-length" class="form-label">
                    <i class="fas fa-clock"></i>
                    Session Length (minutes)
                  </label>
                  <input
                    type="number"
                    id="campaign-session-length"
                    name="session_length"
                    class="form-input"
                    value="${campaign?.metadata?.session_length || 240}"
                    min="60"
                    max="480"
                    step="30"
                    placeholder="240"
                  />
                </div>
              </div>
            </div>

            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" data-action="close-modal">
                <i class="fas fa-times"></i>
                Cancel
              </button>
              <button type="submit" class="btn btn--primary">
                <i class="fas fa-save"></i>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * Show campaign settings modal
   */
  showCampaignSettingsModal() {
    const campaign = this.core.getCampaignData();
    const modalHtml = this.generateCampaignSettingsModal(campaign);
    this.showModal(modalHtml);
  }

  /**
   * Generate campaign settings modal HTML
   */
  generateCampaignSettingsModal(campaign) {
    return `
      <div class="modal-overlay" id="campaign-settings-modal">
        <div class="modal modal--large">
          <div class="modal__header">
            <h3 class="modal__title">
              <i class="fas fa-cogs"></i>
              Campaign Settings
            </h3>
            <button class="modal__close" data-action="close-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal__content">
            <div class="settings-tabs">
              <div class="settings-tabs__nav">
                <button class="settings-tab settings-tab--active" data-tab="general">
                  <i class="fas fa-cog"></i>
                  General
                </button>
                <button class="settings-tab" data-tab="gameplay">
                  <i class="fas fa-dice-d20"></i>
                  Gameplay
                </button>
                <button class="settings-tab" data-tab="ai">
                  <i class="fas fa-robot"></i>
                  AI Settings
                </button>
                <button class="settings-tab" data-tab="export">
                  <i class="fas fa-download"></i>
                  Export/Backup
                </button>
              </div>

              <div class="settings-tabs__content">
                <!-- General Settings -->
                <div class="settings-panel settings-panel--active" data-panel="general">
                  <h4>General Campaign Settings</h4>
                  <form id="general-settings-form">
                    <div class="form-grid form-grid--2-col">
                      <div class="form-group">
                        <label class="form-label">Auto-save Interval</label>
                        <select class="form-select" name="autosave_interval">
                          <option value="1">Every 1 minute</option>
                          <option value="5" selected>Every 5 minutes</option>
                          <option value="10">Every 10 minutes</option>
                          <option value="0">Disabled</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Date Format</label>
                        <select class="form-select" name="date_format">
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD" selected>YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </form>
                </div>

                <!-- Gameplay Settings -->
                <div class="settings-panel" data-panel="gameplay">
                  <h4>Gameplay Configuration</h4>
                  <form id="gameplay-settings-form">
                    <div class="form-grid form-grid--2-col">
                      <div class="form-group">
                        <label class="form-label">Default Player Level</label>
                        <input type="number" class="form-input" name="default_level" value="1" min="1" max="20" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">Max Players</label>
                        <input type="number" class="form-input" name="max_players" value="6" min="1" max="12" />
                      </div>
                    </div>
                  </form>
                </div>

                <!-- AI Settings -->
                <div class="settings-panel" data-panel="ai">
                  <h4>AI Integration Settings</h4>
                  <form id="ai-settings-form">
                    <div class="form-group">
                      <label class="form-label">Enable AI Suggestions</label>
                      <div class="form-toggle">
                        <input type="checkbox" id="ai-enabled" name="ai_enabled" checked />
                        <label for="ai-enabled" class="toggle-label"></label>
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">AI Creativity Level</label>
                      <input type="range" class="form-range" name="ai_creativity" min="1" max="10" value="7" />
                      <div class="range-labels">
                        <span>Conservative</span>
                        <span>Creative</span>
                      </div>
                    </div>
                  </form>
                </div>

                <!-- Export Settings -->
                <div class="settings-panel" data-panel="export">
                  <h4>Export & Backup Options</h4>
                  <div class="export-options">
                    <button class="btn btn--primary btn--block" data-action="export-campaign">
                      <i class="fas fa-download"></i>
                      Export Campaign Data
                    </button>
                    <button class="btn btn--secondary btn--block" data-action="backup-campaign">
                      <i class="fas fa-cloud-upload"></i>
                      Create Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" data-action="close-modal">
              <i class="fas fa-times"></i>
              Close
            </button>
            <button type="button" class="btn btn--primary" data-action="save-settings">
              <i class="fas fa-save"></i>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show quick edit modal for campaign info
   */
  showQuickEditModal() {
    const campaign = this.core.getCampaignData();
    const modalHtml = this.generateQuickEditModal(campaign);
    this.showModal(modalHtml);
  }

  /**
   * Generate quick edit modal HTML
   */
  generateQuickEditModal(campaign) {
    return `
      <div class="modal-overlay" id="quick-edit-modal">
        <div class="modal modal--medium">
          <div class="modal__header">
            <h3 class="modal__title">
              <i class="fas fa-edit"></i>
              Quick Edit Campaign
            </h3>
            <button class="modal__close" data-action="close-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form class="modal__content" id="quick-edit-form">
            <div class="form-group">
              <label for="quick-name" class="form-label">Campaign Name</label>
              <input
                type="text"
                id="quick-name"
                name="name"
                class="form-input"
                value="${campaign?.name || ''}"
                required
              />
            </div>

            <div class="form-group">
              <label for="quick-session" class="form-label">Current Session</label>
              <input
                type="number"
                id="quick-session"
                name="current_session"
                class="form-input"
                value="${campaign?.current_session || 1}"
                min="1"
              />
            </div>

            <div class="form-group">
              <label for="quick-location" class="form-label">Current Location</label>
              <input
                type="text"
                id="quick-location"
                name="current_location"
                class="form-input"
                value="${campaign?.current_location || ''}"
                placeholder="Where the party currently is"
              />
            </div>

            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" data-action="close-modal">
                <i class="fas fa-times"></i>
                Cancel
              </button>
              <button type="submit" class="btn btn--primary">
                <i class="fas fa-save"></i>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * Show modal
   */
  showModal(modalHtml) {
    // Remove any existing modals
    this.closeModal();

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Focus first input
    const firstInput = document.querySelector('.modal input, .modal textarea, .modal select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    // Handle modal events
    this.setupModalEvents();
  }

  /**
   * Close modal
   */
  closeModal() {
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }
  }

  /**
   * Setup modal event listeners
   */
  setupModalEvents() {
    const modal = document.querySelector('.modal-overlay');
    if (!modal) return;

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });

    // Handle tab switching in settings modal
    const tabButtons = modal.querySelectorAll('.settings-tab');
    const tabPanels = modal.querySelectorAll('.settings-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;

        // Update active tab
        tabButtons.forEach(btn => btn.classList.remove('settings-tab--active'));
        button.classList.add('settings-tab--active');

        // Update active panel
        tabPanels.forEach(panel => panel.classList.remove('settings-panel--active'));
        const targetPanel = modal.querySelector(`[data-panel="${targetTab}"]`);
        if (targetPanel) {
          targetPanel.classList.add('settings-panel--active');
        }
      });
    });
  }

  /**
   * Get form data from modal
   */
  getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return null;

    const formData = new FormData(form);
    const data = {};

    // Convert FormData to regular object
    for (const [key, value] = formData.entries()) {
      data[key] = value;
    }

    // Handle metadata fields
    const metadata = {};
    ['theme', 'tone', 'session_length'].forEach(field => {
      if (data[field]) {
        metadata[field] = data[field];
        delete data[field];
      }
    });

    if (Object.keys(metadata).length > 0) {
      data.metadata = metadata;
    }

    return data;
  }

  /**
   * Validate form data
   */
  validateFormData(data) {
    return this.core.validateCampaignData(data);
  }
} 