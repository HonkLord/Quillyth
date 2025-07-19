#!/usr/bin/env node

/**
 * Automated Accessibility Testing
 * Uses axe-core to test accessibility compliance
 *
 * Features:
 * - Dynamic icon accessibility validation based on actual UI state
 * - Configurable thresholds for accessibility requirements
 * - Comprehensive ARIA attribute testing
 * - Keyboard navigation validation
 * - Configurable base URL for different environments
 *
 * Configuration:
 * - Environment variable: QUILLYTH_TEST_BASE_URL (full URL)
 * - Environment variable: QUILLYTH_TEST_PORT (port only, uses localhost)
 * - Config file: js/shared/config.js (TESTING.BASE_URL property, preferred)
 * - Config file: js/shared/config.js (TEST_BASE_URL property, fallback)
 * - Default fallback: http://localhost:3000
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/**
 * Get base URL from environment variable or configuration file
 * @returns {string} Base URL for testing
 */
function getBaseUrl() {
  // Priority 1: Environment variable
  if (process.env.QUILLYTH_TEST_BASE_URL) {
    return process.env.QUILLYTH_TEST_BASE_URL;
  }

  // Priority 2: Environment variable for port (common pattern)
  if (process.env.QUILLYTH_TEST_PORT) {
    return `http://localhost:${process.env.QUILLYTH_TEST_PORT}`;
  }

  // Priority 3: Check for config file
  try {
    const configPath = path.join(__dirname, "..", "js", "shared", "config.js");
    if (fs.existsSync(configPath)) {
      // Try to read and parse the config file
      const configContent = fs.readFileSync(configPath, "utf8");
      // Look for TESTING.BASE_URL in the config (preferred)
      const testingUrlMatch = configContent.match(
        /TESTING:\s*{[^}]*BASE_URL:\s*["']([^"']+)["']/
      );
      if (testingUrlMatch) {
        return testingUrlMatch[1];
      }
      // Fallback: Look for TEST_BASE_URL in the config
      const testUrlMatch = configContent.match(
        /TEST_BASE_URL:\s*["']([^"']+)["']/
      );
      if (testUrlMatch) {
        return testUrlMatch[1];
      }
    }
  } catch (error) {
    console.log("⚠️  Could not read config file, using default URL");
  }

  // Priority 4: Default fallback
  return "http://localhost:3000";
}

class AccessibilityTester {
  constructor() {
    this.baseUrl = getBaseUrl();
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      violations: [],
    };

    // Configuration for accessibility thresholds
    // These can be updated at runtime using updateConfig() method
    this.config = {
      minHiddenIconsRatio: 0.7, // At least 70% of icons should be aria-hidden
      minHiddenIconsCount: 2, // Minimum absolute count of hidden icons
    };

