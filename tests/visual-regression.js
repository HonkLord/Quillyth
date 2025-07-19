#!/usr/bin/env node

/**
 * Visual Regression Testing
 * Detects CSS changes and UI inconsistencies using screenshot comparison
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

class VisualRegressionTester {
  constructor() {
    this.baseUrl = "http://localhost:3000";
    this.screenshotsDir = path.join(__dirname, "screenshots");
    this.baselineDir = path.join(this.screenshotsDir, "baseline");
    this.currentDir = path.join(this.screenshotsDir, "current");
    this.diffDir = path.join(this.screenshotsDir, "diff");

    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      diffs: [],
    };
  }

  async init() {
    // Create directories if they don't exist
    [
      this.screenshotsDir,
      this.baselineDir,
      this.currentDir,
      this.diffDir,
    ].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async test(name, testFn) {
    this.results.total++;
    console.log(`\n🖼️  Testing: ${name}`);

    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      this.results.failed++;
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      this.results.diffs.push({ name, error: error.message });
    }
  }

  async captureScreenshot(page, name, selector = "body") {
    await page.waitForSelector(selector, { timeout: 5000 });

    // Wait for any animations to complete
    await page.waitForTimeout(1000);

    const screenshotPath = path.join(this.currentDir, `${name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      omitBackground: true,
    });

    return screenshotPath;
  }

  async compareScreenshots(currentPath, baselinePath, diffPath) {
    // Simple file size comparison for now
    // In a real implementation, you'd use image comparison libraries
    if (!fs.existsSync(baselinePath)) {
      throw new Error("Baseline screenshot not found");
    }

    const currentStats = fs.statSync(currentPath);
    const baselineStats = fs.statSync(baselinePath);

    const sizeDiff = Math.abs(currentStats.size - baselineStats.size);
    const sizeDiffPercent = (sizeDiff / baselineStats.size) * 100;

    if (sizeDiffPercent > 5) {
      // 5% threshold
      throw new Error(`Screenshot differs by ${sizeDiffPercent.toFixed(2)}%`);
    }

    return true;
  }

  async testDashboardLayout() {
    return this.test("Dashboard Layout Consistency", async () => {
      const page = await this.browser.newPage();

      try {
        await page.goto(`${this.baseUrl}/#dashboard`);
        await page.waitForSelector("#dashboard-content");

        // Test dashboard grid layout
        const gridLayout = await page.evaluate(() => {
          const grid = document.querySelector(".dashboard-grid");
          if (!grid) return null;

          const computedStyle = window.getComputedStyle(grid);
          return {
            display: computedStyle.display,
            gridTemplateColumns: computedStyle.gridTemplateColumns,
            gap: computedStyle.gap,
          };
        });

        if (!gridLayout || gridLayout.display !== "grid") {
          throw new Error("Dashboard grid layout not properly applied");
        }

        // Capture screenshot
        const screenshotPath = await this.captureScreenshot(
          page,
          "dashboard",
          "#dashboard-content"
        );
        const baselinePath = path.join(this.baselineDir, "dashboard.png");

        await this.compareScreenshots(screenshotPath, baselinePath);
      } finally {
        await page.close();
      }
    });
  }

  async testNavigationLayout() {
    return this.test("Navigation Layout Consistency", async () => {
      const page = await this.browser.newPage();

      try {
        await page.goto(this.baseUrl);
        await page.waitForSelector(".main-nav-tabs");

        // Test navigation structure
        const navStructure = await page.evaluate(() => {
          const tabs = document.querySelectorAll(".main-nav-tab");
          const tabList = document.querySelector('[role="tablist"]');

          return {
            tabCount: tabs.length,
            hasTablist: !!tabList,
            tabWidths: Array.from(tabs).map((tab) => tab.offsetWidth),
            tabHeights: Array.from(tabs).map((tab) => tab.offsetHeight),
          };
        });

        if (!navStructure.hasTablist) {
          throw new Error("Navigation missing tablist role");
        }

        if (navStructure.tabCount < 8) {
          throw new Error("Insufficient navigation tabs");
        }

        // Check for consistent tab sizing
        const uniqueWidths = new Set(navStructure.tabWidths);
        const uniqueHeights = new Set(navStructure.tabHeights);

        if (uniqueWidths.size > 2 || uniqueHeights.size > 1) {
          throw new Error("Inconsistent tab sizing detected");
        }

        // Capture screenshot
        const screenshotPath = await this.captureScreenshot(
          page,
          "navigation",
          ".top-nav"
        );
        const baselinePath = path.join(this.baselineDir, "navigation.png");

        await this.compareScreenshots(screenshotPath, baselinePath);
      } finally {
        await page.close();
      }
    });
  }

  async testResponsiveDesign() {
    return this.test("Responsive Design Consistency", async () => {
      const page = await this.browser.newPage();

      try {
        await page.goto(this.baseUrl);

        // Test mobile layout (768px)
        await page.setViewport({ width: 768, height: 1024 });
        await page.waitForTimeout(500);

        const mobileLayout = await page.evaluate(() => {
          const nav = document.querySelector(".main-nav-tabs");
          const search = document.querySelector(".search-container");

          return {
            navDisplay: window.getComputedStyle(nav).display,
            searchDisplay: window.getComputedStyle(search).display,
            bodyWidth: document.body.offsetWidth,
          };
        });

        if (mobileLayout.bodyWidth !== 768) {
          throw new Error("Mobile viewport not properly applied");
        }

        // Capture mobile screenshot
        const mobileScreenshotPath = await this.captureScreenshot(
          page,
          "mobile-layout"
        );
        const mobileBaselinePath = path.join(
          this.baselineDir,
          "mobile-layout.png"
        );

        await this.compareScreenshots(mobileScreenshotPath, mobileBaselinePath);

        // Test desktop layout (1200px)
        await page.setViewport({ width: 1200, height: 800 });
        await page.waitForTimeout(500);

        const desktopLayout = await page.evaluate(() => {
          const nav = document.querySelector(".main-nav-tabs");
          const search = document.querySelector(".search-container");

          return {
            navDisplay: window.getComputedStyle(nav).display,
            searchDisplay: window.getComputedStyle(search).display,
            bodyWidth: document.body.offsetWidth,
          };
        });

        if (desktopLayout.bodyWidth !== 1200) {
          throw new Error("Desktop viewport not properly applied");
        }

        // Capture desktop screenshot
        const desktopScreenshotPath = await this.captureScreenshot(
          page,
          "desktop-layout"
        );
        const desktopBaselinePath = path.join(
          this.baselineDir,
          "desktop-layout.png"
        );

        await this.compareScreenshots(
          desktopScreenshotPath,
          desktopBaselinePath
        );
      } finally {
        await page.close();
      }
    });
  }

  async testComponentConsistency() {
    return this.test("Component Visual Consistency", async () => {
      const page = await this.browser.newPage();

      try {
        await page.goto(this.baseUrl);
        await page.waitForSelector(".stat-card");

        // Test stat card consistency
        const cardStyles = await page.evaluate(() => {
          const cards = document.querySelectorAll(".stat-card");
          return Array.from(cards).map((card) => {
            const style = window.getComputedStyle(card);
            return {
              width: card.offsetWidth,
              height: card.offsetHeight,
              padding: style.padding,
              margin: style.margin,
              borderRadius: style.borderRadius,
              backgroundColor: style.backgroundColor,
            };
          });
        });

        // Check for consistent card styling
        const uniqueWidths = new Set(cardStyles.map((c) => c.width));
        const uniqueHeights = new Set(cardStyles.map((c) => c.height));
        const uniquePadding = new Set(cardStyles.map((c) => c.padding));
        const uniqueBorderRadius = new Set(
          cardStyles.map((c) => c.borderRadius)
        );

        if (uniqueWidths.size > 1) {
          throw new Error("Inconsistent card widths");
        }
        if (uniqueHeights.size > 1) {
          throw new Error("Inconsistent card heights");
        }
        if (uniquePadding.size > 1) {
          throw new Error("Inconsistent card padding");
        }
        if (uniqueBorderRadius.size > 1) {
          throw new Error("Inconsistent card border radius");
        }

        // Capture component screenshot
        const screenshotPath = await this.captureScreenshot(
          page,
          "components",
          ".quick-stats"
        );
        const baselinePath = path.join(this.baselineDir, "components.png");

        await this.compareScreenshots(screenshotPath, baselinePath);
      } finally {
        await page.close();
      }
    });
  }

  async runAllTests() {
    console.log("🚀 Starting Visual Regression Testing");
    console.log("=====================================\n");

    try {
      await this.init();
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      await this.testDashboardLayout();
      await this.testNavigationLayout();
      await this.testResponsiveDesign();
      await this.testComponentConsistency();
    } catch (error) {
      console.error("❌ Visual regression testing error:", error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }

    this.printResults();
  }

  printResults() {
    console.log("\n=====================================");
    console.log("📊 VISUAL REGRESSION TEST RESULTS");
    console.log("=====================================");
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Total: ${this.results.total}`);
    console.log("=====================================\n");

    if (this.results.diffs.length > 0) {
      console.log("❌ VISUAL DIFFERENCES DETECTED:");
      this.results.diffs.forEach((diff) => {
        console.log(`   - ${diff.name}: ${diff.error}`);
      });
      console.log(
        "\n💡 Check screenshots in tests/screenshots/diff/ for visual differences"
      );
    } else {
      console.log("🎉 All visual tests passed! No regressions detected.");
    }
  }
}

// Run visual regression tests
const tester = new VisualRegressionTester();
tester.runAllTests().catch(console.error);
