// Result analysis service for detecting empty results and providing intelligent feedback

export interface StepResult {
  stepIndex: number;
  tool: string;
  params: any;
  status: string;
  result?: any;
  error?: string;
  retryCount: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ResultAnalysis {
  hasData: boolean;
  dataQuality: 'excellent' | 'good' | 'poor' | 'empty';
  isEmpty: boolean;
  reason?: string;
  suggestions: string[];
  dataCount: number;
  expectedDataCount?: number;
  qualityScore: number; // 0-100
}

export interface EmptyResultReason {
  type: 'no_data' | 'invalid_filters' | 'wrong_parameters' | 'data_unavailable' | 'permission_denied' | 'unknown';
  description: string;
  confidence: number; // 0-100
}

export class ResultAnalyzer {
  /**
   * Analyze a step result and provide detailed analysis
   */
  static analyzeStepResult(stepResult: StepResult): ResultAnalysis {
    const { result, tool, params, status } = stepResult;

    // Check if step failed
    if (status !== 'COMPLETED') {
      return {
        hasData: false,
        dataQuality: 'empty',
        isEmpty: true,
        reason: 'Step execution failed',
        suggestions: ['Check step parameters', 'Verify tool availability', 'Review error logs'],
        dataCount: 0,
        qualityScore: 0
      };
    }

    // Analyze the result data
    const dataAnalysis = this.analyzeDataStructure(result, tool);
    const emptyReason = this.determineEmptyReason(result, tool, params);
    const suggestions = this.generateSuggestions(result, tool, params, emptyReason);

    return {
      hasData: dataAnalysis.hasData,
      dataQuality: dataAnalysis.quality,
      isEmpty: dataAnalysis.isEmpty,
      reason: emptyReason?.description,
      suggestions,
      dataCount: dataAnalysis.count,
      expectedDataCount: this.getExpectedDataCount(tool, params),
      qualityScore: dataAnalysis.qualityScore
    };
  }

  /**
   * Analyze the data structure of a result
   */
  private static analyzeDataStructure(result: any, tool: string): {
    hasData: boolean;
    isEmpty: boolean;
    quality: 'excellent' | 'good' | 'poor' | 'empty';
    count: number;
    qualityScore: number;
  } {
    if (!result) {
      return {
        hasData: false,
        isEmpty: true,
        quality: 'empty',
        count: 0,
        qualityScore: 0
      };
    }

    // Handle different result structures
    let dataArray: any[] = [];
    let hasData = false;
    let count = 0;

    if (Array.isArray(result)) {
      dataArray = result;
      hasData = result.length > 0;
      count = result.length;
    } else if (result.items && Array.isArray(result.items)) {
      dataArray = result.items;
      hasData = result.items.length > 0;
      count = result.items.length;
    } else if (result.data && Array.isArray(result.data)) {
      dataArray = result.data;
      hasData = result.data.length > 0;
      count = result.data.length;
    } else if (typeof result === 'object') {
      // Single object result
      hasData = true;
      count = 1;
      dataArray = [result];
    }

    // Determine quality based on data characteristics
    const quality = this.assessDataQuality(dataArray, tool);
    const qualityScore = this.calculateQualityScore(dataArray, hasData, tool);

    return {
      hasData,
      isEmpty: !hasData,
      quality,
      count,
      qualityScore
    };
  }

  /**
   * Assess the quality of data in an array
   */
  private static assessDataQuality(dataArray: any[], tool: string): 'excellent' | 'good' | 'poor' | 'empty' {
    if (dataArray.length === 0) {
      return 'empty';
    }

    // Check for common data quality issues
    const hasNullValues = dataArray.some(item => item === null || item === undefined);
    const hasEmptyObjects = dataArray.some(item => 
      typeof item === 'object' && item !== null && Object.keys(item).length === 0
    );
    const hasMissingIds = dataArray.some(item => 
      typeof item === 'object' && item !== null && !item._id && !item.id && !item.uid
    );

    // Check for tool-specific quality indicators
    const toolSpecificQuality = this.assessToolSpecificQuality(dataArray, tool);

    if (hasNullValues || hasEmptyObjects || hasMissingIds || toolSpecificQuality === 'poor') {
      return 'poor';
    }

    if (dataArray.length >= 10 && !hasNullValues && !hasEmptyObjects) {
      return 'excellent';
    }

    return 'good';
  }

