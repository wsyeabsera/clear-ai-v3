/**
 * SmartFilterGenerator - Generates realistic filters based on available data
 * 
 * This service creates intelligent filter suggestions that are likely to
 * return meaningful results based on actual data patterns.
 */

import { DataAssessmentService, DataAvailability } from './data-assessment';
import { QueryRealismValidator } from './query-realism-validator';

export interface FilterSuggestion {
  field: string;
  value: any;
  confidence: number;
  reason: string;
  alternatives: any[];
}

export interface SmartFilterResult {
  suggestedFilters: Record<string, any>;
  filterSuggestions: FilterSuggestion[];
  dataInsights: string[];
  realisticRanges: Record<string, { min: any; max: any; values: any[] }>;
  recommendations: string[];
}

export interface FilterContext {
  entityType: string;
  baseQuery: string;
  existingFilters: Record<string, any>;
  userPreferences?: {
    maxResults?: number;
    dateRange?: { from: string; to: string };
    preferredFields?: string[];
  };
}

export class SmartFilterGenerator {
  private static readonly COMMON_FILTER_PATTERNS = {
    date: {
      patterns: [
        /(?:last|past|recent)\s+(\w+)/gi,
        /(?:from|since|after)\s+(\d{4}-\d{2}-\d{2})/gi,
        /(?:before|until|to)\s+(\d{4}-\d{2}-\d{2})/gi,
        /(?:this|current)\s+(\w+)/gi
      ],
      fields: ['date_from', 'date_to', 'created_at', 'updated_at', 'shipment_date', 'inspection_date']
    },
    status: {
      patterns: [
        /(?:status|state)\s*[:=]\s*["']?(\w+)["']?/gi,
        /(?:with|having)\s+status\s*[:=]\s*["']?(\w+)["']?/gi
      ],
      fields: ['status', 'state']
    },
    type: {
      patterns: [
        /(?:type|category)\s*[:=]\s*["']?(\w+)["']?/gi,
        /(?:with|having)\s+type\s*[:=]\s*["']?(\w+)["']?/gi
      ],
      fields: ['type', 'category', 'waste_type', 'contract_type', 'inspection_type']
    },
    location: {
      patterns: [
        /(?:location|place|city|state)\s*[:=]\s*["']?([^"']+)["']?/gi,
        /(?:in|at|from)\s+([^,\s]+)/gi
      ],
      fields: ['location', 'city', 'state', 'address']
    },
    id: {
      patterns: [
        /(?:id|facility_id|contract_id|shipment_id)\s*[:=]\s*["']?(\w+)["']?/gi,
        /(?:for|of)\s+(\w+_id)/gi
      ],
      fields: ['id', 'facility_id', 'contract_id', 'shipment_id', 'generator_id']
    }
  };

  /**
   * Generate smart filters for a given query context
   */
  static async generateSmartFilters(context: FilterContext): Promise<SmartFilterResult> {
    try {
      // Get data availability for the entity type
      const dataAvailability = await DataAssessmentService.getEntityStatistics(context.entityType);
      
      if (!dataAvailability.hasData) {
        return this.createEmptyResult('No data available for this entity type');
      }

      // Extract filter requirements from the base query
      const queryRequirements = this.extractFilterRequirements(context.baseQuery);
      
      // Generate filter suggestions based on data patterns
      const filterSuggestions = await this.generateFilterSuggestions(
        context.entityType, 
        dataAvailability, 
        queryRequirements,
        context.userPreferences
      );

      // Create realistic filter ranges
      const realisticRanges = this.generateRealisticRanges(dataAvailability);

      // Generate final filter recommendations
      const suggestedFilters = this.buildSuggestedFilters(
        filterSuggestions, 
        context.existingFilters,
        context.userPreferences
      );

      // Generate insights and recommendations
      const dataInsights = this.generateDataInsights(dataAvailability);
      const recommendations = this.generateRecommendations(
        dataAvailability, 
        filterSuggestions, 
        context.userPreferences
      );

      return {
        suggestedFilters,
        filterSuggestions,
        dataInsights,
        realisticRanges,
        recommendations
      };

    } catch (error) {
      console.error('Smart filter generation failed:', error);
      return this.createEmptyResult('Failed to generate smart filters');
    }
  }

  /**
   * Generate filters for a specific field based on data patterns
   */
  static async generateFieldFilters(
    entityType: string, 
    field: string, 
    currentValue?: any
  ): Promise<{
    suggestions: any[];
    confidence: number;
    reasoning: string;
  }> {
    try {
      const dataAvailability = await DataAssessmentService.getEntityStatistics(entityType);
      const fieldValues = dataAvailability.commonValues?.[field] || [];

      if (fieldValues.length === 0) {
        return {
          suggestions: [],
          confidence: 0,
          reasoning: `No data available for field '${field}'`
        };
      }

      // Analyze current value if provided
      let confidence = 1.0;
      let reasoning = 'Based on available data patterns';

      if (currentValue !== undefined) {
        const isRealistic = await QueryRealismValidator.isFilterValueRealistic(
          entityType, 
          field, 
          currentValue
        );
        confidence = isRealistic.confidence;
        reasoning = isRealistic.reason;
      }

      // Generate suggestions based on data distribution
      const suggestions = this.generateFieldSuggestions(field, fieldValues, currentValue);

      return {
        suggestions,
        confidence,
        reasoning
      };

    } catch (error) {
      console.error(`Failed to generate filters for field ${field}:`, error);
      return {
        suggestions: [],
        confidence: 0,
        reasoning: 'Unable to generate field suggestions'
      };
    }
  }

  /**
   * Optimize existing filters based on data availability
   */
  static async optimizeFilters(
    entityType: string, 
    filters: Record<string, any>
  ): Promise<{
    optimizedFilters: Record<string, any>;
    changes: Array<{ field: string; oldValue: any; newValue: any; reason: string }>;
    removedFilters: string[];
  }> {
    try {
      const dataAvailability = await DataAssessmentService.getEntityStatistics(entityType);
      const optimizedFilters: Record<string, any> = {};
      const changes: Array<{ field: string; oldValue: any; newValue: any; reason: string }> = [];
      const removedFilters: string[] = [];

      for (const [field, value] of Object.entries(filters)) {
        const fieldValues = dataAvailability.commonValues?.[field] || [];
        
        if (fieldValues.length === 0) {
          // Remove filters for fields with no data
          removedFilters.push(field);
          continue;
        }

        if (fieldValues.includes(value)) {
          // Keep realistic values
          optimizedFilters[field] = value;
        } else {
          // Find closest realistic value
          const closestValue = this.findClosestValue(value, fieldValues);
          if (closestValue) {
            optimizedFilters[field] = closestValue;
            changes.push({
              field,
              oldValue: value,
              newValue: closestValue,
              reason: `Value '${value}' not found, using closest match '${closestValue}'`
            });
          } else {
            removedFilters.push(field);
          }
        }
      }

      return {
        optimizedFilters,
        changes,
        removedFilters
      };

    } catch (error) {
      console.error('Filter optimization failed:', error);
      return {
        optimizedFilters: filters,
        changes: [],
        removedFilters: []
      };
    }
  }

  // Private methods

  private static extractFilterRequirements(query: string): {
    dateRange?: { from?: string; to?: string; relative?: string };
    status?: string;
    type?: string;
    location?: string;
    id?: string;
    limit?: number;
  } {
    const requirements: any = {};

    // Extract date requirements
    const datePatterns = this.COMMON_FILTER_PATTERNS.date.patterns;
    for (const pattern of datePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        const match = matches[0];
        if (match.includes('last') || match.includes('past') || match.includes('recent')) {
          requirements.dateRange = { relative: match };
        } else if (match.includes('from') || match.includes('since')) {
          requirements.dateRange = { from: this.extractDateFromMatch(match) };
        } else if (match.includes('before') || match.includes('until')) {
          requirements.dateRange = { to: this.extractDateFromMatch(match) };
        }
      }
    }

    // Extract status requirements
    const statusPatterns = this.COMMON_FILTER_PATTERNS.status.patterns;
    for (const pattern of statusPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        requirements.status = this.extractValueFromMatch(matches[0]);
        break;
      }
    }

    // Extract type requirements
    const typePatterns = this.COMMON_FILTER_PATTERNS.type.patterns;
    for (const pattern of typePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        requirements.type = this.extractValueFromMatch(matches[0]);
        break;
      }
    }

    // Extract location requirements
    const locationPatterns = this.COMMON_FILTER_PATTERNS.location.patterns;
    for (const pattern of locationPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        requirements.location = this.extractValueFromMatch(matches[0]);
        break;
      }
    }

    // Extract ID requirements
    const idPatterns = this.COMMON_FILTER_PATTERNS.id.patterns;
    for (const pattern of idPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        requirements.id = this.extractValueFromMatch(matches[0]);
        break;
      }
    }

    // Extract limit requirements
    const limitMatch = query.match(/(?:limit|max|top)\s+(\d+)/gi);
    if (limitMatch) {
      requirements.limit = parseInt(this.extractValueFromMatch(limitMatch[0]) || '10');
    }

    return requirements;
  }

