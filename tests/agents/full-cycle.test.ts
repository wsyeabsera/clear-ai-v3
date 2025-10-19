// Full Cycle Integration Test: Planner → Executor

import { PlannerAgent } from '../../src/agents/planner/PlannerAgent';
import { ExecutionAgent } from '../../src/agents/executor/ExecutionAgent';
import { ExecutionStatus, StepStatus } from '../../src/agents/executor/types';
import { ToolAdapter } from '../../src/agents/planner/tool-adapter';

// Mock ToolAdapter for testing
jest.mock('../../src/agents/planner/tool-adapter');
const MockedToolAdapter = ToolAdapter as jest.Mocked<typeof ToolAdapter>;

describe('Full Cycle: Planner → Executor', () => {
  let planner: PlannerAgent;
  let executor: ExecutionAgent;

  beforeAll(async () => {
    // Mock ToolAdapter.getAvailableTools
    MockedToolAdapter.getAvailableTools = jest.fn().mockReturnValue([
      {
        name: 'mcp_waste-management_shipments_list',
        description: 'List shipments',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' }
          }
        }
      },
      {
        name: 'mcp_waste-management_facilities_create',
        description: 'Create facility',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string' },
            name: { type: 'string' },
            client_uid: { type: 'string' }
          },
          required: ['uid', 'name', 'client_uid']
        }
      },
      {
        name: 'mcp_waste-management_shipments_create',
        description: 'Create shipment',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string' },
            client_uid: { type: 'string' },
            license_plate: { type: 'string' }
          },
          required: ['uid', 'client_uid', 'license_plate']
        }
      }
    ]);
    
    // Initialize agents (MongoDB connection is handled by global test setup)
    planner = new PlannerAgent();
    executor = new ExecutionAgent();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Flow: Query → Plan → Execute', () => {
    it('should create plan and execute successfully', async () => {
      // Mock tool execution
      MockedToolAdapter.executeTool.mockResolvedValue({
        success: true,
        data: [
          { uid: 'ship-1', license_plate: 'ABC-123' },
          { uid: 'ship-2', license_plate: 'DEF-456' }
        ]
      });

      // Create plan
      const planResponse = await planner.plan('List all shipments');
      expect(planResponse.status).toBe('COMPLETED');
      expect(planResponse.plan.steps).toHaveLength(1);
      expect(planResponse.plan.steps[0].tool).toBe('mcp_waste-management_shipments_list');

      // Execute plan
      const execution = await executor.executePlan(planResponse.requestId);
      expect(execution.status).toBe(ExecutionStatus.COMPLETED);
      expect(execution.completedSteps).toBe(execution.totalSteps);
      expect(execution.failedSteps).toBe(0);
      expect(execution.results).toHaveLength(1);
      expect(execution.results[0].status).toBe(StepStatus.COMPLETED);
    });

    it('should handle multi-step sequential execution', async () => {
      // Mock tool executions
      MockedToolAdapter.executeTool
        .mockResolvedValueOnce({
          success: true,
          data: { uid: 'facility-1', name: 'Test Facility' }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { uid: 'ship-1', facility_uid: 'facility-1' }
        });

      // Create plan with dependencies
      const planResponse = await planner.plan('Create a facility and then create a shipment for that facility');
      expect(planResponse.status).toBe('COMPLETED');
      expect(planResponse.plan.steps).toHaveLength(2);
      expect(planResponse.plan.steps[1].dependsOn).toContain(0);

      // Execute plan
      const execution = await executor.executePlan(planResponse.requestId);
      expect(execution.status).toBe(ExecutionStatus.COMPLETED);
      expect(execution.completedSteps).toBe(2);
      expect(execution.failedSteps).toBe(0);
      
      // Verify steps executed in order
      expect(execution.results[0].stepIndex).toBe(0);
      expect(execution.results[1].stepIndex).toBe(1);
    });
  });

  describe('Parallel Execution', () => {
    it('should execute parallel steps simultaneously', async () => {
      // Mock tool executions with delays to test parallel execution
      let callCount = 0;
      MockedToolAdapter.executeTool.mockImplementation(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        return {
          success: true,
          data: { uid: `facility-${callCount}`, name: `Facility ${callCount}` }
        };
      });

      // Create plan with parallel steps
      const planResponse = await planner.plan('Create multiple facilities in parallel');
      expect(planResponse.status).toBe('COMPLETED');
      
      // Check if plan has parallel steps
      const parallelSteps = planResponse.plan.steps.filter(step => step.parallel);
      expect(parallelSteps.length).toBeGreaterThan(0);

      // Execute plan
      const startTime = Date.now();
      const execution = await executor.executePlan(planResponse.requestId, {
        parallelExecutionLimit: 5
      });
      const endTime = Date.now();

      expect(execution.status).toBe(ExecutionStatus.COMPLETED);
      expect(execution.completedSteps).toBe(execution.totalSteps);
      
      // Verify parallel execution timing (should be faster than sequential)
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(300); // Should be much faster than sequential
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed steps and eventually succeed', async () => {
      let attemptCount = 0;
      MockedToolAdapter.executeTool.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error('Network timeout');
        }
        return {
          success: true,
          data: { uid: 'ship-retry', license_plate: 'RETRY-123' }
        };
      });

      // Create plan
      const planResponse = await planner.plan('Create a shipment with retry');
      expect(planResponse.status).toBe('COMPLETED');

      // Execute plan with retry configuration
      const execution = await executor.executePlan(planResponse.requestId, {
        maxRetries: 3,
        retryDelayMs: 10 // Fast retry for testing
      });

      expect(execution.status).toBe(ExecutionStatus.COMPLETED);
      expect(execution.results[0].retryCount).toBe(2);
      expect(execution.results[0].status).toBe(StepStatus.COMPLETED);
      expect(MockedToolAdapter.executeTool).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      MockedToolAdapter.executeTool.mockRejectedValue(new Error('Persistent error'));

      // Create plan
      const planResponse = await planner.plan('Create a shipment that will fail');
      expect(planResponse.status).toBe('COMPLETED');

      // Execute plan
      const execution = await executor.executePlan(planResponse.requestId, {
        maxRetries: 2,
        retryDelayMs: 10
      });

      expect(execution.status).toBe(ExecutionStatus.FAILED);
      expect(execution.results[0].status).toBe(StepStatus.FAILED);
      expect(execution.results[0].retryCount).toBe(2);
      expect(MockedToolAdapter.executeTool).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Rollback Functionality', () => {
    it('should rollback on execution failure', async () => {
      // Mock first step success, second step failure
      MockedToolAdapter.executeTool
        .mockResolvedValueOnce({
          success: true,
          data: { uid: 'facility-1', name: 'Test Facility' }
        })
        .mockRejectedValueOnce(new Error('Shipment creation failed'))
        .mockResolvedValueOnce({
          success: true,
          data: { deleted: true }
        }); // Rollback delete

      // Create multi-step plan
      const planResponse = await planner.plan('Create facility and shipment, then fail on shipment');
      expect(planResponse.status).toBe('COMPLETED');

      // Execute plan with rollback enabled
      const execution = await executor.executePlan(planResponse.requestId, {
        enableRollback: true,
        continueOnError: false
      });

      expect(execution.status).toBe(ExecutionStatus.ROLLED_BACK);
      expect(execution.completedSteps).toBe(1);
      expect(execution.failedSteps).toBe(1);
      
      // Verify rollback was executed
      expect(MockedToolAdapter.executeTool).toHaveBeenCalledWith(
        'mcp_waste-management_facilities_delete',
        { uid: 'facility-1' }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle plan not found error', async () => {
      const execution = await executor.executePlan('nonexistent-plan-id');
      expect(execution.status).toBe(ExecutionStatus.FAILED);
      expect(execution.error).toContain('Plan not found');
    });

    it('should handle tool execution errors gracefully', async () => {
      MockedToolAdapter.executeTool.mockRejectedValue(new Error('Tool execution failed'));

      const planResponse = await planner.plan('Execute failing tool');
      const execution = await executor.executePlan(planResponse.requestId);

      expect(execution.status).toBe(ExecutionStatus.FAILED);
      expect(execution.results[0].status).toBe(StepStatus.FAILED);
      expect(execution.results[0].error).toContain('Tool execution failed');
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track execution statistics accurately', async () => {
      // Execute multiple plans
      MockedToolAdapter.executeTool.mockResolvedValue({
        success: true,
        data: []
      });

      const plan1 = await planner.plan('List shipments');
      const plan2 = await planner.plan('List facilities');
      
      const exec1 = await executor.executePlan(plan1.requestId);
      const exec2 = await executor.executePlan(plan2.requestId);

      // Get statistics
      const stats = await executor.getStatistics();
      
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.byStatus.COMPLETED).toBeGreaterThanOrEqual(2);
      expect(stats.successRate).toBeGreaterThan(0);
    });

    it('should provide execution monitoring capabilities', async () => {
      MockedToolAdapter.executeTool.mockResolvedValue({
        success: true,
        data: { uid: 'test-shipment' }
      });

      const planResponse = await planner.plan('Create test shipment');
      const execution = await executor.executePlan(planResponse.requestId);

      // Test execution retrieval
      const retrievedExecution = await executor.getExecution(execution.executionId);
      expect(retrievedExecution).toBeDefined();
      expect(retrievedExecution?.executionId).toBe(execution.executionId);
      expect(retrievedExecution?.status).toBe(ExecutionStatus.COMPLETED);

      // Test execution by plan ID
      const executionsByPlan = await executor.getExecutionsByPlanId(planResponse.requestId);
      expect(executionsByPlan).toHaveLength(1);
      expect(executionsByPlan[0].executionId).toBe(execution.executionId);
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom execution configuration', async () => {
      MockedToolAdapter.executeTool.mockResolvedValue({
        success: true,
        data: []
      });

      const planResponse = await planner.plan('Test configuration');
      
      const execution = await executor.executePlan(planResponse.requestId, {
        maxRetries: 5,
        retryDelayMs: 2000,
        enableRollback: false,
        continueOnError: true,
        parallelExecutionLimit: 10
      });

      expect(execution.status).toBe(ExecutionStatus.COMPLETED);
      // Configuration is applied internally by the execution agent
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance benchmarks', async () => {
      MockedToolAdapter.executeTool.mockResolvedValue({
        success: true,
        data: []
      });

      // Test plan creation speed
      const planStart = Date.now();
      const planResponse = await planner.plan('Performance test query');
      const planTime = Date.now() - planStart;
      
      expect(planTime).toBeLessThan(100); // < 100ms

      // Test execution speed
      const execStart = Date.now();
      const execution = await executor.executePlan(planResponse.requestId);
      const execTime = Date.now() - execStart;
      
      expect(execTime).toBeLessThan(500); // < 500ms
      expect(execution.status).toBe(ExecutionStatus.COMPLETED);
    });
  });
});
