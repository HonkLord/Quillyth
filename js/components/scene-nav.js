export class SceneNavigation {
  constructor() {
    this.scenes = [];
    this.expandedScenes = new Set();
    this.searchTerm = "";
  }

  init(scenes) {
    this.scenes = scenes;
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById("scene-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.render();
      });
    }

    // Expand/collapse functionality
    document.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("expand-button") &&
        e.target.closest(".scene-nav-group")
      ) {
        const sceneId = e.target.dataset.sceneId;
        this.toggleExpanded(sceneId);
      }
    });
  }

  toggleExpanded(sceneId) {
    if (this.expandedScenes.has(sceneId)) {
      this.expandedScenes.delete(sceneId);
    } else {
      this.expandedScenes.add(sceneId);
    }
    this.render();
  }

  render() {
    const container = document.getElementById("nav-content-tree");
    if (!container) return;

    container.innerHTML = this.renderSceneTree(this.scenes, 0);
  }

  renderSceneTree(scenes, depth = 0) {
    if (!scenes || scenes.length === 0) {
      return '<div class="no-scenes">No scenes available. <button onclick="sceneManager.createNewScene()" class="btn-primary">Create First Scene</button></div>';
    }

    return scenes
      .filter((scene) => this.matchesSearch(scene))
      .map((scene) => this.renderSceneNode(scene, depth))
      .join("");
  }

  renderSceneNode(scene, depth) {
    const hasChildren = scene.children && scene.children.length > 0;
    const isExpanded = this.expandedScenes.has(scene.id);
    const depthClass = `depth-${Math.min(depth, 4)}`;

    return `
            <div class="scene-nav-group ${depthClass}" data-scene-id="${
      scene.id
    }">
                <div class="scene-nav-link-container">
                    ${
                      hasChildren
                        ? `
                        <button class="expand-button ${
                          isExpanded ? "expanded" : ""
                        }" 
                                data-scene-id="${scene.id}">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    `
                        : '<div class="expand-spacer"></div>'
                    }
                    
                    <div class="scene-nav-link" data-scene-id="${scene.id}">
                        <div class="scene-nav-content">
                            <div class="scene-name">${scene.name}</div>
                            <div class="scene-meta">
                                <span class="scene-type">${
                                  scene.scene_type || "scene"
                                }</span>
                                ${
                                  scene.characters &&
                                  scene.characters.length > 0
                                    ? `<span class="character-count">${scene.characters.length} chars</span>`
                                    : ""
                                }
                                ${
                                  scene.pathHistory &&
                                  scene.pathHistory.length > 0
                                    ? `<span class="progress-indicator">${scene.pathHistory.length} steps</span>`
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>
                
                ${
                  hasChildren && isExpanded
                    ? `
                    <div class="scene-nav-content">
                        ${this.renderSceneTree(scene.children, depth + 1)}
                    </div>
                `
                    : ""
                }
            </div>
        `;
  }

  matchesSearch(scene) {
    if (!this.searchTerm) return true;

    const searchableText = [
      scene.name,
      scene.description,
      scene.scene_type,
      ...(scene.characters || []).map((c) => c.name),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(this.searchTerm);
  }

  updateActive(sceneId) {
    // Remove previous active states
    document.querySelectorAll(".scene-nav-link.selected").forEach((link) => {
      link.classList.remove("selected");
    });

    // Add active state to current scene
    const activeLink = document.querySelector(
      `[data-scene-id="${sceneId}"] .scene-nav-link`
    );
    if (activeLink) {
      activeLink.classList.add("selected");

      // Ensure parent scenes are expanded
      this.expandParentScenes(sceneId);
    }
  }

  expandParentScenes(sceneId) {
    const scene = this.findSceneById(sceneId);
    if (scene && scene.parent_id) {
      this.expandedScenes.add(scene.parent_id);
      this.expandParentScenes(scene.parent_id);
      this.render();
    }
  }

  findSceneById(sceneId) {
    const findRecursive = (scenes) => {
      for (const scene of scenes) {
        if (scene.id === sceneId) return scene;
        const found = findRecursive(scene.children || []);
        if (found) return found;
      }
      return null;
    };
    return findRecursive(this.scenes);
  }
}
