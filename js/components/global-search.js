import { SearchService } from "../services/search-service.js";

/**
 * Global Search Component
 * Provides unified search interface across all content types
 */
export class GlobalSearch {
  constructor() {
    this.searchService = new SearchService();
    this.isVisible = false;
    this.currentResults = [];
    this.selectedIndex = -1;
    this.searchTimeout = null;
    this.minQueryLength = 2;

    this.init();
  }

  /**
   * Initialize the global search component
   */
  init() {
    this.createSearchInterface();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  /**
   * Create the search interface HTML
   */
  createSearchInterface() {
    // Check if search interface already exists
    if (document.getElementById("global-search-container")) {
      return;
    }

    const searchContainer = document.createElement("div");
    searchContainer.id = "global-search-container";
    searchContainer.className = "global-search-container";

    searchContainer.innerHTML = `
      <div class="global-search-overlay" id="global-search-overlay"></div>
      <div class="global-search-modal" id="global-search-modal">
        <div class="search-header">
          <div class="search-input-container">
            <i class="fas fa-search search-icon"></i>
            <input 
              type="text" 
              id="global-search-input" 
              class="global-search-input" 
              placeholder="Search across all content... (Ctrl+K)"
              autocomplete="off"
            />
            <button class="search-close-btn" id="search-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="search-filters" id="search-filters">
            <button class="filter-btn active" data-type="all">All</button>
            <button class="filter-btn" data-type="scenes">Scenes</button>
            <button class="filter-btn" data-type="characters">Characters</button>
            <button class="filter-btn" data-type="quests">Quests</button>
            <button class="filter-btn" data-type="notes">Notes</button>
            <button class="filter-btn" data-type="locations">Locations</button>
          </div>
        </div>
        
        <div class="search-results-container">
          <div id="search-results" class="search-results">
            <div class="search-placeholder">
              <i class="fas fa-search"></i>
              <p>Start typing to search across all your campaign content...</p>
              <div class="search-tips">
                <span>💡 Tips:</span>
                <ul>
                  <li>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate results</li>
                  <li>Press <kbd>Enter</kbd> to open selected item</li>
                  <li>Use <kbd>Esc</kbd> to close search</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div class="search-footer">
          <div class="search-stats" id="search-stats"></div>
          <div class="search-shortcuts">
            <kbd>Ctrl</kbd> + <kbd>K</kbd> to search • <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(searchContainer);
  }

  /**
   * Setup event listeners for search functionality
   */
  setupEventListeners() {
    const searchInput = document.getElementById("global-search-input");
    const searchOverlay = document.getElementById("global-search-overlay");
    const closeBtn = document.getElementById("search-close-btn");
    const filterBtns = document.querySelectorAll(".filter-btn");

    // Search input events
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.handleSearchInput(e.target.value);
      });

      searchInput.addEventListener("keydown", (e) => {
        this.handleKeyNavigation(e);
      });
    }

    // Close search events
    if (searchOverlay) {
      searchOverlay.addEventListener("click", () => {
        this.hideSearch();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.hideSearch();
      });
    }

    // Filter button events
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.handleFilterChange(e.target.dataset.type);
      });
    });

    // Results container click handling
    const resultsContainer = document.getElementById("search-results");
    if (resultsContainer) {
      resultsContainer.addEventListener("click", (e) => {
        const resultItem = e.target.closest(".search-result-item");
        if (resultItem) {
          this.handleResultClick(resultItem);
        }
      });
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.showSearch();
      }

      // Escape to close search
      if (e.key === "Escape" && this.isVisible) {
        this.hideSearch();
      }
    });
  }

  /**
   * Show the search interface
   */
  showSearch() {
    const container = document.getElementById("global-search-container");
    const input = document.getElementById("global-search-input");

    if (container && input) {
      container.style.display = "flex";
      this.isVisible = true;

      // Focus the input after a short delay to ensure it's visible
      setTimeout(() => {
        input.focus();
        input.select();
      }, 100);
    }
  }

  /**
   * Hide the search interface
   */
  hideSearch() {
    const container = document.getElementById("global-search-container");
    const input = document.getElementById("global-search-input");

    if (container) {
      container.style.display = "none";
      this.isVisible = false;
      this.selectedIndex = -1;

      if (input) {
        input.value = "";
      }

      this.clearResults();
    }
  }

  /**
   * Handle search input changes
   * @param {string} query - Search query
   */
  async handleSearchInput(query) {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search
    this.searchTimeout = setTimeout(async () => {
      await this.performSearch(query);
    }, 300);
  }

  /**
   * Perform the actual search
   * @param {string} query - Search query
   */
  async performSearch(query) {
    const resultsContainer = document.getElementById("search-results");
    const statsContainer = document.getElementById("search-stats");

    if (!resultsContainer) return;

    if (query.length < this.minQueryLength) {
      this.showPlaceholder();
      return;
    }

    // Show loading state
    resultsContainer.innerHTML = `
      <div class="search-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Searching...</p>
      </div>
    `;

    try {
      // Get active filter
      const activeFilter =
        document.querySelector(".filter-btn.active")?.dataset.type;
      const searchOptions =
        activeFilter === "all" ? {} : { types: [activeFilter] };

      // Perform search
      const results = await this.searchService.globalSearch(
        query,
        searchOptions
      );
      this.currentResults = results;
      this.selectedIndex = -1;

      // Display results
      this.displayResults(results, query);

      // Update stats
      if (statsContainer) {
        statsContainer.textContent = `${results.length} result${
          results.length !== 1 ? "s" : ""
        } found`;
      }
    } catch (error) {
      console.error("Search error:", error);
      resultsContainer.innerHTML = `
        <div class="search-error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Search error occurred. Please try again.</p>
        </div>
      `;
    }
  }

  /**
   * Display search results
   * @param {Array} results - Search results
   * @param {string} query - Original query for highlighting
   */
  displayResults(results, query) {
    const resultsContainer = document.getElementById("search-results");
    if (!resultsContainer) return;

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-no-results">
          <i class="fas fa-search"></i>
          <p>No results found for "${query}"</p>
          <div class="search-suggestions">
            <span>Try:</span>
            <ul>
              <li>Different keywords</li>
              <li>Checking spelling</li>
              <li>Using broader terms</li>
            </ul>
          </div>
        </div>
      `;
      return;
    }

    const resultsHTML = results
      .map((result, index) => {
        const typeIcon = this.getTypeIcon(result.type);
        const typeLabel = this.getTypeLabel(result.type);

        return `
        <div class="search-result-item" data-index="${index}" data-type="${
          result.type
        }" data-id="${result.id}">
          <div class="result-icon">
            <i class="${typeIcon}"></i>
          </div>
          <div class="result-content">
            <div class="result-header">
              <h4 class="result-title">${this.highlightQuery(
                result.title,
                query
              )}</h4>
              <span class="result-type">${typeLabel}</span>
            </div>
            <p class="result-description">${this.highlightQuery(
              result.description,
              query
            )}</p>
            <div class="result-score">Relevance: ${Math.round(
              result.score
            )}</div>
          </div>
        </div>
      `;
      })
      .join("");

    resultsContainer.innerHTML = resultsHTML;
  }

