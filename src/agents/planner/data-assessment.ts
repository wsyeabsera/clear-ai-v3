/**
 * DataAssessmentService - Pre-planning data availability checks
 * 
 * This service assesses data availability before creating plans to ensure
 * realistic query generation and avoid empty results.
 */

// Note: Database connection and ToolRegistry imports would need to be implemented
// For now, we'll use mock implementations

// Mock database connection
const connectToDatabase = async () => {
  // This would connect to the actual database
  return {
    collection: (name: string) => ({
      countDocuments: async () => 100,
      find: () => ({
        limit: (n: number) => ({
          toArray: async () => []
        })
      }),
      aggregate: () => ({
        toArray: async () => []
      })
    })
  };
};

// Mock ToolRegistry
class ToolRegistry {
  getAvailableTools() {
    return [
      { name: 'shipments_list' },
      { name: 'facilities_list' },
      { name: 'contracts_list' },
      { name: 'waste_codes_list' },
      { name: 'waste_generators_list' },
      { name: 'inspections_list' },
      { name: 'contaminants_list' }
    ];
  }
}

export interface DataAvailability {
  entityType: string;
  totalCount: number;
  hasData: boolean;
  dateRange?: {
    earliest: string | null;
    latest: string | null;
  };
  sampleData?: any[];
  commonValues?: {
    [field: string]: any[];
  };
  lastUpdated?: string;
}

export interface DataAssessmentResult {
  overallAvailability: number; // 0-1 score
  entityAvailability: DataAvailability[];
  recommendations: string[];
  warnings: string[];
  cacheTimestamp: number;
}

export interface DataQuery {
  entityType: string;
  filters?: Record<string, any>;
  limit?: number;
  dateField?: string;
}

export class DataAssessmentService {
  private static cache = new Map<string, DataAssessmentResult>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static toolRegistry = new ToolRegistry();

  /**
   * Assess data availability for a given query context
   */
  static async assessDataAvailability(queries: string[]): Promise<DataAssessmentResult> {
    const cacheKey = this.generateCacheKey(queries);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const db = await connectToDatabase();
      const entityTypes = this.extractEntityTypes(queries);
      const entityAvailability: DataAvailability[] = [];

      // Assess each entity type
      for (const entityType of entityTypes) {
        const availability = await this.assessEntityAvailability(db, entityType);
        entityAvailability.push(availability);
      }

      const result: DataAssessmentResult = {
        overallAvailability: this.calculateOverallAvailability(entityAvailability),
        entityAvailability,
        recommendations: this.generateRecommendations(entityAvailability),
        warnings: this.generateWarnings(entityAvailability),
        cacheTimestamp: Date.now()
      };

      this.cacheResult(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Data assessment failed:', error);
      return this.getFallbackResult();
    }
  }

  /**
   * Get data statistics for a specific entity type
   */
  static async getEntityStatistics(entityType: string): Promise<DataAvailability> {
    try {
      const db = await connectToDatabase();
      return await this.assessEntityAvailability(db, entityType);
    } catch (error) {
      console.error(`Failed to get statistics for ${entityType}:`, error);
      return this.getEmptyAvailability(entityType);
    }
  }

  /**
   * Check if a specific query is realistic based on available data
   */
  static async isQueryRealistic(query: string, entityType: string): Promise<{
    isRealistic: boolean;
    confidence: number;
    reasons: string[];
    suggestions: string[];
  }> {
    try {
      const stats = await this.getEntityStatistics(entityType);
      const analysis = this.analyzeQueryRealism(query, stats);
      
      return {
        isRealistic: analysis.isRealistic,
        confidence: analysis.confidence,
        reasons: analysis.reasons,
        suggestions: analysis.suggestions
      };
    } catch (error) {
      console.error('Query realism check failed:', error);
      return {
        isRealistic: false,
        confidence: 0,
        reasons: ['Unable to assess query realism'],
        suggestions: ['Try a simpler query or check data availability']
      };
    }
  }

  /**
   * Get realistic filter suggestions based on available data
   */
  static async getRealisticFilters(entityType: string, baseFilters: Record<string, any> = {}): Promise<{
    suggestedFilters: Record<string, any>;
    dataRanges: Record<string, { min: any; max: any; values: any[] }>;
    recommendations: string[];
  }> {
    try {
      const stats = await this.getEntityStatistics(entityType);
      const suggestions = this.generateFilterSuggestions(stats, baseFilters);
      
      return {
        suggestedFilters: suggestions.filters,
        dataRanges: suggestions.ranges,
        recommendations: suggestions.recommendations
      };
    } catch (error) {
      console.error('Failed to generate realistic filters:', error);
      return {
        suggestedFilters: baseFilters,
        dataRanges: {},
        recommendations: ['Unable to generate filter suggestions']
      };
    }
  }

