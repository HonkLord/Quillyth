#!/usr/bin/env node

/**
 * Monthly Maintenance Script
 * Automated alignment checks and reporting
 *
 * IMPROVEMENTS (2025-07-19):
 * - Replaced fragile string parsing with structured JSON parsing for performance tests
 * - Added structured JSON output generation to accessibility tests
 * - Implemented report validation to ensure data integrity
 * - Added fallback string parsing for backward compatibility
 * - Enhanced error handling and logging for better debugging
 * - Improved recommendation generation with detailed violation information
 *
 * The script now reads structured JSON reports from:
 * - tests/performance-reports/latest.json
 * - tests/accessibility-reports/latest.json
 *
 * This makes detection of performance and accessibility issues more reliable
 * and maintainable compared to the previous string-matching approach.
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

  async readPerformanceReport() {
    const latestReportPath = path.join(
      __dirname,
      "..",
      "tests",
      "performance-reports",
      "latest.json"
    );

    try {
      if (fs.existsSync(latestReportPath)) {
        const reportContent = fs.readFileSync(latestReportPath, "utf8");
        const report = JSON.parse(reportContent);

        // Validate report structure
        if (this.validatePerformanceReport(report)) {
          return report;
        } else {
          console.log("⚠️  Performance report has invalid structure");
          return null;
        }
      } else {
        console.log(
          "⚠️  No performance report found, performance test may not have run"
        );
        return null;
      }
    } catch (error) {
      console.log(`⚠️  Error reading performance report: ${error.message}`);
      return null;
    }
  }

  async readAccessibilityReport() {
    const latestReportPath = path.join(
      __dirname,
      "..",
      "tests",
      "accessibility-reports",
      "latest.json"
    );

    try {
      if (fs.existsSync(latestReportPath)) {
        const reportContent = fs.readFileSync(latestReportPath, "utf8");
        const report = JSON.parse(reportContent);

        // Validate report structure
        if (this.validateAccessibilityReport(report)) {
          return report;
        } else {
          console.log("⚠️  Accessibility report has invalid structure");
          return null;
        }
      } else {
        console.log(
          "⚠️  No accessibility report found, accessibility test may not have run"
        );
        return null;
      }
    } catch (error) {
      console.log(`⚠️  Error reading accessibility report: ${error.message}`);
      return null;
    }
  }

  validatePerformanceReport(report) {
    const requiredFields = ["timestamp", "summary", "hasIssues"];
    const summaryFields = [
      "totalTests",
      "passedTests",
      "failedTests",
      "averageResponseTime",
    ];
    const issuesFields = ["hasWarnings", "hasErrors"];

    try {
      // Check required top-level fields
      for (const field of requiredFields) {
        if (!(field in report)) {
          console.log(
            `⚠️  Performance report missing required field: ${field}`
          );
          return false;
        }
      }

      // Check summary fields
      for (const field of summaryFields) {
        if (!(field in report.summary)) {
          console.log(`⚠️  Performance report summary missing field: ${field}`);
          return false;
        }
      }

      // Check hasIssues fields
      for (const field of issuesFields) {
        if (!(field in report.hasIssues)) {
          console.log(
            `⚠️  Performance report hasIssues missing field: ${field}`
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.log(
        `⚠️  Error validating performance report structure: ${error.message}`
      );
      return false;
    }
  }

  validateAccessibilityReport(report) {
    const requiredFields = ["timestamp", "summary", "hasIssues"];
    const summaryFields = [
      "totalTests",
      "passedTests",
      "failedTests",
      "successRate",
    ];
    const issuesFields = ["hasViolations", "hasErrors", "violationCount"];

    try {
      // Check required top-level fields
      for (const field of requiredFields) {
        if (!(field in report)) {
          console.log(
            `⚠️  Accessibility report missing required field: ${field}`
          );
          return false;
        }
      }

      // Check summary fields
      for (const field of summaryFields) {
        if (!(field in report.summary)) {
          console.log(
            `⚠️  Accessibility report summary missing field: ${field}`
          );
          return false;
        }
      }

      // Check hasIssues fields
      for (const field of issuesFields) {
        if (!(field in report.hasIssues)) {
          console.log(
            `⚠️  Accessibility report hasIssues missing field: ${field}`
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.log(
        `⚠️  Error validating accessibility report structure: ${error.message}`
      );
      return false;
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
    await this.generateRecommendations();

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

  async generateRecommendations() {
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

    // Check for performance issues using structured JSON data
    if (this.results.tests.performance.success) {
      try {
        const performanceReport = await this.readPerformanceReport();

        if (performanceReport && performanceReport.hasIssues) {
          const issues = performanceReport.hasIssues;

          if (issues.hasErrors) {
            recommendations.push({
              type: "error",
              priority: "high",
              message: `${issues.failedTestsCount} performance tests failed`,
              action: "Investigate and fix performance test failures",
              test: "performance",
              details: performanceReport.recommendations.filter(
                (r) => r.type === "error"
              ),
            });
          }

          if (issues.hasWarnings) {
            let warningMessage = "Performance issues detected";
            if (issues.averageResponseTimeExceeded) {
              warningMessage += ` - Average response time (${performanceReport.summary.averageResponseTime}ms) exceeds threshold`;
            }
            if (issues.slowEndpointsCount > 0) {
              warningMessage += ` - ${issues.slowEndpointsCount} slow endpoints detected`;
            }

            recommendations.push({
              type: "warning",
              priority: "medium",
              message: warningMessage,
              action:
                "Review performance monitoring results and optimize slow endpoints",
              test: "performance",
              details: performanceReport.recommendations.filter(
                (r) => r.type === "warning" || r.type === "optimization"
              ),
            });
          }
        }
      } catch (e) {
        console.log(`⚠️  Error parsing performance report: ${e.message}`);
        // Fallback to basic string parsing if JSON parsing fails
        const perfOutput = this.results.tests.performance.output;
        if (perfOutput.includes("slow") || perfOutput.includes("warning")) {
          recommendations.push({
            type: "warning",
            priority: "medium",
            message: "Performance issues detected (fallback detection)",
            action:
              "Review performance monitoring results and optimize slow endpoints",
            test: "performance",
          });
        }
      }
    }

    // Check for accessibility issues using structured JSON data
    if (this.results.tests.accessibility.success) {
      try {
        const accessibilityReport = await this.readAccessibilityReport();

        if (accessibilityReport && accessibilityReport.hasIssues) {
          const issues = accessibilityReport.hasIssues;

          if (issues.hasErrors) {
            recommendations.push({
              type: "error",
              priority: "high",
              message: `${accessibilityReport.summary.failedTests} accessibility tests failed`,
              action: "Investigate and fix accessibility test failures",
              test: "accessibility",
              details: accessibilityReport.violations,
            });
          }

          if (issues.hasViolations) {
            recommendations.push({
              type: "warning",
              priority: "medium",
              message: `${issues.violationCount} accessibility violations detected`,
              action: "Review accessibility test results and fix violations",
              test: "accessibility",
              details: accessibilityReport.violations,
            });
          }
        }
      } catch (e) {
        console.log(`⚠️  Error parsing accessibility report: ${e.message}`);
        // Fallback to basic string parsing if JSON parsing fails
        const a11yOutput = this.results.tests.accessibility.output;
        if (a11yOutput.includes("FAIL") || a11yOutput.includes("violation")) {
          recommendations.push({
            type: "warning",
            priority: "medium",
            message: "Accessibility issues detected (fallback detection)",
            action: "Review accessibility test results and fix violations",
            test: "accessibility",
          });
        }
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
