// Unit tests for RollbackHandler

import { RollbackHandler } from '../../../src/agents/executor/rollback-handler';
import { ExecutionStepResult, StepStatus } from '../../../src/agents/executor/types';
import { PlanStep } from '../../../src/agents/planner/types';
import { ToolAdapter } from '../../../src/agents/planner/tool-adapter';

// Mock ToolAdapter
jest.mock('../../../src/agents/planner/tool-adapter');
const MockedToolAdapter = ToolAdapter as jest.Mocked<typeof ToolAdapter>;

describe('RollbackHandler', () => {
  let rollbackHandler: RollbackHandler;
  
  beforeEach(() => {
    jest.clearAllMocks();
    rollbackHandler = new RollbackHandler();
  });
  
  describe('generateRollbackPlan', () => {
    it('should generate rollback plan for completed steps', () => {
      const completedSteps: ExecutionStepResult[] = [
        {
          stepIndex: 0,
          tool: 'mcp_waste-management_shipments_create',
          params: { id: 'ship-123', client_id: 'client-123' },
          status: StepStatus.COMPLETED,
          result: { success: true, data: { id: 'ship-123' } },
          retryCount: 0,
          dependencies: []
        },
        {
          stepIndex: 1,
          tool: 'mcp_waste-management_facilities_create',
          params: { id: 'facility-123', name: 'Test Facility' },
          status: StepStatus.COMPLETED,
          result: { success: true, data: { id: 'facility-123' } },
          retryCount: 0,
          dependencies: []
        }
      ];
      
      const rollbackPlan = rollbackHandler.generateRollbackPlan(completedSteps);
      
      expect(rollbackPlan.steps).toHaveLength(2);
      expect(rollbackPlan.steps[0].tool).toBe('mcp_waste-management_facilities_delete');
      expect(rollbackPlan.steps[0].params).toEqual({ id: 'facility-123' });
      expect(rollbackPlan.steps[1].tool).toBe('mcp_waste-management_shipments_delete');
      expect(rollbackPlan.steps[1].params).toEqual({ id: 'ship-123' });
      expect(rollbackPlan.reason).toContain('2 completed steps');
    });
    
    it('should only include completed steps in rollback plan', () => {
      const steps: ExecutionStepResult[] = [
        {
          stepIndex: 0,
          tool: 'mcp_waste-management_shipments_create',
          params: { id: 'ship-123' },
          status: StepStatus.COMPLETED,
          result: { success: true, data: { id: 'ship-123' } },
          retryCount: 0,
          dependencies: []
        },
        {
          stepIndex: 1,
          tool: 'mcp_waste-management_facilities_create',
          params: { id: 'facility-123' },
          status: StepStatus.FAILED,
          result: null,
          retryCount: 0,
          dependencies: []
        },
        {
          stepIndex: 2,
          tool: 'mcp_waste-management_contaminants_create',
          params: { id: 'contaminant-123' },
          status: StepStatus.PENDING,
          result: null,
          retryCount: 0,
          dependencies: []
        }
      ];
      
      const rollbackPlan = rollbackHandler.generateRollbackPlan(steps);
      
      expect(rollbackPlan.steps).toHaveLength(1);
      expect(rollbackPlan.steps[0].tool).toBe('mcp_waste-management_shipments_delete');
    });
    
    it('should sort steps in reverse order', () => {
      const completedSteps: ExecutionStepResult[] = [
        {
          stepIndex: 0,
          tool: 'mcp_waste-management_shipments_create',
          params: { id: 'ship-123' },
          status: StepStatus.COMPLETED,
          result: { success: true, data: { id: 'ship-123' } },
          retryCount: 0,
          dependencies: []
        },
        {
          stepIndex: 2,
          tool: 'mcp_waste-management_contaminants_create',
          params: { id: 'contaminant-123' },
          status: StepStatus.COMPLETED,
          result: { success: true, data: { id: 'contaminant-123' } },
          retryCount: 0,
          dependencies: []
        }
      ];
      
      const rollbackPlan = rollbackHandler.generateRollbackPlan(completedSteps);
      
      // Should be in reverse order (step 2 first, then step 0)
      expect(rollbackPlan.steps[0].description).toContain('step 2');
      expect(rollbackPlan.steps[1].description).toContain('step 0');
    });
    
    it('should handle steps without inverse operations', () => {
      const completedSteps: ExecutionStepResult[] = [
        {
          stepIndex: 0,
          tool: 'unknown_tool',
          params: { id: 'test-123' },
          status: StepStatus.COMPLETED,
          result: { success: true, data: { id: 'test-123' } },
          retryCount: 0,
          dependencies: []
        }
      ];
      
      const rollbackPlan = rollbackHandler.generateRollbackPlan(completedSteps);
      
      expect(rollbackPlan.steps).toHaveLength(0);
    });
  });
  
  describe('getInverseOperation', () => {
    it('should return inverse operation for create', () => {
      const inverse = rollbackHandler.getInverseOperation('mcp_waste-management_shipments_create');
      expect(inverse).toBe('mcp_waste-management_shipments_delete');
    });
    
    it('should return inverse operation for delete', () => {
      const inverse = rollbackHandler.getInverseOperation('mcp_waste-management_shipments_delete');
      expect(inverse).toBe('mcp_waste-management_shipments_create');
    });
    
    it('should return inverse operation for update', () => {
      const inverse = rollbackHandler.getInverseOperation('mcp_waste-management_shipments_update');
      expect(inverse).toBe('mcp_waste-management_shipments_update');
    });
    
    it('should return null for unknown tool', () => {
      const inverse = rollbackHandler.getInverseOperation('unknown_tool');
      expect(inverse).toBeNull();
    });
  });
  
  describe('supportsRollback', () => {
    it('should return true for supported tools', () => {
      expect(rollbackHandler.supportsRollback('mcp_waste-management_shipments_create')).toBe(true);
      expect(rollbackHandler.supportsRollback('mcp_waste-management_shipments_delete')).toBe(true);
      expect(rollbackHandler.supportsRollback('mcp_waste-management_shipments_update')).toBe(true);
    });
    
    it('should return false for unsupported tools', () => {
      expect(rollbackHandler.supportsRollback('unknown_tool')).toBe(false);
      expect(rollbackHandler.supportsRollback('mcp_waste-management_shipments_list')).toBe(false);
    });
  });
  
  describe('executeRollback', () => {
    it('should execute rollback plan successfully', async () => {
      const rollbackPlan = {
        steps: [
          {
            tool: 'mcp_waste-management_shipments_delete',
            params: { id: 'ship-123' },
            dependsOn: [],
            parallel: false,
            description: 'Rollback step 0'
          }
        ],
        reason: 'Test rollback',
        createdAt: new Date()
      };
      
      MockedToolAdapter.executeTool.mockResolvedValue({
        success: true,
        data: { deleted: true }
      });
      
      const result = await rollbackHandler.executeRollback(rollbackPlan);
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(MockedToolAdapter.executeTool).toHaveBeenCalledWith(
        'mcp_waste-management_shipments_delete',
        { id: 'ship-123' }
      );
    });
    
    it('should handle rollback failures', async () => {
      const rollbackPlan = {
        steps: [
          {
            tool: 'mcp_waste-management_shipments_delete',
            params: { id: 'ship-123' },
            dependsOn: [],
            parallel: false,
            description: 'Rollback step 0'
          },
          {
            tool: 'mcp_waste-management_facilities_delete',
            params: { id: 'facility-123' },
            dependsOn: [],
            parallel: false,
            description: 'Rollback step 1'
          }
        ],
        reason: 'Test rollback',
        createdAt: new Date()
      };
      
      MockedToolAdapter.executeTool
        .mockResolvedValueOnce({
          success: true,
          data: { deleted: true }
        })
        .mockRejectedValueOnce(new Error('Delete failed'));
      
      const result = await rollbackHandler.executeRollback(rollbackPlan);
      
      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Rollback step 2 failed');
    });
    
    it('should handle empty rollback plan', async () => {
      const rollbackPlan = {
        steps: [],
        reason: 'Empty rollback',
        createdAt: new Date()
      };
      
      const result = await rollbackHandler.executeRollback(rollbackPlan);
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('getRollbackStats', () => {
    it('should return rollback statistics', () => {
      const rollbackPlan = {
        steps: [
          {
            tool: 'mcp_waste-management_shipments_delete',
            params: { id: 'ship-123' },
            dependsOn: [],
            parallel: false,
            description: 'Rollback step 0'
          },
          {
            tool: 'unknown_tool',
            params: { id: 'test-123' },
            dependsOn: [],
            parallel: false,
            description: 'Rollback step 1'
          }
        ],
        reason: 'Test rollback',
        createdAt: new Date()
      };
      
      const stats = rollbackHandler.getRollbackStats(rollbackPlan);
      
      expect(stats.totalSteps).toBe(2);
      expect(stats.supportedSteps).toBe(1);
      expect(stats.unsupportedSteps).toBe(1);
      expect(stats.supportRate).toBe(50);
    });
    
    it('should handle empty rollback plan', () => {
      const rollbackPlan = {
        steps: [],
        reason: 'Empty rollback',
        createdAt: new Date()
      };
      
      const stats = rollbackHandler.getRollbackStats(rollbackPlan);
      
      expect(stats.totalSteps).toBe(0);
      expect(stats.supportedSteps).toBe(0);
      expect(stats.unsupportedSteps).toBe(0);
      expect(stats.supportRate).toBe(0);
    });
  });
  
  describe('validateRollbackPlan', () => {
    it('should return empty array for valid rollback plan', () => {
      const rollbackPlan = {
        steps: [
          {
            tool: 'mcp_waste-management_shipments_delete',
            params: { id: 'ship-123' },
            dependsOn: [],
            parallel: false,
            description: 'Rollback step 0'
          }
        ],
        reason: 'Test rollback',
        createdAt: new Date()
      };
      
      const errors = rollbackHandler.validateRollbackPlan(rollbackPlan);
      
      expect(errors).toEqual([]);
    });
    
    it('should return errors for invalid rollback plan', () => {
      const rollbackPlan = {
        steps: [
          {
            tool: '',
            params: {},
            dependsOn: [],
            parallel: false,
            description: 'Invalid step'
          },
          {
            tool: 'unknown_tool',
            params: { id: 'test-123' },
            dependsOn: [],
            parallel: false,
            description: 'Unsupported step'
          }
        ],
        reason: 'Test rollback',
        createdAt: new Date()
      };
      
      const errors = rollbackHandler.validateRollbackPlan(rollbackPlan);
      
      expect(errors).toContain('Rollback step 0 has no tool');
      expect(errors).toContain('Rollback step 0 has invalid parameters');
      expect(errors).toContain('Rollback step 1 uses unsupported tool: unknown_tool');
    });
    
    it('should return error for empty rollback plan', () => {
      const rollbackPlan = {
        steps: [],
        reason: 'Empty rollback',
        createdAt: new Date()
      };
      
      const errors = rollbackHandler.validateRollbackPlan(rollbackPlan);
      
      expect(errors).toContain('Rollback plan has no steps');
    });
  });
  
  describe('createMinimalRollbackPlan', () => {
    it('should create minimal rollback plan for critical steps', () => {
      const completedSteps: ExecutionStepResult[] = [
        {
          stepIndex: 0,
          tool: 'mcp_waste-management_shipments_create',
          params: { id: 'ship-123' },
          status: StepStatus.COMPLETED,
          result: { success: true, data: { id: 'ship-123' } },
          retryCount: 0,
          dependencies: []
        },
        {
          stepIndex: 1,
          tool: 'mcp_waste-management_shipments_list',
          params: { page: 1, limit: 10 },
          status: StepStatus.COMPLETED,
          result: { success: true, data: [] },
          retryCount: 0,
          dependencies: []
        }
      ];
      
      const rollbackPlan = rollbackHandler.createMinimalRollbackPlan(completedSteps);
      
      expect(rollbackPlan.steps).toHaveLength(1);
      expect(rollbackPlan.steps[0].tool).toBe('mcp_waste-management_shipments_delete');
    });
  });
  
  describe('generateRollbackParams', () => {
    it('should generate delete params for create operations', () => {
      const step: ExecutionStepResult = {
        stepIndex: 0,
        tool: 'mcp_waste-management_shipments_create',
        params: { id: 'ship-123', client_id: 'client-123' },
        status: StepStatus.COMPLETED,
        result: { success: true, data: { id: 'ship-123' } },
        retryCount: 0,
        dependencies: []
      };
      
      // Access private method through any cast
      const params = (rollbackHandler as any).generateRollbackParams(step);
      
      expect(params).toEqual({ id: 'ship-123' });
    });
    
    it('should return null for failed operations', () => {
      const step: ExecutionStepResult = {
        stepIndex: 0,
        tool: 'mcp_waste-management_shipments_create',
        params: { id: 'ship-123' },
        status: StepStatus.FAILED,
        result: { success: false, error: 'Creation failed' },
        retryCount: 0,
        dependencies: []
      };
      
      const params = (rollbackHandler as any).generateRollbackParams(step);
      
      expect(params).toBeNull();
    });
  });
  
  describe('isCriticalStep', () => {
    it('should identify critical steps', () => {
      expect((rollbackHandler as any).isCriticalStep('mcp_waste-management_shipments_create')).toBe(true);
      expect((rollbackHandler as any).isCriticalStep('mcp_waste-management_shipments_delete')).toBe(true);
      expect((rollbackHandler as any).isCriticalStep('mcp_waste-management_shipments_update')).toBe(true);
    });
    
    it('should not identify non-critical steps', () => {
      expect((rollbackHandler as any).isCriticalStep('mcp_waste-management_shipments_list')).toBe(false);
      expect((rollbackHandler as any).isCriticalStep('mcp_waste-management_shipments_get')).toBe(false);
    });
  });
});
