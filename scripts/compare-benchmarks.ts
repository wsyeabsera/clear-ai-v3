#!/usr/bin/env ts-node

/**
 * Benchmark Comparison Framework
 * 
 * This script compares benchmark results between different runs
 * to track improvement progress and identify regressions.
 */

import { readFileSync, writeFileSync } from 'fs';
import { performance } from 'perf_hooks';

interface ComparisonReport {
  timestamp: string;
  baselineRun: string;
  currentRun: string;
  overallImprovement: {
    scoreImprovement: number;
    durationImprovement: number;
    successRateImprovement: number;
    overallTrend: 'improving' | 'stable' | 'regressing';
  };
  categoryComparisons: {
    [category: string]: {
      scoreChange: number;
      durationChange: number;
      successRateChange: number;
      trend: 'improving' | 'stable' | 'regressing';
      keyImprovements: string[];
      keyRegressions: string[];
    };
  };
  detailedAnalysis: {
    improvements: string[];
    regressions: string[];
    recommendations: string[];
    nextSteps: string[];
  };
  metrics: {
    baseline: any;
    current: any;
    changes: any;
  };
}

class BenchmarkComparator {
  private baselineReport: any;
  private currentReport: any;

  constructor(baselinePath: string, currentPath: string) {
    this.loadReports(baselinePath, currentPath);
  }

  private loadReports(baselinePath: string, currentPath: string): void {
    try {
      this.baselineReport = JSON.parse(readFileSync(baselinePath, 'utf-8'));
      this.currentReport = JSON.parse(readFileSync(currentPath, 'utf-8'));
    } catch (error) {
      throw new Error(`Failed to load reports: ${error}`);
    }
  }

  compare(): ComparisonReport {
    console.log('🔍 Comparing benchmark results...');
    
    const overallImprovement = this.calculateOverallImprovement();
    const categoryComparisons = this.calculateCategoryComparisons();
    const detailedAnalysis = this.performDetailedAnalysis();
    
    const comparison: ComparisonReport = {
      timestamp: new Date().toISOString(),
      baselineRun: this.baselineReport.timestamp,
      currentRun: this.currentReport.timestamp,
      overallImprovement,
      categoryComparisons,
      detailedAnalysis,
      metrics: {
        baseline: this.baselineReport.overallMetrics,
        current: this.currentReport.overallMetrics,
        changes: this.calculateMetricChanges()
      }
    };
    
    return comparison;
  }

  private calculateOverallImprovement(): any {
    const baseline = this.baselineReport.overallMetrics;
    const current = this.currentReport.overallMetrics;
    
    const scoreImprovement = current.averageScore - baseline.averageScore;
    const durationImprovement = ((baseline.averageDuration - current.averageDuration) / baseline.averageDuration) * 100;
    const successRateImprovement = current.successRate - baseline.successRate;
    
    let overallTrend: 'improving' | 'stable' | 'regressing' = 'stable';
    if (scoreImprovement > 0.5 && successRateImprovement > 5) {
      overallTrend = 'improving';
    } else if (scoreImprovement < -0.5 || successRateImprovement < -5) {
      overallTrend = 'regressing';
    }
    
    return {
      scoreImprovement,
      durationImprovement,
      successRateImprovement,
      overallTrend
    };
  }

  private calculateCategoryComparisons(): any {
    const comparisons: any = {};
    
    const categories = ['dataJoining', 'emptyResultHandling', 'dataAwareness', 'performance', 'errorRecovery'];
    
    categories.forEach(category => {
      const baseline = this.baselineReport.categoryResults[category];
      const current = this.currentReport.categoryResults[category];
      
      if (!baseline || !current) return;
      
      const scoreChange = current.averageScore - baseline.averageScore;
      const durationChange = ((baseline.averageDuration - current.averageDuration) / baseline.averageDuration) * 100;
      const successRateChange = current.successfulTests - baseline.successfulTests;
      
      let trend: 'improving' | 'stable' | 'regressing' = 'stable';
      if (scoreChange > 0.5 && successRateChange > 0) {
        trend = 'improving';
      } else if (scoreChange < -0.5 || successRateChange < 0) {
        trend = 'regressing';
      }
      
      const keyImprovements = this.identifyImprovements(baseline, current);
      const keyRegressions = this.identifyRegressions(baseline, current);
      
      comparisons[category] = {
        scoreChange,
        durationChange,
        successRateChange,
        trend,
        keyImprovements,
        keyRegressions
      };
    });
    
    return comparisons;
  }

