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
