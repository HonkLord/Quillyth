#!/usr/bin/env node

/**
 * Performance Monitoring System
 * Tracks API response times and frontend performance metrics
 *
 * Configuration:
 * - TEST_CAMPAIGN_ID: Campaign ID to test against (default: "campaign-4-old-cistern")
 * - TEST_BASE_URL: Base URL for API endpoints (default: "http://localhost:3000")
 * - TEST_API_RESPONSE_TIME: API response time threshold in ms (default: 1000)
 * - TEST_PAGE_LOAD_TIME: Page load time threshold in ms (default: 3000)
 * - TEST_MEMORY_USAGE: Memory usage threshold in MB (default: 50)
 *
 * Usage examples:
 *   node tests/performance-monitor.js
 *   TEST_CAMPAIGN_ID=campaign-1 node tests/performance-monitor.js
 *   TEST_BASE_URL=http://staging.example.com TEST_CAMPAIGN_ID=campaign-2 node tests/performance-monitor.js
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

class PerformanceMonitor {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || "http://localhost:3000";
    this.campaignId = config.campaignId || "campaign-4-old-cistern";
    this.results = {
      apiTests: [],
      thresholds: {
        apiResponseTime: config.apiResponseTime || 1000, // 1 second
        pageLoadTime: config.pageLoadTime || 3000, // 3 seconds
        memoryUsage: config.memoryUsage || 50, // 50MB
      },
    };
  }

  async test(name, testFn) {
    console.log(`\n⚡ Testing: ${name}`);
    const startTime = Date.now();

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      this.results.apiTests.push({
        name,
        duration,
        status: "PASS",
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ PASS: ${name} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.results.apiTests.push({
        name,
        duration,
        status: "FAIL",
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      console.log(`❌ FAIL: ${name} (${duration}ms) - ${error.message}`);
      throw error;
    }
  }

  async testAPIEndpoints() {
    console.log("🚀 Starting Performance Monitoring");
    console.log("=====================================");
    console.log(`📋 Configuration:`);
    console.log(`   Campaign ID: ${this.campaignId}`);
    console.log(`   Base URL: ${this.baseUrl}`);
    console.log(
      `   API Response Time Threshold: ${this.results.thresholds.apiResponseTime}ms`
    );
    console.log(
      `   Page Load Time Threshold: ${this.results.thresholds.pageLoadTime}ms`
    );
    console.log(
      `   Memory Usage Threshold: ${this.results.thresholds.memoryUsage}MB`
    );
    console.log("=====================================\n");

    const endpoints = [
      { name: "Campaigns API", path: "/api/campaigns" },
      { name: "Characters API", path: "/api/characters" },
      { name: "Scenes API", path: "/api/scenes" },
      { name: "Sessions API", path: "/api/sessions" },
      { name: "Quests API", path: "/api/quests" },
      { name: "Notes API", path: "/api/notes" },
      { name: "Locations API", path: "/api/locations" },
    ];

    for (const endpoint of endpoints) {
      await this.test(`${endpoint.name} Response Time`, async () => {
        const response = await fetch(
          `${this.baseUrl}${endpoint.path}?campaign_id=${this.campaignId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response structure
        if (
          !data ||
          (Array.isArray(data) &&
            data.length === 0 &&
            endpoint.name !== "Notes API")
        ) {
          throw new Error("Empty or invalid response");
        }

        return data;
      });
    }

    // Test concurrent API calls
    await this.test("Concurrent API Performance", async () => {
      const promises = endpoints.map((endpoint) =>
        fetch(`${this.baseUrl}${endpoint.path}?campaign_id=${this.campaignId}`)
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map((r) => r.json()));

      const totalDataSize = JSON.stringify(results).length;
      if (totalDataSize > 1000000) {
        // 1MB limit
        throw new Error(`Response size too large: ${totalDataSize} bytes`);
      }

      return results;
    });

    // Test database query performance
    await this.test("Database Query Performance", async () => {
      const startTime = Date.now();

      // Test complex query with joins
      const response = await fetch(
        `${this.baseUrl}/api/characters?campaign_id=${this.campaignId}`
      );
      const data = await response.json();

      const duration = Date.now() - startTime;

      if (duration > this.results.thresholds.apiResponseTime) {
        throw new Error(`Database query too slow: ${duration}ms`);
      }

      return data;
    });
  }

  async generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.apiTests.length,
        passedTests: this.results.apiTests.filter((t) => t.status === "PASS")
          .length,
        failedTests: this.results.apiTests.filter((t) => t.status === "FAIL")
          .length,
        averageResponseTime: this.calculateAverageResponseTime(),
        slowestEndpoint: this.findSlowestEndpoint(),
        fastestEndpoint: this.findFastestEndpoint(),
      },
      details: this.results.apiTests,
      recommendations: this.generateRecommendations(),
      thresholds: this.results.thresholds,
      hasIssues: this.hasPerformanceIssues(),
    };

    // Save report to file
    const reportPath = path.join(__dirname, "performance-reports");
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const filename = `performance-report-${
      new Date().toISOString().split("T")[0]
    }.json`;
    const reportFilePath = path.join(reportPath, filename);
    fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2));

    // Also save a latest.json for easy access by maintenance scripts
    const latestPath = path.join(reportPath, "latest.json");
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));

    console.log(`📄 Performance report saved to: ${reportFilePath}`);
    console.log(`📄 Latest report also saved to: ${latestPath}`);

    return report;
  }

  calculateAverageResponseTime() {
    const passedTests = this.results.apiTests.filter(
      (t) => t.status === "PASS"
    );
    if (passedTests.length === 0) return 0;

    const totalTime = passedTests.reduce((sum, test) => sum + test.duration, 0);
    return Math.round(totalTime / passedTests.length);
  }

  findSlowestEndpoint() {
    const passedTests = this.results.apiTests.filter(
      (t) => t.status === "PASS"
    );
    if (passedTests.length === 0) return null;

    return passedTests.reduce((slowest, test) =>
      test.duration > slowest.duration ? test : slowest
    );
  }

  findFastestEndpoint() {
    const passedTests = this.results.apiTests.filter(
      (t) => t.status === "PASS"
    );
    if (passedTests.length === 0) return null;

    return passedTests.reduce((fastest, test) =>
      test.duration < fastest.duration ? test : fastest
    );
  }

  generateRecommendations() {
    const recommendations = [];
    const avgResponseTime = this.calculateAverageResponseTime();

    if (avgResponseTime > this.results.thresholds.apiResponseTime) {
      recommendations.push({
        type: "warning",
        message: `Average response time (${avgResponseTime}ms) exceeds threshold (${this.results.thresholds.apiResponseTime}ms)`,
        action: "Consider implementing database indexing or query optimization",
      });
    }

    const slowEndpoints = this.results.apiTests.filter(
      (t) =>
        t.status === "PASS" &&
        t.duration > this.results.thresholds.apiResponseTime
    );

    if (slowEndpoints.length > 0) {
      recommendations.push({
        type: "optimization",
        message: `${slowEndpoints.length} endpoints are performing slowly`,
        action: "Review and optimize database queries for these endpoints",
        endpoints: slowEndpoints.map((t) => t.name),
      });
    }

    const failedTests = this.results.apiTests.filter(
      (t) => t.status === "FAIL"
    );
    if (failedTests.length > 0) {
      recommendations.push({
        type: "error",
        message: `${failedTests.length} performance tests failed`,
        action: "Investigate and fix performance issues",
        failures: failedTests.map((t) => ({ name: t.name, error: t.error })),
      });
    }

    return recommendations;
  }

  printResults() {
    console.log("\n=====================================");
    console.log("📊 PERFORMANCE MONITORING RESULTS");
    console.log("=====================================");

    const passed = this.results.apiTests.filter(
      (t) => t.status === "PASS"
    ).length;
    const failed = this.results.apiTests.filter(
      (t) => t.status === "FAIL"
    ).length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${this.results.apiTests.length}`);
    console.log(
      `⏱️  Average Response Time: ${this.calculateAverageResponseTime()}ms`
    );

    const slowest = this.findSlowestEndpoint();
    const fastest = this.findFastestEndpoint();

    if (slowest) {
      console.log(`🐌 Slowest: ${slowest.name} (${slowest.duration}ms)`);
    }
    if (fastest) {
      console.log(`⚡ Fastest: ${fastest.name} (${fastest.duration}ms)`);
    }

    console.log("=====================================\n");

    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log("💡 RECOMMENDATIONS:");
      recommendations.forEach((rec) => {
        console.log(`   ${rec.type.toUpperCase()}: ${rec.message}`);
        console.log(`   Action: ${rec.action}`);
        if (rec.endpoints) {
          console.log(`   Endpoints: ${rec.endpoints.join(", ")}`);
        }
        console.log("");
      });
    } else {
      console.log("🎉 All performance metrics are within acceptable ranges!");
    }
  }

  async runAllTests() {
    await this.testAPIEndpoints();
    const report = await this.generatePerformanceReport();
    this.printResults();
    return report;
  }

  hasPerformanceIssues() {
    const avgResponseTime = this.calculateAverageResponseTime();
    const slowEndpoints = this.results.apiTests.filter(
      (t) =>
        t.status === "PASS" &&
        t.duration > this.results.thresholds.apiResponseTime
    );
    const failedTests = this.results.apiTests.filter(
      (t) => t.status === "FAIL"
    );

    return {
      averageResponseTimeExceeded:
        avgResponseTime > this.results.thresholds.apiResponseTime,
      slowEndpointsCount: slowEndpoints.length,
      failedTestsCount: failedTests.length,
      hasWarnings:
        avgResponseTime > this.results.thresholds.apiResponseTime ||
        slowEndpoints.length > 0,
      hasErrors: failedTests.length > 0,
    };
  }
}

// Configuration options
const config = {
  // Override these values as needed for different test environments
  campaignId: process.env.TEST_CAMPAIGN_ID || "campaign-4-old-cistern",
  baseUrl: process.env.TEST_BASE_URL || "http://localhost:3000",
  apiResponseTime: process.env.TEST_API_RESPONSE_TIME || 1000,
  pageLoadTime: process.env.TEST_PAGE_LOAD_TIME || 3000,
  memoryUsage: process.env.TEST_MEMORY_USAGE || 50,
};

// Run performance monitoring
const monitor = new PerformanceMonitor(config);
monitor.runAllTests().catch(console.error);
