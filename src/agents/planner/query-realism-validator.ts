/**
 * QueryRealismValidator - Ensures queries match available data
 * 
 * This service validates that generated queries are realistic based on
 * actual data availability and patterns.
 */

import { DataAssessmentService, DataAvailability } from './data-assessment';

export interface QueryValidationResult {
  isValid: boolean;
  confidence: number;
  issues: QueryIssue[];
  suggestions: string[];
  dataContext: DataContext;
}

export interface QueryIssue {
  type: 'data_unavailable' | 'unrealistic_filter' | 'invalid_date_range' | 'missing_entity' | 'low_confidence';
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  value?: any;
  suggestion?: string;
}

export interface DataContext {
  entityType: string;
  totalRecords: number;
  dateRange?: { earliest: string; latest: string };
  availableValues: Record<string, any[]>;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface QueryPattern {
  pattern: RegExp;
  entityType: string;
  requiredFields: string[];
  optionalFields: string[];
  commonFilters: string[];
}

export class QueryRealismValidator {
  private static queryPatterns: QueryPattern[] = [
    {
      pattern: /(?:list|get|show|find|search)\s+(?:all\s+)?shipments?/gi,
      entityType: 'shipments',
      requiredFields: [],
      optionalFields: ['facility_id', 'status', 'date_from', 'date_to', 'limit'],
      commonFilters: ['status', 'facility_id', 'waste_type', 'date_range']
    },
    {
      pattern: /(?:list|get|show|find|search)\s+(?:all\s+)?facilities?/gi,
      entityType: 'facilities',
      requiredFields: [],
      optionalFields: ['type', 'location', 'status', 'limit'],
      commonFilters: ['type', 'location', 'status']
    },
    {
      pattern: /(?:list|get|show|find|search)\s+(?:all\s+)?contracts?/gi,
      entityType: 'contracts',
      requiredFields: [],
      optionalFields: ['facility_id', 'status', 'contract_type', 'date_from', 'date_to'],
      commonFilters: ['status', 'facility_id', 'contract_type', 'date_range']
    },
    {
      pattern: /(?:list|get|show|find|search)\s+(?:all\s+)?waste_codes?/gi,
      entityType: 'waste_codes',
      requiredFields: [],
      optionalFields: ['category', 'hazard_level', 'limit'],
      commonFilters: ['category', 'hazard_level']
    },
    {
      pattern: /(?:list|get|show|find|search)\s+(?:all\s+)?generators?/gi,
      entityType: 'waste_generators',
      requiredFields: [],
      optionalFields: ['type', 'location', 'limit'],
      commonFilters: ['type', 'location']
    },
    {
      pattern: /(?:list|get|show|find|search)\s+(?:all\s+)?inspections?/gi,
      entityType: 'inspections',
      requiredFields: [],
      optionalFields: ['facility_id', 'status', 'inspection_type', 'date_from', 'date_to'],
      commonFilters: ['status', 'facility_id', 'inspection_type', 'date_range']
    },
    {
      pattern: /(?:list|get|show|find|search)\s+(?:all\s+)?contaminants?/gi,
      entityType: 'contaminants',
      requiredFields: [],
      optionalFields: ['type', 'severity', 'limit'],
      commonFilters: ['type', 'severity']
    }
  ];

  /**
   * Validate a query for realism based on available data
   */
  static async validateQuery(query: string, entityType?: string): Promise<QueryValidationResult> {
    try {
      // Detect entity type if not provided
      const detectedEntityType = entityType || this.detectEntityType(query);
      if (!detectedEntityType) {
        return this.createInvalidResult('Unable to detect entity type from query', []);
      }

      // Get data context
      const dataContext = await this.getDataContext(detectedEntityType);
      
      // Validate query against data context
      const validation = await this.validateAgainstData(query, detectedEntityType, dataContext);
      
      return {
        isValid: validation.issues.filter(i => i.severity === 'error').length === 0,
        confidence: validation.confidence,
        issues: validation.issues,
        suggestions: validation.suggestions,
        dataContext
      };

    } catch (error) {
      console.error('Query validation failed:', error);
      return this.createInvalidResult('Query validation failed', ['Try a simpler query or check system status']);
    }
  }

