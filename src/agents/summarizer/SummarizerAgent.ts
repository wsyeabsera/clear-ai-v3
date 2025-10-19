// Summarizer Agent for generating human-readable summaries

import { randomUUID } from 'crypto';
import { SummaryResult, SummaryFormat, SummaryContext, StructuredSummary } from './types';
import { ExecutionStorage } from '../executor/storage';
import { PlanStorage } from '../planner/storage';
import { AnalyzerStorage } from '../analyzer/storage';
import { SummarizerStorage } from './storage';
import OpenAI from 'openai';

export class SummarizerAgent {
  private summarizerStorage: SummarizerStorage;
  private openai: OpenAI;

  constructor() {
    this.summarizerStorage = new SummarizerStorage();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
  }

  async summarize(executionId: string, format: SummaryFormat = SummaryFormat.STRUCTURED): Promise<SummaryResult> {
    try {
      // Fetch execution data
      const execution = await ExecutionStorage.getExecutionById(executionId);
      if (!execution) {
        throw new Error('Execution not found');
      }

      // Fetch plan data
      const plan = await PlanStorage.getPlanByRequestId(execution.planRequestId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Optionally fetch analysis
      const analysis = await AnalyzerStorage.getAnalysisByExecutionId(executionId);

      // Build summary context
      const context: SummaryContext = {
        execution_id: executionId,
        plan_request_id: execution.planRequestId,
        user_query: plan.query,
        plan: plan.plan,
        execution_results: execution.results,
        execution_status: execution.status,
        execution_time_ms: execution.completedAt && execution.startedAt 
          ? execution.completedAt.getTime() - execution.startedAt.getTime()
          : 0,
        analysis_result: analysis || undefined,
        started_at: execution.startedAt,
        completed_at: execution.completedAt
      };

      // Generate summary based on format
      let content: string;
      let structured_data: StructuredSummary | undefined;

      if (format === SummaryFormat.STRUCTURED) {
        structured_data = this.generateStructuredSummary(context);
        content = this.formatStructuredSummary(structured_data);
      } else {
        content = await this.generateLLMSummary(context, format);
      }

      // Create summary result
      const summaryResult: SummaryResult = {
        summary_id: randomUUID(),
        execution_id: executionId,
        plan_request_id: execution.planRequestId,
        format,
        content,
        structured_data
      };

      // Store summary in MongoDB
      await SummarizerStorage.saveSummary(summaryResult);

      return summaryResult;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Summary generation failed: ${error.message}`);
      }
      throw new Error('Summary generation failed: Unknown error');
    }
  }

  generateStructuredSummary(context: SummaryContext): StructuredSummary {
    const { user_query, execution_results, execution_status, execution_time_ms, analysis_result } = context;
    
    const success = execution_status === 'COMPLETED';
    const steps_executed = execution_results.length;
    
    // Extract key results from successful steps
    const key_results = execution_results
      .filter(result => result.status === 'COMPLETED' && result.result)
      .map(result => ({
        step: result.stepIndex,
        tool: result.tool,
        result: result.result
      }));

    // Extract errors from failed steps
    const errors = execution_results
      .filter(result => result.status === 'FAILED' && result.error)
      .map(result => `Step ${result.stepIndex}: ${result.error}`);

    // Generate answer based on success and results
    let answer: string;
    if (success) {
      answer = `Successfully completed ${steps_executed} steps. ${key_results.length} operations completed successfully.`;
    } else {
      answer = `Execution failed after ${steps_executed} steps. ${errors.length} errors occurred.`;
    }

    // Add analysis recommendations if available
    const recommendations = analysis_result?.recommendations || [];

    return {
      user_query,
      answer,
      steps_executed,
      success,
      key_results,
      errors: errors.length > 0 ? errors : undefined,
      execution_time_ms,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  }

  private formatStructuredSummary(structured: StructuredSummary): string {
    let content = `# Execution Summary\n\n`;
    content += `**Query:** ${structured.user_query}\n\n`;
    content += `**Answer:** ${structured.answer}\n\n`;
    content += `**Status:** ${structured.success ? '✅ Success' : '❌ Failed'}\n\n`;
    content += `**Steps Executed:** ${structured.steps_executed}\n\n`;
    content += `**Execution Time:** ${structured.execution_time_ms}ms\n\n`;

    if (structured.key_results && structured.key_results.length > 0) {
      content += `## Key Results\n\n`;
      structured.key_results.forEach((result, index) => {
        content += `${index + 1}. **${result.tool}**: ${JSON.stringify(result.result)}\n`;
      });
      content += `\n`;
    }

    if (structured.errors && structured.errors.length > 0) {
      content += `## Errors\n\n`;
      structured.errors.forEach((error, index) => {
        content += `${index + 1}. ${error}\n`;
      });
      content += `\n`;
    }

    if (structured.recommendations && structured.recommendations.length > 0) {
      content += `## Recommendations\n\n`;
      structured.recommendations.forEach((rec, index) => {
        content += `${index + 1}. ${rec}\n`;
      });
    }

    return content;
  }

  private async generateLLMSummary(context: SummaryContext, format: SummaryFormat): Promise<string> {
    try {
      const prompt = this.buildSummaryPrompt(context, format);
      
      const response = await this.openai.chat.completions.create({
        model: process.env.SUMMARIZER_LLM_MODEL || 'gpt-4o-mini',
        temperature: parseFloat(process.env.SUMMARIZER_TEMPERATURE || '0.7'),
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(format)
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from LLM');
      }

      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`LLM summary generation failed: ${error.message}`);
      }
      throw new Error('LLM summary generation failed: Unknown error');
    }
  }

  private buildSummaryPrompt(context: SummaryContext, format: SummaryFormat): string {
    const { user_query, execution_results, execution_status, execution_time_ms, analysis_result } = context;
    
    let prompt = `Generate a summary for this execution:\n\n`;
    prompt += `Query: "${user_query}"\n`;
    prompt += `Status: ${execution_status}\n`;
    prompt += `Execution Time: ${execution_time_ms}ms\n`;
    prompt += `Steps: ${execution_results.length}\n\n`;

    prompt += `Step Details:\n`;
    execution_results.forEach((result, index) => {
      prompt += `${index + 1}. ${result.tool}: ${result.status}`;
      if (result.error) {
        prompt += ` (Error: ${result.error})`;
      }
      if (result.result) {
        prompt += ` - Result: ${JSON.stringify(result.result)}`;
      }
      prompt += `\n`;
    });

    if (analysis_result) {
      prompt += `\nAnalysis:\n`;
      prompt += `Feedback: ${analysis_result.feedback}\n`;
      prompt += `Success Rate: ${analysis_result.evaluation_metrics.success_rate}\n`;
      if (analysis_result.recommendations.length > 0) {
        prompt += `Recommendations: ${analysis_result.recommendations.join(', ')}\n`;
      }
    }

    return prompt;
  }

  private getSystemPrompt(format: SummaryFormat): string {
    switch (format) {
      case SummaryFormat.JSON:
        return 'You are a technical summarizer. Generate a clear, concise JSON summary of the execution results. Focus on key data points and outcomes.';
      case SummaryFormat.MARKDOWN:
        return 'You are a technical writer. Generate a well-structured markdown summary of the execution results. Use headers, lists, and formatting for clarity.';
      case SummaryFormat.PLAIN_TEXT:
        return 'You are a technical communicator. Generate a clear, concise plain text summary of the execution results. Focus on what happened and the outcomes.';
      default:
        return 'You are a technical summarizer. Generate a clear, concise summary of the execution results.';
    }
  }
}