  /**
   * Show placeholder content
   */
  showPlaceholder() {
    const resultsContainer = document.getElementById("search-results");
    const statsContainer = document.getElementById("search-stats");

    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="search-placeholder">
          <i class="fas fa-search"></i>
          <p>Start typing to search across all your campaign content...</p>
          <div class="search-tips">
            <span>💡 Tips:</span>
            <ul>
              <li>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate results</li>
              <li>Press <kbd>Enter</kbd> to open selected item</li>
              <li>Use <kbd>Esc</kbd> to close search</li>
            </ul>
          </div>
        </div>
      `;
    }

    if (statsContainer) {
      statsContainer.textContent = "";
    }
  }

  /**
   * Clear search results
   */
  clearResults() {
    this.currentResults = [];
    this.showPlaceholder();
  }

  /**
   * Handle keyboard navigation in results
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyNavigation(e) {
    if (this.currentResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.currentResults.length - 1
        );
        this.updateSelection();
        break;

      case "ArrowUp":
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;

      case "Enter":
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.navigateToResult(this.currentResults[this.selectedIndex]);
        }
        break;
    }
  }

  /**
   * Update visual selection in results
   */
  updateSelection() {
    const resultItems = document.querySelectorAll(".search-result-item");

    resultItems.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add("selected");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("selected");
      }
    });
  }

  /**
   * Handle filter change
   * @param {string} filterType - Filter type
   */
  handleFilterChange(filterType) {
    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    document
      .querySelector(`[data-type="${filterType}"]`)
      .classList.add("active");

    // Re-run search with new filter
    const query = document.getElementById("global-search-input")?.value;
    if (query && query.length >= this.minQueryLength) {
      this.performSearch(query);
    }
  }

  /**
   * Handle result click
   * @param {HTMLElement} resultItem - Clicked result item
   */
  handleResultClick(resultItem) {
    const index = parseInt(resultItem.dataset.index);
    if (index >= 0 && index < this.currentResults.length) {
      this.navigateToResult(this.currentResults[index]);
    }
  }

  /**
   * Navigate to a search result
   * @param {Object} result - Search result object
   */
  navigateToResult(result) {
    this.hideSearch();

    // Navigate based on content type
    switch (result.type) {
      case "scenes":
        if (window.sceneManager) {
          window.sceneManager.navigateToScene(result.id);
        }
        break;

      case "characters":
        if (window.characterManager) {
          window.characterManager.showCharacterDetails(result.id);
        }
        break;

      case "quests":
        if (window.questManager) {
          window.questManager.showQuestDetails(result.id);
        }
        break;

      case "notes":
        if (window.notesManager) {
          window.notesManager.showNoteDetails(result.id);
        }
        break;

      case "locations":
        if (window.sceneManager) {
          window.sceneManager.navigateToLocation(result.id);
        }
        break;

      default:
        console.log("Navigation not implemented for type:", result.type);
    }
  }

  /**
   * Get icon for content type
   * @param {string} type - Content type
   * @returns {string} Icon class
   */
  getTypeIcon(type) {
    const icons = {
      scenes: "fas fa-map-marker-alt",
      characters: "fas fa-users",
      locations: "fas fa-map",
      quests: "fas fa-scroll",
      notes: "fas fa-sticky-note",
      players: "fas fa-user-friends",
    };

    return icons[type] || "fas fa-file";
  }

  /**
   * Get label for content type
   * @param {string} type - Content type
   * @returns {string} Human-readable label
   */
  getTypeLabel(type) {
    const labels = {
      scenes: "Scene",
      characters: "Character",
      locations: "Location",
      quests: "Quest",
      notes: "Note",
      players: "Player",
    };

    return labels[type] || type;
  }

  /**
   * Highlight search query in text
   * @param {string} text - Text to highlight
   * @param {string} query - Search query
   * @returns {string} Text with highlighted query
   */
  highlightQuery(text, query) {
    if (!query || !text) return text;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  /**
   * Escape regex special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
