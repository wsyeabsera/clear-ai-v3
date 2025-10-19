/**
 * Complexity Analyzer for Multi-Tool Request Handling
 * Analyzes query complexity and determines optimal execution strategy
 */

import { MCPTool } from '../../types/mcp';

export interface QueryComplexity {
  isComplex: boolean;
  complexityScore: number;
  entityCount: number;
  relationshipCount: number;
  aggregationNeeded: boolean;
  timeBasedFiltering: boolean;
  paginationRequired: boolean;
  parallelizationOpportunities: ParallelizationOpportunity[];
  estimatedSteps: number;
  riskFactors: string[];
}

export interface ParallelizationOpportunity {
  type: 'independent_queries' | 'batch_operations' | 'parallel_filters';
  description: string;
  steps: number[];
  confidence: number;
}

export interface ExecutionStrategy {
  strategy: 'simple' | 'parallel' | 'batched' | 'complex';
  maxParallelSteps: number;
  batchSize: number;
  errorRecovery: boolean;
  progressTracking: boolean;
  estimatedDuration: number;
}

export class ComplexityAnalyzer {
  private tools: MCPTool[];

  constructor(tools: MCPTool[]) {
    this.tools = tools;
  }

  /**
   * Analyze query complexity and determine execution strategy
   */
  analyzeQueryComplexity(query: string, selectedTools: string[]): QueryComplexity {
    const complexity = this.calculateComplexityMetrics(query, selectedTools);
    const parallelizationOpportunities = this.identifyParallelizationOpportunities(selectedTools);
    
    return {
      isComplex: complexity.score > 0.6,
      complexityScore: complexity.score,
      entityCount: complexity.entityCount,
      relationshipCount: complexity.relationshipCount,
      aggregationNeeded: complexity.aggregationNeeded,
      timeBasedFiltering: complexity.timeBasedFiltering,
      paginationRequired: complexity.paginationRequired,
      parallelizationOpportunities,
      estimatedSteps: selectedTools.length,
      riskFactors: this.identifyRiskFactors(query, selectedTools)
    };
  }

  /**
   * Determine optimal execution strategy based on complexity
   */
  getExecutionStrategy(complexity: QueryComplexity): ExecutionStrategy {
    if (!complexity.isComplex) {
      return {
        strategy: 'simple',
        maxParallelSteps: 1,
        batchSize: 1,
        errorRecovery: false,
        progressTracking: false,
        estimatedDuration: complexity.estimatedSteps * 2000 // 2 seconds per step
      };
    }

    if (complexity.complexityScore > 0.8) {
      return {
        strategy: 'complex',
        maxParallelSteps: Math.min(5, complexity.parallelizationOpportunities.length),
        batchSize: 3,
        errorRecovery: true,
        progressTracking: true,
        estimatedDuration: complexity.estimatedSteps * 1500 // 1.5 seconds per step with parallelization
      };
    }

    if (complexity.parallelizationOpportunities.length > 2) {
      return {
        strategy: 'parallel',
        maxParallelSteps: Math.min(3, complexity.parallelizationOpportunities.length),
        batchSize: 2,
        errorRecovery: true,
        progressTracking: true,
        estimatedDuration: complexity.estimatedSteps * 1200 // 1.2 seconds per step with parallelization
      };
    }

    return {
      strategy: 'batched',
      maxParallelSteps: 2,
      batchSize: 2,
      errorRecovery: true,
      progressTracking: false,
      estimatedDuration: complexity.estimatedSteps * 1800 // 1.8 seconds per step
    };
  }

