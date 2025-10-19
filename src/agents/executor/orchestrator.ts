// Orchestrator for managing execution flow, dependencies, and parallel execution

import { PlanStep } from '../planner/types';
import { ExecutionStepResult, StepStatus, DependencyGraph, ExecutionContext } from './types';

export class ExecutionOrchestrator {
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
    return readySteps.filter(stepIndex => {
      const step = steps[stepIndex];
      return step.parallel && 
             context.runningSteps.size < context.config.parallelExecutionLimit;
    });
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
