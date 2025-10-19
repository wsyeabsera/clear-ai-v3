/**
 * Tool Metadata Validator
 * Validates tool schemas for consistency, required fields, and proper parameter types
 */

import { MCPTool } from '../../types/mcp';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ToolMetadataValidator {
  /**
   * Validate all tool schemas for consistency and correctness
   */
  static validateToolSchemas(tools: MCPTool[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    tools.forEach(tool => {
      // Check for consistent ID naming
      const hasId = tool.inputSchema.properties.id;
      const hasUid = Object.keys(tool.inputSchema.properties).some(key => key.endsWith('_uid'));
      
      if (hasId && hasUid) {
        errors.push(`Tool ${tool.name} has inconsistent ID naming (both 'id' and '*_uid' fields)`);
      }

      // Check required fields exist in properties
      tool.inputSchema.required?.forEach(requiredField => {
        if (!tool.inputSchema.properties[requiredField]) {
          errors.push(`Tool ${tool.name} requires field '${requiredField}' but it's not defined in properties`);
        }
      });

      // Check for common parameter naming issues
      const properties = tool.inputSchema.properties;
      Object.keys(properties).forEach(propName => {
        // Check for inconsistent ID field naming
        if (propName.endsWith('_uid') && !propName.includes('client_uid') && !propName.includes('facility_uid') && !propName.includes('shipment_uid')) {
          warnings.push(`Tool ${tool.name} has field '${propName}' - consider using '${propName.replace('_uid', '_id')}' for consistency`);
        }

        // Check for missing descriptions
        if (!properties[propName].description) {
          warnings.push(`Tool ${tool.name} field '${propName}' is missing description`);
        }

        // Check for proper type definitions
        const prop = properties[propName];
        if (prop.type === 'array' && !prop.items) {
          errors.push(`Tool ${tool.name} field '${propName}' is array type but missing items definition`);
        }

        // Check for proper format definitions
        if (prop.format === 'date-time' && prop.type !== 'string') {
          errors.push(`Tool ${tool.name} field '${propName}' has date-time format but is not string type`);
        }
      });

      // Check for common tool naming patterns
      if (!tool.name.includes('_')) {
        warnings.push(`Tool ${tool.name} doesn't follow naming convention (should be 'entity_action')`);
      }

      // Check for proper description
      if (!tool.description || tool.description.length < 10) {
        warnings.push(`Tool ${tool.name} has short or missing description`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single tool schema
   */
  static validateSingleTool(tool: MCPTool): ValidationResult {
    return this.validateToolSchemas([tool]);
  }

  /**
   * Get validation summary
   */
  static getValidationSummary(tools: MCPTool[]): {
    totalTools: number;
    validTools: number;
    invalidTools: number;
    totalErrors: number;
    totalWarnings: number;
  } {
    const result = this.validateToolSchemas(tools);
    const invalidTools = result.errors.length > 0 ? 1 : 0;

    return {
      totalTools: tools.length,
      validTools: tools.length - invalidTools,
      invalidTools,
      totalErrors: result.errors.length,
      totalWarnings: result.warnings.length
    };
  }

  /**
   * Fix common tool schema issues automatically
   */
  static fixCommonIssues(tool: MCPTool): MCPTool {
    const fixedTool = { ...tool };
    
    // Fix inconsistent ID naming
    const properties = { ...fixedTool.inputSchema.properties };
    Object.keys(properties).forEach(propName => {
      if (propName.endsWith('_uid') && !propName.includes('client_uid') && !propName.includes('facility_uid') && !propName.includes('shipment_uid')) {
        const newName = propName.replace('_uid', '_id');
        properties[newName] = properties[propName];
        delete properties[propName];
      }
    });

    // Update required fields to match fixed property names
    const required = fixedTool.inputSchema.required?.map(field => {
      if (field.endsWith('_uid') && !field.includes('client_uid') && !field.includes('facility_uid') && !field.includes('shipment_uid')) {
        return field.replace('_uid', '_id');
      }
      return field;
    });

    fixedTool.inputSchema = {
      ...fixedTool.inputSchema,
      properties,
      required
    };

    return fixedTool;
  }
}
