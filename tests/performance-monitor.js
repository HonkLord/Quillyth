#!/usr/bin/env node

/**
 * Performance Monitoring System
 * Tracks API response times and frontend performance metrics
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

class PerformanceMonitor {
  constructor() {
    this.baseUrl = "http://localhost:3000";
    this.results = {
      apiTests: [],
      thresholds: {
        apiResponseTime: 1000, // 1 second
        pageLoadTime: 3000, // 3 seconds
        memoryUsage: 50, // 50MB
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
          `${this.baseUrl}${endpoint.path}?campaign_id=campaign-4-old-cistern`
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
        fetch(
          `${this.baseUrl}${endpoint.path}?campaign_id=campaign-4-old-cistern`
        )
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
        `${this.baseUrl}/api/characters?campaign_id=campaign-4-old-cistern`
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
    };

    // Save report to file
    const reportPath = path.join(__dirname, "performance-reports");
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const filename = `performance-report-${
      new Date().toISOString().split("T")[0]
    }.json`;
    fs.writeFileSync(
      path.join(reportPath, filename),
      JSON.stringify(report, null, 2)
    );

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
}

// Run performance monitoring
const monitor = new PerformanceMonitor();
monitor.runAllTests().catch(console.error);
