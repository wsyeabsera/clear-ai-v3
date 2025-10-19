#!/usr/bin/env ts-node

/**
 * Smart Multi-Tool AI Testing Script
 * 
 * This script creates intelligent test queries based on actual database data
 * patterns and relationships discovered through assessment.
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import { readFileSync } from 'fs';

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

// Load database assessment
let databaseAssessment: any = {};
try {
  const assessmentData = readFileSync('/Users/yab/Projects/clear-ai-v3/DATABASE_ASSESSMENT.json', 'utf-8');
  databaseAssessment = JSON.parse(assessmentData);
} catch (error) {
  console.warn('Could not load database assessment, using empty data');
}

// Smart test queries based on actual data
const SMART_TEST_QUERIES = [
  {
    id: 'facility-shipment-analysis',
    name: 'Facility Shipment Analysis',
    query: `Analyze shipments at facilities in ${databaseAssessment.patterns?.geographicDistribution?.cities?.[0] || 'Mayerfurt'} and ${databaseAssessment.patterns?.geographicDistribution?.cities?.[1] || 'Test City'}, showing entry and exit weights, and identify any patterns in weight differences`,
    complexity: 'Medium',
    expectedTools: ['facilities_list', 'shipments_list'],
    dataBased: true,
    description: 'Uses real cities from database: Mayerfurt, Test City'
  },
  {
    id: 'inspection-quality-assessment',
    name: 'Inspection Quality Assessment',
    query: `Review all inspections and identify the acceptance rate. Show details of any rejected inspections and analyze the reasons for rejection based on the inspection comments`,
    complexity: 'Medium',
    expectedTools: ['inspections_list'],
    dataBased: true,
    description: 'Uses actual inspection data with 66.7% acceptance rate'
  },
  {
    id: 'contaminant-material-analysis',
    name: 'Contaminant Material Analysis',
    query: `Analyze the contaminant data and identify the types of materials found: ${databaseAssessment.patterns?.contaminantTypes?.join(', ') || 'Unknown Chemical, Plastic - PET'}. Show which shipments had contaminants and their estimated sizes`,
    complexity: 'Medium',
    expectedTools: ['contaminants_list', 'shipments_list'],
    dataBased: true,
    description: 'Uses real contaminant types: Unknown Chemical, Plastic - PET'
  },
  {
    id: 'weight-distribution-analysis',
    name: 'Weight Distribution Analysis',
    query: `Analyze shipment weights across all facilities. The data shows weights ranging from ${databaseAssessment.patterns?.tonnageRanges?.min || 8500} to ${databaseAssessment.patterns?.tonnageRanges?.max || 23548} kg. Calculate the average weight and identify any facilities with significantly different weight patterns`,
    complexity: 'High',
    expectedTools: ['shipments_list', 'facilities_list'],
    dataBased: true,
    description: 'Uses real weight ranges: 8500-23548 kg'
  },
  {
    id: 'geographic-performance-comparison',
    name: 'Geographic Performance Comparison',
    query: `Compare facility performance across different countries: ${databaseAssessment.patterns?.geographicDistribution?.countries?.join(', ') || 'Ecuador, Test Country, Sint Maarten'}. Analyze shipment patterns, inspection rates, and contaminant occurrences by geographic location`,
    complexity: 'High',
    expectedTools: ['facilities_list', 'shipments_list', 'inspections_list', 'contaminants_list'],
    dataBased: true,
    description: 'Uses real countries: Ecuador, Test Country, Sint Maarten'
  },
  {
    id: 'temporal-data-analysis',
    name: 'Temporal Data Analysis',
    query: `Analyze data patterns over time. Shipments range from ${databaseAssessment.patterns?.dateRanges?.shipments?.earliest || '2025-01-18'} to ${databaseAssessment.patterns?.dateRanges?.shipments?.latest || '2025-09-22'}, while inspections and contaminants are from ${databaseAssessment.patterns?.dateRanges?.inspections?.earliest || '2025-10-19'}. Identify any temporal patterns or gaps in data collection`,
    complexity: 'Very High',
    expectedTools: ['shipments_list', 'inspections_list', 'contaminants_list', 'facilities_list'],
    dataBased: true,
    description: 'Uses real date ranges from assessment'
  }
];

interface SmartTestResult {
  queryId: string;
  queryName: string;
  query: string;
  complexity: string;
  dataBased: boolean;
  description: string;
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
  intelligenceScore: number; // 1-10 based on how well it used real data
}

interface SmartTestReport {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageDuration: number;
  averageIntelligenceScore: number;
  results: SmartTestResult[];
  insights: {
    dataUtilization: {
      realCitiesUsed: number;
      realCountriesUsed: number;
      realDateRangesUsed: number;
      realWeightRangesUsed: number;
      realContaminantTypesUsed: number;
    };
    queryIntelligence: {
      naiveQueries: number;
      dataAwareQueries: number;
      highlyIntelligentQueries: number;
    };
    recommendations: string[];
  };
}

class SmartMultiToolTester {
  private results: SmartTestResult[] = [];

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

  calculateIntelligenceScore(testQuery: any, result: SmartTestResult): number {
    let score = 5; // Base score
    
    // Check if query uses real data from assessment
    if (testQuery.dataBased) {
      score += 2;
    }
    
    // Check if query references specific real values
    const realDataReferences = [
      'Mayerfurt', 'Test City', 'Valdosta', // Real cities
      'Ecuador', 'Test Country', 'Sint Maarten', // Real countries
      '8500', '23548', '14682', // Real weight ranges
      'Unknown Chemical', 'Plastic - PET', // Real contaminant types
      '2025-01-18', '2025-09-22', '2025-10-19' // Real dates
    ];
    
    const referencesFound = realDataReferences.filter(ref => 
      testQuery.query.includes(ref)
    ).length;
    
    score += Math.min(referencesFound * 0.5, 2); // Up to 2 points for data references
    
    // Check if execution was successful
    if (result.success) {
      score += 1;
    }
    
    // Check if plan shows intelligent tool selection
    if (result.plan?.plan?.steps?.length > 0) {
      score += 1;
    }
    
    return Math.min(Math.max(score, 1), 10); // Clamp between 1-10
  }

  async runTest(testQuery: any): Promise<SmartTestResult> {
    console.log(`\n🧠 Running smart test: ${testQuery.name}`);
    console.log(`📝 Query: ${testQuery.query}`);
    console.log(`⚡ Complexity: ${testQuery.complexity}`);
    console.log(`🎯 Data-based: ${testQuery.dataBased ? 'Yes' : 'No'}`);
    console.log(`📊 Description: ${testQuery.description}`);
    
    const startTime = performance.now();
    let result: SmartTestResult = {
      queryId: testQuery.id,
      queryName: testQuery.name,
      query: testQuery.query,
      complexity: testQuery.complexity,
      dataBased: testQuery.dataBased,
      description: testQuery.description,
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
      feedbackProvided: false,
      intelligenceScore: 0
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

      // Calculate intelligence score
      result.intelligenceScore = this.calculateIntelligenceScore(testQuery, result);

      console.log(`✅ Test completed in ${result.duration.toFixed(2)}ms`);
      console.log(`📊 Success: ${result.success}`);
      console.log(`🧠 Intelligence Score: ${result.intelligenceScore}/10`);
      console.log(`🔧 Plan steps: ${result.plan?.plan?.steps?.length || 0}`);

      // Provide feedback
      try {
        const feedbackText = `Smart data-driven query test for ${testQuery.name}. ` +
          `Query uses real database values: ${testQuery.dataBased}. ` +
          `Intelligence score: ${result.intelligenceScore}/10. ` +
          `Execution success: ${result.success}. ` +
          `Analysis feedback: ${result.analysis?.feedback || 'No feedback available'}`;
        
        const rating = Math.min(Math.max(result.intelligenceScore, 1), 5); // Convert 1-10 to 1-5
        const categories = ['smart-query', 'data-driven', 'intelligent', testQuery.complexity.toLowerCase()];
        
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
      result.intelligenceScore = 1; // Low score for failed tests
      
      console.error(`❌ Test failed: ${result.error}`);
    }

    return result;
  }

  async runAllTests(): Promise<SmartTestReport> {
    console.log('🧠 Starting Smart Multi-Tool AI Testing');
    console.log(`📊 Running ${SMART_TEST_QUERIES.length} intelligent test queries`);
    console.log('🎯 All queries based on real database assessment data');
    
    // Run all tests
    for (const testQuery of SMART_TEST_QUERIES) {
      const result = await this.runTest(testQuery);
      this.results.push(result);
      
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return this.generateReport();
  }

  generateReport(): SmartTestReport {
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    const averageIntelligenceScore = this.results.reduce((sum, r) => sum + r.intelligenceScore, 0) / totalTests;

    // Analyze data utilization
    const dataUtilization = {
      realCitiesUsed: this.results.filter(r => r.query.includes('Mayerfurt') || r.query.includes('Test City') || r.query.includes('Valdosta')).length,
      realCountriesUsed: this.results.filter(r => r.query.includes('Ecuador') || r.query.includes('Test Country') || r.query.includes('Sint Maarten')).length,
      realDateRangesUsed: this.results.filter(r => r.query.includes('2025-01-18') || r.query.includes('2025-09-22') || r.query.includes('2025-10-19')).length,
      realWeightRangesUsed: this.results.filter(r => r.query.includes('8500') || r.query.includes('23548') || r.query.includes('14682')).length,
      realContaminantTypesUsed: this.results.filter(r => r.query.includes('Unknown Chemical') || r.query.includes('Plastic - PET')).length
    };

    // Analyze query intelligence
    const queryIntelligence = {
      naiveQueries: this.results.filter(r => r.intelligenceScore <= 4).length,
      dataAwareQueries: this.results.filter(r => r.intelligenceScore > 4 && r.intelligenceScore <= 7).length,
      highlyIntelligentQueries: this.results.filter(r => r.intelligenceScore > 7).length
    };

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (averageIntelligenceScore < 6) {
      recommendations.push('Improve query intelligence by using more real database values');
    }
    
    if (dataUtilization.realCitiesUsed < 3) {
      recommendations.push('Increase usage of real geographic data in queries');
    }
    
    if (queryIntelligence.naiveQueries > queryIntelligence.highlyIntelligentQueries) {
      recommendations.push('Focus on creating more data-driven, intelligent queries');
    }
    
    if (successfulTests / totalTests < 0.8) {
      recommendations.push('Improve execution reliability for complex queries');
    }

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageDuration,
      averageIntelligenceScore,
      results: this.results,
      insights: {
        dataUtilization,
        queryIntelligence,
        recommendations
      }
    };
  }

  printReport(report: SmartTestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('🧠 SMART MULTI-TOOL AI TESTING REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 OVERALL STATISTICS:`);
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   Successful: ${report.successfulTests} (${((report.successfulTests / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${report.failedTests} (${((report.failedTests / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`   Average Duration: ${report.averageDuration.toFixed(2)}ms`);
    console.log(`   Average Intelligence Score: ${report.averageIntelligenceScore.toFixed(1)}/10`);
    
    console.log(`\n🎯 DATA UTILIZATION:`);
    console.log(`   Real Cities Used: ${report.insights.dataUtilization.realCitiesUsed}/${report.totalTests}`);
    console.log(`   Real Countries Used: ${report.insights.dataUtilization.realCountriesUsed}/${report.totalTests}`);
    console.log(`   Real Date Ranges Used: ${report.insights.dataUtilization.realDateRangesUsed}/${report.totalTests}`);
    console.log(`   Real Weight Ranges Used: ${report.insights.dataUtilization.realWeightRangesUsed}/${report.totalTests}`);
    console.log(`   Real Contaminant Types Used: ${report.insights.dataUtilization.realContaminantTypesUsed}/${report.totalTests}`);
    
    console.log(`\n🧠 QUERY INTELLIGENCE:`);
    console.log(`   Naive Queries (1-4): ${report.insights.queryIntelligence.naiveQueries}`);
    console.log(`   Data-Aware Queries (5-7): ${report.insights.queryIntelligence.dataAwareQueries}`);
    console.log(`   Highly Intelligent Queries (8-10): ${report.insights.queryIntelligence.highlyIntelligentQueries}`);
    
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
      console.log(`   Intelligence Score: ${result.intelligenceScore}/10`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
      console.log(`   Data-Based: ${result.dataBased ? 'Yes' : 'No'}`);
      console.log(`   Description: ${result.description}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  const tester = new SmartMultiToolTester();
  
  try {
    const report = await tester.runAllTests();
    tester.printReport(report);
    
    // Save report to file
    const reportPath = '/Users/yab/Projects/clear-ai-v3/SMART_MULTI_TOOL_TEST_REPORT.json';
    const fs = require('fs');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Smart test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { SmartMultiToolTester, SMART_TEST_QUERIES };
