#!/usr/bin/env ts-node

/**
 * Complex Multi-Tool AI Testing Script
 * 
 * This script tests the AI system's intelligence by executing complex queries
 * that require joining data from multiple tools and storing analysis feedback.
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

// Test queries with increasing complexity
const TEST_QUERIES = [
  {
    id: 'cross-entity-relationship',
    name: 'Cross-Entity Relationship Query',
    query: 'Find all shipments at facilities in New York that had rejected inspections in the last 30 days, and show me the contaminants found in those shipments',
    complexity: 'Medium',
    expectedTools: ['facilities_list', 'inspections_list', 'shipments_get', 'contaminants_list']
  },
  {
    id: 'contract-compliance',
    name: 'Contract Compliance Analysis',
    query: 'Show me all facilities with active contracts that have shipments exceeding their contract tonnage limits, including the waste generator details',
    complexity: 'High',
    expectedTools: ['contracts_list', 'facilities_get', 'shipments_list', 'waste_generators_list']
  },
  {
    id: 'quality-control',
    name: 'Quality Control Investigation',
    query: 'Find all facilities that have more than 5 contaminant reports in the last month, list their recent shipments, and check if they have active contracts with waste code specifications',
    complexity: 'High',
    expectedTools: ['contaminants_list', 'facilities_get', 'shipments_list', 'contracts_list', 'waste_codes_get']
  },
  {
    id: 'regional-performance',
    name: 'Regional Performance Report',
    query: 'Compare waste acceptance rates across all facilities in different countries, showing the number of accepted vs rejected inspections, average shipment weights, and top contaminant types per region',
    complexity: 'Very High',
    expectedTools: ['facilities_list', 'inspections_list', 'shipments_list', 'contaminants_list']
  },
  {
    id: 'waste-generator-risk',
    name: 'Waste Generator Risk Assessment',
    query: 'Identify waste generators that have had shipments with contaminants at multiple different facilities, show their contract status, and list all waste codes associated with their shipments',
    complexity: 'Very High',
    expectedTools: ['waste_generators_list', 'shipments_list', 'contaminants_list', 'contracts_list', 'waste_codes_list']
  }
];

interface TestResult {
  queryId: string;
  queryName: string;
  query: string;
  complexity: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  executionId: string;
  analysisId: string;
  summaryId: string;
  plan: any;
  execution: any;
  analysis: any;
  summary: any;
  error?: string;
  feedbackProvided: boolean;
}

interface TestReport {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageDuration: number;
  results: TestResult[];
  insights: {
    toolUsagePatterns: Record<string, number>;
    complexityVsSuccess: Record<string, { total: number; successful: number }>;
    commonFailurePatterns: string[];
    recommendations: string[];
  };
}

class ComplexMultiToolTester {
  private results: TestResult[] = [];

  async executeGraphQL(query: string, variables: any = {}): Promise<any> {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async executeFullCycle(query: string, llmProvider: string = 'openai'): Promise<any> {
    const mutation = `
      mutation ExecuteFullCycle($request: FullCycleRequestInput!) {
        executeFullCycle(request: $request) {
          request_id
          execution_id
          analysis_id
          summary_id
          query
          plan {
            requestId
            query
            plan {
              steps {
                tool
                params
                dependsOn
                parallel
                description
              }
              metadata {
                query
                requestId
                estimatedDurationMs
                totalSteps
                parallelSteps
              }
            }
            status
            createdAt
            executionTimeMs
            validationErrors
          }
          execution {
            executionId
            planRequestId
            status
            startedAt
            completedAt
            totalSteps
            completedSteps
            failedSteps
            results {
              stepIndex
              tool
              params
              status
              result
              error
              startedAt
              completedAt
              retryCount
              dependencies
            }
            error
          }
          analysis {
            analysis_id
            execution_id
            plan_request_id
            feedback
            evaluation_metrics {
              success_rate
              efficiency_score
              step_success_rates
              error_patterns
              retry_frequency
              average_step_time_ms
            }
            improvement_notes
            success_indicators
            failure_patterns
            recommendations
          }
          summary {
            summary_id
            execution_id
            plan_request_id
            format
            content
            structured_data {
              user_query
              answer
              steps_executed
              success
              key_results
              errors
              execution_time_ms
              recommendations
            }
          }
          success
          total_time_ms
          created_at
        }
      }
    `;

    return await this.executeGraphQL(mutation, {
      request: {
        query,
        llm_provider: llmProvider,
        execution_config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        summary_format: 'STRUCTURED'
      }
    });
  }

  async provideFeedback(executionId: string, userFeedback: string, rating: number, categories: string[]): Promise<any> {
    const mutation = `
      mutation ProvideFeedback($feedback: FeedbackRequestInput!) {
        provideFeedback(feedback: $feedback) {
          feedback_id
          execution_id
          user_feedback
          rating
          categories
          processed
          created_at
        }
      }
    `;

    return await this.executeGraphQL(mutation, {
      feedback: {
        execution_id: executionId,
        user_feedback: userFeedback,
        rating,
        categories
      }
    });
  }

  async runTest(testQuery: any): Promise<TestResult> {
    console.log(`\n🧪 Running test: ${testQuery.name}`);
    console.log(`📝 Query: ${testQuery.query}`);
    console.log(`⚡ Complexity: ${testQuery.complexity}`);
    
    const startTime = performance.now();
    let result: TestResult = {
      queryId: testQuery.id,
      queryName: testQuery.name,
      query: testQuery.query,
      complexity: testQuery.complexity,
      startTime,
      endTime: 0,
      duration: 0,
      success: false,
      executionId: '',
      analysisId: '',
      summaryId: '',
      plan: null,
      execution: null,
      analysis: null,
      summary: null,
      feedbackProvided: false
    };

    try {
      // Execute full cycle
      const fullCycleResult = await this.executeFullCycle(testQuery.query);
      const cycleData = fullCycleResult.executeFullCycle;
      
      result.endTime = performance.now();
      result.duration = result.endTime - result.startTime;
      result.success = cycleData.success;
      result.executionId = cycleData.execution_id;
      result.analysisId = cycleData.analysis_id;
      result.summaryId = cycleData.summary_id;
      result.plan = cycleData.plan;
      result.execution = cycleData.execution;
      result.analysis = cycleData.analysis;
      result.summary = cycleData.summary;

      console.log(`✅ Test completed in ${result.duration.toFixed(2)}ms`);
      console.log(`📊 Success: ${result.success}`);
      console.log(`🔧 Plan steps: ${result.plan?.plan?.steps?.length || 0}`);
      console.log(`⚡ Execution status: ${result.execution?.status || 'Unknown'}`);

      // Provide feedback
      try {
        const feedbackText = `Complex multi-tool query test for ${testQuery.name}. ` +
          `Query complexity: ${testQuery.complexity}. ` +
          `Execution success: ${result.success}. ` +
          `Plan efficiency: ${result.plan?.plan?.steps?.length || 0} steps. ` +
          `Analysis feedback: ${result.analysis?.feedback || 'No feedback available'}`;
        
        const rating = result.success ? 4 : 2; // Rate based on success
        const categories = ['multi-tool', 'complex-join', 'aggregation', testQuery.complexity.toLowerCase()];
        
        await this.provideFeedback(result.executionId, feedbackText, rating, categories);
        result.feedbackProvided = true;
        
        console.log(`💬 Feedback provided successfully`);
      } catch (feedbackError) {
        console.warn(`⚠️  Failed to provide feedback: ${feedbackError}`);
      }

    } catch (error) {
      result.endTime = performance.now();
      result.duration = result.endTime - result.startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      
      console.error(`❌ Test failed: ${result.error}`);
    }

    return result;
  }

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting Complex Multi-Tool AI Testing');
    console.log(`📊 Running ${TEST_QUERIES.length} test queries`);
    
    // Run all tests
    for (const testQuery of TEST_QUERIES) {
      const result = await this.runTest(testQuery);
      this.results.push(result);
      
      // Add delay between tests to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return this.generateReport();
  }

  generateReport(): TestReport {
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    // Analyze tool usage patterns
    const toolUsagePatterns: Record<string, number> = {};
    this.results.forEach(result => {
      if (result.plan?.plan?.steps) {
        result.plan.plan.steps.forEach((step: any) => {
          toolUsagePatterns[step.tool] = (toolUsagePatterns[step.tool] || 0) + 1;
        });
      }
    });

    // Analyze complexity vs success
    const complexityVsSuccess: Record<string, { total: number; successful: number }> = {};
    this.results.forEach(result => {
      if (!complexityVsSuccess[result.complexity]) {
        complexityVsSuccess[result.complexity] = { total: 0, successful: 0 };
      }
      complexityVsSuccess[result.complexity].total++;
      if (result.success) {
        complexityVsSuccess[result.complexity].successful++;
      }
    });

    // Identify common failure patterns
    const commonFailurePatterns: string[] = [];
    const failureReasons = this.results
      .filter(r => !r.success && r.error)
      .map(r => r.error)
      .filter(Boolean);
    
    // Count failure patterns
    const failureCounts: Record<string, number> = {};
    failureReasons.forEach(reason => {
      if (reason) {
        const pattern = reason.toLowerCase();
        failureCounts[pattern] = (failureCounts[pattern] || 0) + 1;
      }
    });
    
    // Get top 3 failure patterns
    Object.entries(failureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([pattern]) => commonFailurePatterns.push(pattern));

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (successfulTests / totalTests < 0.8) {
      recommendations.push('Consider improving plan generation logic for better success rates');
    }
    
    if (averageDuration > 30000) {
      recommendations.push('Optimize execution performance - consider parallel processing improvements');
    }
    
    if (commonFailurePatterns.length > 0) {
      recommendations.push(`Address common failure patterns: ${commonFailurePatterns.join(', ')}`);
    }
    
    if (Object.keys(toolUsagePatterns).length < 5) {
      recommendations.push('Encourage more diverse tool usage in complex queries');
    }

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageDuration,
      results: this.results,
      insights: {
        toolUsagePatterns,
        complexityVsSuccess,
        commonFailurePatterns,
        recommendations
      }
    };
  }

  printReport(report: TestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPLEX MULTI-TOOL AI TESTING REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 OVERALL STATISTICS:`);
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   Successful: ${report.successfulTests} (${((report.successfulTests / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${report.failedTests} (${((report.failedTests / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`   Average Duration: ${report.averageDuration.toFixed(2)}ms`);
    
    console.log(`\n🔧 TOOL USAGE PATTERNS:`);
    Object.entries(report.insights.toolUsagePatterns)
      .sort(([,a], [,b]) => b - a)
      .forEach(([tool, count]) => {
        console.log(`   ${tool}: ${count} uses`);
      });
    
    console.log(`\n📊 COMPLEXITY VS SUCCESS:`);
    Object.entries(report.insights.complexityVsSuccess).forEach(([complexity, stats]) => {
      const successRate = ((stats.successful / stats.total) * 100).toFixed(1);
      console.log(`   ${complexity}: ${stats.successful}/${stats.total} (${successRate}%)`);
    });
    
    if (report.insights.commonFailurePatterns.length > 0) {
      console.log(`\n❌ COMMON FAILURE PATTERNS:`);
      report.insights.commonFailurePatterns.forEach((pattern, index) => {
        console.log(`   ${index + 1}. ${pattern}`);
      });
    }
    
    if (report.insights.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      report.insights.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    console.log(`\n📋 DETAILED RESULTS:`);
    report.results.forEach((result, index) => {
      console.log(`\n   Test ${index + 1}: ${result.queryName}`);
      console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
      console.log(`   Plan Steps: ${result.plan?.plan?.steps?.length || 0}`);
      console.log(`   Execution Status: ${result.execution?.status || 'Unknown'}`);
      console.log(`   Feedback Provided: ${result.feedbackProvided ? 'Yes' : 'No'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  const tester = new ComplexMultiToolTester();
  
  try {
    const report = await tester.runAllTests();
    tester.printReport(report);
    
    // Save report to file
    const reportPath = '/Users/yab/Projects/clear-ai-v3/COMPLEX_MULTI_TOOL_TEST_REPORT.json';
    const fs = require('fs');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ComplexMultiToolTester, TEST_QUERIES };
