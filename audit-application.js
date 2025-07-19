#!/usr/bin/env node

/**
 * Application Audit Script
 * Comprehensive check for feature, page, and CSS alignment
 *
 * Configuration:
 * - TEST_BASE_URL: Base URL for API endpoints (default: "http://localhost:3000")
 * - AUDIT_BASE_URL: Alternative environment variable for base URL
 * - AUDIT_ENFORCE_CDN: Enable/disable CDN usage enforcement (default: "true")
 *
 * Usage examples:
 *   node audit-application.js
 *   TEST_BASE_URL=http://staging.example.com node audit-application.js
 *   AUDIT_BASE_URL=http://production.example.com node audit-application.js
 *   AUDIT_ENFORCE_CDN=false node audit-application.js  # Disable CDN check for airgapped environments
 */

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

/**
 * Get base URL from configuration sources
 * Priority: 1. Environment variables, 2. Config file, 3. Default fallback
 * @returns {string} Base URL for testing
 */
function getBaseUrl() {
  // Check environment variables first
  if (process.env.TEST_BASE_URL) {
    return process.env.TEST_BASE_URL;
  }

  if (process.env.AUDIT_BASE_URL) {
    return process.env.AUDIT_BASE_URL;
  }

  // Try to read from config file
  try {
    const configPath = path.join(__dirname, "js", "shared", "config.js");
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, "utf8");
      // Look specifically for TESTING.BASE_URL
      const baseUrlMatch = configContent.match(
        /TESTING:\s*{[\s\S]*?BASE_URL:\s*"([^"]+)"/
      );
      if (baseUrlMatch) {
        return baseUrlMatch[1];
      }
    }
  } catch (error) {
    // Silently fall back to default if config file can't be read
  }

  // Default fallback
  return "http://localhost:3000";
}

/**
 * Check if CDN usage should be enforced
 * Priority: 1. Environment variable AUDIT_ENFORCE_CDN, 2. Config file, 3. Default true
 * @returns {boolean} Whether to enforce CDN usage
 */
function shouldEnforceCDN() {
  // Check environment variable first
  if (process.env.AUDIT_ENFORCE_CDN !== undefined) {
    return process.env.AUDIT_ENFORCE_CDN.toLowerCase() === "true";
  }

  // Try to read from config file
  try {
    const configPath = path.join(__dirname, "js", "shared", "config.js");
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, "utf8");
      // Look for AUDIT.ENFORCE_CDN setting
      const cdnMatch = configContent.match(
        /AUDIT:\s*{[\s\S]*?ENFORCE_CDN:\s*(true|false)/
      );
      if (cdnMatch) {
        return cdnMatch[1] === "true";
      }
    }
  } catch (error) {
    // Silently fall back to default if config file can't be read
  }

  // Default fallback - enforce CDN by default for production-like environments
  return true;
}

