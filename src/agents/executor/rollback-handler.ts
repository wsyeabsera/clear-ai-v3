// Rollback handler for generating and executing rollback plans

import { PlanStep } from '../planner/types';
import { ExecutionStepResult, StepStatus, RollbackPlan } from './types';
import { ToolAdapter } from '../planner/tool-adapter';

export class RollbackHandler {
  private static readonly INVERSE_OPERATIONS: Record<string, string> = {
    // Shipments
    'mcp_waste-management_shipments_create': 'mcp_waste-management_shipments_delete',
    'mcp_waste-management_shipments_update': 'mcp_waste-management_shipments_update', // Restore original values
    'mcp_waste-management_shipments_delete': 'mcp_waste-management_shipments_create', // Recreate with original data
    
    // Facilities
    'mcp_waste-management_facilities_create': 'mcp_waste-management_facilities_delete',
    'mcp_waste-management_facilities_update': 'mcp_waste-management_facilities_update',
    'mcp_waste-management_facilities_delete': 'mcp_waste-management_facilities_create',
    
    // Contaminants
    'mcp_waste-management_contaminants_create': 'mcp_waste-management_contaminants_delete',
    'mcp_waste-management_contaminants_update': 'mcp_waste-management_contaminants_update',
    'mcp_waste-management_contaminants_delete': 'mcp_waste-management_contaminants_create',
    
    // Inspections
    'mcp_waste-management_inspections_create': 'mcp_waste-management_inspections_delete',
    'mcp_waste-management_inspections_update': 'mcp_waste-management_inspections_update',
    'mcp_waste-management_inspections_delete': 'mcp_waste-management_inspections_create',
    
    // Contracts
    'mcp_waste-management_contracts_create': 'mcp_waste-management_contracts_delete',
    'mcp_waste-management_contracts_update': 'mcp_waste-management_contracts_update',
    'mcp_waste-management_contracts_delete': 'mcp_waste-management_contracts_create',
    
    // Waste Codes
    'mcp_waste-management_waste_codes_create': 'mcp_waste-management_waste_codes_delete',
    'mcp_waste-management_waste_codes_update': 'mcp_waste-management_waste_codes_update',
    'mcp_waste-management_waste_codes_delete': 'mcp_waste-management_waste_codes_create',
    
    // Waste Generators
    'mcp_waste-management_waste_generators_create': 'mcp_waste-management_waste_generators_delete',
    'mcp_waste-management_waste_generators_update': 'mcp_waste-management_waste_generators_update',
    'mcp_waste-management_waste_generators_delete': 'mcp_waste-management_waste_generators_create',
    
    // Waste Properties
    'mcp_waste-management_waste_properties_create': 'mcp_waste-management_waste_properties_delete',
    'mcp_waste-management_waste_properties_update': 'mcp_waste-management_waste_properties_update',
    'mcp_waste-management_waste_properties_delete': 'mcp_waste-management_waste_properties_create',
    
    // Shipment Waste Compositions
    'mcp_waste-management_shipment_waste_compositions_create': 'mcp_waste-management_shipment_waste_compositions_delete',
    'mcp_waste-management_shipment_waste_compositions_update': 'mcp_waste-management_shipment_waste_compositions_update',
    'mcp_waste-management_shipment_waste_compositions_delete': 'mcp_waste-management_shipment_waste_compositions_create'
  };
  
  /**
   * Generate rollback plan for completed steps
   */
  generateRollbackPlan(completedSteps: ExecutionStepResult[]): RollbackPlan {
    const rollbackSteps: PlanStep[] = [];
    
    // Sort completed steps in reverse order (most recent first)
    const sortedSteps = completedSteps
      .filter(step => step.status === StepStatus.COMPLETED)
      .sort((a, b) => b.stepIndex - a.stepIndex);
    
    for (const step of sortedSteps) {
      const rollbackStep = this.createRollbackStep(step);
      if (rollbackStep) {
        rollbackSteps.push(rollbackStep);
      }
    }
    
    return {
      steps: rollbackSteps,
      reason: `Rollback for ${completedSteps.length} completed steps`,
      createdAt: new Date()
    };
  }
  
  /**
   * Create a rollback step for a completed step
   */
  private createRollbackStep(step: ExecutionStepResult): PlanStep | null {
    const inverseTool = this.getInverseOperation(step.tool);
    
    if (!inverseTool) {
      console.warn(`No inverse operation found for tool: ${step.tool}`);
      return null;
    }
    
    // Generate rollback parameters based on the original step result
    const rollbackParams = this.generateRollbackParams(step);
    
    if (!rollbackParams) {
      console.warn(`Could not generate rollback parameters for step: ${step.stepIndex}`);
      return null;
    }
    
    return {
      tool: inverseTool,
      params: rollbackParams,
      dependsOn: [], // Rollback steps don't have dependencies
      parallel: false, // Execute rollback steps sequentially for safety
      description: `Rollback step ${step.stepIndex}: ${step.tool}`
    };
  }
  
  /**
   * Map operation to its inverse
   */
  getInverseOperation(tool: string): string | null {
    return RollbackHandler.INVERSE_OPERATIONS[tool] || null;
  }
  