  private static async generateFilterSuggestions(
    entityType: string,
    dataAvailability: DataAvailability,
    queryRequirements: any,
    userPreferences?: any
  ): Promise<FilterSuggestion[]> {
    const suggestions: FilterSuggestion[] = [];

    // Generate date filter suggestions
    if (queryRequirements.dateRange || userPreferences?.dateRange) {
      const dateSuggestions = this.generateDateFilterSuggestions(
        dataAvailability, 
        queryRequirements.dateRange,
        userPreferences?.dateRange
      );
      suggestions.push(...dateSuggestions);
    }

    // Generate status filter suggestions
    if (queryRequirements.status) {
      const statusSuggestions = this.generateFieldFilterSuggestions(
        'status', 
        dataAvailability.commonValues?.status || [],
        queryRequirements.status
      );
      suggestions.push(...statusSuggestions);
    }

    // Generate type filter suggestions
    if (queryRequirements.type) {
      const typeSuggestions = this.generateFieldFilterSuggestions(
        'type', 
        dataAvailability.commonValues?.type || [],
        queryRequirements.type
      );
      suggestions.push(...typeSuggestions);
    }

    // Generate location filter suggestions
    if (queryRequirements.location) {
      const locationSuggestions = this.generateFieldFilterSuggestions(
        'location', 
        dataAvailability.commonValues?.location || [],
        queryRequirements.location
      );
      suggestions.push(...locationSuggestions);
    }

    // Generate ID filter suggestions
    if (queryRequirements.id) {
      const idSuggestions = this.generateFieldFilterSuggestions(
        'id', 
        dataAvailability.commonValues?.id || [],
        queryRequirements.id
      );
      suggestions.push(...idSuggestions);
    }

    // Generate limit suggestions
    if (queryRequirements.limit || userPreferences?.maxResults) {
      const limitSuggestions = this.generateLimitSuggestions(
        dataAvailability.totalCount,
        queryRequirements.limit,
        userPreferences?.maxResults
      );
      suggestions.push(...limitSuggestions);
    }

    return suggestions;
  }