  private identifyImprovements(baseline: any, current: any): string[] {
    const improvements: string[] = [];
    
    if (current.averageScore > baseline.averageScore + 0.5) {
      improvements.push(`Score improved from ${baseline.averageScore.toFixed(1)} to ${current.averageScore.toFixed(1)}`);
    }
    
    if (current.averageDuration < baseline.averageDuration * 0.9) {
      improvements.push(`Duration improved by ${((baseline.averageDuration - current.averageDuration) / baseline.averageDuration * 100).toFixed(1)}%`);
    }
    
    if (current.successfulTests > baseline.successfulTests) {
      improvements.push(`Success rate improved from ${baseline.successfulTests}/${baseline.totalTests} to ${current.successfulTests}/${current.totalTests}`);
    }
    
    return improvements;
  }

  private identifyRegressions(baseline: any, current: any): string[] {
    const regressions: string[] = [];
    
    if (current.averageScore < baseline.averageScore - 0.5) {
      regressions.push(`Score decreased from ${baseline.averageScore.toFixed(1)} to ${current.averageScore.toFixed(1)}`);
    }
    
    if (current.averageDuration > baseline.averageDuration * 1.1) {
      regressions.push(`Duration increased by ${((current.averageDuration - baseline.averageDuration) / baseline.averageDuration * 100).toFixed(1)}%`);
    }
    
    if (current.successfulTests < baseline.successfulTests) {
      regressions.push(`Success rate decreased from ${baseline.successfulTests}/${baseline.totalTests} to ${current.successfulTests}/${current.totalTests}`);
    }
    
    return regressions;
  }

  private performDetailedAnalysis(): any {
    const improvements: string[] = [];
    const regressions: string[] = [];
    const recommendations: string[] = [];
    const nextSteps: string[] = [];
    
    // Analyze overall trends
    const overall = this.calculateOverallImprovement();
    
    if (overall.overallTrend === 'improving') {
      improvements.push('Overall system performance is improving');
    } else if (overall.overallTrend === 'regressing') {
      regressions.push('Overall system performance is regressing');
    }
    
    // Analyze category-specific trends
    const categoryComparisons = this.calculateCategoryComparisons();
    
    Object.entries(categoryComparisons).forEach(([category, comparison]: [string, any]) => {
      if (comparison.trend === 'improving') {
        improvements.push(`${category} category is showing improvement`);
        improvements.push(...comparison.keyImprovements);
      } else if (comparison.trend === 'regressing') {
        regressions.push(`${category} category is regressing`);
        regressions.push(...comparison.keyRegressions);
      }
    });
    
    // Generate recommendations based on analysis
    if (regressions.length > 0) {
      recommendations.push('Investigate and fix regressions immediately');
    }
    
    if (overall.scoreImprovement < 1) {
      recommendations.push('Focus on improving overall system intelligence');
    }
    
    if (overall.durationImprovement < 10) {
      recommendations.push('Optimize system performance');
    }
    
    // Generate next steps
    if (improvements.length > 0) {
      nextSteps.push('Continue current improvement strategies');
    }
    
    if (regressions.length > 0) {
      nextSteps.push('Address identified regressions');
    }
    
    nextSteps.push('Run additional benchmarks to validate improvements');
    nextSteps.push('Implement next phase of improvement blueprints');
    
    return {
      improvements,
      regressions,
      recommendations,
      nextSteps
    };
  }