  /**
   * Assess quality based on tool-specific requirements
   */
  private static assessToolSpecificQuality(dataArray: any[], tool: string): 'excellent' | 'good' | 'poor' | 'empty' {
    if (dataArray.length === 0) return 'empty';

    const toolName = tool.toLowerCase();

    // Facility-specific quality checks
    if (toolName.includes('facility')) {
      const hasRequiredFields = dataArray.every(item => 
        item.name && (item.location || item.type)
      );
      return hasRequiredFields ? 'good' : 'poor';
    }

    // Shipment-specific quality checks
    if (toolName.includes('shipment')) {
      const hasRequiredFields = dataArray.every(item => 
        item.weight !== undefined && item.status
      );
      return hasRequiredFields ? 'good' : 'poor';
    }

    // Client-specific quality checks
    if (toolName.includes('client')) {
      const hasRequiredFields = dataArray.every(item => 
        item.name && (item.email || item.contact)
      );
      return hasRequiredFields ? 'good' : 'poor';
    }

    // Contract-specific quality checks
    if (toolName.includes('contract')) {
      const hasRequiredFields = dataArray.every(item => 
        item.client_id && (item.start_date || item.end_date)
      );
      return hasRequiredFields ? 'good' : 'poor';
    }

    return 'good';
  }