  private static generateDateFilterSuggestions(
    dataAvailability: DataAvailability,
    queryDateRange?: any,
    userDateRange?: any
  ): FilterSuggestion[] {
    const suggestions: FilterSuggestion[] = [];

    if (!dataAvailability.dateRange?.earliest || !dataAvailability.dateRange?.latest) {
      return suggestions;
    }

    const earliest = new Date(dataAvailability.dateRange.earliest);
    const latest = new Date(dataAvailability.dateRange.latest);

    // Generate date_from suggestion
    if (queryDateRange?.from) {
      suggestions.push({
        field: 'date_from',
        value: queryDateRange.from,
        confidence: 0.9,
        reason: 'Based on query requirements',
        alternatives: [earliest.toISOString().split('T')[0]]
      });
    } else if (userDateRange?.from) {
      suggestions.push({
        field: 'date_from',
        value: userDateRange.from,
        confidence: 0.8,
        reason: 'Based on user preferences',
        alternatives: [earliest.toISOString().split('T')[0]]
      });
    } else {
      // Suggest a realistic date range
      const suggestedFrom = this.calculateRealisticDateFrom(earliest, latest);
      suggestions.push({
        field: 'date_from',
        value: suggestedFrom,
        confidence: 0.7,
        reason: 'Based on data availability patterns',
        alternatives: [earliest.toISOString().split('T')[0]]
      });
    }

    // Generate date_to suggestion
    if (queryDateRange?.to) {
      suggestions.push({
        field: 'date_to',
        value: queryDateRange.to,
        confidence: 0.9,
        reason: 'Based on query requirements',
        alternatives: [latest.toISOString().split('T')[0]]
      });
    } else if (userDateRange?.to) {
      suggestions.push({
        field: 'date_to',
        value: userDateRange.to,
        confidence: 0.8,
        reason: 'Based on user preferences',
        alternatives: [latest.toISOString().split('T')[0]]
      });
    } else {
      suggestions.push({
        field: 'date_to',
        value: latest.toISOString().split('T')[0],
        confidence: 0.7,
        reason: 'Based on latest available data',
        alternatives: [latest.toISOString().split('T')[0]]
      });
    }

    return suggestions;
  }

