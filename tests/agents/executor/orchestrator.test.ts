// Unit tests for ExecutionOrchestrator

import { ExecutionOrchestrator } from '../../../src/agents/executor/orchestrator';
import { PlanStep } from '../../../src/agents/planner/types';
import { ExecutionStepResult, StepStatus, ExecutionContext } from '../../../src/agents/executor/types';

describe('ExecutionOrchestrator', () => {
  let orchestrator: ExecutionOrchestrator;
  
  beforeEach(() => {
    orchestrator = new ExecutionOrchestrator();
  });
  
  describe('buildDependencyGraph', () => {
    it('should build dependency graph from plan steps', () => {
      const steps: PlanStep[] = [
        { tool: 'tool1', params: {}, dependsOn: [], parallel: false },
        { tool: 'tool2', params: {}, dependsOn: [0], parallel: false },
        { tool: 'tool3', params: {}, dependsOn: [0], parallel: true },
        { tool: 'tool4', params: {}, dependsOn: [1, 2], parallel: false }
      ];
      
      const graph = orchestrator.buildDependencyGraph(steps);
      
      expect(graph[0]).toEqual([]);
      expect(graph[1]).toEqual([0]);
      expect(graph[2]).toEqual([0]);
      expect(graph[3]).toEqual([1, 2]);
    });
    
    it('should handle steps with no dependencies', () => {
      const steps: PlanStep[] = [
        { tool: 'tool1', params: {}, dependsOn: [], parallel: false },
        { tool: 'tool2', params: {}, dependsOn: [], parallel: false }
      ];
      
      const graph = orchestrator.buildDependencyGraph(steps);
      
      expect(graph[0]).toEqual([]);
      expect(graph[1]).toEqual([]);
    });
  });
  
  describe('getReadySteps', () => {
    it('should return steps with satisfied dependencies', () => {
      const steps: PlanStep[] = [
        { tool: 'tool1', params: {}, dependsOn: [], parallel: false },
        { tool: 'tool2', params: {}, dependsOn: [0], parallel: false },
        { tool: 'tool3', params: {}, dependsOn: [1], parallel: false }
      ];
      
      const stepResults: ExecutionStepResult[] = [
        {
          stepIndex: 0,
          tool: 'tool1',
          params: {},
          status: StepStatus.COMPLETED,
          retryCount: 0,
          dependencies: []
        },
        {
          stepIndex: 1,
          tool: 'tool2',
          params: {},
          status: StepStatus.PENDING,
          retryCount: 0,
          dependencies: [0]
        },
        {
          stepIndex: 2,
          tool: 'tool3',
          params: {},
          status: StepStatus.PENDING,
          retryCount: 0,
          dependencies: [1]
        }
      ];
      
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: { 0: [], 1: [0], 2: [1] },
        completedSteps: new Set([0]),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const readySteps = orchestrator.getReadySteps(steps, stepResults, context);
      
      expect(readySteps).toEqual([1]); // Only step 1 is ready (depends on completed step 0)
    });
    
    it('should not return already completed or running steps', () => {
      const steps: PlanStep[] = [
        { tool: 'tool1', params: {}, dependsOn: [], parallel: false },
        { tool: 'tool2', params: {}, dependsOn: [0], parallel: false }
      ];
      
      const stepResults: ExecutionStepResult[] = [
        {
          stepIndex: 0,
          tool: 'tool1',
          params: {},
          status: StepStatus.COMPLETED,
          retryCount: 0,
          dependencies: []
        },
        {
          stepIndex: 1,
          tool: 'tool2',
          params: {},
          status: StepStatus.RUNNING,
          retryCount: 0,
          dependencies: [0]
        }
      ];
      
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: { 0: [], 1: [0] },
        completedSteps: new Set([0]),
        failedSteps: new Set(),
        runningSteps: new Set([1])
      };
      
      const readySteps = orchestrator.getReadySteps(steps, stepResults, context);
      
      expect(readySteps).toEqual([]); // No ready steps (step 1 is running)
    });
  });
  
  describe('areDependenciesSatisfied', () => {
    it('should return true when all dependencies are completed', () => {
      const stepResults: ExecutionStepResult[] = [
        {
          stepIndex: 0,
          tool: 'tool1',
          params: {},
          status: StepStatus.COMPLETED,
          retryCount: 0,
          dependencies: []
        },
        {
          stepIndex: 1,
          tool: 'tool2',
          params: {},
          status: StepStatus.PENDING,
          retryCount: 0,
          dependencies: [0]
        }
      ];
      
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: { 0: [], 1: [0] },
        completedSteps: new Set([0]),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const satisfied = orchestrator.areDependenciesSatisfied(1, stepResults, context);
      
      expect(satisfied).toBe(true);
    });
    
    it('should return false when dependencies are not completed', () => {
      const stepResults: ExecutionStepResult[] = [
        {
          stepIndex: 0,
          tool: 'tool1',
          params: {},
          status: StepStatus.PENDING,
          retryCount: 0,
          dependencies: []
        },
        {
          stepIndex: 1,
          tool: 'tool2',
          params: {},
          status: StepStatus.PENDING,
          retryCount: 0,
          dependencies: [0]
        }
      ];
      
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: { 0: [], 1: [0] },
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const satisfied = orchestrator.areDependenciesSatisfied(1, stepResults, context);
      
      expect(satisfied).toBe(false);
    });
  });
  
  describe('getParallelSteps', () => {
    it('should return parallel steps within limit', () => {
      const steps: PlanStep[] = [
        { tool: 'tool1', params: {}, dependsOn: [], parallel: true },
        { tool: 'tool2', params: {}, dependsOn: [], parallel: true },
        { tool: 'tool3', params: {}, dependsOn: [], parallel: false }
      ];
      
      const readySteps = [0, 1, 2];
      
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 2
        },
        dependencyGraph: { 0: [], 1: [], 2: [] },
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const parallelSteps = orchestrator.getParallelSteps(readySteps, steps, context);
      
      expect(parallelSteps).toEqual([0, 1]); // Only first 2 parallel steps within limit
    });
    
    it('should not return parallel steps when limit reached', () => {
      const steps: PlanStep[] = [
        { tool: 'tool1', params: {}, dependsOn: [], parallel: true }
      ];
      
      const readySteps = [0];
      
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 1
        },
        dependencyGraph: { 0: [] },
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set([0]) // Already running
      };
      
      const parallelSteps = orchestrator.getParallelSteps(readySteps, steps, context);
      
      expect(parallelSteps).toEqual([]); // No parallel steps when limit reached
    });
  });
  
  describe('getSequentialSteps', () => {
    it('should return non-parallel steps', () => {
      const steps: PlanStep[] = [
        { tool: 'tool1', params: {}, dependsOn: [], parallel: true },
        { tool: 'tool2', params: {}, dependsOn: [], parallel: false },
        { tool: 'tool3', params: {}, dependsOn: [], parallel: true }
      ];
      
      const readySteps = [0, 1, 2];
      
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: { 0: [], 1: [], 2: [] },
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const sequentialSteps = orchestrator.getSequentialSteps(readySteps, steps, context);
      
      expect(sequentialSteps).toEqual([1]); // Only non-parallel step
    });
  });
  
  describe('sortStepsByPriority', () => {
    it('should sort by dependency count first, then by index', () => {
      const steps: PlanStep[] = [
        { tool: 'tool1', params: {}, dependsOn: [2], parallel: false }, // 1 dependency
        { tool: 'tool2', params: {}, dependsOn: [], parallel: false },  // 0 dependencies
        { tool: 'tool3', params: {}, dependsOn: [], parallel: false },  // 0 dependencies
        { tool: 'tool4', params: {}, dependsOn: [1, 2], parallel: false } // 2 dependencies
      ];
      
      const stepIndices = [0, 1, 2, 3];
      
      const sorted = orchestrator.sortStepsByPriority(stepIndices, steps);
      
      expect(sorted).toEqual([1, 2, 0, 3]); // 0 deps first (1,2), then 1 dep (0), then 2 deps (3)
    });
  });
  
  describe('isExecutionComplete', () => {
    it('should return true when all steps completed or failed', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: {},
        completedSteps: new Set([0, 1]),
        failedSteps: new Set([2]),
        runningSteps: new Set()
      };
      
      const isComplete = orchestrator.isExecutionComplete(3, context);
      
      expect(isComplete).toBe(true);
    });
    
    it('should return false when steps still pending', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: {},
        completedSteps: new Set([0]),
        failedSteps: new Set(),
        runningSteps: new Set([1])
      };
      
      const isComplete = orchestrator.isExecutionComplete(3, context);
      
      expect(isComplete).toBe(false);
    });
  });
  
  describe('shouldContinueOnError', () => {
    it('should return false when continueOnError is disabled', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: {},
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const shouldContinue = orchestrator.shouldContinueOnError(context, 0);
      
      expect(shouldContinue).toBe(false);
    });
    
    it('should return true when continueOnError is enabled and no dependents', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: true,
          parallelExecutionLimit: 5
        },
        dependencyGraph: { 0: [], 1: [0] },
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const shouldContinue = orchestrator.shouldContinueOnError(context, 1);
      
      expect(shouldContinue).toBe(true);
    });
  });
  
  describe('calculateProgress', () => {
    it('should calculate progress percentage', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: {},
        completedSteps: new Set([0, 1]),
        failedSteps: new Set([2]),
        runningSteps: new Set()
      };
      
      const progress = orchestrator.calculateProgress(5, context);
      
      expect(progress).toBe(60); // 3 out of 5 steps completed/failed
    });
    
    it('should return 100 for zero total steps', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: {},
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const progress = orchestrator.calculateProgress(0, context);
      
      expect(progress).toBe(100);
    });
  });
  
  describe('getExecutionSummary', () => {
    it('should return execution summary', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: {},
        completedSteps: new Set([0, 1]),
        failedSteps: new Set([2]),
        runningSteps: new Set([3])
      };
      
      const stepResults: ExecutionStepResult[] = [];
      
      const summary = orchestrator.getExecutionSummary(5, context, stepResults);
      
      expect(summary.totalSteps).toBe(5);
      expect(summary.completedSteps).toBe(2);
      expect(summary.failedSteps).toBe(1);
      expect(summary.runningSteps).toBe(1);
      expect(summary.pendingSteps).toBe(1);
      expect(summary.progress).toBe(60);
      expect(summary.isComplete).toBe(false);
    });
  });
  
  describe('validateContext', () => {
    it('should return empty array for valid context', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: {},
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const errors = orchestrator.validateContext(context);
      
      expect(errors).toEqual([]);
    });
    
    it('should return errors for invalid context', () => {
      const context: ExecutionContext = {
        executionId: '',
        planRequestId: '',
        config: {
          maxRetries: -1,
          retryDelayMs: -1,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 0
        },
        dependencyGraph: {},
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set()
      };
      
      const errors = orchestrator.validateContext(context);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Execution ID is required');
      expect(errors).toContain('Plan request ID is required');
      expect(errors).toContain('Max retries must be non-negative');
      expect(errors).toContain('Retry delay must be non-negative');
      expect(errors).toContain('Parallel execution limit must be at least 1');
    });
  });
  
  describe('createContext', () => {
    it('should create valid execution context', () => {
      const steps: PlanStep[] = [
        { tool: 'tool1', params: {}, dependsOn: [], parallel: false }
      ];
      
      const context = orchestrator.createContext('exec-123', 'plan-123', {
        maxRetries: 3,
        retryDelayMs: 1000,
        enableRollback: true,
        continueOnError: false,
        parallelExecutionLimit: 5
      }, steps);
      
      expect(context.executionId).toBe('exec-123');
      expect(context.planRequestId).toBe('plan-123');
      expect(context.config.maxRetries).toBe(3);
      expect(context.dependencyGraph[0]).toEqual([]);
      expect(context.completedSteps).toBeInstanceOf(Set);
      expect(context.failedSteps).toBeInstanceOf(Set);
      expect(context.runningSteps).toBeInstanceOf(Set);
    });
  });
  
  describe('updateContextAfterStep', () => {
    it('should update context after step completion', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: {},
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set([0])
      };
      
      orchestrator.updateContextAfterStep(context, 0, StepStatus.COMPLETED);
      
      expect(context.runningSteps.has(0)).toBe(false);
      expect(context.completedSteps.has(0)).toBe(true);
      expect(context.failedSteps.has(0)).toBe(false);
    });
    
    it('should update context after step failure', () => {
      const context: ExecutionContext = {
        executionId: 'exec-123',
        planRequestId: 'plan-123',
        config: {
          maxRetries: 3,
          retryDelayMs: 1000,
          enableRollback: true,
          continueOnError: false,
          parallelExecutionLimit: 5
        },
        dependencyGraph: {},
        completedSteps: new Set(),
        failedSteps: new Set(),
        runningSteps: new Set([0])
      };
      
      orchestrator.updateContextAfterStep(context, 0, StepStatus.FAILED);
      
      expect(context.runningSteps.has(0)).toBe(false);
      expect(context.completedSteps.has(0)).toBe(false);
      expect(context.failedSteps.has(0)).toBe(true);
    });
  });
});
