#!/usr/bin/env node

/**
 * Monthly Maintenance Script
 * Automated alignment checks and reporting
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class MonthlyMaintenance {
  constructor() {
    this.reportDir = path.join(__dirname, "..", "reports");
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      recommendations: [],
      summary: {},
    };
  }

  async init() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async runCommand(command, description) {
    console.log(`\n🔧 Running: ${description}`);
    try {
      const output = execSync(command, { encoding: "utf8", timeout: 300000 });
      console.log(`✅ ${description} completed successfully`);
      return { success: true, output };
    } catch (error) {
      console.log(`❌ ${description} failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async runAllChecks() {
    console.log("🚀 Starting Monthly Maintenance");
    console.log("=====================================\n");

    await this.init();

    // Run all test suites
    this.results.tests.unit = await this.runCommand("npm test", "Unit Tests");
    this.results.tests.audit = await this.runCommand(
      "npm run audit",
      "Alignment Audit"
    );
    this.results.tests.performance = await this.runCommand(
      "npm run test:performance",
      "Performance Tests"
    );
    this.results.tests.accessibility = await this.runCommand(
      "npm run test:accessibility",
      "Accessibility Tests"
    );

    // Generate summary
    this.generateSummary();
    this.generateRecommendations();

    // Save report
    await this.saveReport();

    this.printResults();
  }

  generateSummary() {
    const tests = this.results.tests;
    const totalTests = Object.keys(tests).length;
    const passedTests = Object.values(tests).filter((t) => t.success).length;
    const failedTests = totalTests - passedTests;

    this.results.summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      timestamp: new Date().toISOString(),
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Check for failed tests
    Object.entries(this.results.tests).forEach(([testName, result]) => {
      if (!result.success) {
        recommendations.push({
          type: "error",
          priority: "high",
          message: `${testName} test suite failed`,
          action: `Investigate and fix issues in ${testName} tests`,
          test: testName,
        });
      }
    });

    // Check for performance issues
    if (this.results.tests.performance.success) {
      try {
        // Parse performance output for recommendations
        const perfOutput = this.results.tests.performance.output;
        if (perfOutput.includes("slow") || perfOutput.includes("warning")) {
          recommendations.push({
            type: "warning",
            priority: "medium",
            message: "Performance issues detected",
            action:
              "Review performance monitoring results and optimize slow endpoints",
            test: "performance",
          });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Check for accessibility issues
    if (this.results.tests.accessibility.success) {
      try {
        const a11yOutput = this.results.tests.accessibility.output;
        if (a11yOutput.includes("FAIL") || a11yOutput.includes("violation")) {
          recommendations.push({
            type: "warning",
            priority: "medium",
            message: "Accessibility issues detected",
            action: "Review accessibility test results and fix violations",
            test: "accessibility",
          });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Add general maintenance recommendations
    recommendations.push({
      type: "info",
      priority: "low",
      message: "Update dependencies",
      action: "Run npm audit and update outdated packages",
      test: "general",
    });

    recommendations.push({
      type: "info",
      priority: "low",
      message: "Review documentation",
      action: "Update README and documentation if needed",
      test: "general",
    });

    this.results.recommendations = recommendations;
  }

  async saveReport() {
    const filename = `maintenance-report-${
      new Date().toISOString().split("T")[0]
    }.json`;
    const reportPath = path.join(this.reportDir, filename);

    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  printResults() {
    console.log("\n=====================================");
    console.log("📊 MONTHLY MAINTENANCE RESULTS");
    console.log("=====================================");

    const summary = this.results.summary;
    console.log(`✅ Passed: ${summary.passedTests}`);
    console.log(`❌ Failed: ${summary.failedTests}`);
    console.log(`📈 Success Rate: ${summary.successRate}%`);
    console.log(`📅 Date: ${new Date(summary.timestamp).toLocaleDateString()}`);

    console.log("\n=====================================");
    console.log("🧪 TEST RESULTS");
    console.log("=====================================");

    Object.entries(this.results.tests).forEach(([testName, result]) => {
      const status = result.success ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} ${testName}`);
    });

    if (this.results.recommendations.length > 0) {
      console.log("\n=====================================");
      console.log("💡 RECOMMENDATIONS");
      console.log("=====================================");

      const byPriority = {
        high: this.results.recommendations.filter((r) => r.priority === "high"),
        medium: this.results.recommendations.filter(
          (r) => r.priority === "medium"
        ),
        low: this.results.recommendations.filter((r) => r.priority === "low"),
      };

      ["high", "medium", "low"].forEach((priority) => {
        if (byPriority[priority].length > 0) {
          console.log(`\n${priority.toUpperCase()} PRIORITY:`);
          byPriority[priority].forEach((rec) => {
            console.log(`   ${rec.type.toUpperCase()}: ${rec.message}`);
            console.log(`   Action: ${rec.action}`);
          });
        }
      });
    }

    console.log("\n=====================================");
    if (summary.successRate === 100) {
      console.log("🎉 All maintenance checks passed!");
    } else {
      console.log(
        "🔧 Some issues need attention. Review recommendations above."
      );
    }
    console.log("=====================================");
  }
}

// Run monthly maintenance
const maintenance = new MonthlyMaintenance();
maintenance.runAllChecks().catch(console.error);
