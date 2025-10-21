// Plan validation logic for the Planner Agent

import { Plan, PlanStep, ValidationResult, MCPTool } from './types';
import { VariableResolutionService, ValidationResult as VariableValidationResult } from './parameter-resolver';

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

    // Enhanced parameter type validation
    Object.entries(step.params).forEach(([key, value]) => {
      const paramSchema = tool.inputSchema.properties[key];
      if (paramSchema) {
        const typeValidation = this.validateParameterTypeEnhanced(key, value, paramSchema, step.tool);
        if (!typeValidation.isValid) {
          errors.push(`Step ${stepIndex}: ${typeValidation.error}`);
        }
        if (typeValidation.warning) {
          warnings.push(`Step ${stepIndex}: ${typeValidation.warning}`);
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
   * Enhanced parameter type validation with better error messages
   */
  private validateParameterTypeEnhanced(paramName: string, value: any, schema: any, toolName: string): { isValid: boolean; error?: string; warning?: string } {
    const expectedType = schema.type;
    const actualType = this.getActualType(value);

    // Handle variable references
    if (typeof value === 'string' && value.includes('${')) {
      return this.validateVariableParameter(paramName, value, schema, toolName);
    }

    // Handle null/undefined values
    if (value === null || value === undefined) {
      if (schema.required) {
        return { isValid: false, error: `Parameter '${paramName}' is required but is ${actualType}` };
      }
      return { isValid: true }; // Optional parameter can be null/undefined
    }

    // Type validation
    const typeValidation = this.validateTypeCompatibility(actualType, expectedType, paramName, value);
    if (!typeValidation.isValid) {
      return { isValid: false, error: typeValidation.error };
    }

    // Additional validation based on parameter name patterns
    const patternValidation = this.validateParameterPattern(paramName, value, expectedType, toolName);
    if (!patternValidation.isValid) {
      return { isValid: false, error: patternValidation.error };
    }

    if (patternValidation.warning) {
      return { isValid: true, warning: patternValidation.warning };
    }

    return { isValid: true };
  }

  /**
   * Validate variable parameters
   */
  private validateVariableParameter(paramName: string, value: string, schema: any, toolName: string): { isValid: boolean; error?: string; warning?: string } {
    // Check if it's a valid variable reference
    const stepMatch = value.match(/^\$\{step_(\d+)\.result(.*?)\}/);
    const entityMatch = value.match(/^\$\{(\w+)_(\d+)\.(\w+)\}/);

    if (!stepMatch && !entityMatch) {
      return { isValid: false, error: `Parameter '${paramName}' has invalid variable reference format: ${value}` };
    }

    // Check if the expected type is compatible with variable references
    if (schema.type === 'number' || schema.type === 'boolean') {
      return { isValid: false, error: `Parameter '${paramName}' expects ${schema.type} but has variable reference: ${value}` };
    }

    return { isValid: true };
  }

  /**
   * Get actual type of a value
   */
  private getActualType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  /**
   * Validate type compatibility
   */
  private validateTypeCompatibility(actualType: string, expectedType: string, paramName: string, value: any): { isValid: boolean; error?: string } {
    if (actualType === expectedType) {
      return { isValid: true };
    }

    // Special cases for type conversion
    if (expectedType === 'string' && (actualType === 'number' || actualType === 'boolean')) {
      return { isValid: true }; // Can be converted to string
    }

    if (expectedType === 'number' && actualType === 'string') {
      if (isNaN(Number(value))) {
        return { isValid: false, error: `Parameter '${paramName}' must be a number, got string '${value}'` };
      }
      return { isValid: true }; // Can be converted to number
    }

    if (expectedType === 'boolean' && actualType === 'string') {
      if (value !== 'true' && value !== 'false') {
        return { isValid: false, error: `Parameter '${paramName}' must be a boolean, got string '${value}'` };
      }
      return { isValid: true }; // Can be converted to boolean
    }

    return { isValid: false, error: `Parameter '${paramName}' must be ${expectedType}, got ${actualType}` };
  }

  /**
   * Validate parameter patterns based on name and tool context
   */
  private validateParameterPattern(paramName: string, value: any, expectedType: string, toolName: string): { isValid: boolean; error?: string; warning?: string } {
    // ID parameter validation
    if (paramName.includes('_id') || paramName === 'id') {
      if (typeof value === 'string' && value.length === 0) {
        return { isValid: false, error: `Parameter '${paramName}' cannot be empty` };
      }
      if (typeof value === 'string' && !this.isValidId(value)) {
        return { isValid: false, error: `Parameter '${paramName}' has invalid ID format: ${value}` };
      }
    }

    // Date parameter validation
    if (paramName.includes('date') || paramName.includes('time')) {
      if (typeof value === 'string' && !this.isValidDate(value)) {
        return { isValid: false, error: `Parameter '${paramName}' has invalid date format: ${value}` };
      }
    }

    // Numeric parameter validation
    if (paramName.includes('page') || paramName.includes('limit') || paramName.includes('count')) {
      if (typeof value === 'number' && value < 0) {
        return { isValid: false, error: `Parameter '${paramName}' cannot be negative: ${value}` };
      }
      if (typeof value === 'number' && paramName.includes('page') && value === 0) {
        return { isValid: false, error: `Parameter '${paramName}' must be greater than 0` };
      }
    }

    // Email validation
    if (paramName.includes('email')) {
      if (typeof value === 'string' && !this.isValidEmail(value)) {
        return { isValid: false, error: `Parameter '${paramName}' has invalid email format: ${value}` };
      }
    }

    return { isValid: true };
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
   * Legacy parameter type validation (kept for compatibility)
   */
  private validateParameterType(paramName: string, value: any, schema: any): string | null {
    const validation = this.validateParameterTypeEnhanced(paramName, value, schema, '');
    return validation.isValid ? null : validation.error || 'Invalid parameter type';
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
   * Enhanced variable references validation with type checking
   */
  private validateVariableReferences(steps: PlanStep[]): string[] {
    const errors: string[] = [];

    steps.forEach((step, stepIndex) => {
      // Use the enhanced VariableResolutionService for validation
      const previousResults = this.buildPreviousResults(steps, stepIndex);
      const validation = VariableResolutionService.validateVariableReferences(step.params, previousResults);

      if (!validation.isValid) {
        validation.errors.forEach(error => {
          errors.push(`Step ${stepIndex}: ${error}`);
        });
      }

      // Add warnings as errors for strict validation
      validation.warnings.forEach(warning => {
        errors.push(`Step ${stepIndex}: ${warning}`);
      });

      // Additional validation for step dependencies
      const dependencyErrors = this.validateStepDependencies(step, stepIndex, steps);
      errors.push(...dependencyErrors);
    });

    return errors;
  }

  /**
   * Build previous results for validation context
   */
  private buildPreviousResults(steps: PlanStep[], currentStepIndex: number): Array<{ stepIndex: number; result: any }> {
    const previousResults: Array<{ stepIndex: number; result: any }> = [];

    for (let i = 0; i < currentStepIndex; i++) {
      // Create a mock result structure for validation
      previousResults.push({
        stepIndex: i,
        result: this.createMockResultForStep(steps[i])
      });
    }

    return previousResults;
  }

  /**
   * Create a mock result structure for validation
   */
  private createMockResultForStep(step: PlanStep): any {
    // Create a mock result based on the tool type
    const tool = this.availableTools.find(t => t.name === step.tool);
    if (!tool) {
      return { items: [] };
    }

    // Mock result structure based on common patterns
    if (step.tool.includes('list') || step.tool.includes('get')) {
      return {
        items: [
          {
            _id: 'mock_id_1',
            id: 'mock_id_1',
            uid: 'mock_id_1',
            name: 'Mock Item',
            // Add other common fields based on tool type
            ...this.getMockFieldsForTool(step.tool)
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      };
    }

    return {
      _id: 'mock_id_1',
      id: 'mock_id_1',
      uid: 'mock_id_1',
      name: 'Mock Item',
      ...this.getMockFieldsForTool(step.tool)
    };
  }

  /**
   * Get mock fields based on tool type
   */
  private getMockFieldsForTool(toolName: string): any {
    const mockFields: any = {};

    if (toolName.includes('facility')) {
      mockFields.location = 'Mock Location';
      mockFields.type = 'Mock Type';
    } else if (toolName.includes('shipment')) {
      mockFields.weight = 1000;
      mockFields.status = 'active';
      mockFields.facility_id = 'mock_facility_id';
    } else if (toolName.includes('client')) {
      mockFields.email = 'mock@example.com';
      mockFields.contact = 'Mock Contact';
    } else if (toolName.includes('contract')) {
      mockFields.client_id = 'mock_client_id';
      mockFields.start_date = '2024-01-01';
      mockFields.end_date = '2024-12-31';
    }

    return mockFields;
  }

  /**
   * Validate step dependencies with enhanced checking
   */
  private validateStepDependencies(step: PlanStep, stepIndex: number, allSteps: PlanStep[]): string[] {
    const errors: string[] = [];

    if (!step.dependsOn || step.dependsOn.length === 0) {
      return errors;
    }

    // Check each dependency
    step.dependsOn.forEach(depIndex => {
      // Validate dependency index
      if (depIndex < 0) {
        errors.push(`Step ${stepIndex}: Invalid dependency index ${depIndex} (negative)`);
        return;
      }

      if (depIndex >= stepIndex) {
        errors.push(`Step ${stepIndex}: Cannot depend on step ${depIndex} (future or current step)`);
        return;
      }

      if (depIndex >= allSteps.length) {
        errors.push(`Step ${stepIndex}: Dependency step ${depIndex} does not exist`);
        return;
      }

      // Check if dependency makes sense based on tool types
      const dependencyStep = allSteps[depIndex];
      const dependencyValidation = this.validateToolDependency(step, dependencyStep, stepIndex, depIndex);
      if (!dependencyValidation.isValid) {
        errors.push(`Step ${stepIndex}: ${dependencyValidation.error}`);
      }
    });

    return errors;
  }

  /**
   * Validate if a tool dependency makes sense
   */
  private validateToolDependency(step: PlanStep, dependencyStep: PlanStep, stepIndex: number, depIndex: number): { isValid: boolean; error?: string } {
    // Check if the dependency produces data that this step might need
    const stepTool = this.availableTools.find(t => t.name === step.tool);
    const depTool = this.availableTools.find(t => t.name === dependencyStep.tool);

    if (!stepTool || !depTool) {
      return { isValid: true }; // Skip validation if tools not found
    }

    // Check for common dependency patterns
    const stepName = step.tool.toLowerCase();
    const depName = dependencyStep.tool.toLowerCase();

    // Facility-related dependencies
    if (stepName.includes('shipment') && depName.includes('facility')) {
      return { isValid: true }; // Shipments often depend on facilities
    }

    if (stepName.includes('contract') && depName.includes('client')) {
      return { isValid: true }; // Contracts often depend on clients
    }

    // Check if step parameters reference the dependency
    const paramsStr = JSON.stringify(step.params);
    if (paramsStr.includes(`step_${depIndex}`)) {
      return { isValid: true }; // Step references the dependency
    }

    // If no clear relationship, warn but don't error
    return { isValid: true };
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
