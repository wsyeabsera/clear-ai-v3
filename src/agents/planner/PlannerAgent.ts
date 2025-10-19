// Planner Agent (rule-based, deterministic)

import { randomUUID } from 'crypto';
import { PlannerState, Plan, PlanResponse, PlanStatus, MCPTool } from './types';
import { ToolAdapter } from './tool-adapter';
import { PlanValidator } from './validator';
import { PlanStorage } from './storage';

export class PlannerAgent {
  private tools: MCPTool[];
  
  constructor() {
    this.tools = ToolAdapter.getAvailableTools();
  }
  
  /**
   * Create a plan for a given query
   */
  async plan(query: string, llmProvider?: string, skipDatabase: boolean = false): Promise<PlanResponse> {
    const requestId = randomUUID();
    const startTime = new Date();
    
    try {
      // Step 1: Parse query (simplified)
      const parsedQuery = this.parseQuery(query);
      
      // Step 2: Select tools (simplified)
      const selectedTools = this.selectTools(parsedQuery);
      
      // Step 3: Generate plan (simplified)
      const plan = this.generatePlan(query, selectedTools, requestId);
      
      // Step 4: Validate plan
      const validator = new PlanValidator(this.tools);
      const validation = validator.validatePlan(plan);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime.getTime();
      
      // Step 5: Save plan (only if not skipping database)
      if (!skipDatabase) {
        try {
          await PlanStorage.savePlan(
            requestId,
            query,
            plan,
            llmProvider || 'simple',
            validation.errors
          );
          
          // Update status
          await PlanStorage.updatePlanStatus(requestId, PlanStatus.COMPLETED, executionTime);
        } catch (dbError) {
          console.warn('Database operation failed, continuing without persistence:', dbError);
        }
      }
      
      return {
        requestId,
        query,
        plan,
        status: PlanStatus.COMPLETED,
        createdAt: startTime.toISOString(),
        executionTimeMs: executionTime,
        validationErrors: validation.errors
      };
      
    } catch (error) {
      console.error('Planner agent error:', error);
      
      // Update status to failed (only if not skipping database)
      if (!skipDatabase) {
        try {
          await PlanStorage.updatePlanStatus(requestId, PlanStatus.FAILED);
        } catch (dbError) {
          console.warn('Database operation failed:', dbError);
        }
      }
      
      return {
        requestId,
        query,
        plan: {
          steps: [],
          metadata: {
            query,
            requestId,
            totalSteps: 0,
            parallelSteps: 0
          }
        },
        status: PlanStatus.FAILED,
        createdAt: startTime.toISOString(),
        validationErrors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  /**
   * Parse user query (simplified)
   */
  private parseQuery(query: string): any {
    // Simple keyword-based parsing
    const lowerQuery = query.toLowerCase();
    
    return {
      intent: this.extractIntent(lowerQuery),
      entities: this.extractEntities(lowerQuery),
      parameters: this.extractParameters(lowerQuery),
      complexity: this.determineComplexity(lowerQuery)
    };
  }
  
  private extractIntent(query: string): string {
    if (query.includes('list') || query.includes('get all') || query.includes('show')) {
      return 'list';
    } else if (query.includes('create') || query.includes('add') || query.includes('new')) {
      return 'create';
    } else if (query.includes('update') || query.includes('edit') || query.includes('modify')) {
      return 'update';
    } else if (query.includes('delete') || query.includes('remove')) {
      return 'delete';
    } else if (query.includes('get') || query.includes('find') || query.includes('search')) {
      return 'get';
    }
    return 'unknown';
  }
  
  private extractEntities(query: string): string[] {
    const entities: string[] = [];
    if (query.includes('shipment')) entities.push('shipments');
    if (query.includes('facility')) entities.push('facilities');
    if (query.includes('contaminant')) entities.push('contaminants');
    if (query.includes('inspection')) entities.push('inspections');
    if (query.includes('contract')) entities.push('contracts');
    if (query.includes('client')) entities.push('clients');
    if (query.includes('waste code')) entities.push('waste_codes');
    if (query.includes('waste generator')) entities.push('waste_generators');
    if (query.includes('waste property')) entities.push('waste_properties');
    if (query.includes('bunker')) entities.push('bunkers');
    return entities;
  }
  
  private extractParameters(query: string): any {
    const params: any = {};
    
    // Date parameters
    if (query.includes('last week')) {
      params.date_from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (query.includes('last month')) {
      params.date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (query.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      params.date_from = today.toISOString();
    }
    
    // Location parameters
    const locationMatch = query.match(/(?:from|in)\s+(\w+)/i);
    if (locationMatch) {
      params.location = locationMatch[1];
    }
    
    // Status parameters
    if (query.includes('contaminated')) {
      params.status = 'contaminated';
    }
    if (query.includes('rejected')) {
      params.status = 'rejected';
    }
    
    return params;
  }
  
  private determineComplexity(query: string): string {
    const entityCount = this.extractEntities(query).length;
    const paramCount = Object.keys(this.extractParameters(query)).length;
    
    if (entityCount > 2 || paramCount > 3) {
      return 'complex';
    } else if (entityCount > 1 || paramCount > 1) {
      return 'moderate';
    }
    return 'simple';
  }
  
  /**
   * Select tools based on parsed query
   */
  private selectTools(parsedQuery: any): string[] {
    const selectedTools: string[] = [];
    const { intent, entities } = parsedQuery;
    
    entities.forEach((entity: string) => {
      const toolPrefix = entity.replace('_', '_');
      
      switch (intent) {
        case 'list':
          selectedTools.push(`${toolPrefix}_list`);
          break;
        case 'create':
          selectedTools.push(`${toolPrefix}_create`);
          break;
        case 'update':
          selectedTools.push(`${toolPrefix}_update`);
          break;
        case 'delete':
          selectedTools.push(`${toolPrefix}_delete`);
          break;
        case 'get':
          selectedTools.push(`${toolPrefix}_get`);
          break;
        default:
          // Default to list for unknown intents
          selectedTools.push(`${toolPrefix}_list`);
      }
    });
    
    // Filter to only include tools that actually exist
    return selectedTools.filter(toolName => 
      this.tools.some(tool => tool.name === toolName)
    );
  }
  
  /**
   * Generate a simple plan
   */
  private generatePlan(query: string, selectedTools: string[], requestId: string): Plan {
    const steps = selectedTools.map((toolName, index) => {
      const tool = this.tools.find(t => t.name === toolName);
      
      // Generate basic parameters based on tool schema
      const params: any = {};
      if (tool?.inputSchema.required) {
        tool.inputSchema.required.forEach(param => {
          if (param === 'page') params[param] = 1;
          else if (param === 'limit') params[param] = 10;
          else if (param === 'id') params[param] = '${previous_step_result.id}';
          else params[param] = 'placeholder_value';
        });
      }
      
      return {
        tool: toolName,
        params,
        dependsOn: index > 0 ? [index - 1] : [],
        parallel: false,
        description: `Execute ${toolName} command`
      };
    });
    
    return {
      steps,
      metadata: {
        query,
        requestId,
        totalSteps: steps.length,
        parallelSteps: 0
      }
    };
  }
  
  /**
   * Get a plan by request ID
   */
  async getPlan(requestId: string): Promise<PlanResponse | null> {
    const planRequest = await PlanStorage.getPlanByRequestId(requestId);
    
    if (!planRequest) {
      return null;
    }
    
    return {
      requestId: planRequest.requestId,
      query: planRequest.query,
      plan: planRequest.plan,
      status: planRequest.status,
      createdAt: planRequest.createdAt.toISOString(),
      executionTimeMs: planRequest.executionTimeMs,
      validationErrors: planRequest.validationErrors
    };
  }
  
  /**
   * Get plan statistics
   */
  async getStatistics() {
    return await PlanStorage.getPlanStatistics();
  }
  
  /**
   * Get recent plans
   */
  async getRecentPlans(limit: number = 50) {
    const plans = await PlanStorage.getRecentPlans(limit);
    return plans.map(plan => ({
      requestId: plan.requestId,
      query: plan.query,
      status: plan.status,
      createdAt: plan.createdAt.toISOString(),
      executionTimeMs: plan.executionTimeMs
    }));
  }
  
  /**
   * Delete a plan
   */
  async deletePlan(requestId: string): Promise<boolean> {
    return await PlanStorage.deletePlan(requestId);
  }
  
  /**
   * Test the agent with a simple query
   */
  async test(query: string = 'List all shipments'): Promise<PlanResponse> {
    console.log(`Testing planner agent with query: "${query}"`);
    return await this.plan(query);
  }
}
