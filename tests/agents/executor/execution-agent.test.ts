// Unit tests for ExecutionAgent

import { ExecutionAgent } from '../../../src/agents/executor/ExecutionAgent';
import { ExecutionStorage } from '../../../src/agents/executor/storage';
import { PlanStorage } from '../../../src/agents/planner/storage';
import { ToolAdapter } from '../../../src/agents/planner/tool-adapter';
import { ExecutionStatus, StepStatus } from '../../../src/agents/executor/types';

// Mock dependencies
jest.mock('../../../src/agents/executor/storage');
jest.mock('../../../src/agents/planner/storage');
jest.mock('../../../src/agents/planner/tool-adapter');

const MockedExecutionStorage = ExecutionStorage as jest.Mocked<typeof ExecutionStorage>;
const MockedPlanStorage = PlanStorage as jest.Mocked<typeof PlanStorage>;
const MockedToolAdapter = ToolAdapter as jest.Mocked<typeof ToolAdapter>;

describe('ExecutionAgent', () => {
  let executionAgent: ExecutionAgent;
  
  beforeEach(() => {
    jest.clearAllMocks();
    executionAgent = new ExecutionAgent();
  });
  
  describe('executePlan', () => {
    it('should execute a simple plan successfully', async () => {
      // Mock plan data
      const mockPlan = {
        requestId: 'plan-123',
        query: 'Test query',
        plan: {
          steps: [
            {
              tool: 'mcp_waste-management_shipments_list',
              params: { page: 1, limit: 10 },
              dependsOn: [],
              parallel: false,
              description: 'List shipments'
            }
          ],
          metadata: {
            query: 'Test query',
            requestId: 'plan-123',
            totalSteps: 1,
            parallelSteps: 0
          }
        },
        status: 'COMPLETED',
        createdAt: new Date(),
        executionTimeMs: 100
      };
      
      // Mock storage responses
      MockedPlanStorage.getPlanByRequestId.mockResolvedValue(mockPlan as any);
      MockedExecutionStorage.saveExecution.mockResolvedValue({
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        status: ExecutionStatus.PENDING,
        totalSteps: 1,
        completedSteps: 0,
        failedSteps: 0,
        results: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      
      MockedExecutionStorage.updateExecutionStatus.mockResolvedValue({
        executionId: 'exec-123',
        status: ExecutionStatus.RUNNING
      } as any);
      
      MockedExecutionStorage.updateStepResult.mockResolvedValue({
        executionId: 'exec-123',
        results: [{
          stepIndex: 0,
          tool: 'mcp_waste-management_shipments_list',
          params: { page: 1, limit: 10 },
          status: StepStatus.COMPLETED,
          result: { success: true, data: [] },
          retryCount: 0,
          dependencies: []
        }]
      } as any);
      
      MockedExecutionStorage.updateExecutionProgress.mockResolvedValue({
        executionId: 'exec-123',
        completedSteps: 1,
        failedSteps: 0
      } as any);
      
      MockedExecutionStorage.getExecutionById.mockResolvedValue({
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        status: ExecutionStatus.COMPLETED,
        totalSteps: 1,
        completedSteps: 1,
        failedSteps: 0,
        results: [{
          stepIndex: 0,
          tool: 'mcp_waste-management_shipments_list',
          params: { page: 1, limit: 10 },
          status: StepStatus.COMPLETED,
          result: { success: true, data: [] },
          retryCount: 0,
          dependencies: []
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      
      // Mock tool execution
      MockedToolAdapter.executeTool.mockResolvedValue({
        success: true,
        data: []
      });
      
      // Execute plan
      const result = await executionAgent.executePlan('plan-123');
      
      // Verify result
      expect(result.executionId).toBe('exec-123');
      expect(result.planRequestId).toBe('plan-123');
      expect(result.status).toBe(ExecutionStatus.COMPLETED);
      expect(result.totalSteps).toBe(1);
      expect(result.completedSteps).toBe(1);
      expect(result.failedSteps).toBe(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe(StepStatus.COMPLETED);
      
      // Verify storage calls
      expect(MockedPlanStorage.getPlanByRequestId).toHaveBeenCalledWith('plan-123');
      expect(MockedExecutionStorage.saveExecution).toHaveBeenCalled();
      expect(MockedExecutionStorage.updateExecutionStatus).toHaveBeenCalledWith(expect.any(String), ExecutionStatus.RUNNING);
      expect(MockedToolAdapter.executeTool).toHaveBeenCalledWith('mcp_waste-management_shipments_list', { page: 1, limit: 10 });
    });
    
    it('should handle plan not found error', async () => {
      MockedPlanStorage.getPlanByRequestId.mockResolvedValueOnce(null);
      
      const result = await executionAgent.executePlan('nonexistent-plan');
      
      expect(result.status).toBe(ExecutionStatus.FAILED);
      expect(result.error).toContain('Plan not found');
    });
    
    it('should handle tool execution failure', async () => {
      const mockPlan = {
        requestId: 'plan-123',
        query: 'Test query',
        plan: {
          steps: [
            {
              tool: 'mcp_waste-management_shipments_list',
              params: { page: 1, limit: 10 },
              dependsOn: [],
              parallel: false,
              description: 'List shipments'
            }
          ],
          metadata: {
            query: 'Test query',
            requestId: 'plan-123',
            totalSteps: 1,
            parallelSteps: 0
          }
        },
        status: 'COMPLETED',
        createdAt: new Date(),
        executionTimeMs: 100
      };
      
      MockedPlanStorage.getPlanByRequestId.mockResolvedValue(mockPlan as any);
      MockedExecutionStorage.saveExecution.mockResolvedValue({
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        status: ExecutionStatus.PENDING,
        totalSteps: 1,
        completedSteps: 0,
        failedSteps: 0,
        results: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      
      MockedExecutionStorage.updateExecutionStatus.mockResolvedValue({
        executionId: 'exec-123',
        status: ExecutionStatus.RUNNING
      } as any);
      
      MockedExecutionStorage.updateStepResult.mockResolvedValue({
        executionId: 'exec-123',
        results: [{
          stepIndex: 0,
          tool: 'mcp_waste-management_shipments_list',
          params: { page: 1, limit: 10 },
          status: StepStatus.FAILED,
          error: 'Tool execution failed',
          retryCount: 3,
          dependencies: []
        }]
      } as any);
      
      MockedExecutionStorage.updateExecutionProgress.mockResolvedValue({
        executionId: 'exec-123',
        completedSteps: 0,
        failedSteps: 1
      } as any);
      
      MockedExecutionStorage.getExecutionById.mockResolvedValue({
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        status: ExecutionStatus.FAILED,
        totalSteps: 1,
        completedSteps: 0,
        failedSteps: 1,
        results: [{
          stepIndex: 0,
          tool: 'mcp_waste-management_shipments_list',
          params: { page: 1, limit: 10 },
          status: StepStatus.FAILED,
          error: 'Tool execution failed',
          retryCount: 3,
          dependencies: []
        }],
        error: 'Tool execution failed',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      
      // Mock tool execution failure
      MockedToolAdapter.executeTool.mockRejectedValue(new Error('Tool execution failed'));
      
      const result = await executionAgent.executePlan('plan-123');
      
      expect(result.status).toBe(ExecutionStatus.FAILED);
      expect(result.failedSteps).toBe(1);
      expect(result.results[0].status).toBe(StepStatus.FAILED);
      expect(result.results[0].error).toBe('Tool execution failed');
    });
  });
  
  describe('getExecution', () => {
    it('should return execution by ID', async () => {
      const mockExecution = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        status: ExecutionStatus.COMPLETED,
        totalSteps: 1,
        completedSteps: 1,
        failedSteps: 0,
        results: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      MockedExecutionStorage.getExecutionById.mockResolvedValue(mockExecution as any);
      
      const result = await executionAgent.getExecution('exec-123');
      
      expect(result).toBeDefined();
      expect(result?.executionId).toBe('exec-123');
      expect(result?.status).toBe(ExecutionStatus.COMPLETED);
    });
    
    it('should return null for non-existent execution', async () => {
      MockedExecutionStorage.getExecutionById.mockResolvedValue(null);
      
      const result = await executionAgent.getExecution('nonexistent');
      
      expect(result).toBeNull();
    });
  });
  
  describe('cancelExecution', () => {
    it('should cancel running execution', async () => {
      const mockExecution = {
        executionId: 'exec-123',
        status: ExecutionStatus.RUNNING
      };
      
      MockedExecutionStorage.getExecutionById.mockResolvedValue(mockExecution as any);
      MockedExecutionStorage.updateExecutionStatus.mockResolvedValue({
        executionId: 'exec-123',
        status: ExecutionStatus.FAILED
      } as any);
      
      const result = await executionAgent.cancelExecution('exec-123');
      
      expect(result).toBe(true);
      expect(MockedExecutionStorage.updateExecutionStatus).toHaveBeenCalledWith(
        'exec-123',
        ExecutionStatus.FAILED,
        'Execution cancelled by user'
      );
    });
    
    it('should not cancel non-running execution', async () => {
      const mockExecution = {
        executionId: 'exec-123',
        status: ExecutionStatus.COMPLETED
      };
      
      MockedExecutionStorage.getExecutionById.mockResolvedValue(mockExecution as any);
      
      const result = await executionAgent.cancelExecution('exec-123');
      
      expect(result).toBe(false);
      expect(MockedExecutionStorage.updateExecutionStatus).not.toHaveBeenCalled();
    });
    
    it('should return false for non-existent execution', async () => {
      MockedExecutionStorage.getExecutionById.mockResolvedValue(null);
      
      const result = await executionAgent.cancelExecution('nonexistent');
      
      expect(result).toBe(false);
    });
  });
  
  describe('retryExecution', () => {
    it('should retry failed execution', async () => {
      const mockExecution = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        status: ExecutionStatus.FAILED
      };
      
      MockedExecutionStorage.getExecutionById.mockResolvedValue(mockExecution as any);
      
      // Mock the retry execution
      const mockRetryResult = {
        executionId: 'exec-456',
        planRequestId: 'plan-123',
        status: ExecutionStatus.COMPLETED,
        totalSteps: 1,
        completedSteps: 1,
        failedSteps: 0,
        results: []
      };
      
      // Mock the executePlan method
      const executePlanSpy = jest.spyOn(executionAgent, 'executePlan').mockResolvedValue(mockRetryResult as any);
      
      const result = await executionAgent.retryExecution('exec-123');
      
      expect(result).toBeDefined();
      expect(result.executionId).toBe('exec-456');
      expect(executePlanSpy).toHaveBeenCalledWith('plan-123');
      
      executePlanSpy.mockRestore();
    });
    
    it('should throw error for non-failed execution', async () => {
      const mockExecution = {
        executionId: 'exec-123',
        status: ExecutionStatus.RUNNING
      };
      
      MockedExecutionStorage.getExecutionById.mockResolvedValue(mockExecution as any);
      
      await expect(executionAgent.retryExecution('exec-123')).rejects.toThrow('Cannot retry execution with status: RUNNING');
    });
    
    it('should throw error for non-existent execution', async () => {
      MockedExecutionStorage.getExecutionById.mockResolvedValue(null);
      
      await expect(executionAgent.retryExecution('nonexistent')).rejects.toThrow('Execution not found: nonexistent');
    });
  });
  
  describe('getExecutionsByPlanId', () => {
    it('should return executions for plan', async () => {
      const mockExecutions = [
        {
          executionId: 'exec-123',
          planRequestId: 'plan-123',
          status: ExecutionStatus.COMPLETED,
          totalSteps: 1,
          completedSteps: 1,
          failedSteps: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      MockedExecutionStorage.getExecutionsByPlanId.mockResolvedValue(mockExecutions as any);
      
      const result = await executionAgent.getExecutionsByPlanId('plan-123');
      
      expect(result).toHaveLength(1);
      expect(result[0].executionId).toBe('exec-123');
      expect(result[0].planRequestId).toBe('plan-123');
    });
  });
  
  describe('getRecentExecutions', () => {
    it('should return recent executions', async () => {
      const mockExecutions = [
        {
          executionId: 'exec-123',
          planRequestId: 'plan-123',
          status: ExecutionStatus.COMPLETED,
          totalSteps: 1,
          completedSteps: 1,
          failedSteps: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      MockedExecutionStorage.getRecentExecutions.mockResolvedValue(mockExecutions as any);
      
      const result = await executionAgent.getRecentExecutions(10);
      
      expect(result).toHaveLength(1);
      expect(MockedExecutionStorage.getRecentExecutions).toHaveBeenCalledWith(10);
    });
  });
  
  describe('getStatistics', () => {
    it('should return execution statistics', async () => {
      const mockStats = {
        total: 10,
        byStatus: {
          [ExecutionStatus.COMPLETED]: 8,
          [ExecutionStatus.FAILED]: 2,
          [ExecutionStatus.RUNNING]: 0,
          [ExecutionStatus.PENDING]: 0,
          [ExecutionStatus.ROLLED_BACK]: 0
        },
        averageExecutionTime: 1500,
        successRate: 80,
        averageStepsPerExecution: 2.5
      };
      
      MockedExecutionStorage.getExecutionStatistics.mockResolvedValue(mockStats);
      
      const result = await executionAgent.getStatistics();
      
      expect(result).toEqual(mockStats);
    });
  });
});