  /**
   * Calculate complexity metrics for the query
   */
  private calculateComplexityMetrics(query: string, selectedTools: string[]): {
    score: number;
    entityCount: number;
    relationshipCount: number;
    aggregationNeeded: boolean;
    timeBasedFiltering: boolean;
    paginationRequired: boolean;
  } {
    let score = 0;
    let entityCount = 0;
    let relationshipCount = 0;
    let aggregationNeeded = false;
    let timeBasedFiltering = false;
    let paginationRequired = false;

    // Count entities involved
    const entities = new Set<string>();
    selectedTools.forEach(toolName => {
      const tool = this.tools.find(t => t.name === toolName);
      if (tool) {
        const entity = toolName.split('_')[0];
        entities.add(entity);
      }
    });
    entityCount = entities.size;
    score += entityCount * 0.1;

    // Check for relationship complexity
    const relationshipKeywords = ['with', 'and', 'between', 'across', 'related', 'linked'];
    relationshipKeywords.forEach(keyword => {
      if (query.toLowerCase().includes(keyword)) {
        relationshipCount++;
        score += 0.15;
      }
    });

    // Check for aggregation needs
    const aggregationKeywords = ['total', 'sum', 'count', 'average', 'aggregate', 'summary', 'report'];
    aggregationKeywords.forEach(keyword => {
      if (query.toLowerCase().includes(keyword)) {
        aggregationNeeded = true;
        score += 0.2;
      }
    });

    // Check for time-based filtering
    const timeKeywords = ['last', 'recent', 'since', 'from', 'to', 'between', 'today', 'yesterday', 'week', 'month', 'year'];
    timeKeywords.forEach(keyword => {
      if (query.toLowerCase().includes(keyword)) {
        timeBasedFiltering = true;
        score += 0.1;
      }
    });

    // Check for pagination needs
    const paginationKeywords = ['all', 'list', 'show', 'get', 'find'];
    paginationKeywords.forEach(keyword => {
      if (query.toLowerCase().includes(keyword)) {
        paginationRequired = true;
        score += 0.05;
      }
    });

    // Check for complex operations
    const complexKeywords = ['analyze', 'compare', 'correlate', 'cross-reference', 'merge', 'join'];
    complexKeywords.forEach(keyword => {
      if (query.toLowerCase().includes(keyword)) {
        score += 0.25;
      }
    });

    // Check tool count
    if (selectedTools.length > 5) {
      score += 0.2;
    } else if (selectedTools.length > 3) {
      score += 0.1;
    }

    return {
      score: Math.min(1.0, score),
      entityCount,
      relationshipCount,
      aggregationNeeded,
      timeBasedFiltering,
      paginationRequired
    };
  }

  /**
   * Identify parallelization opportunities
   */
  private identifyParallelizationOpportunities(selectedTools: string[]): ParallelizationOpportunity[] {
    const opportunities: ParallelizationOpportunity[] = [];

    // Group tools by type
    const listTools = selectedTools.filter(tool => tool.includes('_list'));
    const getTools = selectedTools.filter(tool => tool.includes('_get'));
    const independentTools = selectedTools.filter(tool => 
      !tool.includes('_list') && !tool.includes('_get') && !tool.includes('_create')
    );

    // Independent queries opportunity
    if (listTools.length > 1) {
      opportunities.push({
        type: 'independent_queries',
        description: 'Multiple list operations can run in parallel',
        steps: listTools.map((_, index) => index),
        confidence: 0.9
      });
    }

    // Batch operations opportunity
    if (getTools.length > 1) {
      opportunities.push({
        type: 'batch_operations',
        description: 'Multiple get operations can be batched',
        steps: getTools.map((_, index) => index),
        confidence: 0.8
      });
    }

    // Parallel filters opportunity
    if (independentTools.length > 1) {
      opportunities.push({
        type: 'parallel_filters',
        description: 'Independent operations can run in parallel',
        steps: independentTools.map((_, index) => index),
        confidence: 0.7
      });
    }

    return opportunities;
  }

  /**
   * Identify potential risk factors
   */
  private identifyRiskFactors(query: string, selectedTools: string[]): string[] {
    const risks: string[] = [];

    // Check for circular dependencies
    const createTools = selectedTools.filter(tool => tool.includes('_create'));
    const getTools = selectedTools.filter(tool => tool.includes('_get'));
    
    if (createTools.length > 0 && getTools.length > 0) {
      risks.push('Potential circular dependency between create and get operations');
    }

    // Check for high tool count
    if (selectedTools.length > 8) {
      risks.push('High number of tools may cause timeout issues');
    }

    // Check for complex queries
    if (query.toLowerCase().includes('all') && selectedTools.length > 3) {
      risks.push('Query requests all data which may be slow');
    }

    // Check for time-based queries without limits
    if (query.toLowerCase().includes('last') && !query.toLowerCase().includes('limit')) {
      risks.push('Time-based query without limits may return large datasets');
    }

    return risks;
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(complexity: QueryComplexity): string[] {
    const suggestions: string[] = [];

    if (complexity.complexityScore > 0.7) {
      suggestions.push('Consider breaking this query into smaller, focused queries');
    }

    if (complexity.parallelizationOpportunities.length > 0) {
      suggestions.push(`Found ${complexity.parallelizationOpportunities.length} parallelization opportunities`);
    }

    if (complexity.riskFactors.length > 0) {
      suggestions.push('Consider adding pagination or time limits to reduce risk');
    }

    if (complexity.aggregationNeeded) {
      suggestions.push('Consider using database aggregation instead of application-level processing');
    }

    return suggestions;
  }
}
