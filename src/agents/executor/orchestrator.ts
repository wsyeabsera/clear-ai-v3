// Orchestrator for managing execution flow, dependencies, and parallel execution

import { PlanStep } from '../planner/types';
import { ExecutionStepResult, StepStatus, DependencyGraph, ExecutionContext } from './types';
import { ComplexityAnalyzer, QueryComplexity, ExecutionStrategy } from '../planner/complexity-analyzer';

export class ExecutionOrchestrator {
  private complexityAnalyzer: ComplexityAnalyzer;
  private executionStrategy: ExecutionStrategy | null = null;

  constructor(tools: any[] = []) {
    this.complexityAnalyzer = new ComplexityAnalyzer(tools);
  }

  /**
   * Analyze query complexity and set execution strategy
   */
  analyzeAndSetStrategy(query: string, selectedTools: string[]): QueryComplexity {
    const complexity = this.complexityAnalyzer.analyzeQueryComplexity(query, selectedTools);
    this.executionStrategy = this.complexityAnalyzer.getExecutionStrategy(complexity);
    return complexity;
  }

  /**
   * Get current execution strategy
   */
  getExecutionStrategy(): ExecutionStrategy | null {
    return this.executionStrategy;
  }

  /**
   * Build dependency graph from plan steps
   */
  buildDependencyGraph(steps: PlanStep[]): DependencyGraph {
    const graph: DependencyGraph = {};
    
    steps.forEach((step, index) => {
      graph[index] = step.dependsOn || [];
    });
    
    return graph;
  }
  
  /**
   * Get steps ready to execute (dependencies satisfied)
   */
  getReadySteps(
    steps: PlanStep[], 
    results: ExecutionStepResult[],
    context: ExecutionContext
  ): number[] {
    const readySteps: number[] = [];
    
    steps.forEach((step, index) => {
      // Skip if already completed, failed, or running
      if (context.completedSteps.has(index) || 
          context.failedSteps.has(index) || 
          context.runningSteps.has(index)) {
        return;
      }
      
      // Check if all dependencies are satisfied
      if (this.areDependenciesSatisfied(index, results, context)) {
        readySteps.push(index);
      }
    });
    
    return readySteps;
  }
  