  /**
   * Validate multiple queries in batch
   */
  static async validateQueries(queries: string[]): Promise<QueryValidationResult[]> {
    const results = await Promise.all(
      queries.map(query => this.validateQuery(query))
    );
    return results;
  }

  /**
   * Get realistic query suggestions based on available data
   */
  static async getRealisticSuggestions(entityType: string, baseQuery: string = ''): Promise<{
    suggestedQueries: string[];
    realisticFilters: Record<string, any>;
    dataInsights: string[];
  }> {
    try {
      const dataContext = await this.getDataContext(entityType);
      const suggestions = this.generateQuerySuggestions(entityType, dataContext, baseQuery);
      
      return {
        suggestedQueries: suggestions.queries,
        realisticFilters: suggestions.filters,
        dataInsights: suggestions.insights
      };
    } catch (error) {
      console.error('Failed to generate realistic suggestions:', error);
      return {
        suggestedQueries: [],
        realisticFilters: {},
        dataInsights: ['Unable to generate suggestions']
      };
    }
  }

  /**
   * Check if a filter value is realistic for a given field
   */
  static async isFilterValueRealistic(entityType: string, field: string, value: any): Promise<{
    isRealistic: boolean;
    confidence: number;
    alternatives: any[];
    reason: string;
  }> {
    try {
      const dataContext = await this.getDataContext(entityType);
      const fieldValues = dataContext.availableValues[field] || [];
      
      if (fieldValues.length === 0) {
        return {
          isRealistic: false,
          confidence: 0,
          alternatives: [],
          reason: `No data available for field '${field}'`
        };
      }

      const isExactMatch = fieldValues.includes(value);
      const isSimilarMatch = this.findSimilarValues(value, fieldValues);
      
      if (isExactMatch) {
        return {
          isRealistic: true,
          confidence: 1.0,
          alternatives: fieldValues.slice(0, 5),
          reason: 'Value found in available data'
        };
      }

      if (isSimilarMatch.length > 0) {
        return {
          isRealistic: false,
          confidence: 0.6,
          alternatives: isSimilarMatch,
          reason: `Similar values found: ${isSimilarMatch.slice(0, 3).join(', ')}`
        };
      }

      return {
        isRealistic: false,
        confidence: 0.2,
        alternatives: fieldValues.slice(0, 5),
        reason: `Value '${value}' not found. Available values: ${fieldValues.slice(0, 3).join(', ')}`
      };

    } catch (error) {
      console.error('Filter value validation failed:', error);
      return {
        isRealistic: false,
        confidence: 0,
        alternatives: [],
        reason: 'Unable to validate filter value'
      };
    }
  }

  // Private methods

  private static detectEntityType(query: string): string | null {
    for (const pattern of this.queryPatterns) {
      if (pattern.pattern.test(query)) {
        return pattern.entityType;
      }
    }
    return null;
  }

  private static async getDataContext(entityType: string): Promise<DataContext> {
    try {
      const stats = await DataAssessmentService.getEntityStatistics(entityType);
      
      return {
        entityType,
        totalRecords: stats.totalCount,
        dateRange: stats.dateRange ? {
          earliest: stats.dateRange.earliest || '',
          latest: stats.dateRange.latest || ''
        } : undefined,
        availableValues: stats.commonValues || {},
        dataQuality: this.assessDataQuality(stats)
      };
    } catch (error) {
      console.error(`Failed to get data context for ${entityType}:`, error);
      return {
        entityType,
        totalRecords: 0,
        availableValues: {},
        dataQuality: 'poor'
      };
    }
  }

