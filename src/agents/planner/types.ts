// TypeScript interfaces for the Planner Agent

export interface PlannerState {
  // Core planning data
  query: string;
  requestId: string;
  tools: MCPTool[];
  selectedTools: string[];
  plan: Plan;
  validationErrors: string[];
  refinementCount: number;
  
  // LLM provider info
  llmProvider: string;
  
  // Metadata
  createdAt: Date;
  executionTimeMs?: number;
}

export interface PlanStep {
  tool: string;
  params: Record<string, any>;
  dependsOn: number[];
  parallel: boolean;
  description?: string;
}

export interface Plan {
  steps: PlanStep[];
  metadata: {
    query: string;
    requestId: string;
    estimatedDurationMs?: number;
    totalSteps: number;
    parallelSteps: number;
  };
}

export interface PlanRequest {
  query: string;
  requestId: string;
  llmProvider?: string;
}

export interface PlanResponse {
  requestId: string;
  query: string;
  plan: Plan;
  status: PlanStatus;
  createdAt: string;
  executionTimeMs?: number;
  validationErrors: string[];
}

export enum PlanStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LLMConfig {
  provider: 'openai' | 'groq' | 'ollama';
  model: string;
  temperature: number;
  maxTokens?: number;
  apiKey?: string;
  baseURL?: string;
}

export interface ToolSelectionResult {
  selectedTools: string[];
  reasoning: string;
  confidence: number;
}

export interface PlanGenerationResult {
  plan: Plan;
  reasoning: string;
  confidence: number;
}

// LLM-powered planning types
export interface LLMToolSelectionRequest {
  query: string;
  availableTools: MCPTool[];
  analysisFeedback?: string;
}

export interface LLMToolSelectionResponse {
  tools: string[];
  reasoning: string;
  entities: string[];
  confidence: number;
}

export interface LLMPlanGenerationRequest {
  query: string;
  selectedTools: string[];
  toolSchemas: Record<string, any>;
  entities: string[];
  requestId: string;
  analysisFeedback?: string;
}

export interface LLMPlanGenerationResponse {
  plan: Plan;
  reasoning: string;
  confidence: number;
}

export interface LLMPlanRefinementRequest {
  query: string;
  plan: Plan;
  validationErrors: string[];
  toolSchemas: Record<string, any>;
}

export interface LLMPlanRefinementResponse {
  plan: Plan;
  reasoning: string;
  confidence: number;
}

// Enhanced planning context
export interface PlanningContext {
  query: string;
  requestId: string;
  availableTools: MCPTool[];
  selectedTools: string[];
  entities: string[];
  toolSchemas: Record<string, any>;
  previousStepResults?: Array<{
    stepIndex: number;
    result: any;
  }>;
  refinementCount: number;
  maxRefinements: number;
}

// Parameter resolution types
export interface ParameterResolutionContext {
  query: string;
  toolName: string;
  requiredParams: string[];
  optionalParams: string[];
  previousStepResults?: Array<{ stepIndex: number; result: any }>;
}

export interface ResolvedParameters {
  [key: string]: any;
}

// OpenAI service configuration
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}