  /**
   * Calculate a quality score (0-100)
   */
  private static calculateQualityScore(dataArray: any[], hasData: boolean, tool: string): number {
    if (!hasData) return 0;

    let score = 50; // Base score

    // Data count bonus
    if (dataArray.length >= 10) score += 20;
    else if (dataArray.length >= 5) score += 10;
    else if (dataArray.length >= 1) score += 5;

    // Data completeness bonus
    const completenessScore = this.calculateCompletenessScore(dataArray, tool);
    score += completenessScore;

    // Data consistency bonus
    const consistencyScore = this.calculateConsistencyScore(dataArray);
    score += consistencyScore;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate completeness score based on required fields
   */
  private static calculateCompletenessScore(dataArray: any[], tool: string): number {
    if (dataArray.length === 0) return 0;

    const toolName = tool.toLowerCase();
    let requiredFields: string[] = [];

    // Define required fields based on tool type
    if (toolName.includes('facility')) {
      requiredFields = ['name', 'location'];
    } else if (toolName.includes('shipment')) {
      requiredFields = ['weight', 'status'];
    } else if (toolName.includes('client')) {
      requiredFields = ['name', 'email'];
    } else if (toolName.includes('contract')) {
      requiredFields = ['client_id', 'start_date'];
    }

    if (requiredFields.length === 0) return 10; // Default bonus

    const completenessRatio = dataArray.reduce((sum, item) => {
      const presentFields = requiredFields.filter(field => 
        item[field] !== undefined && item[field] !== null && item[field] !== ''
      ).length;
      return sum + (presentFields / requiredFields.length);
    }, 0) / dataArray.length;

    return Math.round(completenessRatio * 20); // Up to 20 points
  }

  /**
   * Calculate consistency score based on data uniformity
   */
  private static calculateConsistencyScore(dataArray: any[]): number {
    if (dataArray.length <= 1) return 10; // Default bonus for single items

    // Check for consistent field presence
    const allFields = new Set<string>();
    dataArray.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allFields.add(key));
      }
    });

    const fieldConsistency = Array.from(allFields).reduce((sum, field) => {
      const presentCount = dataArray.filter(item => 
        item && typeof item === 'object' && item[field] !== undefined
      ).length;
      const consistency = presentCount / dataArray.length;
      return sum + consistency;
    }, 0) / allFields.size;

    return Math.round(fieldConsistency * 10); // Up to 10 points
  }

  /**
   * Determine why a result is empty
   */
  private static determineEmptyReason(result: any, tool: string, params: any): EmptyResultReason | null {
    if (!this.isResultEmpty(result)) {
      return null;
    }

    const toolName = tool.toLowerCase();

    // Check for common empty result patterns
    if (this.hasRestrictiveFilters(params)) {
      return {
        type: 'invalid_filters',
        description: 'Query filters are too restrictive',
        confidence: 80
      };
    }

    if (this.hasInvalidParameters(params)) {
      return {
        type: 'wrong_parameters',
        description: 'Query parameters are invalid or malformed',
        confidence: 70
      };
    }

    if (this.hasDateRangeIssues(params)) {
      return {
        type: 'invalid_filters',
        description: 'Date range filters may be excluding all data',
        confidence: 60
      };
    }

    if (this.hasLocationIssues(params)) {
      return {
        type: 'invalid_filters',
        description: 'Location filters may not match any existing data',
        confidence: 60
      };
    }

    // Check for tool-specific issues
    if (toolName.includes('contract') && !params.client_id) {
      return {
        type: 'wrong_parameters',
        description: 'Contract queries typically require a client_id parameter',
        confidence: 70
      };
    }

    if (toolName.includes('shipment') && !params.facility_id) {
      return {
        type: 'wrong_parameters',
        description: 'Shipment queries typically require a facility_id parameter',
        confidence: 60
      };
    }

    return {
      type: 'no_data',
      description: 'No data matches the query criteria',
      confidence: 50
    };
  }

  /**
   * Check if a result is empty
   */
  private static isResultEmpty(result: any): boolean {
    if (!result) return true;
    if (Array.isArray(result)) return result.length === 0;
    if (result.items && Array.isArray(result.items)) return result.items.length === 0;
    if (result.data && Array.isArray(result.data)) return result.data.length === 0;
    return false;
  }

  /**
   * Check if parameters have restrictive filters
   */
  private static hasRestrictiveFilters(params: any): boolean {
    if (!params || typeof params !== 'object') return false;

    // Check for very specific filters that might be too restrictive
    const restrictivePatterns = [
      'status' in params && params.status !== 'active',
      'date_from' in params && this.isOldDate(params.date_from),
      'limit' in params && params.limit === 1,
      'page' in params && params.page > 10
    ];

    return restrictivePatterns.some(Boolean);
  }

  /**
   * Check if parameters are invalid
   */
  private static hasInvalidParameters(params: any): boolean {
    if (!params || typeof params !== 'object') return false;

    // Check for invalid ID formats
    const idFields = ['_id', 'id', 'facility_id', 'client_id', 'shipment_id'];
    for (const field of idFields) {
      if (params[field] && typeof params[field] === 'string') {
        if (params[field].length < 3 || params[field].includes('PLACEHOLDER')) {
          return true;
        }
      }
    }

    // Check for invalid date formats
    const dateFields = ['date_from', 'date_to', 'start_date', 'end_date'];
    for (const field of dateFields) {
      if (params[field] && typeof params[field] === 'string') {
        if (!this.isValidDate(params[field])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for date range issues
   */
  private static hasDateRangeIssues(params: any): boolean {
    if (!params || typeof params !== 'object') return false;

    const dateFrom = params.date_from || params.start_date;
    const dateTo = params.date_to || params.end_date;

    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      // Check if date range is in the future
      if (fromDate > new Date()) {
        return true;
      }
      
      // Check if date range is too narrow
      const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for location issues
   */
  private static hasLocationIssues(params: any): boolean {
    if (!params || typeof params !== 'object') return false;

    const locationFields = ['location', 'city', 'state', 'country'];
    for (const field of locationFields) {
      if (params[field] && typeof params[field] === 'string') {
        // Check for placeholder or invalid location values
        if (params[field].includes('PLACEHOLDER') || 
            params[field].length < 2 || 
            params[field].includes('Mock')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate suggestions for improving results
   */
  private static generateSuggestions(result: any, tool: string, params: any, emptyReason: EmptyResultReason | null): string[] {
    const suggestions: string[] = [];

    if (emptyReason) {
      switch (emptyReason.type) {
        case 'invalid_filters':
          suggestions.push('Try removing or relaxing filter parameters');
          suggestions.push('Check if date ranges are reasonable');
          suggestions.push('Verify location parameters match existing data');
          break;
        case 'wrong_parameters':
          suggestions.push('Verify all required parameters are provided');
          suggestions.push('Check parameter formats (IDs, dates, etc.)');
          suggestions.push('Remove placeholder or invalid values');
          break;
        case 'no_data':
          suggestions.push('Try a broader search without specific filters');
          suggestions.push('Check if the requested data exists in the system');
          suggestions.push('Consider using different search criteria');
          break;
      }
    }

    // Tool-specific suggestions
    const toolName = tool.toLowerCase();
    if (toolName.includes('facility')) {
      suggestions.push('Try searching facilities by type or location');
    } else if (toolName.includes('shipment')) {
      suggestions.push('Try searching shipments by date range or status');
    } else if (toolName.includes('client')) {
      suggestions.push('Try searching clients by name or contact information');
    } else if (toolName.includes('contract')) {
      suggestions.push('Ensure client_id parameter is provided and valid');
    }

    // General suggestions based on parameters
    if (params.limit && params.limit < 5) {
      suggestions.push('Try increasing the limit parameter to get more results');
    }

    if (params.page && params.page > 1) {
      suggestions.push('Try starting with page 1 to see if data exists');
    }

    return suggestions;
  }

  /**
   * Get expected data count based on tool and parameters
   */
  private static getExpectedDataCount(tool: string, params: any): number | undefined {
    const toolName = tool.toLowerCase();
    
    // List operations typically return multiple items
    if (toolName.includes('list') || toolName.includes('get_all')) {
      return params.limit || 10;
    }
    
    // Single item operations
    if (toolName.includes('get_by_id') || toolName.includes('find_by')) {
      return 1;
    }
    
    return undefined;
  }

  /**
   * Check if a date is old (more than 1 year ago)
   */
  private static isOldDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date < oneYearAgo;
  }

  /**
   * Check if a date string is valid
   */
  private static isValidDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
}