  /**
   * Check if all dependencies are completed
   */
  areDependenciesSatisfied(
    stepIndex: number, 
    results: ExecutionStepResult[], 
    context: ExecutionContext
  ): boolean {
    const step = results.find(r => r.stepIndex === stepIndex);
    if (!step) return false;
    
    // Check if all dependencies are completed
    for (const depIndex of step.dependencies) {
      if (!context.completedSteps.has(depIndex)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get steps that can run in parallel
   */
  getParallelSteps(
    readySteps: number[],
    steps: PlanStep[],
    context: ExecutionContext
  ): number[] {
    const strategy = this.getExecutionStrategy();
    const maxParallel = strategy?.maxParallelSteps || context.config.parallelExecutionLimit;
    
    return readySteps.filter(stepIndex => {
      const step = steps[stepIndex];
      const canRunParallel = step.parallel || this.canRunInParallel(step, steps, readySteps);
      const withinLimit = context.runningSteps.size < maxParallel;
      
      return canRunParallel && withinLimit;
    });
  }

  /**
   * Determine if a step can run in parallel based on complexity analysis
   */
  private canRunInParallel(step: PlanStep, steps: PlanStep[], readySteps: number[]): boolean {
    const strategy = this.getExecutionStrategy();
    
    // For complex strategies, allow more parallelization
    if (strategy?.strategy === 'complex' || strategy?.strategy === 'parallel') {
      // Check if this is a list operation that can run in parallel
      if (step.tool.includes('_list')) {
        return true;
      }
      
      // Check if this is an independent get operation
      if (step.tool.includes('_get') && step.dependsOn.length === 0) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get sequential steps (non-parallel or when parallel limit reached)
   */
  getSequentialSteps(
    readySteps: number[],
    steps: PlanStep[],
    context: ExecutionContext
  ): number[] {
    return readySteps.filter(stepIndex => {
      const step = steps[stepIndex];
      return !step.parallel || 
             context.runningSteps.size >= context.config.parallelExecutionLimit;
    });
  }
  
  /**
   * Sort steps by priority (dependencies first, then by index)
   */
  sortStepsByPriority(stepIndices: number[], steps: PlanStep[]): number[] {
    return stepIndices.sort((a, b) => {
      const stepA = steps[a];
      const stepB = steps[b];
      
      // Steps with fewer dependencies come first
      const depsA = stepA.dependsOn?.length || 0;
      const depsB = stepB.dependsOn?.length || 0;
      
      if (depsA !== depsB) {
        return depsA - depsB;
      }
      
      // If same dependency count, sort by index
      return a - b;
    });
  }
  
  /**
   * Check if execution is complete
   */
  isExecutionComplete(
    totalSteps: number,
    context: ExecutionContext
  ): boolean {
    return context.completedSteps.size + context.failedSteps.size >= totalSteps;
  }
  
  /**
   * Check if execution should continue on error
   */
  shouldContinueOnError(
    context: ExecutionContext,
    failedStepIndex: number
  ): boolean {
    if (!context.config.continueOnError) {
      return false;
    }
    
    // Check if the failed step is critical (has many dependents)
    const dependents = this.getDependents(failedStepIndex, context);
    return dependents.length === 0; // Only continue if no other steps depend on this one
  }
  
  /**
   * Get steps that depend on a given step
   */
  getDependents(stepIndex: number, context: ExecutionContext): number[] {
    const dependents: number[] = [];
    
    for (const [stepIdx, deps] of Object.entries(context.dependencyGraph)) {
      if (deps.includes(stepIndex)) {
        dependents.push(parseInt(stepIdx));
      }
    }
    
    return dependents;
  }
  
  /**
   * Get intelligent batches for similar operations
   */
  getIntelligentBatches(
    readySteps: number[],
    steps: PlanStep[],
    context: ExecutionContext
  ): number[][] {
    const strategy = this.getExecutionStrategy();
    const batchSize = strategy?.batchSize || 2;
    
    const batches: number[][] = [];
    const processed = new Set<number>();
    
    // Group similar operations
    const listSteps = readySteps.filter(stepIndex => 
      steps[stepIndex].tool.includes('_list') && !processed.has(stepIndex)
    );
    const getSteps = readySteps.filter(stepIndex => 
      steps[stepIndex].tool.includes('_get') && !processed.has(stepIndex)
    );
    const otherSteps = readySteps.filter(stepIndex => 
      !steps[stepIndex].tool.includes('_list') && 
      !steps[stepIndex].tool.includes('_get') && 
      !processed.has(stepIndex)
    );
    
    // Create batches for list operations
    for (let i = 0; i < listSteps.length; i += batchSize) {
      const batch = listSteps.slice(i, i + batchSize);
      if (batch.length > 0) {
        batches.push(batch);
        batch.forEach(stepIndex => processed.add(stepIndex));
      }
    }
    
    // Create batches for get operations
    for (let i = 0; i < getSteps.length; i += batchSize) {
      const batch = getSteps.slice(i, i + batchSize);
      if (batch.length > 0) {
        batches.push(batch);
        batch.forEach(stepIndex => processed.add(stepIndex));
      }
    }
    
    // Add remaining steps as individual batches
    otherSteps.forEach(stepIndex => {
      batches.push([stepIndex]);
      processed.add(stepIndex);
    });
    
    return batches;
  }

  /**
   * Check if steps can be batched together
   */
  canBatchSteps(stepIndices: number[], steps: PlanStep[]): boolean {
    if (stepIndices.length < 2) return false;
    
    const stepTypes = stepIndices.map(idx => steps[idx].tool.split('_')[1]);
    const uniqueTypes = new Set(stepTypes);
    
    // Can batch if all steps are the same type (list, get, etc.)
    return uniqueTypes.size === 1;
  }

  /**
   * Get execution priority for a step
   */
  getStepPriority(stepIndex: number, steps: PlanStep[]): number {
    const step = steps[stepIndex];
    const strategy = this.getExecutionStrategy();
    
    // Higher priority for list operations in complex queries
    if (strategy?.strategy === 'complex' && step.tool.includes('_list')) {
      return 1;
    }
    
    // Higher priority for steps with no dependencies
    if (step.dependsOn.length === 0) {
      return 2;
    }
    
    // Lower priority for create operations (usually depend on other data)
    if (step.tool.includes('_create')) {
      return 4;
    }
    
    return 3;
  }

  /**
   * Calculate execution progress percentage
   */
  calculateProgress(
    totalSteps: number,
    context: ExecutionContext
  ): number {
    if (totalSteps === 0) return 100;
    
    const completed = context.completedSteps.size;
    const failed = context.failedSteps.size;
    
    return Math.round(((completed + failed) / totalSteps) * 100);
  }
  
  /**
   * Get execution summary
   */
  getExecutionSummary(
    totalSteps: number,
    context: ExecutionContext,
    results: ExecutionStepResult[]
  ): {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    runningSteps: number;
    pendingSteps: number;
    progress: number;
    isComplete: boolean;
  } {
    const completed = context.completedSteps.size;
    const failed = context.failedSteps.size;
    const running = context.runningSteps.size;
    const pending = totalSteps - completed - failed - running;
    
    return {
      totalSteps,
      completedSteps: completed,
      failedSteps: failed,
      runningSteps: running,
      pendingSteps: pending,
      progress: this.calculateProgress(totalSteps, context),
      isComplete: this.isExecutionComplete(totalSteps, context)
    };
  }
  
  /**
   * Validate execution context
   */
  validateContext(context: ExecutionContext): string[] {
    const errors: string[] = [];
    
    if (!context.executionId) {
      errors.push('Execution ID is required');
    }
    
    if (!context.planRequestId) {
      errors.push('Plan request ID is required');
    }
    
    if (!context.config) {
      errors.push('Execution config is required');
    }
    
    if (context.config.maxRetries < 0) {
      errors.push('Max retries must be non-negative');
    }
    
    if (context.config.retryDelayMs < 0) {
      errors.push('Retry delay must be non-negative');
    }
    
    if (context.config.parallelExecutionLimit < 1) {
      errors.push('Parallel execution limit must be at least 1');
    }
    
    return errors;
  }
  
  /**
   * Create execution context
   */
  createContext(
    executionId: string,
    planRequestId: string,
    config: any,
    steps: PlanStep[]
  ): ExecutionContext {
    const dependencyGraph = this.buildDependencyGraph(steps);
    
    return {
      executionId,
      planRequestId,
      config,
      dependencyGraph,
      completedSteps: new Set(),
      failedSteps: new Set(),
      runningSteps: new Set()
    };
  }
  
  /**
   * Update context after step completion
   */
  updateContextAfterStep(
    context: ExecutionContext,
    stepIndex: number,
    status: StepStatus
  ): void {
    context.runningSteps.delete(stepIndex);
    
    if (status === StepStatus.COMPLETED) {
      context.completedSteps.add(stepIndex);
    } else if (status === StepStatus.FAILED) {
      context.failedSteps.add(stepIndex);
    }
  }
}