  private calculateMetricChanges(): any {
    const baseline = this.baselineReport.overallMetrics;
    const current = this.currentReport.overallMetrics;
    
    return {
      averageScore: {
        baseline: baseline.averageScore,
        current: current.averageScore,
        change: current.averageScore - baseline.averageScore,
        changePercent: ((current.averageScore - baseline.averageScore) / baseline.averageScore) * 100
      },
      averageDuration: {
        baseline: baseline.averageDuration,
        current: current.averageDuration,
        change: current.averageDuration - baseline.averageDuration,
        changePercent: ((current.averageDuration - baseline.averageDuration) / baseline.averageDuration) * 100
      },
      successRate: {
        baseline: baseline.successRate,
        current: current.successRate,
        change: current.successRate - baseline.successRate,
        changePercent: current.successRate - baseline.successRate
      }
    };
  }

  printComparison(comparison: ComparisonReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 BENCHMARK COMPARISON REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📅 COMPARISON PERIOD:`);
    console.log(`   Baseline: ${comparison.baselineRun}`);
    console.log(`   Current:  ${comparison.currentRun}`);
    
    console.log(`\n📈 OVERALL IMPROVEMENT:`);
    const overall = comparison.overallImprovement;
    console.log(`   Score Change: ${overall.scoreImprovement > 0 ? '+' : ''}${overall.scoreImprovement.toFixed(2)}/10`);
    console.log(`   Duration Change: ${overall.durationImprovement > 0 ? '+' : ''}${overall.durationImprovement.toFixed(1)}%`);
    console.log(`   Success Rate Change: ${overall.successRateImprovement > 0 ? '+' : ''}${overall.successRateImprovement.toFixed(1)}%`);
    console.log(`   Overall Trend: ${overall.overallTrend.toUpperCase()}`);
    
    console.log(`\n📊 CATEGORY COMPARISONS:`);
    Object.entries(comparison.categoryComparisons).forEach(([category, comp]: [string, any]) => {
      console.log(`\n   ${category.toUpperCase()}:`);
      console.log(`     Score Change: ${comp.scoreChange > 0 ? '+' : ''}${comp.scoreChange.toFixed(2)}`);
      console.log(`     Duration Change: ${comp.durationChange > 0 ? '+' : ''}${comp.durationChange.toFixed(1)}%`);
      console.log(`     Success Change: ${comp.successRateChange > 0 ? '+' : ''}${comp.successRateChange}`);
      console.log(`     Trend: ${comp.trend.toUpperCase()}`);
      
      if (comp.keyImprovements.length > 0) {
        console.log(`     Improvements:`);
        comp.keyImprovements.forEach(imp => console.log(`       • ${imp}`));
      }
      
      if (comp.keyRegressions.length > 0) {
        console.log(`     Regressions:`);
        comp.keyRegressions.forEach(reg => console.log(`       • ${reg}`));
      }
    });
    
    if (comparison.detailedAnalysis.improvements.length > 0) {
      console.log(`\n✅ IMPROVEMENTS:`);
      comparison.detailedAnalysis.improvements.forEach((imp, index) => {
        console.log(`   ${index + 1}. ${imp}`);
      });
    }
    
    if (comparison.detailedAnalysis.regressions.length > 0) {
      console.log(`\n❌ REGRESSIONS:`);
      comparison.detailedAnalysis.regressions.forEach((reg, index) => {
        console.log(`   ${index + 1}. ${reg}`);
      });
    }
    
    if (comparison.detailedAnalysis.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      comparison.detailedAnalysis.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    if (comparison.detailedAnalysis.nextSteps.length > 0) {
      console.log(`\n🚀 NEXT STEPS:`);
      comparison.detailedAnalysis.nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: npx ts-node compare-benchmarks.ts <baseline-report.json> <current-report.json>');
    process.exit(1);
  }
  
  const [baselinePath, currentPath] = args;
  
  try {
    const comparator = new BenchmarkComparator(baselinePath, currentPath);
    const comparison = comparator.compare();
    comparator.printComparison(comparison);
    
    // Save comparison to file
    const comparisonPath = '/Users/yab/Projects/clear-ai-v3/BENCHMARK_COMPARISON.json';
    writeFileSync(comparisonPath, JSON.stringify(comparison, null, 2));
    console.log(`\n💾 Comparison report saved to: ${comparisonPath}`);
    
  } catch (error) {
    console.error('❌ Comparison failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { BenchmarkComparator, ComparisonReport };
