// Smart parameter resolution for intelligent planning

export interface ParameterResolutionContext {
  query: string;
  toolName: string;
  requiredParams: string[];
  optionalParams: string[];
  previousStepResults?: Array<{ stepIndex: number; result: any }>;
}

export interface ResolvedParameters {
  [key: string]: any;
}

export interface VariableResolutionContext {
  stepParams: any;
  previousResults: Array<{ stepIndex: number; result: any }>;
  currentStepIndex: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TypeCheckResult {
  isValid: boolean;
  expectedType: string;
  actualType: string;
  suggestion?: string;
}

/**
 * Enhanced variable resolution service with type checking and validation
 */
export class VariableResolutionService {
  /**
   * Resolve variables with enhanced type checking and validation
   */
  static resolveVariables(context: VariableResolutionContext): any {
    const { stepParams, previousResults, currentStepIndex } = context;

    if (typeof stepParams !== 'object' || stepParams === null) {
      return stepParams;
    }

    const resolved: any = Array.isArray(stepParams) ? [] : {};

    for (const [key, value] of Object.entries(stepParams)) {
      if (typeof value === 'string' && value.includes('${')) {
        // Enhanced variable resolution with type checking
        resolved[key] = this.resolveVariableWithTypeChecking(value, previousResults, currentStepIndex);
      } else if (typeof value === 'object') {
        // Recursively resolve nested objects
        resolved[key] = this.resolveVariables({
          stepParams: value,
          previousResults,
          currentStepIndex
        });
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Resolve a single variable with type checking
   */
  private static resolveVariableWithTypeChecking(
    expression: string,
    previousResults: Array<{ stepIndex: number; result: any }>,
    currentStepIndex: number
  ): any {
    // First try the standard step pattern: ${step_N.result.field}
    const stepMatch = expression.match(/\$\{step_(\d+)\.result(.*?)\}/);
    if (stepMatch) {
      const stepIndex = parseInt(stepMatch[1]);
      const path = stepMatch[2];

      // Validate step index
      if (stepIndex >= currentStepIndex) {
        console.warn(`Variable reference to future step ${stepIndex} in step ${currentStepIndex}`);
        return expression; // Return unresolved
      }

      const stepResult = previousResults.find(sr => sr.stepIndex === stepIndex);
      if (!stepResult || !stepResult.result) {
        console.warn(`Step ${stepIndex} result not found for variable: ${expression}`);
        return null;
      }

      // Navigate the path with enhanced error handling
      return this.getValueByPathWithValidation(stepResult.result, path, expression);
    }

    // Try entity pattern: ${entity_N.field}
    const entityMatch = expression.match(/\$\{(\w+)_(\d+)\.(\w+)\}/);
    if (entityMatch) {
      const entityType = entityMatch[1];
      const entityIndex = parseInt(entityMatch[2]);
      const field = entityMatch[3];

      // Find step results that match this entity type
      const matchingSteps = this.findStepsByEntityType(entityType, previousResults);

      if (matchingSteps.length > entityIndex) {
        const stepResult = matchingSteps[entityIndex];
        if (stepResult && stepResult.result) {
          return this.getValueByPathWithValidation(stepResult.result, `.${field}`, expression);
        }
      }

      console.warn(`Entity ${entityType}_${entityIndex} not found for variable: ${expression}`);
      return null;
    }

    return expression;
  }

  /**
   * Get value by path with enhanced validation and error handling
   */
  private static getValueByPathWithValidation(obj: any, path: string, originalExpression: string): any {
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
   * Find step results that match a specific entity type
   */
  private static findStepsByEntityType(entityType: string, previousResults: Array<{ stepIndex: number; result: any }>): Array<{ stepIndex: number; result: any }> {
    const matchingSteps: Array<{ stepIndex: number; result: any }> = [];

    for (const stepResult of previousResults) {
      if (stepResult.result) {
        // Check if the result contains entities of the expected type
        if (this.resultContainsEntityType(stepResult.result, entityType)) {
          matchingSteps.push(stepResult);
        }
      }
    }

    return matchingSteps;
  }

  /**
   * Check if a result contains entities of a specific type
   */
  private static resultContainsEntityType(result: any, entityType: string): boolean {
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
  private static isEntityOfType(obj: any, entityType: string): boolean {
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
   * Validate variable references with type checking
   */
  static validateVariableReferences(stepParams: any, previousResults: Array<{ stepIndex: number; result: any }>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    this.validateVariableReferencesRecursive(stepParams, previousResults, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Recursively validate variable references
   */
  private static validateVariableReferencesRecursive(
    obj: any,
    previousResults: Array<{ stepIndex: number; result: any }>,
    errors: string[],
    warnings: string[]
  ): void {
    if (typeof obj === 'string' && obj.includes('${')) {
      const variablePattern = /\$\{[^}]+\}/g;
      const matches = obj.match(variablePattern) || [];

      matches.forEach(match => {
        const validation = this.validateSingleVariable(match, previousResults);
        if (!validation.isValid) {
          errors.push(validation.error || `Invalid variable reference: ${match}`);
        } else if (validation.warning) {
          warnings.push(validation.warning);
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        this.validateVariableReferencesRecursive(value, previousResults, errors, warnings);
      }
    }
  }

  /**
   * Validate a single variable reference
   */
  private static validateSingleVariable(expression: string, previousResults: Array<{ stepIndex: number; result: any }>): { isValid: boolean; error?: string; warning?: string } {
    // Check step reference pattern
    const stepMatch = expression.match(/^\$\{step_(\d+)\.result(.*?)\}/);
    if (stepMatch) {
      const stepIndex = parseInt(stepMatch[1]);
      const path = stepMatch[2];

      if (stepIndex < 0) {
        return { isValid: false, error: `Invalid step index: ${stepIndex}` };
      }

      const stepResult = previousResults.find(sr => sr.stepIndex === stepIndex);
      if (!stepResult) {
        return { isValid: false, error: `Step ${stepIndex} not found in previous results` };
      }

      if (!stepResult.result) {
        return { isValid: false, error: `Step ${stepIndex} has no result` };
      }

      // Validate path
      const pathValidation = this.validatePath(stepResult.result, path);
      if (!pathValidation.isValid) {
        return { isValid: false, error: pathValidation.error };
      }

      return { isValid: true, warning: pathValidation.warning };
    }

    // Check entity pattern
    const entityMatch = expression.match(/^\$\{(\w+)_(\d+)\.(\w+)\}/);
    if (entityMatch) {
      const entityType = entityMatch[1];
      const entityIndex = parseInt(entityMatch[2]);
      const field = entityMatch[3];

      if (entityIndex < 0) {
        return { isValid: false, error: `Invalid entity index: ${entityIndex}` };
      }

      const matchingSteps = this.findStepsByEntityType(entityType, previousResults);
      if (matchingSteps.length <= entityIndex) {
        return { isValid: false, error: `Entity ${entityType}_${entityIndex} not found (only ${matchingSteps.length} available)` };
      }

      return { isValid: true };
    }

    return { isValid: false, error: `Invalid variable reference format: ${expression}` };
  }

  /**
   * Validate a path within a result object
   */
  private static validatePath(obj: any, path: string): { isValid: boolean; error?: string; warning?: string } {
    if (!path) return { isValid: true };

    try {
      const parts = path.match(/\[(\d+)\]|\.(\w+)/g);
      if (!parts) return { isValid: true };

      let current = obj;
      for (const part of parts) {
        if (part.startsWith('[')) {
          const index = parseInt(part.slice(1, -1));
          if (!Array.isArray(current)) {
            return { isValid: false, error: `Expected array but got ${typeof current} at path ${path}` };
          }
          if (index >= current.length) {
            return { isValid: false, error: `Array index ${index} out of bounds (length: ${current.length})` };
          }
          current = current[index];
        } else {
          const prop = part.slice(1);
          if (current === null || current === undefined) {
            return { isValid: false, error: `Cannot access property '${prop}' of ${current}` };
          }
          if (!(prop in current)) {
            return { isValid: false, error: `Property '${prop}' not found in object` };
          }
          current = current[prop];
        }
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: `Error validating path ${path}: ${error}` };
    }
  }

  /**
   * Check if a value is a dependency expression
   */
  static isDependencyExpression(value: any): boolean {
    return typeof value === 'string' && value.startsWith('${step_') && value.endsWith('}');
  }

  /**
   * Resolve dependency expressions in parameters
   */
  static resolveDependencies(parameters: ResolvedParameters, stepResults: Array<{ stepIndex: number; result: any }>): ResolvedParameters {
    const resolved = { ...parameters };

    for (const [key, value] of Object.entries(resolved)) {
      if (this.isDependencyExpression(value)) {
        const dependencyValue = this.resolveDependencyExpression(value, stepResults);
        if (dependencyValue !== null) {
          resolved[key] = dependencyValue;
        }
      }
    }

    return resolved;
  }

  /**
   * Resolve a single dependency expression
   */
  private static resolveDependencyExpression(expression: string, stepResults: Array<{ stepIndex: number; result: any }>): any {
    const match = expression.match(/\${step_(\d+)\.result\.(.+)}/);
    if (!match) {
      return null;
    }

    const stepIndex = parseInt(match[1]);
    const fieldPath = match[2];

    const stepResult = stepResults.find(sr => sr.stepIndex === stepIndex);
    if (!stepResult) {
      return null;
    }

    // Navigate the field path (e.g., "items[0].id")
    return this.getNestedValue(stepResult.result, fieldPath);
  }

  /**
   * Get nested value from object using dot notation and array access
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) {
        return null;
      }

      // Handle array access like "items[0]"
      const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
      if (arrayMatch) {
        const arrayName = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);
        return current[arrayName] && current[arrayName][index];
      }

      return current[key];
    }, obj);
  }
}

export class ParameterResolver {
  /**
   * Resolve parameters for a tool based on query context
   */
  static resolveParameters(context: ParameterResolutionContext): ResolvedParameters {
    const resolved: ResolvedParameters = {};

    // Resolve required parameters first
    for (const param of context.requiredParams) {
      resolved[param] = this.resolveParameter(param, context);
    }

    // Resolve optional parameters if they can be extracted
    for (const param of context.optionalParams) {
      const value = this.resolveParameter(param, context);
      if (value !== null) {
        resolved[param] = value;
      }
    }

    return resolved;
  }

  /**
   * Resolve a single parameter
   */
  private static resolveParameter(paramName: string, context: ParameterResolutionContext): any {
    const query = context.query.toLowerCase();

    // Handle common parameter types
    switch (paramName) {
      case 'page':
        return this.extractPageNumber(query) || 1;

      case 'limit':
        return this.extractLimit(query) || this.getDefaultLimit(context.toolName);

      case 'id':
        return this.extractIdFromQuery(query) || this.generateIdDependency(context);

      case 'facility_id':
        return this.extractFacilityId(query, context);

      case 'client_id':
        return this.extractClientId(query, context);

      case 'shipment_id':
        return this.extractShipmentId(query, context);

      case 'date_from':
      case 'start_date':
        return this.extractDateFrom(query);

      case 'date_to':
      case 'end_date':
        return this.extractDateTo(query);

      case 'status':
        return this.extractStatus(query);

      case 'location':
        return this.extractLocation(query);

      case 'name':
        return this.extractName(query);

      case 'waste_type':
        return this.extractWasteType(query);

      default:
        return this.extractGenericParameter(paramName, query, context);
    }
  }

  /**
   * Extract page number from query
   */
  private static extractPageNumber(query: string): number | null {
    const pageMatch = query.match(/page\s+(\d+)/i);
    return pageMatch ? parseInt(pageMatch[1]) : null;
  }

  /**
   * Extract limit from query
   */
  private static extractLimit(query: string): number | null {
    const limitMatch = query.match(/(?:limit|per\s+page|items)\s+(\d+)/i);
    return limitMatch ? parseInt(limitMatch[1]) : null;
  }

  /**
   * Get default limit based on tool type
   */
  private static getDefaultLimit(toolName: string): number {
    if (toolName.includes('list')) {
      return 50; // Reasonable default for list operations
    }
    return 10;
  }

  /**
   * Extract ID from query or generate dependency
   */
  private static extractIdFromQuery(query: string): string | null {
    // Look for MongoDB ObjectId pattern
    const idMatch = query.match(/\b[0-9a-fA-F]{24}\b/);
    if (idMatch) {
      return idMatch[0];
    }

    // Look for "id: X" pattern
    const idPatternMatch = query.match(/id:\s*([^\s]+)/i);
    if (idPatternMatch) {
      return idPatternMatch[1];
    }

    return null;
  }

  /**
   * Generate ID dependency expression
   */
  private static generateIdDependency(context: ParameterResolutionContext): string {
    // Find a previous step that might have returned an ID
    if (context.previousStepResults && context.previousStepResults.length > 0) {
      const lastStep = context.previousStepResults[context.previousStepResults.length - 1];
      return `\${step_${lastStep.stepIndex}.result.id}`;
    }

    // Fallback to placeholder that will need to be resolved
    return 'PLACEHOLDER_ID';
  }

  /**
   * Extract facility ID from query or dependencies
   */
  private static extractFacilityId(query: string, context: ParameterResolutionContext): string | null {
    // Look for facility reference in query
    if (query.includes('facility')) {
      const facilityMatch = query.match(/facility[:\s]+([^\s]+)/i);
      if (facilityMatch) {
        return facilityMatch[1];
      }
    }

    // Check if we have a previous step that got facilities
    if (context.previousStepResults) {
      for (const step of context.previousStepResults) {
        if (step.result && step.result.items && step.result.items.length > 0) {
          return `\${step_${step.stepIndex}.result.items[0].id}`;
        }
      }
    }

    return null;
  }

  /**
   * Extract client ID from query or dependencies
   */
  private static extractClientId(query: string, context: ParameterResolutionContext): string | null {
    if (query.includes('client')) {
      const clientMatch = query.match(/client[:\s]+([^\s]+)/i);
      if (clientMatch) {
        return clientMatch[1];
      }
    }

    if (context.previousStepResults) {
      for (const step of context.previousStepResults) {
        if (step.result && step.result.items && step.result.items.length > 0) {
          return `\${step_${step.stepIndex}.result.items[0].id}`;
        }
      }
    }

    return null;
  }

  /**
   * Extract shipment ID from query or dependencies
   */
  private static extractShipmentId(query: string, context: ParameterResolutionContext): string | null {
    if (query.includes('shipment')) {
      const shipmentMatch = query.match(/shipment[:\s]+([^\s]+)/i);
      if (shipmentMatch) {
        return shipmentMatch[1];
      }
    }

    if (context.previousStepResults) {
      for (const step of context.previousStepResults) {
        if (step.result && step.result.items && step.result.items.length > 0) {
          return `\${step_${step.stepIndex}.result.items[0].id}`;
        }
      }
    }

    return null;
  }

  /**
   * Extract start date from query
   */
  private static extractDateFrom(query: string): string | null {
    const now = new Date();

    if (query.includes('last week')) {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return lastWeek.toISOString();
    }

    if (query.includes('last month')) {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return lastMonth.toISOString();
    }

    if (query.includes('yesterday')) {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday.toISOString();
    }

    if (query.includes('today')) {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    }

    if (query.includes('this month')) {
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return thisMonth.toISOString();
    }

    // Look for specific date patterns
    const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return new Date(dateMatch[1]).toISOString();
    }

    return null;
  }

  /**
   * Extract end date from query
   */
  private static extractDateTo(query: string): string | null {
    const now = new Date();

    if (query.includes('last week')) {
      return now.toISOString();
    }

    if (query.includes('last month')) {
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return thisMonth.toISOString();
    }

    if (query.includes('yesterday')) {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      yesterday.setHours(23, 59, 59, 999);
      return yesterday.toISOString();
    }

    if (query.includes('today')) {
      const today = new Date(now);
      today.setHours(23, 59, 59, 999);
      return today.toISOString();
    }

    return null;
  }

  /**
   * Extract status from query
   */
  private static extractStatus(query: string): string | null {
    const statusKeywords = {
      'contaminated': 'contaminated',
      'contamination': 'contaminated',
      'rejected': 'rejected',
      'rejection': 'rejected',
      'accepted': 'accepted',
      'pending': 'pending',
      'completed': 'completed',
      'active': 'active',
      'inactive': 'inactive',
      'maintenance': 'maintenance'
    };

    for (const [keyword, status] of Object.entries(statusKeywords)) {
      if (query.includes(keyword)) {
        return status;
      }
    }

    return null;
  }

  /**
   * Extract location from query
   */
  private static extractLocation(query: string): string | null {
    // Common location patterns
    const locationPatterns = [
      /(?:in|from|at)\s+([A-Z][a-z]+)/g,
      /(?:in|from|at)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g
    ];

    for (const pattern of locationPatterns) {
      const match = pattern.exec(query);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract name from query
   */
  private static extractName(query: string): string | null {
    // Look for quoted names
    const quotedMatch = query.match(/"([^"]+)"/);
    if (quotedMatch) {
      return quotedMatch[1];
    }

    // Look for "name: X" pattern
    const nameMatch = query.match(/name:\s*([^\s]+)/i);
    if (nameMatch) {
      return nameMatch[1];
    }

    return null;
  }

  /**
   * Extract waste type from query
   */
  private static extractWasteType(query: string): string | null {
    const wasteTypes = [
      'hazardous', 'medical', 'electronic', 'organic', 'plastic',
      'metal', 'glass', 'paper', 'construction', 'industrial'
    ];

    for (const wasteType of wasteTypes) {
      if (query.includes(wasteType)) {
        return wasteType;
      }
    }

    return null;
  }

  /**
   * Extract generic parameter from query
   */
  private static extractGenericParameter(paramName: string, query: string, context: ParameterResolutionContext): any {
    // Look for "paramName: value" pattern
    const pattern = new RegExp(`${paramName}:\\s*([^\\s]+)`, 'i');
    const match = pattern.exec(query);
    if (match) {
      return match[1];
    }

    // For boolean parameters, check if the param name appears in query
    if (paramName.includes('has_') || paramName.includes('is_') || paramName.includes('enable_')) {
      return query.includes(paramName.replace(/_/g, ' '));
    }

    return null;
  }

  /**
   * Generate dependency expression for a parameter
   */
  static generateDependencyExpression(stepIndex: number, fieldPath: string): string {
    return `\${step_${stepIndex}.result.${fieldPath}}`;
  }

  /**
   * Check if a value is a dependency expression
   */
  static isDependencyExpression(value: any): boolean {
    return VariableResolutionService.isDependencyExpression(value);
  }

  /**
   * Resolve dependency expressions in parameters
   */
  static resolveDependencies(parameters: ResolvedParameters, stepResults: Array<{ stepIndex: number; result: any }>): ResolvedParameters {
    return VariableResolutionService.resolveDependencies(parameters, stepResults);
  }

  /**
   * Enhanced parameter resolution with type checking and validation
   */
  static resolveParametersWithValidation(context: ParameterResolutionContext): { parameters: ResolvedParameters; validation: ValidationResult } {
    const parameters = this.resolveParameters(context);
    const validation = this.validateResolvedParameters(parameters, context);

    return { parameters, validation };
  }

  /**
   * Validate resolved parameters
   */
  private static validateResolvedParameters(parameters: ResolvedParameters, context: ParameterResolutionContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for unresolved variables
    const unresolvedVars = this.findUnresolvedVariables(parameters);
    if (unresolvedVars.length > 0) {
      errors.push(`Unresolved variable references: ${unresolvedVars.join(', ')}`);
    }

    // Check for placeholder values
    const placeholderVars = this.findPlaceholderValues(parameters);
    if (placeholderVars.length > 0) {
      warnings.push(`Placeholder values found: ${placeholderVars.join(', ')}`);
    }

    // Validate parameter types
    for (const [key, value] of Object.entries(parameters)) {
      const typeCheck = this.validateParameterType(key, value, context);
      if (!typeCheck.isValid) {
        errors.push(`Parameter '${key}': ${typeCheck.expectedType} expected, got ${typeCheck.actualType}`);
        if (typeCheck.suggestion) {
          warnings.push(`Suggestion: ${typeCheck.suggestion}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Find unresolved variable references
   */
  private static findUnresolvedVariables(parameters: ResolvedParameters): string[] {
    const unresolved: string[] = [];

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string' && value.includes('${') && !VariableResolutionService.isDependencyExpression(value)) {
        unresolved.push(`${key}: ${value}`);
      } else if (typeof value === 'object' && value !== null) {
        unresolved.push(...this.findUnresolvedVariablesInObject(value, key));
      }
    }

    return unresolved;
  }

  /**
   * Find unresolved variables in nested objects
   */
  private static findUnresolvedVariablesInObject(obj: any, prefix: string): string[] {
    const unresolved: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = `${prefix}.${key}`;

      if (typeof value === 'string' && value.includes('${') && !VariableResolutionService.isDependencyExpression(value)) {
        unresolved.push(`${fullKey}: ${value}`);
      } else if (typeof value === 'object' && value !== null) {
        unresolved.push(...this.findUnresolvedVariablesInObject(value, fullKey));
      }
    }

    return unresolved;
  }

  /**
   * Find placeholder values
   */
  private static findPlaceholderValues(parameters: ResolvedParameters): string[] {
    const placeholders: string[] = [];

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string' && (value.includes('PLACEHOLDER') || value.includes('placeholder'))) {
        placeholders.push(`${key}: ${value}`);
      } else if (typeof value === 'object' && value !== null) {
        placeholders.push(...this.findPlaceholderValuesInObject(value, key));
      }
    }

    return placeholders;
  }

  /**
   * Find placeholder values in nested objects
   */
  private static findPlaceholderValuesInObject(obj: any, prefix: string): string[] {
    const placeholders: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = `${prefix}.${key}`;

      if (typeof value === 'string' && (value.includes('PLACEHOLDER') || value.includes('placeholder'))) {
        placeholders.push(`${fullKey}: ${value}`);
      } else if (typeof value === 'object' && value !== null) {
        placeholders.push(...this.findPlaceholderValuesInObject(value, fullKey));
      }
    }

    return placeholders;
  }

  /**
   * Validate parameter type
   */
  private static validateParameterType(paramName: string, value: any, context: ParameterResolutionContext): TypeCheckResult {
    // Get expected type based on parameter name patterns
    const expectedType = this.getExpectedTypeForParameter(paramName, context.toolName);
    const actualType = this.getActualType(value);

    if (expectedType === 'any') {
      return { isValid: true, expectedType: 'any', actualType };
    }

    const isValid = this.isTypeCompatible(actualType, expectedType);

    return {
      isValid,
      expectedType,
      actualType,
      suggestion: !isValid ? this.getTypeSuggestion(actualType, expectedType, paramName) : undefined
    };
  }

  /**
   * Get expected type for a parameter based on name and tool
   */
  private static getExpectedTypeForParameter(paramName: string, toolName: string): string {
    // ID parameters should be strings or ObjectIds
    if (paramName.includes('_id') || paramName === 'id') {
      return 'string';
    }

    // Numeric parameters
    if (paramName.includes('page') || paramName.includes('limit') || paramName.includes('count')) {
      return 'number';
    }

    // Date parameters
    if (paramName.includes('date') || paramName.includes('time')) {
      return 'string';
    }

    // Boolean parameters
    if (paramName.startsWith('is_') || paramName.startsWith('has_') || paramName.startsWith('enable_')) {
      return 'boolean';
    }

    // Array parameters
    if (paramName.includes('ids') || paramName.includes('list') || paramName.includes('array')) {
      return 'array';
    }

    return 'any';
  }

  /**
   * Get actual type of a value
   */
  private static getActualType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  /**
   * Check if types are compatible
   */
  private static isTypeCompatible(actualType: string, expectedType: string): boolean {
    if (actualType === expectedType) return true;

    // Special cases
    if (expectedType === 'string' && (actualType === 'number' || actualType === 'boolean')) return true;
    if (expectedType === 'number' && actualType === 'string') {
      // Check if string is numeric
      return !isNaN(Number(actualType));
    }
    if (expectedType === 'boolean' && actualType === 'string') {
      return (actualType as string) === 'true' || (actualType as string) === 'false';
    }

    return false;
  }

  /**
   * Get type conversion suggestion
   */
  private static getTypeSuggestion(actualType: string, expectedType: string, paramName: string): string {
    if (expectedType === 'string' && actualType === 'number') {
      return `Convert to string: ${paramName}.toString()`;
    }
    if (expectedType === 'number' && actualType === 'string') {
      return `Convert to number: Number(${paramName})`;
    }
    if (expectedType === 'boolean' && actualType === 'string') {
      return `Convert to boolean: ${paramName} === 'true'`;
    }
    if (expectedType === 'array' && actualType === 'string') {
      return `Convert to array: [${paramName}]`;
    }

    return `Expected ${expectedType}, got ${actualType}`;
  }
}
