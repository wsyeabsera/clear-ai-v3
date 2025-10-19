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
    
    // Validate variable references
    const variableErrors = this.validateVariableReferences(plan.steps);
    errors.push(...variableErrors);

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
   * Validate variable references in plan steps
   */
  private validateVariableReferences(steps: PlanStep[]): string[] {
    const errors: string[] = [];

    steps.forEach((step, stepIndex) => {
      const paramsStr = JSON.stringify(step.params);
      const variablePattern = /\$\{[^}]+\}/g;
      const matches = paramsStr.match(variablePattern) || [];

      matches.forEach(match => {
        // Check if it's a proper step reference
        const stepRefMatch = match.match(/^\$\{step_(\d+)\.result/);
        if (stepRefMatch) {
          const referencedStepIndex = parseInt(stepRefMatch[1]);

          // Check if referenced step exists
          if (referencedStepIndex >= stepIndex) {
            errors.push(`Step ${stepIndex}: Cannot reference step ${referencedStepIndex} (future step)`);
          } else if (referencedStepIndex < 0) {
            errors.push(`Step ${stepIndex}: Invalid step reference ${referencedStepIndex}`);
          } else if (!step.dependsOn?.includes(referencedStepIndex)) {
            errors.push(`Step ${stepIndex}: References step ${referencedStepIndex} but it's not in dependsOn array`);
          }
        } else {
          // Check for entity pattern (e.g., ${facility_1.uid})
          const entityMatch = match.match(/^\$\{(\w+)_(\d+)\.(\w+)\}/);
          if (entityMatch) {
            const entityType = entityMatch[1];
            const entityIndex = parseInt(entityMatch[2]);
            const field = entityMatch[3];

            errors.push(`Step ${stepIndex}: Found '${match}' - should be '${this.suggestStepReference(entityType, entityIndex, field, stepIndex)}'`);
          } else {
            // Other invalid patterns
            errors.push(`Step ${stepIndex}: Invalid variable reference '${match}' - use \${step_N.result.field} format`);
          }
        }
      });
    });

    return errors;
  }

  /**
   * Suggest a proper step reference for an entity variable
   */
  private suggestStepReference(entityType: string, entityIndex: number, field: string, currentStepIndex: number): string {
    // Find steps that might produce this entity type
    const candidateSteps = this.findStepsByEntityType(entityType, currentStepIndex);

    if (candidateSteps.length > entityIndex) {
      const stepIndex = candidateSteps[entityIndex];
      return `\${step_${stepIndex}.result.${field}}`;
    }

    return `\${step_0.result.${field}}`;
  }

  /**
   * Find step indices that might produce a specific entity type
   */
  private findStepsByEntityType(entityType: string, maxStepIndex: number): number[] {
    const steps: number[] = [];

    for (let i = 0; i < maxStepIndex; i++) {
      // This is a simplified check - in a real implementation, you'd need
      // to analyze the tool schemas to determine what entity types they produce
      if (entityType === 'facility' && i < maxStepIndex) {
        steps.push(i);
      } else if (entityType === 'shipment' && i < maxStepIndex) {
        steps.push(i);
      } else if (entityType === 'client' && i < maxStepIndex) {
        steps.push(i);
      } else if (entityType === 'contract' && i < maxStepIndex) {
        steps.push(i);
      }
    }

    return steps;
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
