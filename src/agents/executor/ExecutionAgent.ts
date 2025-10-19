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
import { ResultAnalyzer, StepResult as AnalyzerStepResult } from './result-analyzer';

export class ExecutionAgent {
  private orchestrator: ExecutionOrchestrator;
  private retryHandler: RetryHandler;
  private rollbackHandler: RollbackHandler;
  private defaultConfig: ExecutionConfig;

  constructor() {
    // Get tools for complexity analysis
    const tools = ToolAdapter.getAvailableTools();
    this.orchestrator = new ExecutionOrchestrator(tools);
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

      // Analyze query complexity and set execution strategy
      const selectedTools = planRequest.plan.steps.map(step => step.tool);
      const complexity = this.orchestrator.analyzeAndSetStrategy(planRequest.query, selectedTools);

      console.log(`📊 Query complexity analysis:`, {
        isComplex: complexity.isComplex,
        complexityScore: complexity.complexityScore,
        entityCount: complexity.entityCount,
        parallelizationOpportunities: complexity.parallelizationOpportunities.length,
        riskFactors: complexity.riskFactors.length
      });

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

        // Get intelligent batches for complex queries
        const strategy = this.orchestrator.getExecutionStrategy();
        if (strategy?.strategy === 'complex' || strategy?.strategy === 'batched') {
          const batches = this.orchestrator.getIntelligentBatches(sortedSteps, steps, context);

          for (const batch of batches) {
            if (batch.length > 1) {
              // Execute batch in parallel
              await this.executeBatchSteps(batch, steps, stepResults, context);
            } else {
              // Execute single step
              await this.executeSingleStep(batch[0], steps, stepResults, context);
            }
          }
        } else {
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
   * Execute a batch of steps in parallel
   */
  private async executeBatchSteps(
    stepIndices: number[],
    steps: PlanStep[],
    stepResults: ExecutionStepResult[],
    context: any
  ): Promise<void> {
    console.log(`🔄 Executing batch of ${stepIndices.length} steps: ${stepIndices.join(', ')}`);

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
      // Resolve parameters with step references
      const resolvedParams = this.resolveStepReferences(step.params, stepResults);

      // Validate parameters
      const validation = this.validateParameters(step.tool, resolvedParams);
      if (!validation.valid) {
        throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Execute with resolved and validated parameters
      const result = await this.retryHandler.retryWithBackoff(
        () => ToolAdapter.executeTool(step.tool, resolvedParams),
        context.config.maxRetries,
        context.config.retryDelayMs
      );

      // Mark as completed
      stepResult.status = StepStatus.COMPLETED;
      // Unwrap CommandResult - store only the data field
      stepResult.result = result?.data !== undefined ? result.data : result;
      stepResult.completedAt = new Date();

      // Analyze the result for quality and empty result detection
      const resultAnalysis = this.analyzeStepResult(stepResult);
      if (resultAnalysis.isEmpty) {
        console.warn(`Step ${stepIndex} (${step.tool}) returned empty results: ${resultAnalysis.reason}`);
        console.warn(`Suggestions: ${resultAnalysis.suggestions.join(', ')}`);
      } else if (resultAnalysis.dataQuality === 'poor') {
        console.warn(`Step ${stepIndex} (${step.tool}) returned poor quality data (score: ${resultAnalysis.qualityScore})`);
      }

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

  /**
   * Enhanced step references resolution with intelligent parameter mapping
   * Supports both ${step_N.result.field} and ${entity_N.field} patterns
   */
  private resolveStepReferences(params: any, stepResults: ExecutionStepResult[]): any {
    if (typeof params !== 'object' || params === null) {
      return params;
    }

    const resolved: any = Array.isArray(params) ? [] : {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && (value.includes('${step_') || value.includes('${'))) {
        // Enhanced variable resolution with intelligent mapping
        resolved[key] = this.resolveExpressionWithIntelligence(value, stepResults, key);
      } else if (typeof value === 'object') {
        // Recursively resolve nested objects
        resolved[key] = this.resolveStepReferences(value, stepResults);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Enhanced expression resolution with intelligent parameter mapping
   */
  private resolveExpressionWithIntelligence(expression: string, stepResults: ExecutionStepResult[], paramName: string): any {
    // First try the standard step pattern: ${step_N.result.field}
    const stepMatch = expression.match(/\$\{step_(\d+)\.result(.*?)\}/);
    if (stepMatch) {
      const stepIndex = parseInt(stepMatch[1]);
      const path = stepMatch[2];

      const stepResult = stepResults[stepIndex];
      if (!stepResult || !stepResult.result) {
        console.warn(`Step ${stepIndex} result not found for parameter '${paramName}': ${expression}`);
        return this.getFallbackValue(paramName);
      }

      // Navigate the path with enhanced error handling
      const value = this.getValueByPathEnhanced(stepResult.result, path, expression);
      if (value === null || value === undefined) {
        console.warn(`Path '${path}' not found in step ${stepIndex} result for parameter '${paramName}': ${expression}`);
        return this.getFallbackValue(paramName);
      }

      return value;
    }

    // Try entity pattern: ${entity_N.field} (e.g., ${facility_1.uid})
    const entityMatch = expression.match(/\$\{(\w+)_(\d+)\.(\w+)\}/);
    if (entityMatch) {
      const entityType = entityMatch[1];
      const entityIndex = parseInt(entityMatch[2]);
      const field = entityMatch[3];

      // Find step results that match this entity type
      const matchingSteps = this.findStepsByEntityTypeEnhanced(entityType, stepResults);

      if (matchingSteps.length > entityIndex) {
        const stepResult = matchingSteps[entityIndex];
        if (stepResult && stepResult.result) {
          const value = this.getValueByPathEnhanced(stepResult.result, `.${field}`, expression);
          if (value !== null && value !== undefined) {
            return value;
          }
        }
      }

      console.warn(`Entity ${entityType}_${entityIndex} not found for parameter '${paramName}': ${expression}`);
      return this.getFallbackValue(paramName);
    }

    // If no pattern matches, return the original expression
    console.warn(`Unrecognized variable pattern for parameter '${paramName}': ${expression}`);
    return expression;
  }

  /**
   * Legacy expression resolution (kept for compatibility)
   */
  private resolveExpression(expression: string, stepResults: ExecutionStepResult[]): any {
    return this.resolveExpressionWithIntelligence(expression, stepResults, 'unknown');
  }

  /**
   * Enhanced entity type matching with intelligent detection
   */
  private findStepsByEntityTypeEnhanced(entityType: string, stepResults: ExecutionStepResult[]): ExecutionStepResult[] {
    const matchingSteps: ExecutionStepResult[] = [];

    for (const stepResult of stepResults) {
      if (stepResult.status === 'COMPLETED' && stepResult.result) {
        // Check if the tool name contains the entity type
        if (stepResult.tool.includes(entityType)) {
          matchingSteps.push(stepResult);
        } else if (this.resultContainsEntityType(stepResult.result, entityType)) {
          matchingSteps.push(stepResult);
        }
      }
    }

    return matchingSteps;
  }

  /**
   * Check if a result contains entities of a specific type
   */
  private resultContainsEntityType(result: any, entityType: string): boolean {
    if (Array.isArray(result)) {
      return result.some(item => this.isEntityOfType(item, entityType));
    } else if (result && typeof result === 'object') {
      return this.isEntityOfType(result, entityType) ||
             (result.items && Array.isArray(result.items) && result.items.some((item: any) => this.isEntityOfType(item, entityType)));
    }
    return false;
  }

  /**
   * Check if an object is an entity of a specific type
   */
  private isEntityOfType(obj: any, entityType: string): boolean {
    if (!obj || typeof obj !== 'object') return false;

    // Check common ID patterns
    const hasId = obj._id || obj.id || obj.uid;
    if (!hasId) return false;

    // Check if the object structure matches the entity type
    switch (entityType.toLowerCase()) {
      case 'facility':
        return obj.name !== undefined || obj.location !== undefined || obj.type !== undefined;
      case 'shipment':
        return obj.weight !== undefined || obj.status !== undefined || obj.facility_id !== undefined;
      case 'client':
        return obj.name !== undefined || obj.email !== undefined || obj.contact !== undefined;
      case 'contract':
        return obj.client_id !== undefined || obj.start_date !== undefined || obj.end_date !== undefined;
      default:
        return true; // Assume it matches if it has an ID
    }
  }

  /**
   * Legacy entity type matching (kept for compatibility)
   */
  private findStepsByEntityType(entityType: string, stepResults: ExecutionStepResult[]): ExecutionStepResult[] {
    return this.findStepsByEntityTypeEnhanced(entityType, stepResults);
  }

  /**
   * Enhanced value retrieval with intelligent path handling
   */
  private getValueByPathEnhanced(obj: any, path: string, originalExpression: string): any {
    if (!path) return obj;

    try {
      // Handle array access like [0] and property access like .uid
      const parts = path.match(/\[(\d+)\]|\.(\w+)/g);
      if (!parts) return obj;

      let current = obj;
      for (const part of parts) {
        if (part.startsWith('[')) {
          const index = parseInt(part.slice(1, -1));
          if (!Array.isArray(current)) {
            console.warn(`Expected array but got ${typeof current} for path ${path} in ${originalExpression}`);
            return null;
          }
          if (index >= current.length) {
            console.warn(`Array index ${index} out of bounds (length: ${current.length}) for ${originalExpression}`);
            return null;
          }
          current = current[index];
        } else {
          const prop = part.slice(1);
          if (current === null || current === undefined) {
            console.warn(`Cannot access property '${prop}' of ${current} for ${originalExpression}`);
            return null;
          }
          current = current[prop];
        }
        if (current === undefined) {
          console.warn(`Property '${part}' not found for ${originalExpression}`);
          return null;
        }
      }

      return current;
    } catch (error) {
      console.warn(`Error resolving path ${path} for ${originalExpression}:`, error);
      return null;
    }
  }

  /**
   * Legacy value retrieval (kept for compatibility)
   */
  private getValueByPath(obj: any, path: string): any {
    return this.getValueByPathEnhanced(obj, path, 'legacy');
  }

  /**
   * Get fallback value for a parameter when resolution fails
   */
  private getFallbackValue(paramName: string): any {
    // Provide intelligent fallback values based on parameter name patterns
    if (paramName.includes('_id') || paramName === 'id') {
      return 'PLACEHOLDER_ID';
    }
    if (paramName.includes('page')) {
      return 1;
    }
    if (paramName.includes('limit')) {
      return 10;
    }
    if (paramName.includes('date') || paramName.includes('time')) {
      return new Date().toISOString();
    }
    if (paramName.includes('status')) {
      return 'active';
    }
    if (paramName.includes('name')) {
      return 'PLACEHOLDER_NAME';
    }
    if (paramName.includes('email')) {
      return 'placeholder@example.com';
    }
    if (paramName.includes('weight') || paramName.includes('count')) {
      return 0;
    }
    if (paramName.startsWith('is_') || paramName.startsWith('has_') || paramName.startsWith('enable_')) {
      return false;
    }

    return null;
  }

  /**
   * Enhanced parameter validation with intelligent error detection
   */
  private validateParameters(tool: string, params: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for common issues
    if (typeof params !== 'object' || params === null) {
      errors.push('Parameters must be an object');
      return { valid: false, errors };
    }

    // Enhanced validation for each parameter
    for (const [key, value] of Object.entries(params)) {
      const paramValidation = this.validateSingleParameter(key, value, tool);
      if (!paramValidation.isValid) {
        errors.push(...paramValidation.errors);
      }
    }

    // Check for unresolved variable references
    const paramsStr = JSON.stringify(params);
    const unresolvedVars = this.findUnresolvedVariables(paramsStr);

    if (unresolvedVars.length > 0) {
      errors.push(`Unresolved variable references found: ${unresolvedVars.join(', ')}`);

      // Provide specific suggestions for common patterns
      unresolvedVars.forEach(varRef => {
        if (varRef.includes('facility_')) {
          errors.push(`  → Found '${varRef}' - should be '${this.suggestStepReference(varRef, 'facility')}'`);
        } else if (varRef.includes('shipment_')) {
          errors.push(`  → Found '${varRef}' - should be '${this.suggestStepReference(varRef, 'shipment')}'`);
        } else if (varRef.includes('client_')) {
          errors.push(`  → Found '${varRef}' - should be '${this.suggestStepReference(varRef, 'client')}'`);
        } else if (varRef.includes('contract_')) {
          errors.push(`  → Found '${varRef}' - should be '${this.suggestStepReference(varRef, 'contract')}'`);
        }
      });
    }

    // Check for placeholder text
    if (paramsStr.includes('ObjectId of') || paramsStr.includes('placeholder')) {
      errors.push('Placeholder text found in parameters');
    }

    // Check for string "null" instead of actual null
    for (const [key, value] of Object.entries(params)) {
      if (value === "null") {
        errors.push(`Parameter "${key}" has string "null" instead of null value`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate a single parameter with enhanced checking
   */
  private validateSingleParameter(paramName: string, value: any, tool: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for empty values
    if (value === null || value === undefined) {
      if (this.isRequiredParameter(paramName, tool)) {
        errors.push(`Required parameter '${paramName}' is null or undefined`);
      }
      return { isValid: errors.length === 0, errors };
    }

    // Check for placeholder values
    if (typeof value === 'string' && (value.includes('PLACEHOLDER') || value.includes('placeholder'))) {
      errors.push(`Parameter '${paramName}' contains placeholder value: ${value}`);
    }

    // Check for invalid ID formats
    if (paramName.includes('_id') || paramName === 'id') {
      if (typeof value === 'string' && !this.isValidId(value)) {
        errors.push(`Parameter '${paramName}' has invalid ID format: ${value}`);
      }
    }

    // Check for invalid date formats
    if (paramName.includes('date') || paramName.includes('time')) {
      if (typeof value === 'string' && !this.isValidDate(value)) {
        errors.push(`Parameter '${paramName}' has invalid date format: ${value}`);
      }
    }

    // Check for invalid email formats
    if (paramName.includes('email')) {
      if (typeof value === 'string' && !this.isValidEmail(value)) {
        errors.push(`Parameter '${paramName}' has invalid email format: ${value}`);
      }
    }

    // Check for negative values where not allowed
    if (typeof value === 'number' && value < 0) {
      if (paramName.includes('page') || paramName.includes('limit') || paramName.includes('count')) {
        errors.push(`Parameter '${paramName}' cannot be negative: ${value}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Check if a parameter is required based on its name and tool context
   */
  private isRequiredParameter(paramName: string, tool: string): boolean {
    // Common required parameter patterns
    const requiredPatterns = ['_id', 'id', 'facility_id', 'client_id', 'shipment_id'];
    return requiredPatterns.some(pattern => paramName.includes(pattern));
  }

  /**
   * Check if a value is a valid ID
   */
  private isValidId(value: string): boolean {
    // MongoDB ObjectId pattern
    if (/^[0-9a-fA-F]{24}$/.test(value)) {
      return true;
    }

    // UUID pattern
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)) {
      return true;
    }

    // Simple alphanumeric ID
    if (/^[a-zA-Z0-9_-]+$/.test(value) && value.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Check if a value is a valid date
   */
  private isValidDate(value: string): boolean {
    if (typeof value !== 'string') return false;

    // ISO date format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }

    // ISO datetime format
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }

    return false;
  }

  /**
   * Check if a value is a valid email
   */
  private isValidEmail(value: string): boolean {
    if (typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Find all unresolved variable references in a string
   */
  private findUnresolvedVariables(str: string): string[] {
    const variablePattern = /\$\{[^}]+\}/g;
    const matches = str.match(variablePattern) || [];

    // Filter out properly formatted step references
    return matches.filter(match => {
      // Keep if it's not a proper step reference
      return !match.match(/^\$\{step_\d+\.result/);
    });
  }

  /**
   * Suggest a proper step reference for an entity variable
   */
  private suggestStepReference(entityVar: string, entityType: string): string {
    const match = entityVar.match(/\$\{(\w+)_(\d+)\.(\w+)\}/);
    if (match) {
      const index = match[2];
      const field = match[3];
      return `\${step_${index}.result.${field}}`;
    }
    return `\${step_0.result.${entityType}_id}`;
  }

  /**
   * Analyze a step result for quality and empty result detection
   */
  private analyzeStepResult(stepResult: ExecutionStepResult): any {
    // Convert ExecutionStepResult to AnalyzerStepResult format
    const analyzerStepResult: AnalyzerStepResult = {
      stepIndex: stepResult.stepIndex,
      tool: stepResult.tool,
      params: stepResult.params,
      status: stepResult.status,
      result: stepResult.result,
      error: stepResult.error,
      retryCount: stepResult.retryCount,
      startedAt: stepResult.startedAt,
      completedAt: stepResult.completedAt
    };

    return ResultAnalyzer.analyzeStepResult(analyzerStepResult);
  }
}
