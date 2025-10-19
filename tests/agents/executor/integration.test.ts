// Integration tests for Execution Agent

import { ExecutionAgent } from '../../../src/agents/executor/ExecutionAgent';
import { PlannerAgent } from '../../../src/agents/planner/PlannerAgent';
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

describe('Execution Agent Integration', () => {
  let executionAgent: ExecutionAgent;
  let plannerAgent: PlannerAgent;
  
  beforeEach(() => {
    jest.clearAllMocks();
    executionAgent = new ExecutionAgent();
    plannerAgent = new PlannerAgent();
  });
  
  describe('End-to-End Execution Flow', () => {
    it('should execute a complete plan with multiple steps', async () => {
      // Mock plan creation
      const mockPlan = {
        requestId: 'plan-123',
        query: 'Create shipment and facility',
        plan: {
          steps: [
            {
              tool: 'mcp_waste-management_facilities_create',
              params: { uid: 'facility-123', name: 'Test Facility', client_uid: 'client-123' },
              dependsOn: [],
              parallel: false,
              description: 'Create facility'
            },
            {
              tool: 'mcp_waste-management_shipments_create',
              params: { uid: 'ship-123', client_uid: 'client-123', license_plate: 'ABC-123' },
              dependsOn: [0],
              parallel: false,
              description: 'Create shipment'
            }
          ],
          metadata: {
            query: 'Create shipment and facility',
            requestId: 'plan-123',
            totalSteps: 2,
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
        totalSteps: 2,
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
      
      // Mock step results
      MockedExecutionStorage.updateStepResult
        .mockResolvedValueOnce({
          executionId: 'exec-123',
          results: [{
            stepIndex: 0,
            tool: 'mcp_waste-management_facilities_create',
            params: { uid: 'facility-123', name: 'Test Facility', client_uid: 'client-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'facility-123' } },
            retryCount: 0,
            dependencies: []
          }]
        } as any)
        .mockResolvedValueOnce({
          executionId: 'exec-123',
          results: [{
            stepIndex: 1,
            tool: 'mcp_waste-management_shipments_create',
            params: { uid: 'ship-123', client_uid: 'client-123', license_plate: 'ABC-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'ship-123' } },
            retryCount: 0,
            dependencies: [0]
          }]
        } as any);
      
      MockedExecutionStorage.updateExecutionProgress.mockResolvedValue({
        executionId: 'exec-123',
        completedSteps: 2,
        failedSteps: 0
      } as any);
      
      // Mock final execution result
      MockedExecutionStorage.getExecutionById.mockResolvedValue({
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        status: ExecutionStatus.COMPLETED,
        totalSteps: 2,
        completedSteps: 2,
        failedSteps: 0,
        results: [
          {
            stepIndex: 0,
            tool: 'mcp_waste-management_facilities_create',
            params: { uid: 'facility-123', name: 'Test Facility', client_uid: 'client-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'facility-123' } },
            retryCount: 0,
            dependencies: []
          },
          {
            stepIndex: 1,
            tool: 'mcp_waste-management_shipments_create',
            params: { uid: 'ship-123', client_uid: 'client-123', license_plate: 'ABC-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'ship-123' } },
            retryCount: 0,
            dependencies: [0]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      
      // Mock tool executions
      MockedToolAdapter.executeTool
        .mockResolvedValueOnce({
          success: true,
          data: { uid: 'facility-123' }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { uid: 'ship-123' }
        });
      
      // Execute the plan
      const result = await executionAgent.executePlan('plan-123');
      
      // Verify result
      expect(result.executionId).toBe('exec-123');
      expect(result.planRequestId).toBe('plan-123');
      expect(result.status).toBe(ExecutionStatus.COMPLETED);
      expect(result.totalSteps).toBe(2);
      expect(result.completedSteps).toBe(2);
      expect(result.failedSteps).toBe(0);
      expect(result.results).toHaveLength(2);
      
      // Verify both steps completed successfully
      expect(result.results[0].status).toBe(StepStatus.COMPLETED);
      expect(result.results[0].tool).toBe('mcp_waste-management_facilities_create');
      expect(result.results[1].status).toBe(StepStatus.COMPLETED);
      expect(result.results[1].tool).toBe('mcp_waste-management_shipments_create');
      
      // Verify tool calls were made in correct order
      expect(MockedToolAdapter.executeTool).toHaveBeenNthCalledWith(1,
        'mcp_waste-management_facilities_create',
        { uid: 'facility-123', name: 'Test Facility', client_uid: 'client-123' }
      );
      expect(MockedToolAdapter.executeTool).toHaveBeenNthCalledWith(2,
        'mcp_waste-management_shipments_create',
        { uid: 'ship-123', client_uid: 'client-123', license_plate: 'ABC-123' }
      );
    });
    
    it('should handle parallel execution', async () => {
      const mockPlan = {
        requestId: 'plan-123',
        query: 'Create multiple facilities in parallel',
        plan: {
          steps: [
            {
              tool: 'mcp_waste-management_facilities_create',
              params: { uid: 'facility-1', name: 'Facility 1', client_uid: 'client-123' },
              dependsOn: [],
              parallel: true,
              description: 'Create facility 1'
            },
            {
              tool: 'mcp_waste-management_facilities_create',
              params: { uid: 'facility-2', name: 'Facility 2', client_uid: 'client-123' },
              dependsOn: [],
              parallel: true,
              description: 'Create facility 2'
            }
          ],
          metadata: {
            query: 'Create multiple facilities in parallel',
            requestId: 'plan-123',
            totalSteps: 2,
            parallelSteps: 2
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
        totalSteps: 2,
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
      
      // Mock parallel step results
      MockedExecutionStorage.updateStepResult.mockResolvedValue({
        executionId: 'exec-123',
        results: [
          {
            stepIndex: 0,
            tool: 'mcp_waste-management_facilities_create',
            params: { uid: 'facility-1', name: 'Facility 1', client_uid: 'client-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'facility-1' } },
            retryCount: 0,
            dependencies: []
          },
          {
            stepIndex: 1,
            tool: 'mcp_waste-management_facilities_create',
            params: { uid: 'facility-2', name: 'Facility 2', client_uid: 'client-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'facility-2' } },
            retryCount: 0,
            dependencies: []
          }
        ]
      } as any);
      
      MockedExecutionStorage.updateExecutionProgress.mockResolvedValue({
        executionId: 'exec-123',
        completedSteps: 2,
        failedSteps: 0
      } as any);
      
      MockedExecutionStorage.getExecutionById.mockResolvedValue({
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        status: ExecutionStatus.COMPLETED,
        totalSteps: 2,
        completedSteps: 2,
        failedSteps: 0,
        results: [
          {
            stepIndex: 0,
            tool: 'mcp_waste-management_facilities_create',
            params: { uid: 'facility-1', name: 'Facility 1', client_uid: 'client-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'facility-1' } },
            retryCount: 0,
            dependencies: []
          },
          {
            stepIndex: 1,
            tool: 'mcp_waste-management_facilities_create',
            params: { uid: 'facility-2', name: 'Facility 2', client_uid: 'client-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'facility-2' } },
            retryCount: 0,
            dependencies: []
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      
      // Mock tool executions
      MockedToolAdapter.executeTool
        .mockResolvedValueOnce({
          success: true,
          data: { uid: 'facility-1' }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { uid: 'facility-2' }
        });
      
      const result = await executionAgent.executePlan('plan-123');
      
      expect(result.status).toBe(ExecutionStatus.COMPLETED);
      expect(result.completedSteps).toBe(2);
      expect(result.results).toHaveLength(2);
      
      // Both steps should be completed
      expect(result.results[0].status).toBe(StepStatus.COMPLETED);
      expect(result.results[1].status).toBe(StepStatus.COMPLETED);
    });
    
    it('should handle execution with retries', async () => {
      const mockPlan = {
        requestId: 'plan-123',
        query: 'Create shipment with retry',
        plan: {
          steps: [
            {
              tool: 'mcp_waste-management_shipments_create',
              params: { uid: 'ship-123', client_uid: 'client-123' },
              dependsOn: [],
              parallel: false,
              description: 'Create shipment'
            }
          ],
          metadata: {
            query: 'Create shipment with retry',
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
      
      // Mock retry attempts
      MockedExecutionStorage.updateStepResult.mockResolvedValue({
        executionId: 'exec-123',
        results: [{
          stepIndex: 0,
          tool: 'mcp_waste-management_shipments_create',
          params: { uid: 'ship-123', client_uid: 'client-123' },
          status: StepStatus.COMPLETED,
          result: { success: true, data: { uid: 'ship-123' } },
          retryCount: 2,
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
          tool: 'mcp_waste-management_shipments_create',
          params: { uid: 'ship-123', client_uid: 'client-123' },
          status: StepStatus.COMPLETED,
          result: { success: true, data: { uid: 'ship-123' } },
          retryCount: 2,
          dependencies: []
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      
      // Mock tool execution with retries
      MockedToolAdapter.executeTool
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          success: true,
          data: { uid: 'ship-123' }
        });
      
      const result = await executionAgent.executePlan('plan-123', {
        maxRetries: 3,
        retryDelayMs: 10
      });
      
      expect(result.status).toBe(ExecutionStatus.COMPLETED);
      expect(result.results[0].retryCount).toBe(2);
      expect(MockedToolAdapter.executeTool).toHaveBeenCalledTimes(3);
    });
    
    it('should handle execution failure with rollback', async () => {
      const mockPlan = {
        requestId: 'plan-123',
        query: 'Create shipment and facility with rollback',
        plan: {
          steps: [
            {
              tool: 'mcp_waste-management_facilities_create',
              params: { uid: 'facility-123', name: 'Test Facility', client_uid: 'client-123' },
              dependsOn: [],
              parallel: false,
              description: 'Create facility'
            },
            {
              tool: 'mcp_waste-management_shipments_create',
              params: { uid: 'ship-123', client_uid: 'client-123' },
              dependsOn: [0],
              parallel: false,
              description: 'Create shipment'
            }
          ],
          metadata: {
            query: 'Create shipment and facility with rollback',
            requestId: 'plan-123',
            totalSteps: 2,
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
        totalSteps: 2,
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
      
      // Mock first step success, second step failure
      MockedExecutionStorage.updateStepResult
        .mockResolvedValueOnce({
          executionId: 'exec-123',
          results: [{
            stepIndex: 0,
            tool: 'mcp_waste-management_facilities_create',
            params: { uid: 'facility-123', name: 'Test Facility', client_uid: 'client-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'facility-123' } },
            retryCount: 0,
            dependencies: []
          }]
        } as any)
        .mockResolvedValueOnce({
          executionId: 'exec-123',
          results: [{
            stepIndex: 1,
            tool: 'mcp_waste-management_shipments_create',
            params: { uid: 'ship-123', client_uid: 'client-123' },
            status: StepStatus.FAILED,
            error: 'Shipment creation failed',
            retryCount: 3,
            dependencies: [0]
          }]
        } as any);
      
      MockedExecutionStorage.updateExecutionProgress.mockResolvedValue({
        executionId: 'exec-123',
        completedSteps: 1,
        failedSteps: 1
      } as any);
      
      // Mock rollback execution
      MockedExecutionStorage.updateExecutionStatus.mockResolvedValue({
        executionId: 'exec-123',
        status: ExecutionStatus.ROLLED_BACK
      } as any);
      
      MockedExecutionStorage.getExecutionById.mockResolvedValue({
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        status: ExecutionStatus.ROLLED_BACK,
        totalSteps: 2,
        completedSteps: 1,
        failedSteps: 1,
        results: [
          {
            stepIndex: 0,
            tool: 'mcp_waste-management_facilities_create',
            params: { uid: 'facility-123', name: 'Test Facility', client_uid: 'client-123' },
            status: StepStatus.COMPLETED,
            result: { success: true, data: { uid: 'facility-123' } },
            retryCount: 0,
            dependencies: []
          },
          {
            stepIndex: 1,
            tool: 'mcp_waste-management_shipments_create',
            params: { uid: 'ship-123', client_uid: 'client-123' },
            status: StepStatus.FAILED,
            error: 'Shipment creation failed',
            retryCount: 3,
            dependencies: [0]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      
      // Mock tool executions
      MockedToolAdapter.executeTool
        .mockResolvedValueOnce({
          success: true,
          data: { uid: 'facility-123' }
        })
        .mockRejectedValue(new Error('Shipment creation failed'))
        .mockResolvedValueOnce({
          success: true,
          data: { deleted: true }
        }); // Rollback delete
      
      const result = await executionAgent.executePlan('plan-123', {
        enableRollback: true,
        continueOnError: false
      });
      
      expect(result.status).toBe(ExecutionStatus.ROLLED_BACK);
      expect(result.completedSteps).toBe(1);
      expect(result.failedSteps).toBe(1);
      
      // Verify rollback was executed (check if delete was called)
      const deleteCalls = MockedToolAdapter.executeTool.mock.calls.filter(call => 
        call[0] === 'mcp_waste-management_facilities_delete'
      );
      expect(deleteCalls.length).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle plan not found', async () => {
      MockedPlanStorage.getPlanByRequestId.mockResolvedValue(null);
      
      const result = await executionAgent.executePlan('nonexistent-plan');
      
      // The execution should fail because plan is not found
      expect(result.status).toBe(ExecutionStatus.FAILED);
      expect(result.error).toContain('Plan not found');
    });
    
    it('should handle storage errors gracefully', async () => {
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
      MockedExecutionStorage.saveExecution.mockRejectedValue(new Error('Database error'));
      
      const result = await executionAgent.executePlan('plan-123');
      
      expect(result.status).toBe(ExecutionStatus.FAILED);
      expect(result.error).toContain('Database error');
    });
  });
  
  describe('Configuration', () => {
    it('should use custom configuration', async () => {
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
      
      MockedToolAdapter.executeTool.mockResolvedValue({
        success: true,
        data: []
      });
      
      const customConfig = {
        maxRetries: 5,
        retryDelayMs: 2000,
        enableRollback: false,
        continueOnError: true,
        parallelExecutionLimit: 10
      };
      
      const result = await executionAgent.executePlan('plan-123', customConfig);
      
      expect(result.status).toBe(ExecutionStatus.COMPLETED);
      // The custom config should be used internally by the execution agent
    });
  });
});