  private static generateFieldFilterSuggestions(
    field: string,
    availableValues: any[],
    queryValue?: any
  ): FilterSuggestion[] {
    const suggestions: FilterSuggestion[] = [];

    if (availableValues.length === 0) {
      return suggestions;
    }

    if (queryValue && availableValues.includes(queryValue)) {
      suggestions.push({
        field,
        value: queryValue,
        confidence: 1.0,
        reason: 'Value found in available data',
        alternatives: availableValues.slice(0, 5)
      });
    } else if (queryValue) {
      const closestValue = this.findClosestValue(queryValue, availableValues);
      if (closestValue) {
        suggestions.push({
          field,
          value: closestValue,
          confidence: 0.8,
          reason: `Closest match to '${queryValue}'`,
          alternatives: availableValues.slice(0, 5)
        });
      }
    } else {
      // Suggest most common values
      suggestions.push({
        field,
        value: availableValues[0],
        confidence: 0.7,
        reason: 'Most common value in data',
        alternatives: availableValues.slice(0, 5)
      });
    }

    return suggestions;
  }

  private static generateLimitSuggestions(
    totalCount: number,
    queryLimit?: number,
    userMaxResults?: number
  ): FilterSuggestion[] {
    const suggestions: FilterSuggestion[] = [];

    let suggestedLimit = 50; // Default

    if (queryLimit) {
      suggestedLimit = Math.min(queryLimit, totalCount);
    } else if (userMaxResults) {
      suggestedLimit = Math.min(userMaxResults, totalCount);
    } else {
      // Calculate realistic limit based on data size
      if (totalCount < 100) {
        suggestedLimit = Math.min(20, totalCount);
      } else if (totalCount < 1000) {
        suggestedLimit = Math.min(50, totalCount);
      } else {
        suggestedLimit = Math.min(100, totalCount);
      }
    }

    suggestions.push({
      field: 'limit',
      value: suggestedLimit,
      confidence: 0.8,
      reason: `Optimized for data size (${totalCount} total records)`,
      alternatives: [10, 25, 50, 100].filter(l => l <= totalCount)
    });

    return suggestions;
  }

  private static generateRealisticRanges(dataAvailability: DataAvailability): Record<string, { min: any; max: any; values: any[] }> {
    const ranges: Record<string, { min: any; max: any; values: any[] }> = {};

    // Add date range
    if (dataAvailability.dateRange?.earliest && dataAvailability.dateRange?.latest) {
      ranges.date = {
        min: dataAvailability.dateRange.earliest,
        max: dataAvailability.dateRange.latest,
        values: [dataAvailability.dateRange.earliest, dataAvailability.dateRange.latest]
      };
    }

    // Add field ranges
    if (dataAvailability.commonValues) {
      for (const [field, values] of Object.entries(dataAvailability.commonValues)) {
        if (values.length > 0) {
          ranges[field] = {
            min: values[0],
            max: values[values.length - 1],
            values: values.slice(0, 10)
          };
        }
      }
    }

    return ranges;
  }

