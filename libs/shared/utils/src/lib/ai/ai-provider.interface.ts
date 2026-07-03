import { GeminiModel } from '@workern/models';

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmResponse<T> {
  output: T;
  usage?: LlmUsage;
}

export interface LlmProvider {
  generateText(
    prompt: string,
    options?: {
      systemInstruction?: string;
      temperature?: number;
      images?: Array<{
        mimeType: string;
        base64Data: string;
      }>;
    }
  ): Promise<LlmResponse<string>>;

  generateStructuredOutput<T = any>(
    prompt: string,
    schema: any,
    options?: {
      systemInstruction?: string;
      temperature?: number;
      images?: Array<{
        mimeType: string;
        base64Data: string;
      }>;
    }
  ): Promise<LlmResponse<T>>;

  generateImage?(
    prompt: string,
    options?: {
      aspectRatio?: string;
      model?: GeminiModel | string;
    }
  ): Promise<Buffer>;
}
