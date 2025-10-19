// Plan validation logic for the Planner Agent

import { Plan, PlanStep, ValidationResult, MCPTool } from './types';

export class PlanValidator {
  private availableTools: MCPTool[];
  
  constructor(availableTools: MCPTool[]) {
    this.availableTools = availableTools;
  }
  
  /**
   * Validate a complete plan
   */
  validatePlan(plan: Plan): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate plan structure
    if (!plan.steps || plan.steps.length === 0) {
      errors.push('Plan must have at least one step');
      return { isValid: false, errors, warnings };
    }
    
    // Validate each step
    plan.steps.forEach((step, index) => {
      const stepValidation = this.validateStep(step, index);
      errors.push(...stepValidation.errors);
      warnings.push(...stepValidation.warnings);
    });
    
    // Validate dependencies
    const dependencyErrors = this.validateDependencies(plan.steps);
    errors.push(...dependencyErrors);
    
    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(plan.steps);
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate a single plan step
   */
  validateStep(step: PlanStep, stepIndex: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if tool exists
    const tool = this.availableTools.find(t => t.name === step.tool);
    if (!tool) {
      errors.push(`Step ${stepIndex}: Tool '${step.tool}' not found`);
      return { isValid: false, errors, warnings };
    }
    
    // Validate required parameters
    const requiredParams = tool.inputSchema.required || [];
    const missingParams = requiredParams.filter(param => 
      !(param in step.params) || step.params[param] === undefined || step.params[param] === null
    );
    
    if (missingParams.length > 0) {
      errors.push(`Step ${stepIndex}: Missing required parameters: ${missingParams.join(', ')}`);
    }
    
    // Validate parameter types
    Object.entries(step.params).forEach(([key, value]) => {
      const paramSchema = tool.inputSchema.properties[key];
      if (paramSchema) {
        const typeError = this.validateParameterType(key, value, paramSchema);
        if (typeError) {
          errors.push(`Step ${stepIndex}: ${typeError}`);
        }
      } else {
        warnings.push(`Step ${stepIndex}: Unknown parameter '${key}' for tool '${step.tool}'`);
      }
    });
    
    // Validate dependencies
    if (step.dependsOn) {
      step.dependsOn.forEach(depIndex => {
        if (depIndex < 0 || depIndex >= stepIndex) {
          errors.push(`Step ${stepIndex}: Invalid dependency index ${depIndex}`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate parameter type against schema
   */
  private validateParameterType(paramName: string, value: any, schema: any): string | null {
    const expectedType = schema.type;
    
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          return `Parameter '${paramName}' must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          return `Parameter '${paramName}' must be a number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `Parameter '${paramName}' must be a boolean`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return `Parameter '${paramName}' must be an array`;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return `Parameter '${paramName}' must be an object`;
        }
        break;
    }
    
    return null;
  }
  
  /**
   * Validate step dependencies
   */
  private validateDependencies(steps: PlanStep[]): string[] {
    const errors: string[] = [];
    
    steps.forEach((step, index) => {
      if (step.dependsOn) {
        step.dependsOn.forEach(depIndex => {
          if (depIndex >= index) {
            errors.push(`Step ${index}: Cannot depend on step ${depIndex} (future step)`);
          }
          if (depIndex < 0) {
            errors.push(`Step ${index}: Invalid dependency index ${depIndex}`);
          }
        });
      }
    });
    
    return errors;
  }
  
  /**
   * Detect circular dependencies in the plan
   */
  private detectCircularDependencies(steps: PlanStep[]): string[] {
    const visited = new Set<number>();
    const recursionStack = new Set<number>();
    const circularDeps: string[] = [];
    
    const hasCycle = (stepIndex: number): boolean => {
      if (recursionStack.has(stepIndex)) {
        circularDeps.push(`Step ${stepIndex}`);
        return true;
      }
      
      if (visited.has(stepIndex)) {
        return false;
      }
      
      visited.add(stepIndex);
      recursionStack.add(stepIndex);
      
      const step = steps[stepIndex];
      if (step && step.dependsOn && Array.isArray(step.dependsOn)) {
        for (const depIndex of step.dependsOn) {
          if (hasCycle(depIndex)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(stepIndex);
      return false;
    };
    
    for (let i = 0; i < steps.length; i++) {
      if (!visited.has(i)) {
        hasCycle(i);
      }
    }
    
    return circularDeps;
  }
  
  /**
   * Get suggestions for fixing validation errors
   */
  getFixSuggestions(plan: Plan): string[] {
    const suggestions: string[] = [];
    const validation = this.validatePlan(plan);
    
    if (validation.errors.length === 0) {
      return suggestions;
    }
    
    // Suggest available tools for missing tools
    validation.errors.forEach(error => {
      if (error.includes('not found')) {
        const toolName = error.match(/Tool '([^']+)' not found/)?.[1];
        if (toolName) {
          const similarTools = this.availableTools.filter(tool => 
            tool.name.toLowerCase().includes(toolName.toLowerCase()) ||
            toolName.toLowerCase().includes(tool.name.toLowerCase())
          );
          if (similarTools.length > 0) {
            suggestions.push(`Did you mean: ${similarTools.map(t => t.name).join(', ')}`);
          }
        }
      }
    });
    
    return suggestions;
  }
}
