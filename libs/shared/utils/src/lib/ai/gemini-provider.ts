import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { GeminiModel } from '@workern/models';
import { LlmProvider, LlmResponse } from './ai-provider.interface';

export class GeminiLlmProvider implements LlmProvider {
  private ai: GoogleGenAI;
  private model: GeminiModel | string;

  constructor(apiKey: string, model: GeminiModel | string = GeminiModel.GEMINI_2_5_FLASH) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateText(
    prompt: string,
    options?: {
      systemInstruction?: string;
      temperature?: number;
      images?: Array<{
        mimeType: string;
        base64Data: string;
      }>;
    }
  ): Promise<LlmResponse<string>> {
    const contents: any[] = [];
    const config: any = {
      temperature: options?.temperature ?? 0.7
    };

    if (options?.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }

    const parts: any[] = [];
    if (options?.images && options.images.length > 0) {
      for (const img of options.images) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64Data
          }
        });
      }
    }
    parts.push({ text: prompt });

    contents.push({
      role: 'user',
      parts
    });

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
      config
    });

    const usage = response.usageMetadata;
    return {
      output: response.text?.trim() ?? '',
      usage: usage ? {
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0
      } : undefined
    };
  }

  async generateStructuredOutput<T = any>(
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
  ): Promise<LlmResponse<T>> {
    const rawSchema = typeof (z as any)['toJSONSchema'] === 'function'
      ? (z as any)['toJSONSchema'](schema)
      : zodToJsonSchema(schema);

    const config: any = {
      responseMimeType: 'application/json',
      responseJsonSchema: rawSchema as any,
      temperature: options?.temperature ?? 0.7
    };

    if (options?.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }

    const parts: any[] = [];
    if (options?.images && options.images.length > 0) {
      for (const img of options.images) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64Data
          }
        });
      }
    }
    parts.push({ text: prompt });

    const contents: any[] = [{ role: 'user', parts }];

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
      config
    });

    const text = response.text ?? '{}';
    const usage = response.usageMetadata;
    return {
      output: schema.parse(JSON.parse(text)) as T,
      usage: usage ? {
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0
      } : undefined
    };
  }

  async generateImage(
    prompt: string,
    options?: {
      aspectRatio?: string;
      model?: GeminiModel | string;
    }
  ): Promise<Buffer> {
    const modelToUse = options?.model || GeminiModel.IMAGEN_4_0_ULTRA_GENERATE;
    const response = await this.ai.models.generateImages({
      model: modelToUse,
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: options?.aspectRatio || '1:1',
      }
    });

    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64) {
      throw new Error('No image bytes returned from Gemini Imagen');
    }
    return Buffer.from(base64, 'base64');
  }
}
