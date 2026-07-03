import { LlmProvider } from './ai-provider.interface';
import { GeminiLlmProvider } from './gemini-provider';
import { OpenAiLlmProvider } from './openai-provider';

export * from './ai-provider.interface';
export * from './gemini-provider';
export * from './openai-provider';

export function createLlmProvider(
  providerType: 'gemini' | 'openai',
  apiKey: string,
  model?: string
): LlmProvider {
  if (providerType === 'gemini') {
    return new GeminiLlmProvider(apiKey, model ?? 'gemini-2.5-flash');
  } else {
    return new OpenAiLlmProvider(apiKey, model ?? 'gpt-4o-mini');
  }
}