  /**
   * Generate rollback parameters based on step result
   */
  private generateRollbackParams(step: ExecutionStepResult): any | null {
    const { tool, result, params } = step;
    
    if (!result || !result.success) {
      return null;
    }
    
    // For delete operations, we need to recreate with original data
    if (tool.includes('_delete')) {
      return this.generateRecreateParams(tool, result, params);
    }
    
    // For create operations, we need to delete the created resource
    if (tool.includes('_create')) {
      return this.generateDeleteParams(tool, result, params);
    }
    
    // For update operations, we need to restore original values
    if (tool.includes('_update')) {
      return this.generateRestoreParams(tool, result, params);
    }
    
    return null;
  }
  
  /**
   * Generate parameters for recreating a deleted resource
   */
  private generateRecreateParams(tool: string, result: any, originalParams: any): any {
    // This would need to be implemented based on the specific tool
    // For now, return the original parameters as a starting point
    return originalParams;
  }
  
  /**
   * Generate parameters for deleting a created resource
   */
  private generateDeleteParams(tool: string, result: any, originalParams: any): any {
    // Extract the ID from the result or original params
    const id = result.data?.uid || result.data?.id || originalParams.uid || originalParams.id;
    
    if (!id) {
      return null;
    }
    
    return { uid: id };
  }
  
  /**
   * Generate parameters for restoring original values
   */
  private generateRestoreParams(tool: string, result: any, originalParams: any): any {
    // This would need to store original values before update
    // For now, return the original parameters
    return originalParams;
  }
  
  /**
   * Execute rollback plan
   */
  async executeRollback(rollbackPlan: RollbackPlan): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];
    
    console.log(`Executing rollback plan with ${rollbackPlan.steps.length} steps`);
    
    for (let i = 0; i < rollbackPlan.steps.length; i++) {
      const step = rollbackPlan.steps[i];
      
      try {
        console.log(`Executing rollback step ${i + 1}/${rollbackPlan.steps.length}: ${step.tool}`);
        
        const result = await ToolAdapter.executeTool(step.tool, step.params);
        results.push({
          stepIndex: i,
          tool: step.tool,
          success: result.success,
          result: result.data,
          error: result.error
        });
        
        if (!result.success) {
          errors.push(`Rollback step ${i + 1} failed: ${result.error}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Rollback step ${i + 1} failed: ${errorMessage}`);
        results.push({
          stepIndex: i,
          tool: step.tool,
          success: false,
          error: errorMessage
        });
      }
    }
    
    const success = errors.length === 0;
    
    console.log(`Rollback execution ${success ? 'completed successfully' : 'completed with errors'}`);
    if (errors.length > 0) {
      console.error('Rollback errors:', errors);
    }
    
    return {
      success,
      results,
      errors
    };
  }
  
  /**
   * Check if a tool supports rollback
   */
  supportsRollback(tool: string): boolean {
    return this.getInverseOperation(tool) !== null;
  }
  
  /**
   * Get rollback statistics
   */
  getRollbackStats(rollbackPlan: RollbackPlan): {
    totalSteps: number;
    supportedSteps: number;
    unsupportedSteps: number;
    supportRate: number;
  } {
    const totalSteps = rollbackPlan.steps.length;
    const supportedSteps = rollbackPlan.steps.filter(step => 
      this.supportsRollback(step.tool)
    ).length;
    const unsupportedSteps = totalSteps - supportedSteps;
    const supportRate = totalSteps > 0 ? (supportedSteps / totalSteps) * 100 : 0;
    
    return {
      totalSteps,
      supportedSteps,
      unsupportedSteps,
      supportRate
    };
  }
  
  /**
   * Validate rollback plan
   */
  validateRollbackPlan(rollbackPlan: RollbackPlan): string[] {
    const errors: string[] = [];
    
    if (!rollbackPlan.steps || rollbackPlan.steps.length === 0) {
      errors.push('Rollback plan has no steps');
      return errors;
    }
    
    for (let i = 0; i < rollbackPlan.steps.length; i++) {
      const step = rollbackPlan.steps[i];
      
      if (!step.tool) {
        errors.push(`Rollback step ${i} has no tool`);
        continue;
      }
      
      if (!this.supportsRollback(step.tool)) {
        errors.push(`Rollback step ${i} uses unsupported tool: ${step.tool}`);
      }
      
      if (!step.params || typeof step.params !== 'object') {
        errors.push(`Rollback step ${i} has invalid parameters`);
      }
    }
    
    return errors;
  }
  
  /**
   * Create a minimal rollback plan (only for critical steps)
   */
  createMinimalRollbackPlan(completedSteps: ExecutionStepResult[]): RollbackPlan {
    const criticalSteps = completedSteps.filter(step => 
      step.status === StepStatus.COMPLETED && 
      this.isCriticalStep(step.tool)
    );
    
    return this.generateRollbackPlan(criticalSteps);
  }
  
  /**
   * Check if a step is critical (requires rollback)
   */
  private isCriticalStep(tool: string): boolean {
    const criticalPatterns = [
      /_create$/,
      /_delete$/,
      /_update$/
    ];
    
    return criticalPatterns.some(pattern => pattern.test(tool));
  }
}