    console.log(`🌐 Using test base URL: ${this.baseUrl}`);
  }

  /**
   * Update accessibility configuration
   * @param {Object} newConfig - New configuration object
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log(`🔧 Updated accessibility config:`, this.config);
  }

  /**
   * Update base URL for testing
   * @param {string} newBaseUrl - New base URL
   */
  updateBaseUrl(newBaseUrl) {
    this.baseUrl = newBaseUrl;
    console.log(`🌐 Updated test base URL: ${this.baseUrl}`);
  }

  async test(name, testFn) {
    this.results.total++;
    console.log(`\n🧪 Testing: ${name}`);

    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      this.results.failed++;
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      this.results.violations.push({ name, error: error.message });
    }
  }

  async runAccessibilityTests() {
    console.log("🚀 Starting Accessibility Testing");
    console.log("=====================================\n");

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // Inject axe-core
      const axePath = require.resolve("axe-core");
      await page.addScriptTag({ path: axePath });

      // Test main dashboard
      await this.test("Dashboard Accessibility", async () => {
        await page.goto(`${this.baseUrl}/#dashboard`);
        await page.waitForSelector("#dashboard-content");

        const results = await page.evaluate(() => {
          return new Promise((resolve) => {
            axe.run((err, results) => {
              if (err) throw err;
              resolve(results);
            });
          });
        });

        if (results.violations.length > 0) {
          throw new Error(
            `Found ${results.violations.length} accessibility violations`
          );
        }
      });

      // Test navigation structure
      await this.test("Navigation Accessibility", async () => {
        await page.goto(this.baseUrl);
        await page.waitForSelector(".main-nav-tabs");

        // Check for proper ARIA attributes
        const navStructure = await page.evaluate(() => {
          const tabs = document.querySelectorAll(".main-nav-tab");
          const tabPanels = document.querySelectorAll(".workspace-content");

          return {
            hasTablist: !!document.querySelector('[role="tablist"]'),
            tabCount: tabs.length,
            panelCount: tabPanels.length,
            hasAriaSelected: Array.from(tabs).some((tab) =>
              tab.hasAttribute("aria-selected")
            ),
            hasAriaControls: Array.from(tabs).some((tab) =>
              tab.hasAttribute("aria-controls")
            ),
            hasAriaLabelledby: Array.from(tabPanels).some((panel) =>
              panel.hasAttribute("aria-labelledby")
            ),
          };
        });

        if (!navStructure.hasTablist) {
          throw new Error("Missing tablist role");
        }
        if (!navStructure.hasAriaSelected) {
          throw new Error("Missing aria-selected attributes");
        }
        if (!navStructure.hasAriaControls) {
          throw new Error("Missing aria-controls attributes");
        }
        if (!navStructure.hasAriaLabelledby) {
          throw new Error("Missing aria-labelledby attributes");
        }
      });

      // Test keyboard navigation
      await this.test("Keyboard Navigation", async () => {
        await page.goto(this.baseUrl);
        await page.waitForSelector(".main-nav-tab");

        // Test tab navigation
        await page.keyboard.press("Tab");

        // Wait for focus to be established on a focusable element
        await page.waitForFunction(
          () => {
            const activeElement = document.activeElement;
            return (
              activeElement &&
              (activeElement.tagName === "BUTTON" ||
                activeElement.tagName === "H1" ||
                activeElement.tagName === "INPUT" ||
                activeElement.hasAttribute("tabindex"))
            );
          },
          { timeout: 5000 }
        );

        const focusElement = await page.evaluate(() => {
          return document.activeElement.tagName;
        });

        if (focusElement !== "BUTTON" && focusElement !== "H1") {
          throw new Error("Tab navigation not working properly");
        }
      });

      // Test screen reader compatibility
      await this.test("Screen Reader Compatibility", async () => {
        await page.goto(this.baseUrl);
        await page.waitForSelector(".campaign-title");

        const accessibility = await page.evaluate(() => {
          const title = document.querySelector(".campaign-title");
          const allIcons = document.querySelectorAll("i");
          const hiddenIcons = document.querySelectorAll(
            'i[aria-hidden="true"]'
          );
          const visibleIcons = document.querySelectorAll(
            'i:not([aria-hidden="true"])'
          );

          return {
            hasRole: title.hasAttribute("role"),
            hasTabIndex: title.hasAttribute("tabindex"),
            hasAriaLabel: title.hasAttribute("aria-label"),
            totalIcons: allIcons.length,
            hiddenIcons: hiddenIcons.length,
            visibleIcons: visibleIcons.length,
            hiddenRatio:
              allIcons.length > 0 ? hiddenIcons.length / allIcons.length : 0,
          };
        });

        if (!accessibility.hasRole) {
          throw new Error("Interactive elements missing role attribute");
        }
        if (!accessibility.hasTabIndex) {
          throw new Error("Interactive elements missing tabindex");
        }
        if (!accessibility.hasAriaLabel) {
          throw new Error("Interactive elements missing aria-label");
        }

        // Dynamic validation based on actual UI state
        const minHiddenCount = Math.max(
          this.config.minHiddenIconsCount,
          Math.ceil(accessibility.totalIcons * this.config.minHiddenIconsRatio)
        );

        if (accessibility.hiddenIcons < minHiddenCount) {
          throw new Error(
            `Not enough decorative icons marked as aria-hidden. ` +
              `Found ${accessibility.hiddenIcons}/${accessibility.totalIcons} hidden icons ` +
              `(${(accessibility.hiddenRatio * 100).toFixed(1)}%), ` +
              `expected at least ${minHiddenCount} (${
                this.config.minHiddenIconsRatio * 100
              }% of total)`
          );
        }

        console.log(
          `   📊 Icon accessibility: ${accessibility.hiddenIcons}/${
            accessibility.totalIcons
          } hidden (${(accessibility.hiddenRatio * 100).toFixed(1)}%)`
        );
      });
    } catch (error) {
      console.error("❌ Accessibility testing error:", error);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    this.printResults();
  }

  printResults() {
    console.log("\n=====================================");
    console.log("📊 ACCESSIBILITY TEST RESULTS");
    console.log("=====================================");
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Total: ${this.results.total}`);
    console.log("=====================================\n");

    if (this.results.violations.length > 0) {
      console.log("❌ VIOLATIONS FOUND:");
      this.results.violations.forEach((v) => {
        console.log(`   - ${v.name}: ${v.error}`);
      });
    } else {
      console.log("🎉 All accessibility tests passed!");
    }
  }
}

// Run accessibility tests
const tester = new AccessibilityTester();

// Example: Customize thresholds for different environments
// tester.updateConfig({
//   minHiddenIconsRatio: 0.8,  // Require 80% of icons to be hidden
//   minHiddenIconsCount: 3     // Require at least 3 hidden icons
// });

// Example: Update base URL for different environments
// tester.updateBaseUrl('https://staging.quillyth.com');

tester.runAccessibilityTests().catch(console.error);
