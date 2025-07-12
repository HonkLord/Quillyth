/**
 * SceneActionSystem - Handles action queue management and processing
 * Extracted from SceneManager to improve modularity and maintainability
 */
export class SceneActionSystem {
  constructor() {
    this.actionQueue = [];
    this.currentActionIndex = 0;
    this.isProcessingActions = false;
    this.currentAction = null;
    this.currentResult = null;
  }

  /**
   * Add player action to the queue
   */
  addPlayerActionToQueue(playerId, sceneDataManager) {
    const players = sceneDataManager
      .getAllCharacters()
      .filter((c) => c.type === "player");
    const player = players.find(
      (p) => p.id === playerId || p.name === playerId
    );

    if (!player) {
      console.error(`Player not found: ${playerId}`);
      return;
    }

    const action = {
      id: `player-${playerId}-${Date.now()}`,
      type: "player",
      playerId: playerId,
      playerName: player.name,
      description: "", // Will be filled by user input
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    this.actionQueue.push(action);
    this.updateActionQueueDisplay();
    console.log(`➕ Added player action for ${player.name}`);
  }

  /**
   * Add NPC action to the queue
   */
  addNPCActionToQueue(npcId, sceneDataManager) {
    const npcs = sceneDataManager
      .getAllCharacters()
      .filter((c) => c.type === "npc");
    const npc = npcs.find((n) => n.id === npcId || n.name === npcId);

    if (!npc) {
      console.error(`NPC not found: ${npcId}`);
      return;
    }

    const action = {
      id: `npc-${npcId}-${Date.now()}`,
      type: "npc",
      npcId: npcId,
      npcName: npc.name,
      description: "", // Will be filled by user input or AI
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    this.actionQueue.push(action);
    this.updateActionQueueDisplay();
    console.log(`➕ Added NPC action for ${npc.name}`);
  }

  /**
   * Add external activity to the queue
   */
  addExternalActivityToQueue(activityType) {
    const action = {
      id: `external-${activityType}-${Date.now()}`,
      type: "external",
      activityType: activityType,
      description: "", // Will be filled by user input
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    this.actionQueue.push(action);
    this.updateActionQueueDisplay();
    console.log(`➕ Added external activity: ${activityType}`);
  }

  /**
   * Remove action from queue
   */
  removeActionFromQueue(actionId) {
    const index = this.actionQueue.findIndex(
      (action) => action.id === actionId
    );
    if (index !== -1) {
      this.actionQueue.splice(index, 1);
      this.updateActionQueueDisplay();
      console.log(`➖ Removed action: ${actionId}`);
    }
  }

  /**
   * Move action up in queue
   */
  moveActionUp(actionId) {
    const index = this.actionQueue.findIndex(
      (action) => action.id === actionId
    );
    if (index > 0) {
      [this.actionQueue[index], this.actionQueue[index - 1]] = [
        this.actionQueue[index - 1],
        this.actionQueue[index],
      ];
      this.updateActionQueueDisplay();
    }
  }

  /**
   * Move action down in queue
   */
  moveActionDown(actionId) {
    const index = this.actionQueue.findIndex(
      (action) => action.id === actionId
    );
    if (index < this.actionQueue.length - 1) {
      [this.actionQueue[index], this.actionQueue[index + 1]] = [
        this.actionQueue[index + 1],
        this.actionQueue[index],
      ];
      this.updateActionQueueDisplay();
    }
  }

  /**
   * Clear all actions from queue
   */
  clearAllActions() {
    this.actionQueue = [];
    this.currentActionIndex = 0;
    this.isProcessingActions = false;
    this.currentAction = null;
    this.currentResult = null;
    this.updateActionQueueDisplay();
    console.log("🧹 Cleared all actions from queue");
  }

  /**
   * Get action type label for display
   */
  getActionTypeLabel(action) {
    switch (action.type) {
      case "player":
        return `${action.playerName} Action`;
      case "npc":
        return `${action.npcName} Action`;
      case "external":
        return this.getExternalActivityLabel(action.activityType);
      default:
        return "Unknown Action";
    }
  }

  /**
   * Get external activity label
   */
  getExternalActivityLabel(type) {
    const labels = {
      environment: "Environmental Change",
      weather: "Weather Event",
      time: "Time Passage",
      encounter: "Random Encounter",
      complication: "Complication",
      discovery: "Discovery",
      other: "Other Event",
    };
    return labels[type] || "External Activity";
  }

  /**
   * Get action actor name
   */
  getActionActor(action) {
    switch (action.type) {
      case "player":
        return action.playerName;
      case "npc":
        return action.npcName;
      case "external":
        return "Environment";
      default:
        return "Unknown";
    }
  }

  /**
   * Update action queue display
   */
  updateActionQueueDisplay() {
    // Update compact display
    const compactContainer = document.querySelector(".action-queue-compact");
    if (compactContainer) {
      this.updateCompactActionQueueDisplay(compactContainer);
    }

    // Update full display
    const fullContainer = document.querySelector(".action-queue-full");
    if (fullContainer) {
      this.updateFullActionQueueDisplay(fullContainer);
    }
  }

  /**
   * Update compact action queue display
   */
  updateCompactActionQueueDisplay(container) {
    if (!container) return;

    const queueList = container.querySelector(".action-queue-list");
    if (!queueList) return;

    if (this.actionQueue.length === 0) {
      queueList.innerHTML = '<div class="no-actions">No actions queued</div>';
      return;
    }

    queueList.innerHTML = this.actionQueue
      .map(
        (action, index) => `
      <div class="action-item ${action.status}" data-action-id="${action.id}">
        <div class="action-info">
          <div class="action-type">${this.getActionTypeLabel(action)}</div>
          <div class="action-description">${
            action.description || "No description"
          }</div>
        </div>
        <div class="action-controls">
          <button class="btn-small" onclick="window.sceneManager.actionSystem.moveActionUp('${
            action.id
          }')" 
                  ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="btn-small" onclick="window.sceneManager.actionSystem.moveActionDown('${
            action.id
          }')" 
                  ${
                    index === this.actionQueue.length - 1 ? "disabled" : ""
                  }>↓</button>
          <button class="btn-small btn-danger" onclick="window.sceneManager.actionSystem.removeActionFromQueue('${
            action.id
          }')">×</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Update full action queue display
   */
  updateFullActionQueueDisplay(container) {
    if (!container) return;

    const queueList = container.querySelector(".action-queue-list");
    if (!queueList) return;

    if (this.actionQueue.length === 0) {
      queueList.innerHTML = '<div class="no-actions">No actions queued</div>';
      return;
    }

    queueList.innerHTML = this.actionQueue
      .map(
        (action, index) => `
      <div class="action-item-full ${action.status}" data-action-id="${
          action.id
        }">
        <div class="action-header">
          <div class="action-type">${this.getActionTypeLabel(action)}</div>
          <div class="action-timestamp">${new Date(
            action.timestamp
          ).toLocaleTimeString()}</div>
        </div>
        <div class="action-content">
          <div class="action-description">${
            action.description || "No description"
          }</div>
          <div class="action-controls">
            <button class="btn-small" onclick="window.sceneManager.actionSystem.moveActionUp('${
              action.id
            }')" 
                    ${index === 0 ? "disabled" : ""}>Move Up</button>
            <button class="btn-small" onclick="window.sceneManager.actionSystem.moveActionDown('${
              action.id
            }')" 
                    ${
                      index === this.actionQueue.length - 1 ? "disabled" : ""
                    }>Move Down</button>
            <button class="btn-small btn-danger" onclick="window.sceneManager.actionSystem.removeActionFromQueue('${
              action.id
            }')">Remove</button>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Show current action processing (compact view)
   */
  showCurrentActionProcessingCompact(action) {
    const container = document.querySelector(
      ".current-action-processing-compact"
    );
    if (!container) return;

    container.innerHTML = `
      <div class="processing-action">
        <div class="processing-header">
          <div class="processing-title">Processing: ${this.getActionTypeLabel(
            action
          )}</div>
          <div class="processing-spinner">⚙️</div>
        </div>
        <div class="processing-description">${action.description}</div>
      </div>
    `;
    container.classList.remove("hidden");
  }

  /**
   * Show action result (compact view)
   */
  showActionResultCompact(action, result) {
    const container = document.querySelector(".action-result-compact");
    if (!container) return;

    container.innerHTML = `
      <div class="action-result">
        <div class="result-header">
          <div class="result-title">Result: ${this.getActionTypeLabel(
            action
          )}</div>
          <div class="result-actions">
            <button class="btn-small btn-success" onclick="window.sceneManager.actionSystem.acceptCurrentResult()">Accept</button>
            <button class="btn-small" onclick="window.sceneManager.actionSystem.regenerateCurrentResult()">Regenerate</button>
          </div>
        </div>
        <div class="result-content">${
          result.description || result.narrative
        }</div>
      </div>
    `;
    container.classList.remove("hidden");
  }

  /**
   * Hide current action processing (compact view)
   */
  hideCurrentActionProcessingCompact() {
    const container = document.querySelector(
      ".current-action-processing-compact"
    );
    if (container) {
      container.classList.add("hidden");
    }
  }

  /**
   * Get current action queue
   */
  getActionQueue() {
    return this.actionQueue;
  }

  /**
   * Get current action
   */
  getCurrentAction() {
    return this.currentAction;
  }

  /**
   * Set current action
   */
  setCurrentAction(action) {
    this.currentAction = action;
  }

  /**
   * Get current result
   */
  getCurrentResult() {
    return this.currentResult;
  }

  /**
   * Set current result
   */
  setCurrentResult(result) {
    this.currentResult = result;
  }

  /**
   * Get processing status
   */
  isProcessing() {
    return this.isProcessingActions;
  }

  /**
   * Set processing status
   */
  setProcessing(status) {
    this.isProcessingActions = status;
  }

  /**
   * Get current action index
   */
  getCurrentActionIndex() {
    return this.currentActionIndex;
  }

  /**
   * Set current action index
   */
  setCurrentActionIndex(index) {
    this.currentActionIndex = index;
  }

  /**
   * Accept current result and move to next action
   */
  acceptCurrentResult() {
    if (this.currentAction && this.currentResult) {
      this.currentAction.status = "completed";
      this.currentAction.result = this.currentResult;

      // Update displays
      this.updateActionQueueDisplay();
      this.hideCurrentActionProcessingCompact();

      // Move to next action
      this.currentActionIndex++;

      console.log(`✅ Accepted result for action: ${this.currentAction.id}`);
    }
  }

  /**
   * Regenerate current result
   */
  regenerateCurrentResult() {
    if (this.currentAction) {
      console.log(
        `🔄 Regenerating result for action: ${this.currentAction.id}`
      );
      // This will be handled by the AI integration module
      return this.currentAction;
    }
    return null;
  }
}
