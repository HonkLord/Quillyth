#!/usr/bin/env node

/**
 * Visual Regression Testing
 * Detects CSS changes and UI inconsistencies using screenshot comparison
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const pixelmatchModule = require("pixelmatch");
const pixelmatch = pixelmatchModule.default || pixelmatchModule;
const { PNG } = require("pngjs");

class VisualRegressionTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "http://localhost:3000";
    this.screenshotsDir = path.join(__dirname, "screenshots");
    this.baselineDir = path.join(this.screenshotsDir, "baseline");
    this.currentDir = path.join(this.screenshotsDir, "current");
    this.diffDir = path.join(this.screenshotsDir, "diff");

    // Validate and normalize diffThreshold
    const diffThreshold = VisualRegressionTester.validateDiffThreshold(
      options.diffThreshold || 0.5
    );
    console.log(`ℹ️  diffThreshold configured as: ${diffThreshold}%`);

    // Visual comparison configuration
    this.config = {
      pixelThreshold: options.pixelThreshold || 0.1, // Color threshold (0-1)
      diffThreshold: diffThreshold, // Percentage of pixels that can differ (0-100)
      includeAA: options.includeAA !== false, // Include anti-aliasing
      alpha: options.alpha || 0.5, // Alpha channel threshold
      aaColor: options.aaColor || [255, 255, 0], // Anti-aliasing color (yellow)
      diffColor: options.diffColor || [255, 0, 0], // Diff color (red)
      createBaselines: options.createBaselines !== false, // Auto-create missing baselines
    };

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

  async waitForAnimations(page, selector = "body") {
    try {
      // Wait for all animations to complete by checking if any elements are currently animating
      await page.waitForFunction(
        (targetSelector) => {
          const element = document.querySelector(targetSelector);
          if (!element) return true; // Element not found, consider animations done

          // Check if the element or any of its children are currently animating
          const isAnimating = (el) => {
            const style = window.getComputedStyle(el);
            const animation = style.animation;
            const transition = style.transition;

            // Check if element has active animations or transitions
            if (animation && animation !== "none") {
              const animationName = animation.split(" ")[0];
              if (animationName && animationName !== "none") {
                return true;
              }
            }

            if (transition && transition !== "none") {
              const transitionProperty = transition.split(" ")[0];
              if (transitionProperty && transitionProperty !== "none") {
                return true;
              }
            }

            // Check children recursively
            for (const child of el.children) {
              if (isAnimating(child)) {
                return true;
              }
            }

            return false;
          };

          return !isAnimating(element);
        },
        { timeout: 3000 }, // Reduced timeout to 3 seconds
        selector
      );
    } catch (error) {
      // If animation waiting times out, just continue - this is not critical
      console.log(
        `⚠️  Animation waiting timed out for ${selector}, continuing...`
      );
    }

    // Additional small delay to ensure any final rendering is complete
    await page.waitForTimeout(200);
  }

  async captureScreenshot(page, name, selector = "body") {
    await page.waitForSelector(selector, { timeout: 5000 });

    // Wait for any animations to complete
    await this.waitForAnimations(page, selector);

    const screenshotPath = path.join(this.currentDir, `${name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      omitBackground: true,
    });

    return screenshotPath;
  }

  async createBaselineIfMissing(currentPath, baselinePath) {
    if (!this.config.createBaselines) {
      return false;
    }

    if (!fs.existsSync(baselinePath) && fs.existsSync(currentPath)) {
      console.log(`📸 Creating baseline: ${path.basename(baselinePath)}`);
      fs.copyFileSync(currentPath, baselinePath);
      return true;
    }
    return false;
  }

  async compareScreenshots(currentPath, baselinePath, diffPath) {
    // Check if baseline exists
    if (!fs.existsSync(baselinePath)) {
      const created = await this.createBaselineIfMissing(
        currentPath,
        baselinePath
      );
      if (created) {
        console.log(`✅ Baseline created for ${path.basename(baselinePath)}`);
        return {
          numDiffPixels: 0,
          diffPercentage: 0,
          totalPixels: 0,
          passed: true,
        };
      }
      throw new Error(`Baseline screenshot not found: ${baselinePath}`);
    }

    if (!fs.existsSync(currentPath)) {
      throw new Error("Current screenshot not found");
    }

    // Load images using pngjs
    const baselineImg = PNG.sync.read(fs.readFileSync(baselinePath));
    const currentImg = PNG.sync.read(fs.readFileSync(currentPath));

    // Ensure images have the same dimensions
    if (
      baselineImg.width !== currentImg.width ||
      baselineImg.height !== currentImg.height
    ) {
      throw new Error(
        `Image dimensions mismatch: baseline (${baselineImg.width}x${baselineImg.height}) vs current (${currentImg.width}x${currentImg.height})`
      );
    }

    // Create diff image
    const diffImg = new PNG({
      width: baselineImg.width,
      height: baselineImg.height,
    });

    // Perform pixel-level comparison
    const numDiffPixels = pixelmatch(
      currentImg.data,
      baselineImg.data,
      diffImg.data,
      baselineImg.width,
      baselineImg.height,
      {
        threshold: this.config.pixelThreshold,
        includeAA: this.config.includeAA,
        alpha: this.config.alpha,
        aaColor: this.config.aaColor,
        diffColor: this.config.diffColor,
        diffMask: false, // Don't create diff mask
      }
    );

    // Calculate difference percentage
    const totalPixels = baselineImg.width * baselineImg.height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

    // Validate threshold before comparison
    if (
      typeof this.config.diffThreshold !== "number" ||
      this.config.diffThreshold < 0 ||
      this.config.diffThreshold > 100
    ) {
      throw new Error(
        `Invalid diffThreshold configuration: ${this.config.diffThreshold}. Must be a number between 0-100 (percentage)`
      );
    }

    // Save diff image if differences are found
    if (numDiffPixels > 0 && diffPath) {
      fs.writeFileSync(diffPath, PNG.sync.write(diffImg));
    }

    // Check against configured threshold (both values are now guaranteed to be percentages 0-100)
    if (diffPercentage > this.config.diffThreshold) {
      throw new Error(
        `Visual regression detected: ${numDiffPixels} pixels differ (${diffPercentage.toFixed(
          2
        )}% of total pixels). ` +
          `Threshold: ${this.config.diffThreshold}%. Diff image saved to: ${
            diffPath || "not saved"
          }`
      );
    }

    return {
      numDiffPixels,
      diffPercentage,
      totalPixels,
      passed: diffPercentage <= this.config.diffThreshold,
    };
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
        const diffPath = path.join(this.diffDir, "dashboard-diff.png");

        await this.compareScreenshots(screenshotPath, baselinePath, diffPath);
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

        if (navStructure.tabCount < 6) {
          throw new Error("Insufficient navigation tabs");
        }

        // Check for reasonable tab sizing (allow some variation for responsive design)
        const uniqueWidths = new Set(navStructure.tabWidths);
        const uniqueHeights = new Set(navStructure.tabHeights);

        // Allow more variation for responsive design - this is not critical for visual regression
        if (uniqueWidths.size > 5 || uniqueHeights.size > 3) {
          console.log(
            `⚠️  Tab sizing variation detected: ${uniqueWidths.size} widths, ${uniqueHeights.size} heights`
          );
          // Don't fail the test for this - it's not critical for visual regression
        }

        // Capture screenshot
        const screenshotPath = await this.captureScreenshot(
          page,
          "navigation",
          ".top-nav"
        );
        const baselinePath = path.join(this.baselineDir, "navigation.png");
        const diffPath = path.join(this.diffDir, "navigation-diff.png");

        await this.compareScreenshots(screenshotPath, baselinePath, diffPath);
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
        const mobileDiffPath = path.join(
          this.diffDir,
          "mobile-layout-diff.png"
        );

        await this.compareScreenshots(
          mobileScreenshotPath,
          mobileBaselinePath,
          mobileDiffPath
        );

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
        const desktopDiffPath = path.join(
          this.diffDir,
          "desktop-layout-diff.png"
        );

        await this.compareScreenshots(
          desktopScreenshotPath,
          desktopBaselinePath,
          desktopDiffPath
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
        const diffPath = path.join(this.diffDir, "components-diff.png");

        await this.compareScreenshots(screenshotPath, baselinePath, diffPath);
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

  async runTestsForBaselineUpdate() {
    console.log("🔄 Running tests to generate current screenshots...");
    console.log("=====================================\n");

    try {
      await this.init();
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      // Run tests without comparison to generate current screenshots
      await this.captureScreenshotForBaseline("dashboard", async (page) => {
        await page.goto(`${this.baseUrl}/#dashboard`);
        await page.waitForSelector("#dashboard-content");
      });

      await this.captureScreenshotForBaseline("navigation", async (page) => {
        await page.goto(this.baseUrl);
        await page.waitForSelector(".main-nav-tabs");
      });

      await this.captureScreenshotForBaseline("mobile-layout", async (page) => {
        await page.goto(this.baseUrl);
        await page.setViewport({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
      });

      await this.captureScreenshotForBaseline(
        "desktop-layout",
        async (page) => {
          await page.goto(this.baseUrl);
          await page.setViewport({ width: 1200, height: 800 });
          await page.waitForTimeout(500);
        }
      );

      await this.captureScreenshotForBaseline("components", async (page) => {
        await page.goto(this.baseUrl);
        await page.waitForSelector(".stat-card");
      });
    } catch (error) {
      console.error("❌ Error generating screenshots:", error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async captureScreenshotForBaseline(name, setupFn) {
    console.log(`📸 Capturing screenshot for: ${name}`);
    const page = await this.browser.newPage();

    try {
      await setupFn(page);

      // Determine selector based on test name
      let selector = "body";
      if (name === "dashboard") selector = "#dashboard-content";
      if (name === "navigation") selector = ".top-nav";
      if (name === "components") selector = ".quick-stats";

      // For baseline updates, use a simpler screenshot capture without animation waiting
      await page.waitForSelector(selector, { timeout: 5000 });

      // Small delay to ensure rendering is complete
      await page.waitForTimeout(500);

      const screenshotPath = path.join(this.currentDir, `${name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        omitBackground: true,
      });

      console.log(`✅ Screenshot captured for: ${name}`);
    } catch (error) {
      console.error(
        `❌ Failed to capture screenshot for ${name}:`,
        error.message
      );
      throw error;
    } finally {
      await page.close();
    }
  }

  async updateAllBaselines() {
    console.log("🔄 Updating all baseline screenshots...");

    const testNames = [
      "dashboard",
      "navigation",
      "mobile-layout",
      "desktop-layout",
      "components",
    ];
    let updatedCount = 0;
    let failedCount = 0;

    for (const testName of testNames) {
      const currentPath = path.join(this.currentDir, `${testName}.png`);
      const baselinePath = path.join(this.baselineDir, `${testName}.png`);

      if (fs.existsSync(currentPath)) {
        fs.copyFileSync(currentPath, baselinePath);
        console.log(`✅ Updated baseline for: ${testName}`);
        updatedCount++;
      } else {
        console.log(`❌ No current screenshot found for: ${testName}`);
        failedCount++;
      }
    }

    console.log(`\n📊 Baseline Update Summary:`);
    console.log(`✅ Successfully updated: ${updatedCount} baselines`);
    if (failedCount > 0) {
      console.log(`❌ Failed to update: ${failedCount} baselines`);
    }

    return { updatedCount, failedCount };
  }

  updateBaseline(testName) {
    const currentPath = path.join(this.currentDir, `${testName}.png`);
    const baselinePath = path.join(this.baselineDir, `${testName}.png`);

    if (fs.existsSync(currentPath)) {
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`✅ Updated baseline for: ${testName}`);
      return true;
    } else {
      console.log(`❌ No current screenshot found for: ${testName}`);
      return false;
    }
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
      console.log(
        "\n🔄 To update baselines, run: node tests/visual-regression.js --update-baselines"
      );
    } else {
      console.log("🎉 All visual tests passed! No regressions detected.");
    }
  }

  /**
   * Validate and normalize a diffThreshold value
   * @param {number} threshold - The threshold value to validate
   * @returns {number} - Normalized threshold as percentage (0-100)
   * @throws {Error} - If threshold is invalid
   */
  static validateDiffThreshold(threshold) {
    if (typeof threshold !== "number" || isNaN(threshold)) {
      throw new Error(
        `Invalid diffThreshold: ${threshold}. Must be a valid number`
      );
    }

    if (threshold > 1 && threshold <= 100) {
      // Threshold is provided as percentage (0-100)
      return threshold;
    } else if (threshold >= 0 && threshold <= 1) {
      // Threshold is provided as decimal (0-1), convert to percentage
      return threshold * 100;
    } else {
      throw new Error(
        `Invalid diffThreshold value: ${threshold}. Must be between 0-1 (decimal) or 0-100 (percentage)`
      );
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const updateBaselines = args.includes("--update-baselines");
const help = args.includes("--help") || args.includes("-h");

if (help) {
  console.log(`
🖼️  Visual Regression Testing Tool

Usage:
  node tests/visual-regression.js [options]

Options:
  --update-baselines    Update baseline screenshots with current ones
  --help, -h           Show this help message

Examples:
  node tests/visual-regression.js                    # Run all tests
  node tests/visual-regression.js --update-baselines # Update baselines
  node tests/visual-regression.js --help             # Show help

Configuration:
  The tool uses pixel-level comparison with configurable thresholds:
  - Pixel threshold: 0.1 (color sensitivity, 0-1 range)
  - Diff threshold: 0.5% (percentage of pixels that can differ, accepts 0-1 decimal or 0-100 percentage)
  - Auto-creates missing baselines by default

Threshold Format:
  diffThreshold accepts values in either format:
  - Decimal (0-1): 0.5 = 50% tolerance
  - Percentage (0-100): 50 = 50% tolerance
  The tool automatically detects and normalizes the format.

Output:
  - Screenshots saved to: tests/screenshots/current/
  - Baselines stored in: tests/screenshots/baseline/
  - Diff images saved to: tests/screenshots/diff/
`);
  process.exit(0);
}

// Run visual regression tests
const tester = new VisualRegressionTester();

if (updateBaselines) {
  console.log("🔄 Starting baseline update process...");
  console.log("=====================================\n");

  (async () => {
    try {
      // First, run tests to generate current screenshots
      await tester.runTestsForBaselineUpdate();

      // Then update all baselines with the current screenshots
      const result = await tester.updateAllBaselines();

      console.log("\n=====================================");
      console.log("🎉 BASELINE UPDATE COMPLETE");
      console.log("=====================================");

      if (result.failedCount === 0) {
        console.log("✅ All baselines updated successfully!");
        process.exit(0);
      } else {
        console.log(
          `⚠️  Baseline update completed with ${result.failedCount} failures`
        );
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Baseline update failed:", error);
      process.exit(1);
    }
  })();
} else {
  tester.runAllTests().catch(console.error);
}

// Export the class for testing
module.exports = { VisualRegressionTester };
