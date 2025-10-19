// Main Execution Agent class integrating orchestrator, retry, and rollback handlers

import { randomUUID } from 'crypto';
import { PlanStep } from '../planner/types';
import { 
  ExecutionRequest, 
  ExecutionStepResult, 
  ExecutionStatus, 
  StepStatus, 
  ExecutionConfig, 
  ExecutionResponse,
  ExecutionSummary,
  ExecutionConfigInput
} from './types';
import { ExecutionStorage } from './storage';
import { ExecutionOrchestrator } from './orchestrator';
import { RetryHandler } from './retry-handler';
import { RollbackHandler } from './rollback-handler';
import { ToolAdapter } from '../planner/tool-adapter';
import { PlanStorage } from '../planner/storage';

export class ExecutionAgent {
  private orchestrator: ExecutionOrchestrator;
  private retryHandler: RetryHandler;
  private rollbackHandler: RollbackHandler;
  private defaultConfig: ExecutionConfig;
  
  constructor() {
    this.orchestrator = new ExecutionOrchestrator();
    this.retryHandler = new RetryHandler();
    this.rollbackHandler = new RollbackHandler();
    this.defaultConfig = {
      maxRetries: 3,
      retryDelayMs: 1000,
      enableRollback: true,
      continueOnError: false,
      parallelExecutionLimit: 5
    };
  }
  
