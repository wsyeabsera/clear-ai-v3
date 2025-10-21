#!/usr/bin/env ts-node

/**
 * Execution Results Analysis Script
 * 
 * This script analyzes the actual execution results to verify if queries
 * returned real data or empty results, providing an honest assessment.
 */

import { readFileSync } from 'fs';

interface StepResult {
  stepIndex: number;
  tool: string;
  params: any;
  status: string;
  result: any[];
  error: string | null;
  startedAt: string;
  completedAt: string;
  retryCount: number;
  dependencies: number[];
}

interface QueryAnalysis {
  queryId: string;
  queryName: string;
  query: string;
  totalSteps: number;
  completedSteps: number;
  stepsWithData: number;
  stepsWithEmptyResults: number;
  dataRetrievalRate: number;
  joinSuccess: boolean;
  meaningfulResult: boolean;
  stepDetails: StepResult[];
  issues: string[];
}

interface TruthfulAssessment {
  totalQueries: number;
  queriesWithData: number;
  queriesWithEmptyResults: number;
  overallDataRetrievalRate: number;
  overallJoinSuccessRate: number;
  meaningfulResultsRate: number;
  queryAnalyses: QueryAnalysis[];
  insights: {
    commonIssues: string[];
    dataAvailability: {
      facilities: boolean;
      shipments: boolean;
      inspections: boolean;
      contaminants: boolean;
      contracts: boolean;
      wasteGenerators: boolean;
      wasteCodes: boolean;
    };
    recommendations: string[];
  };
}

class ExecutionResultAnalyzer {
  private reportData: any;
  private assessment: TruthfulAssessment;

  constructor() {
    this.loadReportData();
    this.assessment = {
      totalQueries: 0,
      queriesWithData: 0,
      queriesWithEmptyResults: 0,
      overallDataRetrievalRate: 0,
      overallJoinSuccessRate: 0,
      meaningfulResultsRate: 0,
      queryAnalyses: [],
      insights: {
        commonIssues: [],
        dataAvailability: {
          facilities: false,
          shipments: false,
          inspections: false,
          contaminants: false,
          contracts: false,
          wasteGenerators: false,
          wasteCodes: false
        },
        recommendations: []
      }
    };
  }

  private loadReportData(): void {
    try {
      const reportPath = '/Users/yab/Projects/clear-ai-v3/SMART_MULTI_TOOL_TEST_REPORT.json';
      const reportContent = readFileSync(reportPath, 'utf-8');
      this.reportData = JSON.parse(reportContent);
    } catch (error) {
      console.error('Failed to load report data:', error);
      process.exit(1);
    }
  }

  private analyzeStepResult(step: any): StepResult {
    return {
      stepIndex: step.stepIndex,
      tool: step.tool,
      params: step.params,
      status: step.status,
      result: Array.isArray(step.result) ? step.result : [],
      error: step.error,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      retryCount: step.retryCount,
      dependencies: step.dependencies
    };
  }

  private analyzeQuery(result: any): QueryAnalysis {
    const execution = result.execution;
    const steps = execution.results || [];
    
    const stepDetails = steps.map((step: any) => this.analyzeStepResult(step));
    
    const stepsWithData = stepDetails.filter((step: StepResult) => 
      step.status === 'COMPLETED' && 
      Array.isArray(step.result) && 
      step.result.length > 0
    ).length;
    
    const stepsWithEmptyResults = stepDetails.filter((step: StepResult) => 
      step.status === 'COMPLETED' && 
      Array.isArray(step.result) && 
      step.result.length === 0
    ).length;
    
    const dataRetrievalRate = execution.completedSteps > 0 ? 
      (stepsWithData / execution.completedSteps) * 100 : 0;
    
    // Check if joins were successful by looking for variable references
    const joinSuccess = this.checkJoinSuccess(stepDetails);
    
    // Determine if result is meaningful
    const meaningfulResult = stepsWithData > 0 && dataRetrievalRate > 50;
    
    // Identify issues
    const issues: string[] = [];
    if (stepsWithEmptyResults > 0) {
      issues.push(`${stepsWithEmptyResults} steps returned empty results`);
    }
    if (!joinSuccess && stepDetails.length > 1) {
      issues.push('Failed to properly join data across steps');
    }
    if (dataRetrievalRate < 50) {
      issues.push('Low data retrieval rate');
    }
    
    return {
      queryId: result.queryId,
      queryName: result.queryName,
      query: result.query,
      totalSteps: execution.totalSteps,
      completedSteps: execution.completedSteps,
      stepsWithData,
      stepsWithEmptyResults,
      dataRetrievalRate,
      joinSuccess,
      meaningfulResult,
      stepDetails,
      issues
    };
  }

