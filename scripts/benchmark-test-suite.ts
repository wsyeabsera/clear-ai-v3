#!/usr/bin/env ts-node

/**
 * Comprehensive Benchmark Test Suite
 * 
 * This script runs comprehensive benchmarks to measure AI system performance
 * and provides detailed metrics for improvement tracking.
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import { readFileSync, writeFileSync } from 'fs';

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

// Benchmark test categories
const BENCHMARK_TESTS = {
  dataJoining: [
    {
      id: 'simple-join',
      name: 'Simple Data Join',
      query: 'Find facilities in Mayerfurt and show their shipments',
      complexity: 'Low',
      expectedSteps: 2,
      expectedJoinSuccess: true
    },
    {
      id: 'complex-join',
      name: 'Complex Multi-Entity Join',
      query: 'Find facilities with shipments that have inspections and show the inspection results',
      complexity: 'High',
      expectedSteps: 4,
      expectedJoinSuccess: true
    },
    {
      id: 'conditional-join',
      name: 'Conditional Data Join',
      query: 'Find facilities with rejected inspections and show their contaminant data',
      complexity: 'Medium',
      expectedSteps: 3,
      expectedJoinSuccess: true
    }
  ],
  
  emptyResultHandling: [
    {
      id: 'empty-facility',
      name: 'Empty Facility Query',
      query: 'Find facilities in NonExistentCity and show their data',
      complexity: 'Low',
      expectedEmptyResults: true,
      expectedHandling: 'graceful'
    },
    {
      id: 'empty-shipments',
      name: 'Empty Shipment Query',
      query: 'Find shipments from facility with no shipments',
      complexity: 'Medium',
      expectedEmptyResults: true,
      expectedHandling: 'graceful'
    },
    {
      id: 'mixed-results',
      name: 'Mixed Empty/Data Results',
      query: 'Find facilities in Mayerfurt and NonExistentCity, show shipments for both',
      complexity: 'Medium',
      expectedEmptyResults: true,
      expectedHandling: 'partial'
    }
  ],
  
  dataAwareness: [
    {
      id: 'realistic-query',
      name: 'Realistic Data Query',
      query: 'Analyze shipments from facilities in Mayerfurt and Test City',
      complexity: 'Medium',
      expectedRealistic: true,
      expectedDataFound: true
    },
    {
      id: 'unrealistic-query',
      name: 'Unrealistic Data Query',
      query: 'Find facilities with more than 1000 shipments in the last day',
      complexity: 'Low',
      expectedRealistic: false,
      expectedDataFound: false
    },
    {
      id: 'adaptive-query',
      name: 'Adaptive Query',
      query: 'Show me all available data about facilities and their relationships',
      complexity: 'High',
      expectedRealistic: true,
      expectedDataFound: true
    }
  ],
  
  performance: [
    {
      id: 'simple-performance',
      name: 'Simple Query Performance',
      query: 'List all facilities',
      complexity: 'Low',
      maxExecutionTime: 5000,
      expectedParallel: false
    },
    {
      id: 'parallel-performance',
      name: 'Parallel Execution Performance',
      query: 'Get facilities, shipments, and inspections simultaneously',
      complexity: 'Medium',
      maxExecutionTime: 8000,
      expectedParallel: true
    },
    {
      id: 'complex-performance',
      name: 'Complex Query Performance',
      query: 'Analyze all data relationships across facilities, shipments, inspections, and contaminants',
      complexity: 'High',
      maxExecutionTime: 15000,
      expectedParallel: true
    }
  ],
  
  errorRecovery: [
    {
      id: 'invalid-params',
      name: 'Invalid Parameters Recovery',
      query: 'Find facilities with invalid filter parameters',
      complexity: 'Low',
      expectedError: true,
      expectedRecovery: true
    },
    {
      id: 'network-error',
      name: 'Network Error Recovery',
      query: 'Simulate network timeout and retry',
      complexity: 'Medium',
      expectedError: true,
      expectedRecovery: true
    },
    {
      id: 'partial-failure',
      name: 'Partial Failure Recovery',
      query: 'Execute multi-step query with one failing step',
      complexity: 'High',
      expectedError: true,
      expectedRecovery: true
    }
  ]
};

interface BenchmarkResult {
  category: string;
  testId: string;
  testName: string;
  query: string;
  complexity: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  executionId: string;
  plan: any;
  execution: any;
  analysis: any;
  summary: any;
  metrics: {
    dataRetrievalRate: number;
    joinSuccess: boolean;
    emptyResultHandling: 'excellent' | 'good' | 'poor' | 'failed';
    dataAwareness: 'excellent' | 'good' | 'poor' | 'failed';
    performance: 'excellent' | 'good' | 'poor' | 'failed';
    errorRecovery: 'excellent' | 'good' | 'poor' | 'failed';
    overallScore: number;
  };
  issues: string[];
  recommendations: string[];
}

interface BenchmarkReport {
  timestamp: string;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  categoryResults: {
    dataJoining: CategoryMetrics;
    emptyResultHandling: CategoryMetrics;
    dataAwareness: CategoryMetrics;
    performance: CategoryMetrics;
    errorRecovery: CategoryMetrics;
  };
  overallMetrics: {
    averageScore: number;
    averageDuration: number;
    successRate: number;
    improvementAreas: string[];
    strengths: string[];
  };
  results: BenchmarkResult[];
  comparison?: {
    previousRun?: string;
    improvements: string[];
    regressions: string[];
  };
}

interface CategoryMetrics {
  totalTests: number;
  successfulTests: number;
  averageScore: number;
  averageDuration: number;
  keyIssues: string[];
  recommendations: string[];
}

class BenchmarkTestSuite {
  private results: BenchmarkResult[] = [];

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

  async executeFullCycle(query: string): Promise<any> {
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
        llm_provider: 'openai',
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

  calculateMetrics(test: any, result: any): any {
    const execution = result.execution;
    const steps = execution.results || [];
    
    // Calculate data retrieval rate
    const stepsWithData = steps.filter((step: any) => 
      step.status === 'COMPLETED' && 
      Array.isArray(step.result) && 
      step.result.length > 0
    ).length;
    
    const dataRetrievalRate = execution.completedSteps > 0 ? 
      (stepsWithData / execution.completedSteps) * 100 : 0;
    
    // Check join success
    const joinSuccess = this.checkJoinSuccess(steps);
    
    // Evaluate empty result handling
    const emptyResultHandling = this.evaluateEmptyResultHandling(steps, test);
    
    // Evaluate data awareness
    const dataAwareness = this.evaluateDataAwareness(test, result);
    
    // Evaluate performance
    const performance = this.evaluatePerformance(result, test);
    
    // Evaluate error recovery
    const errorRecovery = this.evaluateErrorRecovery(execution, test);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      dataRetrievalRate,
      joinSuccess,
      emptyResultHandling,
      dataAwareness,
      performance,
      errorRecovery
    });
    
    return {
      dataRetrievalRate,
      joinSuccess,
      emptyResultHandling,
      dataAwareness,
      performance,
      errorRecovery,
      overallScore
    };
  }

  private checkJoinSuccess(steps: any[]): boolean {
    const hasVariableReferences = steps.some((step: any) => 
      JSON.stringify(step.params).includes('${step_') ||
      JSON.stringify(step.params).includes('${step_0') ||
      JSON.stringify(step.params).includes('${step_1')
    );
    
    const hasDependencies = steps.some((step: any) => step.dependencies.length > 0);
    
    return hasVariableReferences || hasDependencies;
  }

  private evaluateEmptyResultHandling(steps: any[], test: any): 'excellent' | 'good' | 'poor' | 'failed' {
    const emptySteps = steps.filter((step: any) => 
      step.status === 'COMPLETED' && 
      Array.isArray(step.result) && 
      step.result.length === 0
    ).length;
    
    const totalSteps = steps.length;
    const emptyRatio = emptySteps / totalSteps;
    
    if (test.expectedEmptyResults) {
      // Test expects empty results - check if handled gracefully
      if (emptyRatio > 0.5) return 'excellent';
      if (emptyRatio > 0.3) return 'good';
      return 'poor';
    } else {
      // Test doesn't expect empty results
      if (emptyRatio === 0) return 'excellent';
      if (emptyRatio < 0.2) return 'good';
      if (emptyRatio < 0.5) return 'poor';
      return 'failed';
    }
  }

  private evaluateDataAwareness(test: any, result: any): 'excellent' | 'good' | 'poor' | 'failed' {
    const query = test.query.toLowerCase();
    const hasRealData = query.includes('mayerfurt') || query.includes('test city');
    const hasUnrealisticData = query.includes('nonexistent') || query.includes('1000 shipments');
    
    if (hasRealData && result.success) return 'excellent';
    if (hasRealData) return 'good';
    if (hasUnrealisticData && !result.success) return 'excellent';
    if (hasUnrealisticData) return 'poor';
    return 'good';
  }

  private evaluatePerformance(result: any, test: any): 'excellent' | 'good' | 'poor' | 'failed' {
    const duration = result.duration || 0;
    const maxTime = test.maxExecutionTime || 10000;
    
    if (duration < maxTime * 0.5) return 'excellent';
    if (duration < maxTime) return 'good';
    if (duration < maxTime * 1.5) return 'poor';
    return 'failed';
  }

  private evaluateErrorRecovery(execution: any, test: any): 'excellent' | 'good' | 'poor' | 'failed' {
    if (test.expectedError) {
      // Test expects errors - check recovery
      if (execution.status === 'COMPLETED') return 'excellent';
      if (execution.failedSteps < execution.totalSteps) return 'good';
      return 'poor';
    } else {
      // Test doesn't expect errors
      if (execution.status === 'COMPLETED' && execution.failedSteps === 0) return 'excellent';
      if (execution.status === 'COMPLETED') return 'good';
      return 'poor';
    }
  }

  private calculateOverallScore(metrics: any): number {
    const scores = {
      dataRetrieval: metrics.dataRetrievalRate / 100,
      joinSuccess: metrics.joinSuccess ? 1 : 0,
      emptyResultHandling: this.scoreToNumber(metrics.emptyResultHandling),
      dataAwareness: this.scoreToNumber(metrics.dataAwareness),
      performance: this.scoreToNumber(metrics.performance),
      errorRecovery: this.scoreToNumber(metrics.errorRecovery)
    };
    
    return Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length * 10;
  }

  private scoreToNumber(score: string): number {
    switch (score) {
      case 'excellent': return 1;
      case 'good': return 0.7;
      case 'poor': return 0.4;
      case 'failed': return 0;
      default: return 0.5;
    }
  }

  async runTest(category: string, test: any): Promise<BenchmarkResult> {
    console.log(`\n🧪 Running ${category} test: ${test.name}`);
    console.log(`📝 Query: ${test.query}`);
    
    const startTime = performance.now();
    
    try {
      const fullCycleResult = await this.executeFullCycle(test.query);
      const cycleData = fullCycleResult.executeFullCycle;
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const metrics = this.calculateMetrics(test, cycleData);
      
      const result: BenchmarkResult = {
        category,
        testId: test.id,
        testName: test.name,
        query: test.query,
        complexity: test.complexity,
        startTime,
        endTime,
        duration,
        success: cycleData.success,
        executionId: cycleData.execution_id,
        plan: cycleData.plan,
        execution: cycleData.execution,
        analysis: cycleData.analysis,
        summary: cycleData.summary,
        metrics,
        issues: this.identifyIssues(test, cycleData, metrics),
        recommendations: this.generateRecommendations(test, metrics)
      };
      
      console.log(`✅ Test completed in ${duration.toFixed(2)}ms`);
      console.log(`📊 Overall Score: ${metrics.overallScore.toFixed(1)}/10`);
      
      return result;
      
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`❌ Test failed: ${error}`);
      
      return {
        category,
        testId: test.id,
        testName: test.name,
        query: test.query,
        complexity: test.complexity,
        startTime,
        endTime,
        duration,
        success: false,
        executionId: '',
        plan: null,
        execution: null,
        analysis: null,
        summary: null,
        metrics: {
          dataRetrievalRate: 0,
          joinSuccess: false,
          emptyResultHandling: 'failed',
          dataAwareness: 'failed',
          performance: 'failed',
          errorRecovery: 'failed',
          overallScore: 0
        },
        issues: [`Test failed: ${error}`],
        recommendations: ['Fix the underlying error and retry']
      };
    }
  }

  private identifyIssues(test: any, result: any, metrics: any): string[] {
    const issues: string[] = [];
    
    if (metrics.dataRetrievalRate < 70) {
      issues.push('Low data retrieval rate');
    }
    
    if (!metrics.joinSuccess && test.expectedJoinSuccess) {
      issues.push('Failed to join data across steps');
    }
    
    if (metrics.emptyResultHandling === 'poor' || metrics.emptyResultHandling === 'failed') {
      issues.push('Poor empty result handling');
    }
    
    if (metrics.dataAwareness === 'poor' || metrics.dataAwareness === 'failed') {
      issues.push('Poor data awareness');
    }
    
    if (metrics.performance === 'poor' || metrics.performance === 'failed') {
      issues.push('Performance issues');
    }
    
    if (metrics.errorRecovery === 'poor' || metrics.errorRecovery === 'failed') {
      issues.push('Poor error recovery');
    }
    
    return issues;
  }

  private generateRecommendations(test: any, metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.dataRetrievalRate < 70) {
      recommendations.push('Improve data retrieval logic and validation');
    }
    
    if (!metrics.joinSuccess) {
      recommendations.push('Enhance data joining capabilities');
    }
    
    if (metrics.emptyResultHandling === 'poor') {
      recommendations.push('Implement better empty result handling');
    }
    
    if (metrics.dataAwareness === 'poor') {
      recommendations.push('Improve data awareness and realistic query generation');
    }
    
    if (metrics.performance === 'poor') {
      recommendations.push('Optimize performance and parallel execution');
    }
    
    if (metrics.errorRecovery === 'poor') {
      recommendations.push('Enhance error recovery mechanisms');
    }
    
    return recommendations;
  }

  async runAllBenchmarks(): Promise<BenchmarkReport> {
    console.log('🚀 Starting Comprehensive Benchmark Test Suite');
    console.log('='.repeat(60));
    
    // Run all test categories
    for (const [category, tests] of Object.entries(BENCHMARK_TESTS)) {
      console.log(`\n📊 Running ${category} tests...`);
      
      for (const test of tests) {
        const result = await this.runTest(category, test);
        this.results.push(result);
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return this.generateReport();
  }

  private generateReport(): BenchmarkReport {
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    const categoryResults = this.calculateCategoryResults();
    const overallMetrics = this.calculateOverallMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      totalTests,
      successfulTests,
      failedTests,
      categoryResults,
      overallMetrics,
      results: this.results
    };
  }

  private calculateCategoryResults(): any {
    const categories = ['dataJoining', 'emptyResultHandling', 'dataAwareness', 'performance', 'errorRecovery'];
    const categoryResults: any = {};
    
    categories.forEach(category => {
      const categoryTests = this.results.filter(r => r.category === category);
      const successfulTests = categoryTests.filter(r => r.success).length;
      const averageScore = categoryTests.reduce((sum, r) => sum + r.metrics.overallScore, 0) / categoryTests.length;
      const averageDuration = categoryTests.reduce((sum, r) => sum + r.duration, 0) / categoryTests.length;
      
      const keyIssues = [...new Set(categoryTests.flatMap(r => r.issues))];
      const recommendations = [...new Set(categoryTests.flatMap(r => r.recommendations))];
      
      categoryResults[category] = {
        totalTests: categoryTests.length,
        successfulTests,
        averageScore,
        averageDuration,
        keyIssues,
        recommendations
      };
    });
    
    return categoryResults;
  }

  private calculateOverallMetrics(): any {
    const averageScore = this.results.reduce((sum, r) => sum + r.metrics.overallScore, 0) / this.results.length;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const successRate = (this.results.filter(r => r.success).length / this.results.length) * 100;
    
    const allIssues = [...new Set(this.results.flatMap(r => r.issues))];
    const allRecommendations = [...new Set(this.results.flatMap(r => r.recommendations))];
    
    return {
      averageScore,
      averageDuration,
      successRate,
      improvementAreas: allIssues,
      strengths: this.identifyStrengths()
    };
  }

  private identifyStrengths(): string[] {
    const strengths: string[] = [];
    
    const dataRetrievalRate = this.results.reduce((sum, r) => sum + r.metrics.dataRetrievalRate, 0) / this.results.length;
    if (dataRetrievalRate > 80) strengths.push('High data retrieval rate');
    
    const joinSuccessRate = (this.results.filter(r => r.metrics.joinSuccess).length / this.results.length) * 100;
    if (joinSuccessRate > 70) strengths.push('Good data joining capabilities');
    
    const performanceScore = this.results.filter(r => r.metrics.performance === 'excellent' || r.metrics.performance === 'good').length / this.results.length * 100;
    if (performanceScore > 70) strengths.push('Good performance');
    
    return strengths;
  }

  printReport(report: BenchmarkReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE BENCHMARK REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 OVERALL METRICS:`);
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   Successful: ${report.successfulTests} (${report.overallMetrics.successRate.toFixed(1)}%)`);
    console.log(`   Failed: ${report.failedTests}`);
    console.log(`   Average Score: ${report.overallMetrics.averageScore.toFixed(1)}/10`);
    console.log(`   Average Duration: ${report.overallMetrics.averageDuration.toFixed(2)}ms`);
    
    console.log(`\n📊 CATEGORY RESULTS:`);
    Object.entries(report.categoryResults).forEach(([category, metrics]: [string, any]) => {
      console.log(`\n   ${category.toUpperCase()}:`);
      console.log(`     Tests: ${metrics.successfulTests}/${metrics.totalTests}`);
      console.log(`     Average Score: ${metrics.averageScore.toFixed(1)}/10`);
      console.log(`     Average Duration: ${metrics.averageDuration.toFixed(2)}ms`);
      if (metrics.keyIssues.length > 0) {
        console.log(`     Key Issues: ${metrics.keyIssues.join(', ')}`);
      }
    });
    
    if (report.overallMetrics.strengths.length > 0) {
      console.log(`\n💪 STRENGTHS:`);
      report.overallMetrics.strengths.forEach((strength, index) => {
        console.log(`   ${index + 1}. ${strength}`);
      });
    }
    
    if (report.overallMetrics.improvementAreas.length > 0) {
      console.log(`\n🔧 IMPROVEMENT AREAS:`);
      report.overallMetrics.improvementAreas.forEach((area, index) => {
        console.log(`   ${index + 1}. ${area}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  const benchmarkSuite = new BenchmarkTestSuite();
  
  try {
    const report = await benchmarkSuite.runAllBenchmarks();
    benchmarkSuite.printReport(report);
    
    // Save report to file
    const reportPath = '/Users/yab/Projects/clear-ai-v3/BENCHMARK_REPORT.json';
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Benchmark report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Benchmark execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { BenchmarkTestSuite, BENCHMARK_TESTS };
