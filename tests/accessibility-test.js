#!/usr/bin/env node

/**
 * Automated Accessibility Testing
 * Uses axe-core to test accessibility compliance
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

class AccessibilityTester {
  constructor() {
    this.baseUrl = "http://localhost:3000";
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      violations: [],
    };
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
        await page.waitForTimeout(100);

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
          const icons = document.querySelectorAll('i[aria-hidden="true"]');

          return {
            hasRole: title.hasAttribute("role"),
            hasTabIndex: title.hasAttribute("tabindex"),
            hasAriaLabel: title.hasAttribute("aria-label"),
            hiddenIcons: icons.length,
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
        if (accessibility.hiddenIcons < 5) {
          throw new Error("Not enough decorative icons marked as aria-hidden");
        }
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
tester.runAccessibilityTests().catch(console.error);