class ApplicationAuditor {
  constructor() {
    this.baseUrl = getBaseUrl();
    this.config = this.loadConfiguration();
    this.enforceCDN = shouldEnforceCDN();
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0,
      details: [],
    };
  }

  /**
   * Load audit configuration from JSON file
   * @returns {Object} Configuration object
   */
  loadConfiguration() {
    try {
      const configPath = path.join(__dirname, "audit-config.json");
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, "utf8");
        return JSON.parse(configContent);
      } else {
        console.warn("⚠️  Configuration file not found: audit-config.json");
        console.warn("   Using fallback configuration...");
        return this.getFallbackConfiguration();
      }
    } catch (error) {
      console.error("❌ Error loading configuration:", error.message);
      console.warn("   Using fallback configuration...");
      return this.getFallbackConfiguration();
    }
  }

  /**
   * Fallback configuration if config file is missing or invalid
   * @returns {Object} Fallback configuration
   */
  getFallbackConfiguration() {
    return {
      css: {
        requiredImports: [
          "./base/variables.css",
          "./base/reset.css",
          "./base/typography.css",
          "./base/layout.css",
          "./components/navigation.css",
          "./components/dashboard.css",
          "./components/scenes.css",
          "./components/characters.css",
          "./components/quests.css",
          "./components/sessions.css",
          "./components/campaigns.css",
          "./components/locations.css",
          "./components/notifications.css",
          "./components/search.css",
          "./components/buttons.css",
          "./components/forms.css",
          "./components/modals.css",
          "./components/cards.css",
        ],
      },
      html: {
        requiredSections: [
          "dashboard-content",
          "scenes-content",
          "characters-content",
          "relationships-content",
          "locations-content",
          "quests-content",
          "notes-content",
          "sessions-content",
          "campaign-content",
          "export-import-content",
        ],
        requiredNavTabs: [
          "nav-dashboard",
          "nav-scenes",
          "nav-characters",
          "nav-relationships",
          "nav-locations",
          "nav-quests",
          "nav-notes",
          "nav-sessions",
          "nav-campaign",
          "nav-export-import",
        ],
        requiredClasses: [
          "app-container",
          "top-nav",
          "main-nav-tabs",
          "main-nav-tab",
          "workspace-content",
          "content-area",
          "management-panel",
          "dashboard-grid",
          "stat-card",
          "section-title",
        ],
        handledActions: [
          "edit-campaign-title",
          "show-dashboard",
          "show-scenes",
          "show-characters",
          "show-relationships",
          "show-locations",
          "show-quests",
          "show-notes",
          "show-sessions",
          "show-campaign",
          "show-export-import",
          "show-quick-actions",
          "toggle-scene-tree",
        ],
      },
      javascript: {
        requiredImports: [
          "SceneManager",
          "CharacterManager",
          "PlayerArcManager",
          "QuestManager",
          "NotesManager",
          "SessionManager",
          "LocationManager",
          "ExportImportPanel",
        ],
        requiredFeatures: [
          "scenes",
          "characters",
          "player-arcs",
          "quests",
          "notes",
          "sessions",
          "locations",
        ],
        requiredManagers: [
          { name: "scene-manager.js", feature: "scenes" },
          { name: "character-manager.js", feature: "characters" },
          { name: "player-arc-manager.js", feature: "player-arcs" },
          { name: "quest-manager.js", feature: "quests" },
          { name: "notes-manager.js", feature: "notes" },
          { name: "session-manager-new.js", feature: "sessions" },
          { name: "location-manager.js", feature: "locations" },
        ],
        featureFiles: [
          {
            name: "scenes",
            files: ["scene-core.js", "scene-manager.js", "scene-ui.js"],
          },
          {
            name: "characters",
            files: [
              "character-core.js",
              "character-manager.js",
              "character-ui.js",
            ],
          },
          {
            name: "player-arcs",
            files: [
              "player-arc-core.js",
              "player-arc-manager.js",
              "player-arc-ui.js",
            ],
          },
          {
            name: "quests",
            files: ["quest-core.js", "quest-manager.js", "quest-ui.js"],
          },
          {
            name: "notes",
            files: ["notes-manager.js"],
          },
          {
            name: "sessions",
            files: [
              "session-core.js",
              "session-manager-new.js",
              "session-ui.js",
            ],
          },
          {
            name: "locations",
            files: [
              "location-core.js",
              "location-manager.js",
              "location-ui.js",
            ],
          },
        ],
      },
      api: {
        requiredRoutes: [
          "campaigns.js",
          "characters.js",
          "character-relationships.js",
          "locations.js",
          "notes.js",
          "player-arcs.js",
          "quests.js",
          "scenes.js",
          "sessions.js",
        ],
      },
      database: {
        requiredTables: [
          "campaigns",
          "sessions",
          "scenes",
          "scene_characters",
          "players",
          "npcs",
          "locations",
          "quests",
          "notes",
          "character_notes",
          "character_relationships",
          "character_progression",
          "player_arcs",
          "scene_cards",
        ],
      },
      responsive: {
        requiredMediaQueries: [
          "@media (max-width: 768px)",
          "@media (max-width: 1024px)",
          "@media (min-width: 1200px)",
        ],
      },
      audit: {
        enforceCDN: true, // Can be overridden by environment variable or config file
      },
    };
  }

  async test(name, testFn, isWarning = false) {
    this.results.total++;
    console.log(`\n🔍 Auditing: ${name}`);

    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ PASS: ${name}`);
      this.results.details.push({
        name,
        status: "PASS",
        error: null,
        warning: false,
      });
    } catch (error) {
      if (isWarning) {
        this.results.warnings++;
        console.log(`⚠️  WARNING: ${name} - ${error.message}`);
        this.results.details.push({
          name,
          status: "WARNING",
          error: error.message,
          warning: true,
        });
      } else {
        this.results.failed++;
        console.log(`❌ FAIL: ${name} - ${error.message}`);
        this.results.details.push({
          name,
          status: "FAIL",
          error: error.message,
          warning: false,
        });
      }
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  // ==========================================
  // HTML STRUCTURE AUDIT
  // ==========================================

  async auditHTMLStructure() {
    await this.test("HTML Structure Validation", async () => {
      const htmlContent = fs.readFileSync("index.html", "utf8");

      // Check for required sections from configuration
      const requiredSections = this.config.html.requiredSections;

      for (const section of requiredSections) {
        this.assert(
          htmlContent.includes(`id="${section}"`),
          `Missing content section: ${section}`
        );
      }

      // Check for navigation tabs from configuration
      const requiredNavTabs = this.config.html.requiredNavTabs;

      for (const tab of requiredNavTabs) {
        this.assert(
          htmlContent.includes(`id="${tab}"`),
          `Missing navigation tab: ${tab}`
        );
      }

      // Check for data-action attributes (no onclick)
      const onclickMatches = htmlContent.match(/onclick=/g) || [];
      this.assert(
        onclickMatches.length <= 1,
        `Too many onclick handlers found: ${onclickMatches.length}`
      );

      this.assert(
        htmlContent.includes("data-action="),
        "Missing data-action attributes for event delegation"
      );
    });
  }

  // ==========================================
  // CSS STRUCTURE AUDIT
  // ==========================================

  async auditCSSStructure() {
    await this.test("CSS Structure Validation", async () => {
      const mainCSS = fs.readFileSync("css/main.css", "utf8");

      // Check for required CSS imports from configuration
      const requiredImports = this.config.css.requiredImports;

      for (const importPath of requiredImports) {
        this.assert(
          mainCSS.includes(`@import url("${importPath}")`),
          `Missing CSS import: ${importPath}`
        );
      }

      // Check that all imported CSS files exist
      for (const importPath of requiredImports) {
        const cssPath = path.join("css", importPath.replace("./", ""));
        this.assert(
          fs.existsSync(cssPath),
          `CSS file does not exist: ${cssPath}`
        );
      }
    });
  }

  // ==========================================
  // JAVASCRIPT MODULE AUDIT
  // ==========================================

  async auditJavaScriptModules() {
    await this.test("JavaScript Module Structure", async () => {
      const appJS = fs.readFileSync("js/app.js", "utf8");

      // Check for required imports from configuration
      const requiredImports = this.config.javascript.requiredImports;

      for (const importName of requiredImports) {
        this.assert(
          appJS.includes(importName),
          `Missing import: ${importName}`
        );
      }

      // Check for required feature directories from configuration
      const requiredFeatures = this.config.javascript.requiredFeatures;

      for (const feature of requiredFeatures) {
        const featurePath = path.join("js", "features", feature);
        this.assert(
          fs.existsSync(featurePath),
          `Missing feature directory: ${featurePath}`
        );
      }

      // Check for required manager files from configuration
      const requiredManagers = this.config.javascript.requiredManagers;

      for (const manager of requiredManagers) {
        const managerPath = path.join(
          "js",
          "features",
          manager.feature,
          manager.name
        );
        this.assert(
          fs.existsSync(managerPath),
          `Missing manager file: ${managerPath}`
        );
      }
    });
  }

  // ==========================================
  // API ENDPOINT AUDIT
  // ==========================================

  async auditAPIEndpoints() {
    await this.test("API Endpoints Validation", async () => {
      const serverJS = fs.readFileSync("server.js", "utf8");

      // Check for required route files from configuration
      const requiredRoutes = this.config.api.requiredRoutes;

      for (const route of requiredRoutes) {
        const routePath = path.join("routes", route);
        this.assert(
          fs.existsSync(routePath),
          `Missing route file: ${routePath}`
        );
      }

      // Check that routes are registered in server.js
      for (const route of requiredRoutes) {
        const routeName = route.replace(".js", "");
        const pattern1 = `require("./routes/${route}")`;
        const pattern2 = `require('./routes/${route}')`;
        const pattern3 = `require("./routes/${routeName}")`;
        const pattern4 = `require('./routes/${routeName}')`;

        this.assert(
          serverJS.includes(pattern1) ||
            serverJS.includes(pattern2) ||
            serverJS.includes(pattern3) ||
            serverJS.includes(pattern4),
          `Route not registered in server.js: ${routeName}`
        );
      }
    });
  }

  // ==========================================
  // DATABASE SCHEMA AUDIT
  // ==========================================

  async auditDatabaseSchema() {
    await this.test("Database Schema Validation", async () => {
      const serverJS = fs.readFileSync("server.js", "utf8");

      // Check for required tables from configuration
      const requiredTables = this.config.database.requiredTables;

      for (const table of requiredTables) {
        this.assert(
          serverJS.includes(`CREATE TABLE IF NOT EXISTS ${table}`),
          `Missing table creation: ${table}`
        );
      }
    });
  }

  // ==========================================
  // FEATURE ALIGNMENT AUDIT
  // ==========================================

  async auditFeatureAlignment() {
    await this.test("Feature Alignment Check", async () => {
      // Check that each feature has the required components from configuration
      const features = this.config.javascript.featureFiles;

      for (const feature of features) {
        for (const file of feature.files) {
          const filePath = path.join("js", "features", feature.name, file);
          this.assert(
            fs.existsSync(filePath),
            `Missing feature file: ${filePath}`
          );
        }
      }
    });
  }

  // ==========================================
  // CSS CLASS ALIGNMENT AUDIT
  // ==========================================

  async auditCSSClassAlignment() {
    await this.test("CSS Class Alignment", async () => {
      const htmlContent = fs.readFileSync("index.html", "utf8");

      // Extract all CSS classes from HTML
      const classMatches = htmlContent.match(/class="[^"]*"/g) || [];
      const classes = new Set();

      classMatches.forEach((match) => {
        const classList = match
          .replace(/class="/, "")
          .replace(/"/, "")
          .split(" ");
        classList.forEach((cls) => classes.add(cls));
      });

      // Check for required CSS classes from configuration
      const requiredClasses = this.config.html.requiredClasses;

      for (const className of requiredClasses) {
        this.assert(
          classes.has(className),
          `Missing CSS class in HTML: ${className}`
        );
      }
    });
  }

  // ==========================================
  // EVENT HANDLER ALIGNMENT AUDIT
  // ==========================================

  async auditEventHandlerAlignment() {
    await this.test("Event Handler Alignment", async () => {
      const appJS = fs.readFileSync("js/app.js", "utf8");
      const htmlContent = fs.readFileSync("index.html", "utf8");

      // Extract data-action values from HTML
      const actionMatches = htmlContent.match(/data-action="[^"]*"/g) || [];
      const actions = new Set();

      actionMatches.forEach((match) => {
        const action = match.replace(/data-action="/, "").replace(/"/, "");
        actions.add(action);
      });

      // Check that all data-action values are handled in app.js from configuration
      const handledActions = this.config.html.handledActions;

      for (const action of handledActions) {
        this.assert(
          appJS.includes(`case "${action}"`),
          `Missing event handler for: ${action}`
        );
      }
    });
  }

  // ==========================================
  // RESPONSIVE DESIGN AUDIT
  // ==========================================

  async auditResponsiveDesign() {
    await this.test("Responsive Design Check", async () => {
      const responsiveCSS = fs.readFileSync(
        "css/utilities/responsive.css",
        "utf8"
      );

      // Check for required media queries from configuration
      const requiredMediaQueries = this.config.responsive.requiredMediaQueries;

      for (const query of requiredMediaQueries) {
        this.assert(
          responsiveCSS.includes(query),
          `Missing media query: ${query}`
        );
      }
    });
  }

  // ==========================================
  // PERFORMANCE AUDIT
  // ==========================================

  async auditPerformance() {
    await this.test("Performance Optimization Check", async () => {
      const htmlContent = fs.readFileSync("index.html", "utf8");

      // Check for CSS versioning (cache busting)
      this.assert(
        htmlContent.includes("css/main.css?v="),
        "CSS file should have version parameter for cache busting"
      );

      // Check for external CDN usage (conditional based on configuration)
      if (this.enforceCDN) {
        this.assert(
          htmlContent.includes("cdnjs.cloudflare.com"),
          "Should use CDN for external libraries"
        );
      } else {
        console.log("   ℹ️  CDN usage check skipped (enforcement disabled)");
      }

      // Check for module scripts
      this.assert(
        htmlContent.includes('type="module"'),
        "Should use ES6 modules for JavaScript"
      );
    });
  }

  // ==========================================
  // ACCESSIBILITY AUDIT
  // ==========================================

  async auditAccessibility() {
    await this.test("Accessibility Check", async () => {
      const htmlContent = fs.readFileSync("index.html", "utf8");

      // Check for required accessibility attributes
      this.assert(
        htmlContent.includes('lang="en"'),
        "HTML should have language attribute"
      );

      this.assert(
        htmlContent.includes("title="),
        "Interactive elements should have title attributes"
      );

      this.assert(
        htmlContent.includes("aria-"),
        "Should include ARIA attributes for accessibility"
      );
    });
  }

  // ==========================================
  // RUN ALL AUDITS
  // ==========================================

  async runAllAudits() {
    console.log("🚀 Starting Application Audit");
    console.log("=====================================");
    console.log(`📋 Configuration:`);
    console.log(`   Base URL: ${this.baseUrl}`);
    console.log(
      `   CDN Enforcement: ${this.enforceCDN ? "Enabled" : "Disabled"}`
    );
    console.log(
      `   Config Source: ${
        fs.existsSync(path.join(__dirname, "audit-config.json"))
          ? "audit-config.json"
          : "fallback configuration"
      }`
    );
    console.log("=====================================\n");

    // Run all audit tests
    await this.auditHTMLStructure();
    await this.auditCSSStructure();
    await this.auditJavaScriptModules();
    await this.auditAPIEndpoints();
    await this.auditDatabaseSchema();
    await this.auditFeatureAlignment();
    await this.auditCSSClassAlignment();
    await this.auditEventHandlerAlignment();
    await this.auditResponsiveDesign();
    await this.auditPerformance();
    await this.auditAccessibility();

    this.printResults();
  }

  printResults() {
    console.log("\n=====================================");
    console.log("📊 AUDIT RESULTS SUMMARY");
    console.log("=====================================");
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📈 Total: ${this.results.total}`);
    console.log("=====================================\n");

    if (this.results.failed > 0) {
      console.log("❌ FAILED TESTS:");
      this.results.details
        .filter((d) => d.status === "FAIL")
        .forEach((d) => console.log(`   - ${d.name}: ${d.error}`));
    }

    if (this.results.warnings > 0) {
      console.log("\n⚠️  WARNINGS:");
      this.results.details
        .filter((d) => d.status === "WARNING")
        .forEach((d) => console.log(`   - ${d.name}: ${d.error}`));
    }

    if (this.results.failed === 0 && this.results.warnings === 0) {
      console.log("🎉 All audits passed! Your application is well-aligned.");
    } else if (this.results.failed === 0) {
      console.log("✅ All critical issues resolved. Some warnings remain.");
    } else {
      console.log("🔧 Please address the failed tests above.");
    }
  }
}

// Run the audit
const auditor = new ApplicationAuditor();
auditor.runAllAudits().catch(console.error);
