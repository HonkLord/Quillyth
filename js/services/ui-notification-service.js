/**
 * UI Notification Service
 * Provides centralized methods for showing modals, toasts, and notifications.
 */
class UINotificationService {
  constructor() {
    if (UINotificationService.instance) {
      return UINotificationService.instance;
    }
    UINotificationService.instance = this;
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - 'success' or 'error'
   * @param {number} duration - Duration in milliseconds
   */
  showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${icon}"></i>
        <span class="toast-message">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);

    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Show a modal dialog with custom content
   * @param {string} title - The title of the modal
   * @param {string} content - The HTML content of the modal body
   * @param {Array} buttons - Array of button objects, e.g., [{ text: 'OK', class: 'btn-primary', action: () => {} }]
   * @returns {HTMLElement} The modal overlay element
   */
  showModal(title, content, buttons = []) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${buttons.length > 0 ? `
        <div class="modal-footer">
          ${buttons.map(btn => `<button class="btn ${btn.class}" id="modal-btn-${btn.text.toLowerCase()}">${btn.text}</button>`).join('')}
        </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(modalOverlay);

    // Event Listeners
    const closeModal = () => modalOverlay.remove();
    modalOverlay.querySelector('.modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    buttons.forEach(btn => {
      modalOverlay.querySelector(`#modal-btn-${btn.text.toLowerCase()}`).addEventListener('click', () => {
        btn.action();
        closeModal();
      });
    });

    return modalOverlay;
  }

  /**
   * Show a confirmation dialog
   * @param {string} title - The title of the dialog
   * @param {string} message - The confirmation message
   * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise
   */
  showConfirmation(title, message) {
    return new Promise((resolve) => {
      const content = `<p>${message}</p>`;
      const buttons = [
        { text: 'Cancel', class: 'btn-secondary', action: () => resolve(false) },
        { text: 'Confirm', class: 'btn-primary', action: () => resolve(true) }
      ];
      this.showModal(title, content, buttons);
    });
  }
}

// Export a singleton instance
export const uiNotificationService = new UINotificationService();
