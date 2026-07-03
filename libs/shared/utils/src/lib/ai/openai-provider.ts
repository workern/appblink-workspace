import { OpenAI } from 'openai';
import { LlmProvider, LlmResponse } from './ai-provider.interface';

export class OpenAiLlmProvider implements LlmProvider {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateText(
    prompt: string,
    options?: {
      systemInstruction?: string;
      temperature?: number;
    }
  ): Promise<LlmResponse<string>> {
    const messages: any[] = [];
    if (options?.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.7
    });

    const usage = response.usage as any;
    return {
      output: response.choices[0]?.message?.content?.trim() ?? '',
      usage: usage ? {
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
        totalTokens: usage.total_tokens ?? 0
      } : undefined
    };
  }

  async generateStructuredOutput<T = any>(
    prompt: string,
    schema: any,
    options?: {
      systemInstruction?: string;
      temperature?: number;
    }
  ): Promise<LlmResponse<T>> {
    // @ts-ignore
    const { zodTextFormat } = await import('openai/helpers/zod');
    const messages: any[] = [];
    if (options?.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.responses.parse({
      model: this.model,
      input: messages,
      temperature: options?.temperature ?? 0.7,
      text: {
        format: zodTextFormat(schema, 'response')
      }
    });

    const usage = response.usage as any;
    return {
      output: response.output_parsed as T,
      usage: usage ? {
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
        totalTokens: usage.total_tokens ?? 0
      } : undefined
    };
  }
}