  private static buildSuggestedFilters(
    suggestions: FilterSuggestion[],
    existingFilters: Record<string, any>,
    userPreferences?: any
  ): Record<string, any> {
    const filters: Record<string, any> = { ...existingFilters };

    // Apply suggestions with highest confidence
    for (const suggestion of suggestions) {
      if (suggestion.confidence > 0.7) {
        filters[suggestion.field] = suggestion.value;
      }
    }

    // Apply user preferences
    if (userPreferences?.maxResults) {
      filters.limit = userPreferences.maxResults;
    }

    return filters;
  }

  private static generateDataInsights(dataAvailability: DataAvailability): string[] {
    const insights: string[] = [];

    insights.push(`Total records: ${dataAvailability.totalCount}`);
    insights.push(`Data quality: ${dataAvailability.totalCount > 1000 ? 'High' : dataAvailability.totalCount > 100 ? 'Medium' : 'Low'}`);

    if (dataAvailability.dateRange) {
      const earliest = new Date(dataAvailability.dateRange.earliest!);
      const latest = new Date(dataAvailability.dateRange.latest!);
      const daysDiff = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
      insights.push(`Date range: ${daysDiff} days`);
    }

    const fieldCount = Object.keys(dataAvailability.commonValues || {}).length;
    insights.push(`Filterable fields: ${fieldCount}`);

    return insights;
  }

  private static generateRecommendations(
    dataAvailability: DataAvailability,
    suggestions: FilterSuggestion[],
    userPreferences?: any
  ): string[] {
    const recommendations: string[] = [];

    if (dataAvailability.totalCount < 50) {
      recommendations.push('Consider removing pagination filters for better results');
    }

    if (suggestions.some(s => s.confidence < 0.7)) {
      recommendations.push('Some filter values may not return results - consider alternatives');
    }

    if (dataAvailability.dateRange && dataAvailability.dateRange.earliest) {
      const earliest = new Date(dataAvailability.dateRange.earliest);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      if (earliest > sixMonthsAgo) {
        recommendations.push('Data is recent - consider using date filters for better performance');
      }
    }

    return recommendations;
  }

  private static generateFieldSuggestions(field: string, availableValues: any[], currentValue?: any): any[] {
    if (currentValue !== undefined && availableValues.includes(currentValue)) {
      return [currentValue, ...availableValues.filter(v => v !== currentValue).slice(0, 4)];
    }

    return availableValues.slice(0, 5);
  }

  private static findClosestValue(value: any, availableValues: any[]): any | null {
    const valueStr = String(value).toLowerCase();
    const exactMatch = availableValues.find(v => String(v).toLowerCase() === valueStr);
    if (exactMatch) return exactMatch;

    const partialMatch = availableValues.find(v => 
      String(v).toLowerCase().includes(valueStr) || 
      valueStr.includes(String(v).toLowerCase())
    );
    if (partialMatch) return partialMatch;

    return availableValues[0] || null;
  }

  private static calculateRealisticDateFrom(earliest: Date, latest: Date): string {
    // Suggest a date that's 30 days before the latest date, but not before earliest
    const suggestedDate = new Date(latest);
    suggestedDate.setDate(suggestedDate.getDate() - 30);
    
    if (suggestedDate < earliest) {
      return earliest.toISOString().split('T')[0];
    }
    
    return suggestedDate.toISOString().split('T')[0];
  }

  private static extractDateFromMatch(match: string): string | null {
    const dateMatch = match.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
  }

  private static extractValueFromMatch(match: string): string | null {
    const valueMatch = match.match(/[:=]\s*["']?([^"']+)["']?/);
    return valueMatch ? valueMatch[1] : null;
  }

  private static createEmptyResult(message: string): SmartFilterResult {
    return {
      suggestedFilters: {},
      filterSuggestions: [],
      dataInsights: [message],
      realisticRanges: {},
      recommendations: ['Unable to generate smart filters']
    };
  }
}
