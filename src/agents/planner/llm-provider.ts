// LLM provider factory for the Planner Agent

import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
// import { BaseLanguageModel } from '@langchain/core/dist/language_models/base';
import { LLMConfig } from './types';
import { PlannerConfig } from './config';

export class LLMProviderFactory {
  private config: PlannerConfig;
  
  constructor(config: PlannerConfig) {
    this.config = config;
  }
  
  createProvider(providerName?: string): any {
    const provider = providerName || this.config.defaultProvider;
    const llmConfig = this.config.providers[provider as keyof typeof this.config.providers];
    
    if (!llmConfig) {
      throw new Error(`Unknown LLM provider: ${provider}`);
    }
    
    switch (provider) {
      case 'openai':
        return this.createOpenAIProvider(llmConfig);
      case 'groq':
        return this.createGroqProvider(llmConfig);
      case 'ollama':
        return this.createOllamaProvider(llmConfig);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
  
  private createOpenAIProvider(config: LLMConfig): any {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    return new ChatOpenAI({
      modelName: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      openAIApiKey: config.apiKey,
    });
  }
  
  private createGroqProvider(config: LLMConfig): any {
    if (!config.apiKey) {
      throw new Error('Groq API key is required');
    }
    
    return new ChatGroq({
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      apiKey: config.apiKey,
    });
  }
  
  private createOllamaProvider(config: LLMConfig): any {
    // For Ollama, we'll use a generic approach since @langchain/ollama might not be available
    // This is a simplified implementation - in production, you'd want to use the proper Ollama integration
    throw new Error('Ollama provider not implemented yet. Please use OpenAI or Groq.');
  }
  
  async createWithFallback(primaryProvider?: string): Promise<any> {
    const providers = [primaryProvider || this.config.defaultProvider, 'groq', 'openai'];
    
    for (const provider of providers) {
      try {
        const llm = this.createProvider(provider);
        // Test the provider with a simple call
        await llm.invoke('test');
        return llm;
      } catch (error) {
        console.warn(`Failed to initialize ${provider}:`, error);
        if (!this.config.enableFallback) {
          throw error;
        }
      }
    }
    
    throw new Error('All LLM providers failed to initialize');
  }
}