  private static assessDataQuality(stats: DataAvailability): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!stats.hasData) return 'poor';
    if (stats.totalCount < 10) return 'poor';
    if (stats.totalCount < 100) return 'fair';
    if (stats.totalCount < 1000) return 'good';
    return 'excellent';
  }

  private static async validateAgainstData(
    query: string, 
    entityType: string, 
    dataContext: DataContext
  ): Promise<{
    issues: QueryIssue[];
    suggestions: string[];
    confidence: number;
  }> {
    const issues: QueryIssue[] = [];
    const suggestions: string[] = [];
    let confidence = 1.0;

    // Check if entity has data
    if (dataContext.totalRecords === 0) {
      issues.push({
        type: 'data_unavailable',
        severity: 'error',
        message: `No data available for ${entityType}`,
        suggestion: 'Try a different entity type or check data availability'
      });
      return { issues, suggestions, confidence: 0 };
    }

    // Check for unrealistic filters
    const filterIssues = this.validateFilters(query, dataContext);
    issues.push(...filterIssues.issues);
    suggestions.push(...filterIssues.suggestions);
    confidence *= filterIssues.confidence;

    // Check for invalid date ranges
    const dateIssues = this.validateDateRanges(query, dataContext);
    issues.push(...dateIssues.issues);
    suggestions.push(...dateIssues.suggestions);
    confidence *= dateIssues.confidence;

    // Check for missing required fields
    const requiredIssues = this.validateRequiredFields(query, entityType, dataContext);
    issues.push(...requiredIssues.issues);
    suggestions.push(...requiredIssues.suggestions);
    confidence *= requiredIssues.confidence;

    // Check data quality
    if (dataContext.dataQuality === 'poor') {
      issues.push({
        type: 'low_confidence',
        severity: 'warning',
        message: 'Data quality is poor, results may be limited',
        suggestion: 'Consider broader queries or check data quality'
      });
      confidence *= 0.7;
    }

    return { issues, suggestions, confidence };
  }

  private static validateFilters(query: string, dataContext: DataContext): {
    issues: QueryIssue[];
    suggestions: string[];
    confidence: number;
  } {
    const issues: QueryIssue[] = [];
    const suggestions: string[] = [];
    let confidence = 1.0;

    // Extract filter patterns from query
    const filterPatterns = [
      /(?:status|type|category)\s*[:=]\s*["']?(\w+)["']?/gi,
      /(?:with|having)\s+(\w+)\s*[:=]\s*["']?(\w+)["']?/gi,
      /(?:where|filter)\s+(\w+)\s*[:=]\s*["']?(\w+)["']?/gi
    ];

    for (const pattern of filterPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        for (const match of matches) {
          const field = this.extractFieldFromMatch(match);
          const value = this.extractValueFromMatch(match);
          
          if (field && value) {
            const fieldValues = dataContext.availableValues[field];
            if (fieldValues && fieldValues.length > 0) {
              if (!fieldValues.includes(value)) {
                issues.push({
                  type: 'unrealistic_filter',
                  severity: 'warning',
                  message: `Value '${value}' not found in ${field} field`,
                  field,
                  value,
                  suggestion: `Try one of: ${fieldValues.slice(0, 3).join(', ')}`
                });
                suggestions.push(`Available values for ${field}: ${fieldValues.slice(0, 5).join(', ')}`);
                confidence *= 0.8;
              }
            }
          }
        }
      }
    }

    return { issues, suggestions, confidence };
  }

  private static validateDateRanges(query: string, dataContext: DataContext): {
    issues: QueryIssue[];
    suggestions: string[];
    confidence: number;
  } {
    const issues: QueryIssue[] = [];
    const suggestions: string[] = [];
    let confidence = 1.0;

    if (!dataContext.dateRange) {
      return { issues, suggestions, confidence };
    }

    // Extract date patterns
    const datePatterns = [
      /(?:from|since|after)\s+(\d{4}-\d{2}-\d{2})/gi,
      /(?:before|until|to)\s+(\d{4}-\d{2}-\d{2})/gi,
      /(?:last|past|recent)\s+(\w+)/gi
    ];

    for (const pattern of datePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        for (const match of matches) {
          const dateStr = this.extractDateFromMatch(match);
          if (dateStr) {
            const queryDate = new Date(dateStr);
            const earliestDate = new Date(dataContext.dateRange!.earliest);
            const latestDate = new Date(dataContext.dateRange!.latest);

            if (queryDate < earliestDate) {
              issues.push({
                type: 'invalid_date_range',
                severity: 'warning',
                message: `Date ${dateStr} is before available data range`,
                value: dateStr,
                suggestion: `Data available from ${dataContext.dateRange!.earliest}`
              });
              confidence *= 0.8;
            }

            if (queryDate > latestDate) {
              issues.push({
                type: 'invalid_date_range',
                severity: 'warning',
                message: `Date ${dateStr} is after available data range`,
                value: dateStr,
                suggestion: `Data available until ${dataContext.dateRange!.latest}`
              });
              confidence *= 0.8;
            }
          }
        }
      }
    }

    return { issues, suggestions, confidence };
  }

  private static validateRequiredFields(query: string, entityType: string, dataContext: DataContext): {
    issues: QueryIssue[];
    suggestions: string[];
    confidence: number;
  } {
    const issues: QueryIssue[] = [];
    const suggestions: string[] = [];
    let confidence = 1.0;

    // Check if query requires specific fields that might not be available
    const pattern = this.queryPatterns.find(p => p.entityType === entityType);
    if (pattern) {
      for (const field of pattern.requiredFields) {
        if (!dataContext.availableValues[field] || dataContext.availableValues[field].length === 0) {
          issues.push({
            type: 'missing_entity',
            severity: 'error',
            message: `Required field '${field}' not available in data`,
            field,
            suggestion: `Remove ${field} requirement or use different entity type`
          });
          confidence *= 0.5;
        }
      }
    }

    return { issues, suggestions, confidence };
  }

  private static generateQuerySuggestions(entityType: string, dataContext: DataContext, baseQuery: string): {
    queries: string[];
    filters: Record<string, any>;
    insights: string[];
  } {
    const queries: string[] = [];
    const filters: Record<string, any> = {};
    const insights: string[] = [];

    // Generate basic queries
    queries.push(`List all ${entityType}`);
    queries.push(`Get ${entityType} with pagination`);

    // Add filtered queries based on available data
    for (const [field, values] of Object.entries(dataContext.availableValues)) {
      if (values.length > 0) {
        queries.push(`Find ${entityType} with ${field} = ${values[0]}`);
        filters[field] = values[0];
      }
    }

    // Add date-based queries if date range is available
    if (dataContext.dateRange) {
      queries.push(`Get ${entityType} from ${dataContext.dateRange.earliest.split('T')[0]}`);
      queries.push(`Find recent ${entityType}`);
      filters.date_from = dataContext.dateRange.earliest.split('T')[0];
    }

    // Generate insights
    insights.push(`Total records: ${dataContext.totalRecords}`);
    insights.push(`Data quality: ${dataContext.dataQuality}`);
    if (dataContext.dateRange) {
      insights.push(`Date range: ${dataContext.dateRange.earliest.split('T')[0]} to ${dataContext.dateRange.latest.split('T')[0]}`);
    }

    return { queries, filters, insights };
  }

  private static findSimilarValues(value: any, availableValues: any[]): any[] {
    const valueStr = String(value).toLowerCase();
    return availableValues.filter(v => 
      String(v).toLowerCase().includes(valueStr) || 
      valueStr.includes(String(v).toLowerCase())
    ).slice(0, 5);
  }

  private static extractFieldFromMatch(match: string): string | null {
    const fieldMatch = match.match(/(\w+)\s*[:=]/);
    return fieldMatch ? fieldMatch[1] : null;
  }

  private static extractValueFromMatch(match: string): string | null {
    const valueMatch = match.match(/[:=]\s*["']?(\w+)["']?/);
    return valueMatch ? valueMatch[1] : null;
  }

  private static extractDateFromMatch(match: string): string | null {
    const dateMatch = match.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
  }

  private static createInvalidResult(message: string, suggestions: string[]): QueryValidationResult {
    return {
      isValid: false,
      confidence: 0,
      issues: [{
        type: 'data_unavailable',
        severity: 'error',
        message
      }],
      suggestions,
      dataContext: {
        entityType: 'unknown',
        totalRecords: 0,
        availableValues: {},
        dataQuality: 'poor'
      }
    };
  }
}