  /**
   * Clear the assessment cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Private methods

  private static generateCacheKey(queries: string[]): string {
    return queries.sort().join('|').toLowerCase();
  }

  private static getCachedResult(key: string): DataAssessmentResult | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.cacheTimestamp) < this.CACHE_DURATION) {
      return cached;
    }
    return null;
  }

  private static cacheResult(key: string, result: DataAssessmentResult): void {
    this.cache.set(key, result);
  }

  private static extractEntityTypes(queries: string[]): string[] {
    const entityTypes = new Set<string>();
    
    // Extract entity types from queries using common patterns
    const patterns = [
      /(?:list|get|show|find|search)\s+(?:all\s+)?(shipments?|facilities?|contracts?|waste_codes?|generators?|inspections?|contaminants?)/gi,
      /(?:shipments?|facilities?|contracts?|waste_codes?|generators?|inspections?|contaminants?)(?:\s+from|\s+in|\s+for)/gi
    ];

    for (const query of queries) {
      for (const pattern of patterns) {
        const matches = query.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const entityType = match.replace(/(?:list|get|show|find|search)\s+(?:all\s+)?/gi, '')
                                  .replace(/\s+(?:from|in|for).*$/gi, '')
                                  .toLowerCase();
            if (entityType) {
              entityTypes.add(entityType);
            }
          });
        }
      }
    }

    // Fallback: if no patterns match, try to infer from tool registry
    if (entityTypes.size === 0) {
      const availableTools = this.toolRegistry.getAvailableTools();
      for (const tool of availableTools) {
        if (tool.name.includes('list') || tool.name.includes('get')) {
          const entityType = tool.name.replace(/(list_|get_)/gi, '').replace(/_/g, '');
          entityTypes.add(entityType);
        }
      }
    }

    return Array.from(entityTypes);
  }

  private static async assessEntityAvailability(db: any, entityType: string): Promise<DataAvailability> {
    try {
      const collection = this.getCollectionName(entityType);
      const collectionObj = db.collection(collection);

      // Get total count
      const totalCount = await collectionObj.countDocuments();

      if (totalCount === 0) {
        return this.getEmptyAvailability(entityType);
      }

      // Get date range if applicable
      const dateRange = await this.getDateRange(collectionObj, entityType);

      // Get sample data
      const sampleData = await collectionObj.find({}).limit(5).toArray();

      // Get common values for key fields
      const commonValues = await this.getCommonValues(collectionObj, entityType);

      // Get last updated timestamp
      const lastUpdated = await this.getLastUpdated(collectionObj);

      return {
        entityType,
        totalCount,
        hasData: totalCount > 0,
        dateRange,
        sampleData,
        commonValues,
        lastUpdated
      };

    } catch (error) {
      console.error(`Failed to assess ${entityType}:`, error);
      return this.getEmptyAvailability(entityType);
    }
  }

  private static getCollectionName(entityType: string): string {
    const mapping: Record<string, string> = {
      'shipments': 'shipments',
      'facilities': 'facilities',
      'contracts': 'contracts',
      'waste_codes': 'waste_codes',
      'generators': 'waste_generators',
      'inspections': 'inspections',
      'contaminants': 'contaminants'
    };
    return mapping[entityType] || entityType;
  }

  private static async getDateRange(collection: any, entityType: string): Promise<{ earliest: string | null; latest: string | null }> {
    const dateFields = this.getDateFields(entityType);
    if (dateFields.length === 0) return { earliest: null, latest: null };

    try {
      const pipeline = [
        { $match: { [dateFields[0]]: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            earliest: { $min: `$${dateFields[0]}` },
            latest: { $max: `$${dateFields[0]}` }
          }
        }
      ];

      const result = await collection.aggregate(pipeline).toArray();
      if (result.length === 0) return { earliest: null, latest: null };

      return {
        earliest: result[0]?.earliest ? result[0].earliest.toISOString() : null,
        latest: result[0]?.latest ? result[0].latest.toISOString() : null
      };
    } catch (error) {
      console.error(`Failed to get date range for ${entityType}:`, error);
      return { earliest: null, latest: null };
    }
  }

  private static getDateFields(entityType: string): string[] {
    const dateFieldMapping: Record<string, string[]> = {
      'shipments': ['created_at', 'updated_at', 'shipment_date'],
      'facilities': ['created_at', 'updated_at'],
      'contracts': ['created_at', 'updated_at', 'start_date', 'end_date'],
      'waste_codes': ['created_at', 'updated_at'],
      'generators': ['created_at', 'updated_at'],
      'inspections': ['created_at', 'updated_at', 'inspection_date'],
      'contaminants': ['created_at', 'updated_at']
    };
    return dateFieldMapping[entityType] || ['created_at', 'updated_at'];
  }

  private static async getCommonValues(collection: any, entityType: string): Promise<Record<string, any[]>> {
    const commonFields = this.getCommonFields(entityType);
    const commonValues: Record<string, any[]> = {};

    for (const field of commonFields) {
      try {
        const pipeline = [
          { $match: { [field]: { $exists: true, $ne: null } } },
          { $group: { _id: `$${field}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $project: { value: '$_id', count: 1, _id: 0 } }
        ];

        const result = await collection.aggregate(pipeline).toArray();
        commonValues[field] = result.map((item: any) => item.value);
      } catch (error) {
        console.error(`Failed to get common values for ${field}:`, error);
        commonValues[field] = [];
      }
    }

    return commonValues;
  }

  private static getCommonFields(entityType: string): string[] {
    const fieldMapping: Record<string, string[]> = {
      'shipments': ['status', 'facility_id', 'waste_type'],
      'facilities': ['type', 'location', 'status'],
      'contracts': ['status', 'facility_id', 'contract_type'],
      'waste_codes': ['category', 'hazard_level'],
      'generators': ['type', 'location'],
      'inspections': ['status', 'facility_id', 'inspection_type'],
      'contaminants': ['type', 'severity']
    };
    return fieldMapping[entityType] || ['status', 'type'];
  }

  private static async getLastUpdated(collection: any): Promise<string | undefined> {
    try {
      const result = await collection.findOne({}, { sort: { updated_at: -1 } });
      return result?.updated_at?.toISOString();
    } catch (error) {
      return undefined;
    }
  }

  private static calculateOverallAvailability(entityAvailability: DataAvailability[]): number {
    if (entityAvailability.length === 0) return 0;
    
    const totalEntities = entityAvailability.length;
    const entitiesWithData = entityAvailability.filter(e => e.hasData).length;
    
    return entitiesWithData / totalEntities;
  }

  private static generateRecommendations(entityAvailability: DataAvailability[]): string[] {
    const recommendations: string[] = [];
    
    const entitiesWithoutData = entityAvailability.filter(e => !e.hasData);
    if (entitiesWithoutData.length > 0) {
      recommendations.push(`No data available for: ${entitiesWithoutData.map(e => e.entityType).join(', ')}`);
    }

    const entitiesWithLowData = entityAvailability.filter(e => e.hasData && e.totalCount < 10);
    if (entitiesWithLowData.length > 0) {
      recommendations.push(`Limited data available for: ${entitiesWithLowData.map(e => e.entityType).join(', ')}`);
    }

    const entitiesWithOldData = entityAvailability.filter(e => {
      if (!e.lastUpdated) return false;
      const lastUpdate = new Date(e.lastUpdated);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return lastUpdate < sixMonthsAgo;
    });
    if (entitiesWithOldData.length > 0) {
      recommendations.push(`Data may be outdated for: ${entitiesWithOldData.map(e => e.entityType).join(', ')}`);
    }

    return recommendations;
  }

  private static generateWarnings(entityAvailability: DataAvailability[]): string[] {
    const warnings: string[] = [];
    
    const totalEntities = entityAvailability.length;
    const entitiesWithData = entityAvailability.filter(e => e.hasData).length;
    
    if (entitiesWithData / totalEntities < 0.5) {
      warnings.push('Most entities have no data available');
    }

    const entitiesWithVeryLowData = entityAvailability.filter(e => e.hasData && e.totalCount < 5);
    if (entitiesWithVeryLowData.length > 0) {
      warnings.push(`Very limited data for: ${entitiesWithVeryLowData.map(e => e.entityType).join(', ')}`);
    }

    return warnings;
  }

  private static analyzeQueryRealism(query: string, stats: DataAvailability): {
    isRealistic: boolean;
    confidence: number;
    reasons: string[];
    suggestions: string[];
  } {
    const reasons: string[] = [];
    const suggestions: string[] = [];
    let confidence = 1.0;

    if (!stats.hasData) {
      reasons.push(`No data available for ${stats.entityType}`);
      suggestions.push(`Try querying a different entity type or check if data exists`);
      return { isRealistic: false, confidence: 0, reasons, suggestions };
    }

    if (stats.totalCount < 5) {
      reasons.push(`Very limited data available (${stats.totalCount} records)`);
      suggestions.push(`Consider broader queries or check data quality`);
      confidence *= 0.5;
    }

    // Check for date-based queries
    const datePatterns = [
      /(?:last|past|recent|this|previous)\s+(?:week|month|year|quarter)/gi,
      /(?:from|since|after|before)\s+\d{4}-\d{2}-\d{2}/gi
    ];

    const hasDateQuery = datePatterns.some(pattern => pattern.test(query));
    if (hasDateQuery && !stats.dateRange?.earliest) {
      reasons.push('Query references dates but no date data available');
      suggestions.push('Remove date filters or use a different query approach');
      confidence *= 0.3;
    }

    // Check for specific value queries
    const valuePatterns = [
      /(?:status|type|category)\s*[:=]\s*["']?(\w+)["']?/gi,
      /(?:with|having)\s+(\w+)\s*[:=]\s*["']?(\w+)["']?/gi
    ];

    for (const pattern of valuePatterns) {
      const matches = query.match(pattern);
      if (matches) {
        const field = this.extractFieldFromMatch(matches[0]);
        if (field && stats.commonValues?.[field]) {
          const queryValue = this.extractValueFromMatch(matches[0]);
          if (queryValue && !stats.commonValues[field].includes(queryValue)) {
            reasons.push(`Value '${queryValue}' not found in ${field} field`);
            suggestions.push(`Try one of: ${stats.commonValues[field].slice(0, 3).join(', ')}`);
            confidence *= 0.4;
          }
        }
      }
    }

    return {
      isRealistic: confidence > 0.5,
      confidence,
      reasons,
      suggestions
    };
  }

  private static extractFieldFromMatch(match: string): string | null {
    const fieldMatch = match.match(/(\w+)\s*[:=]/);
    return fieldMatch ? fieldMatch[1] : null;
  }

  private static extractValueFromMatch(match: string): string | null {
    const valueMatch = match.match(/[:=]\s*["']?(\w+)["']?/);
    return valueMatch ? valueMatch[1] : null;
  }

  private static generateFilterSuggestions(stats: DataAvailability, baseFilters: Record<string, any>): {
    filters: Record<string, any>;
    ranges: Record<string, { min: any; max: any; values: any[] }>;
    recommendations: string[];
  } {
    const suggestions: Record<string, any> = { ...baseFilters };
    const ranges: Record<string, { min: any; max: any; values: any[] }> = {};
    const recommendations: string[] = [];

    // Add realistic date ranges
    if (stats.dateRange?.earliest && stats.dateRange?.latest) {
      const earliest = new Date(stats.dateRange.earliest);
      const latest = new Date(stats.dateRange.latest);
      
      ranges.date = {
        min: earliest,
        max: latest,
        values: [earliest, latest]
      };

      if (!suggestions.date_from) {
        suggestions.date_from = earliest.toISOString().split('T')[0];
      }
      if (!suggestions.date_to) {
        suggestions.date_to = latest.toISOString().split('T')[0];
      }
    }

    // Add realistic limit values
    if (!suggestions.limit) {
      suggestions.limit = Math.min(50, Math.max(10, Math.floor(stats.totalCount / 10)));
    }

    // Add realistic field values
    if (stats.commonValues) {
      for (const [field, values] of Object.entries(stats.commonValues)) {
        if (values.length > 0) {
          ranges[field] = {
            min: values[0],
            max: values[values.length - 1],
            values: values.slice(0, 5)
          };

          if (!suggestions[field] && values.length > 0) {
            suggestions[field] = values[0];
          }
        }
      }
    }

    // Generate recommendations
    if (stats.totalCount < 100) {
      recommendations.push('Consider removing pagination filters for better results');
    }
    if (stats.dateRange && stats.dateRange.earliest) {
      recommendations.push(`Data available from ${stats.dateRange.earliest.split('T')[0]}`);
    }

    return { filters: suggestions, ranges, recommendations };
  }

  private static getEmptyAvailability(entityType: string): DataAvailability {
    return {
      entityType,
      totalCount: 0,
      hasData: false,
      dateRange: { earliest: null, latest: null },
      sampleData: [],
      commonValues: {},
      lastUpdated: undefined
    };
  }

  private static getFallbackResult(): DataAssessmentResult {
    return {
      overallAvailability: 0,
      entityAvailability: [],
      recommendations: ['Unable to assess data availability'],
      warnings: ['Data assessment failed'],
      cacheTimestamp: Date.now()
    };
  }
}