  /**
   * Execute a plan by plan request ID
   */
  async executePlan(
    planRequestId: string, 
    configInput?: ExecutionConfigInput
  ): Promise<ExecutionResponse> {
    const executionId = randomUUID();
    const startTime = new Date();
    
    try {
      // Get the plan from storage
      const planRequest = await PlanStorage.getPlanByRequestId(planRequestId);
      if (!planRequest) {
        throw new Error(`Plan not found: ${planRequestId}`);
      }
      
      // Merge config with defaults
      const config = { ...this.defaultConfig, ...configInput };
      
      // Create execution context
      const context = this.orchestrator.createContext(
        executionId,
        planRequestId,
        config,
        planRequest.plan.steps
      );
      
      // Initialize step results
      const stepResults: ExecutionStepResult[] = planRequest.plan.steps.map((step, index) => ({
        stepIndex: index,
        tool: step.tool,
        params: step.params,
        status: StepStatus.PENDING,
        retryCount: 0,
        dependencies: step.dependsOn || []
      }));
      
      // Save initial execution request
      await ExecutionStorage.saveExecution(
        executionId,
        planRequestId,
        planRequest.plan.steps.length,
        stepResults
      );
      
      // Update status to running
      await ExecutionStorage.updateExecutionStatus(executionId, ExecutionStatus.RUNNING);
      
      console.log(`Starting execution ${executionId} for plan ${planRequestId}`);
      
      // Execute the plan
      const executionResult = await this.executePlanSteps(
        planRequest.plan.steps,
        stepResults,
        context
      );
      
      // Update final status
      const finalStatus = executionResult.success ? ExecutionStatus.COMPLETED : ExecutionStatus.FAILED;
      await ExecutionStorage.updateExecutionStatus(
        executionId, 
        finalStatus,
        executionResult.error
      );
      
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      
      console.log(`Execution ${executionId} ${finalStatus.toLowerCase()} in ${executionTime}ms`);
      
      // Get final execution data
      const finalExecution = await ExecutionStorage.getExecutionById(executionId);
      if (!finalExecution) {
        throw new Error('Failed to retrieve execution data');
      }
      
      return this.mapToExecutionResponse(finalExecution);
      
    } catch (error) {
      console.error(`Execution ${executionId} failed:`, error);
      
      // Update status to failed
      await ExecutionStorage.updateExecutionStatus(
        executionId, 
        ExecutionStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Get execution data for response
      const execution = await ExecutionStorage.getExecutionById(executionId);
      if (execution) {
        return this.mapToExecutionResponse(execution);
      }
      
      // Return minimal response if execution not found
      return {
        executionId,
        planRequestId,
        status: ExecutionStatus.FAILED,
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Execute plan steps with orchestration
   */
  private async executePlanSteps(
    steps: PlanStep[],
    stepResults: ExecutionStepResult[],
    context: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      while (!this.orchestrator.isExecutionComplete(steps.length, context)) {
        // Get ready steps
        const readySteps = this.orchestrator.getReadySteps(steps, stepResults, context);
        
        if (readySteps.length === 0) {
          // No ready steps, check if we're stuck
          const pendingSteps = stepResults.filter(r => r.status === StepStatus.PENDING);
          if (pendingSteps.length > 0) {
            throw new Error('Execution stuck: no ready steps but execution not complete');
          }
          break;
        }
        
        // Sort by priority
        const sortedSteps = this.orchestrator.sortStepsByPriority(readySteps, steps);
        
        // Execute parallel steps first
        const parallelSteps = this.orchestrator.getParallelSteps(sortedSteps, steps, context);
        if (parallelSteps.length > 0) {
          await this.executeParallelSteps(parallelSteps, steps, stepResults, context);
        }
        
        // Execute sequential steps
        const sequentialSteps = this.orchestrator.getSequentialSteps(sortedSteps, steps, context);
        for (const stepIndex of sequentialSteps) {
          await this.executeSingleStep(stepIndex, steps, stepResults, context);
        }
      }
      
      // Check if execution was successful
      const failedSteps = stepResults.filter(r => r.status === StepStatus.FAILED);
      const success = failedSteps.length === 0 || context.config.continueOnError;
      
      if (!success && context.config.enableRollback) {
        console.log('Execution failed, attempting rollback...');
        await this.performRollback(stepResults, context);
      }
      
      return { success };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Execute steps in parallel
   */
  private async executeParallelSteps(
    stepIndices: number[],
    steps: PlanStep[],
    stepResults: ExecutionStepResult[],
    context: any
  ): Promise<void> {
    const promises = stepIndices.map(stepIndex => 
      this.executeSingleStep(stepIndex, steps, stepResults, context)
    );
    
    await Promise.all(promises);
  }
  
  /**
   * Execute a single step with retry logic
   */
  private async executeSingleStep(
    stepIndex: number,
    steps: PlanStep[],
    stepResults: ExecutionStepResult[],
    context: any
  ): Promise<void> {
    const step = steps[stepIndex];
    const stepResult = stepResults[stepIndex];
    
    // Mark as running
    stepResult.status = StepStatus.RUNNING;
    stepResult.startedAt = new Date();
    context.runningSteps.add(stepIndex);
    
    await ExecutionStorage.updateStepResult(context.executionId, stepIndex, stepResult);
    
    try {
      // Execute with retry
      const result = await this.retryHandler.retryWithBackoff(
        () => ToolAdapter.executeTool(step.tool, step.params),
        context.config.maxRetries,
        context.config.retryDelayMs
      );
      
      // Mark as completed
      stepResult.status = StepStatus.COMPLETED;
      stepResult.result = result;
      stepResult.completedAt = new Date();
      
      console.log(`Step ${stepIndex} (${step.tool}) completed successfully`);
      
    } catch (error) {
      // Mark as failed
      stepResult.status = StepStatus.FAILED;
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
      stepResult.completedAt = new Date();
      
      console.error(`Step ${stepIndex} (${step.tool}) failed:`, stepResult.error);
      
      // Check if we should continue on error
      if (!context.config.continueOnError) {
        throw error;
      }
    } finally {
      // Update context and storage
      this.orchestrator.updateContextAfterStep(context, stepIndex, stepResult.status);
      await ExecutionStorage.updateStepResult(context.executionId, stepIndex, stepResult);
      
      // Update progress
      await ExecutionStorage.updateExecutionProgress(
        context.executionId,
        context.completedSteps.size,
        context.failedSteps.size
      );
    }
  }
  
  /**
   * Perform rollback for failed execution
   */
  private async performRollback(
    stepResults: ExecutionStepResult[],
    context: any
  ): Promise<void> {
    try {
      const completedSteps = stepResults.filter(r => r.status === StepStatus.COMPLETED);
      const rollbackPlan = this.rollbackHandler.generateRollbackPlan(completedSteps);
      
      if (rollbackPlan.steps.length === 0) {
        console.log('No rollback steps needed');
        return;
      }
      
      console.log(`Executing rollback with ${rollbackPlan.steps.length} steps`);
      
      const rollbackResult = await this.rollbackHandler.executeRollback(rollbackPlan);
      
      if (rollbackResult.success) {
        console.log('Rollback completed successfully');
        await ExecutionStorage.updateExecutionStatus(context.executionId, ExecutionStatus.ROLLED_BACK);
      } else {
        console.error('Rollback failed:', rollbackResult.errors);
        await ExecutionStorage.updateExecutionStatus(
          context.executionId, 
          ExecutionStatus.FAILED,
          `Rollback failed: ${rollbackResult.errors.join(', ')}`
        );
      }
      
    } catch (error) {
      console.error('Rollback execution failed:', error);
      await ExecutionStorage.updateExecutionStatus(
        context.executionId, 
        ExecutionStatus.FAILED,
        `Rollback execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  /**
   * Get execution by ID
   */
  async getExecution(executionId: string): Promise<ExecutionResponse | null> {
    const execution = await ExecutionStorage.getExecutionById(executionId);
    return execution ? this.mapToExecutionResponse(execution) : null;
  }
  
  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = await ExecutionStorage.getExecutionById(executionId);
    
    if (!execution) {
      return false;
    }
    
    if (execution.status !== ExecutionStatus.RUNNING) {
      return false; // Can only cancel running executions
    }
    
    await ExecutionStorage.updateExecutionStatus(
      executionId, 
      ExecutionStatus.FAILED,
      'Execution cancelled by user'
    );
    
    return true;
  }
  
  /**
   * Retry a failed execution
   */
  async retryExecution(executionId: string): Promise<ExecutionResponse> {
    const execution = await ExecutionStorage.getExecutionById(executionId);
    
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    
    if (execution.status !== ExecutionStatus.FAILED) {
      throw new Error(`Cannot retry execution with status: ${execution.status}`);
    }
    
    // Create new execution with same plan
    return await this.executePlan(execution.planRequestId);
  }
  
  /**
   * Get executions by plan request ID
   */
  async getExecutionsByPlanId(planRequestId: string): Promise<ExecutionSummary[]> {
    const executions = await ExecutionStorage.getExecutionsByPlanId(planRequestId);
    return executions.map(exec => this.mapToExecutionSummary(exec));
  }
  
  /**
   * Get recent executions
   */
  async getRecentExecutions(limit: number = 50): Promise<ExecutionSummary[]> {
    const executions = await ExecutionStorage.getRecentExecutions(limit);
    return executions.map(exec => this.mapToExecutionSummary(exec));
  }
  
  /**
   * Get execution statistics
   */
  async getStatistics() {
    return await ExecutionStorage.getExecutionStatistics();
  }
  
  /**
   * Map execution document to response
   */
  private mapToExecutionResponse(execution: any): ExecutionResponse {
    return {
      executionId: execution.executionId,
      planRequestId: execution.planRequestId,
      status: execution.status,
      startedAt: execution.startedAt?.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
      totalSteps: execution.totalSteps,
      completedSteps: execution.completedSteps,
      failedSteps: execution.failedSteps,
      results: execution.results,
      error: execution.error
    };
  }
  
  /**
   * Map execution document to summary
   */
  private mapToExecutionSummary(execution: any): ExecutionSummary {
    return {
      executionId: execution.executionId,
      planRequestId: execution.planRequestId,
      status: execution.status,
      startedAt: execution.startedAt?.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
      totalSteps: execution.totalSteps,
      completedSteps: execution.completedSteps,
      failedSteps: execution.failedSteps,
      error: execution.error
    };
  }
}