  private checkJoinSuccess(stepDetails: StepResult[]): boolean {
    // Look for variable references like ${step_0.result[0]._id}
    const hasVariableReferences = stepDetails.some((step: StepResult) => 
      JSON.stringify(step.params).includes('${step_') ||
      JSON.stringify(step.params).includes('${step_0') ||
      JSON.stringify(step.params).includes('${step_1')
    );
    
    // Check if later steps used results from earlier steps
    const hasDependencies = stepDetails.some((step: StepResult) => step.dependencies.length > 0);
    
    return hasVariableReferences || hasDependencies;
  }

  private analyzeDataAvailability(): void {
    const allSteps = this.assessment.queryAnalyses.flatMap(q => q.stepDetails);
    
    this.assessment.insights.dataAvailability = {
      facilities: allSteps.some(step => step.tool === 'facilities_list' && step.result.length > 0),
      shipments: allSteps.some(step => step.tool === 'shipments_list' && step.result.length > 0),
      inspections: allSteps.some(step => step.tool === 'inspections_list' && step.result.length > 0),
      contaminants: allSteps.some(step => step.tool === 'contaminants_list' && step.result.length > 0),
      contracts: allSteps.some(step => step.tool === 'contracts_list' && step.result.length > 0),
      wasteGenerators: allSteps.some(step => step.tool === 'waste_generators_list' && step.result.length > 0),
      wasteCodes: allSteps.some(step => step.tool === 'waste_codes_list' && step.result.length > 0)
    };
  }

