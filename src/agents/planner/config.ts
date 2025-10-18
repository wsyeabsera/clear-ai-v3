// LLM provider configuration for the Planner Agent

import { LLMConfig } from './types';

export interface PlannerConfig {
  defaultProvider: 'openai' | 'groq' | 'ollama';
  providers: {
    openai: LLMConfig;
    groq: LLMConfig;
    ollama: LLMConfig;
  };
  maxRefinements: number;
  timeoutMs: number;
  enableFallback: boolean;
}

export const getPlannerConfig = (): PlannerConfig => {
  const defaultProvider = (process.env.DEFAULT_LLM_PROVIDER as 'openai' | 'groq' | 'ollama') || 'openai';
  
  return {
    defaultProvider,
    providers: {
      openai: {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        apiKey: process.env.OPENAI_API_KEY,
      },
      groq: {
        provider: 'groq',
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.3'),
        maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '4000'),
        apiKey: process.env.GROQ_API_KEY,
      },
      ollama: {
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL || 'mistral:latest',
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.3'),
        maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '4000'),
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      },
    },
    maxRefinements: parseInt(process.env.MAX_PLAN_REFINEMENTS || '3'),
    timeoutMs: parseInt(process.env.PLANNER_TIMEOUT_MS || '30000'),
    enableFallback: process.env.ENABLE_LLM_FALLBACK === 'true',
  };
};

export const validateConfig = (config: PlannerConfig): string[] => {
  const errors: string[] = [];
  
  // Validate OpenAI config
  if (config.providers.openai.apiKey && !config.providers.openai.apiKey.trim()) {
    errors.push('OPENAI_API_KEY is empty');
  }
  
  // Validate Groq config
  if (config.providers.groq.apiKey && !config.providers.groq.apiKey.trim()) {
    errors.push('GROQ_API_KEY is empty');
  }
  
  // Validate temperature ranges
  Object.entries(config.providers).forEach(([provider, llmConfig]) => {
    if (llmConfig.temperature < 0 || llmConfig.temperature > 2) {
      errors.push(`${provider} temperature must be between 0 and 2`);
    }
  });
  
  // Validate max refinements
  if (config.maxRefinements < 0 || config.maxRefinements > 10) {
    errors.push('maxRefinements must be between 0 and 10');
  }
  
  return errors;
};