  private generateRecommendations(): void {
    const recommendations: string[] = [];
    
    if (this.assessment.overallDataRetrievalRate < 70) {
      recommendations.push('Improve data retrieval by using more specific filters and checking data availability');
    }
    
    if (this.assessment.overallJoinSuccessRate < 80) {
      recommendations.push('Enhance data joining logic to better utilize results from previous steps');
    }
    
    if (this.assessment.meaningfulResultsRate < 60) {
      recommendations.push('Focus on creating queries that return meaningful, non-empty results');
    }
    
    const emptyResultTools = this.assessment.queryAnalyses
      .flatMap(q => q.stepDetails)
      .filter(step => step.result.length === 0)
      .map(step => step.tool);
    
    const emptyToolCounts = emptyResultTools.reduce((acc, tool) => {
      acc[tool] = (acc[tool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(emptyToolCounts).forEach(([tool, count]) => {
      if (count > 2) {
        recommendations.push(`Tool '${tool}' frequently returns empty results - check data availability or query parameters`);
      }
    });
    
    this.assessment.insights.recommendations = recommendations;
  }

  private identifyCommonIssues(): void {
    const allIssues = this.assessment.queryAnalyses.flatMap(q => q.issues);
    const issueCounts = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    this.assessment.insights.commonIssues = Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);
  }

  analyze(): TruthfulAssessment {
    console.log('🔍 Analyzing execution results for truthful assessment...');
    
    const results = this.reportData.results || [];
    this.assessment.totalQueries = results.length;
    
    // Analyze each query
    results.forEach((result: any) => {
      const queryAnalysis = this.analyzeQuery(result);
      this.assessment.queryAnalyses.push(queryAnalysis);
      
      if (queryAnalysis.meaningfulResult) {
        this.assessment.queriesWithData++;
      } else {
        this.assessment.queriesWithEmptyResults++;
      }
    });
    
    // Calculate overall metrics
    this.assessment.overallDataRetrievalRate = this.assessment.queryAnalyses.length > 0 ?
      this.assessment.queryAnalyses.reduce((sum, q) => sum + q.dataRetrievalRate, 0) / this.assessment.queryAnalyses.length : 0;
    
    this.assessment.overallJoinSuccessRate = this.assessment.queryAnalyses.length > 0 ?
      (this.assessment.queryAnalyses.filter(q => q.joinSuccess).length / this.assessment.queryAnalyses.length) * 100 : 0;
    
    this.assessment.meaningfulResultsRate = this.assessment.totalQueries > 0 ?
      (this.assessment.queriesWithData / this.assessment.totalQueries) * 100 : 0;
    
    // Analyze data availability and generate insights
    this.analyzeDataAvailability();
    this.identifyCommonIssues();
    this.generateRecommendations();
    
    return this.assessment;
  }

  printDetailedAnalysis(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 TRUTHFUL AI EXECUTION ANALYSIS');
    console.log('='.repeat(80));
    
    console.log(`\n📊 OVERALL METRICS:`);
    console.log(`   Total Queries: ${this.assessment.totalQueries}`);
    console.log(`   Queries with Data: ${this.assessment.queriesWithData} (${this.assessment.meaningfulResultsRate.toFixed(1)}%)`);
    console.log(`   Queries with Empty Results: ${this.assessment.queriesWithEmptyResults} (${(100 - this.assessment.meaningfulResultsRate).toFixed(1)}%)`);
    console.log(`   Average Data Retrieval Rate: ${this.assessment.overallDataRetrievalRate.toFixed(1)}%`);
    console.log(`   Join Success Rate: ${this.assessment.overallJoinSuccessRate.toFixed(1)}%`);
    
    console.log(`\n📈 DATA AVAILABILITY:`);
    Object.entries(this.assessment.insights.dataAvailability).forEach(([tool, hasData]) => {
      console.log(`   ${tool}: ${hasData ? '✅ Has Data' : '❌ No Data'}`);
    });
    
    if (this.assessment.insights.commonIssues.length > 0) {
      console.log(`\n⚠️  COMMON ISSUES:`);
      this.assessment.insights.commonIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    if (this.assessment.insights.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      this.assessment.insights.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    console.log(`\n📋 DETAILED QUERY ANALYSIS:`);
    this.assessment.queryAnalyses.forEach((query, index) => {
      console.log(`\n   Query ${index + 1}: ${query.queryName}`);
      console.log(`   Data Retrieval Rate: ${query.dataRetrievalRate.toFixed(1)}%`);
      console.log(`   Steps with Data: ${query.stepsWithData}/${query.completedSteps}`);
      console.log(`   Steps with Empty Results: ${query.stepsWithEmptyResults}`);
      console.log(`   Join Success: ${query.joinSuccess ? '✅' : '❌'}`);
      console.log(`   Meaningful Result: ${query.meaningfulResult ? '✅' : '❌'}`);
      
      if (query.issues.length > 0) {
        console.log(`   Issues: ${query.issues.join(', ')}`);
      }
      
      // Show step details
      console.log(`   Step Details:`);
      query.stepDetails.forEach((step, stepIndex) => {
        const dataCount = Array.isArray(step.result) ? step.result.length : 0;
        console.log(`     Step ${stepIndex}: ${step.tool} - ${dataCount} results ${step.status === 'COMPLETED' ? '✅' : '❌'}`);
      });
    });
    
    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  const analyzer = new ExecutionResultAnalyzer();
  
  try {
    const assessment = analyzer.analyze();
    analyzer.printDetailedAnalysis();
    
    // Save assessment to file
    const fs = require('fs');
    const assessmentPath = '/Users/yab/Projects/clear-ai-v3/TRUTHFUL_AI_ASSESSMENT.json';
    fs.writeFileSync(assessmentPath, JSON.stringify(assessment, null, 2));
    console.log(`\n💾 Truthful assessment saved to: ${assessmentPath}`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ExecutionResultAnalyzer, TruthfulAssessment };
