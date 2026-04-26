import { Injectable } from '@angular/core';
import {
  AI,
  AIOptions,
  GenerationConfig as AiGenerationConfig,
  Part,
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  SchemaType
} from '@angular/fire/ai';
import { FirebaseApp } from 'firebase/app';
import { GeminiModel } from '@workern/models';

/**
 * Generation configuration for AI models
 */
export type GenerationConfig = Omit<
  AiGenerationConfig,
  'responseMimeType' | 'responseSchema'
>;

export type StructuredOutputSchema = NonNullable<
  AiGenerationConfig['responseSchema']
>;

/**
 * Firebase AI service for generating structured outputs using Gemini models
 *
 * This service ensures that the model's generated output always adheres
 * to a specific schema.
 *
 * Example usage for JSON output:
 * ```typescript
 * const jsonSchema: Schema = {
 *   type: SchemaType.OBJECT,
 *   properties: {
 *     name: { type: SchemaType.STRING },
 *     age: { type: SchemaType.INTEGER },
 *     email: { type: SchemaType.STRING },
 *   },
 *   optionalProperties: ['email'],
 * };
 *
 * const result = await this.aiService.generateJsonOutput(
 *   'Generate a user profile for John Doe, age 30',
 *   jsonSchema
 * );
 * ```
 *
 * Example usage for enum output:
 * ```typescript
 * const enumSchema: Schema = {
 *   type: SchemaType.STRING,
 *   enum: ['red', 'green', 'blue'],
 * };
 *
 * const color = await this.aiService.generateEnumOutput(
 *   'What color is the sky on a clear day?',
 *   enumSchema
 * );
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseAiService {
  private ai: AI | null = null;

  /**
   * Initialize the AI service.
   *
   * If not explicitly initialized, the service attempts to resolve
   * the default AI instance via `getAI()` on first use.
   *
   * @param app - Optional Firebase app instance
   * @param options - Optional AI options (backend, location, etc.)
   */
  initialize(app?: FirebaseApp, options?: AIOptions): void {
    this.ai = getAI(app, options);
  }

  /**
   * Initialize the AI service with Google AI backend explicitly.
   *
   * Useful when app-level providers don't set backend and you want
   * this service to enforce Gemini Developer API backend.
   */
  initializeWithGoogleBackend(app?: FirebaseApp): void {
    this.ai = getAI(app, { backend: new GoogleAIBackend() });
  }

  /**
   * Get the AI instance, throwing an error if not initialized
   */
  private getAiInstance(): AI {
    if (!this.ai) {
      this.ai = getAI();
    }

    return this.ai;
  }

  /**
   * Generate structured JSON output from a prompt
   *
   * The model's response will conform to the provided schema.
   * By default, all fields are required unless specified in optionalProperties.
   *
   * @param prompt - The input prompt for the model
   * @param schema - The JSON schema object that defines the structure
   * @param modelName - The AI model to use (defaults to gemini-2.5-flash)
   * @param config - Optional generation configuration
   * @returns The structured JSON output as a string, or null if generation fails
   *
   * @example
   * ```typescript
   * const jsonSchema: Schema = {
   *   type: SchemaType.OBJECT,
   *   properties: {
   *     characters: {
   *       type: SchemaType.ARRAY,
   *       items: {
   *         type: SchemaType.OBJECT,
   *         properties: {
   *           name: { type: SchemaType.STRING },
   *           age: { type: SchemaType.INTEGER },
   *           species: { type: SchemaType.STRING },
   *           accessory: {
   *             type: SchemaType.STRING,
   *             enum: ['hat', 'belt', 'shoes']
   *           },
   *         },
   *       },
   *     },
   *   },
   *   optionalProperties: ['accessory'],
   * };
   *
   * const result = await this.aiService.generateJsonOutput(
   *   "Generate 10 animal-based characters for a children's card game",
   *   jsonSchema
   * );
   * ```
   */
  async generateJsonOutput(
    prompt: string,
    schema: StructuredOutputSchema,
    modelName = GeminiModel.GEMINI_3_PRO_PREVIEW,
    config?: GenerationConfig
  ): Promise<string | null> {
    try {
      const ai = this.getAiInstance();

      const model = getGenerativeModel(ai, {
        model: modelName,
        generationConfig: {
          ...(config ?? {}),
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating JSON output:', error);
      throw error;
    }
  }

  /**
   * Generate enum output from a prompt
   *
   * Useful for classification tasks where you want the model to select
   * one value from a predefined list of options.
   *
   * @param prompt - The input prompt for the model
   * @param schema - The enum schema defining valid values
   * @param modelName - The AI model to use (defaults to gemini-2.5-flash)
   * @param config - Optional generation configuration
   * @returns The selected enum value as a string, or null if generation fails
   *
   * @example
   * ```typescript
   * const enumSchema: Schema = {
   *   type: SchemaType.STRING,
   *   enum: ['drama', 'comedy', 'documentary'],
   * };
   *
   * const genre = await this.aiService.generateEnumOutput(
   *   `The film aims to educate and inform viewers about real-life subjects,
   *    events, or people. It offers a factual record of a particular topic
   *    by combining interviews, historical footage, and narration.`,
   *   enumSchema
   * );
   * console.log(genre); // Output: "documentary"
   * ```
   */
  async generateEnumOutput(
    prompt: string,
    schema: StructuredOutputSchema,
    modelName = GeminiModel.GEMINI_3_1_PRO_PREVIEW,
    config?: GenerationConfig
  ): Promise<string | null> {
    try {
      const ai = this.getAiInstance();

      const model = getGenerativeModel(ai, {
        model: modelName,
        generationConfig: {
          ...(config ?? {}),
          responseMimeType: 'text/x.enum',
          responseSchema: schema
        }
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating enum output:', error);
      throw error;
    }
  }

  /**
   * Generate structured JSON output with streaming
   *
   * Similar to generateJsonOutput but returns a stream for real-time output.
   * Useful for large outputs where you want to show progress to the user.
   *
   * @param prompt - The input prompt for the model
   * @param schema - The JSON schema object that defines the structure
   * @param modelName - The AI model to use (defaults to gemini-2.5-flash)
   * @param config - Optional generation configuration
   * @returns An async iterator of string chunks
   *
   * @example
   * ```typescript
   * const schema: Schema = {
   *   type: SchemaType.OBJECT,
   *   properties: {
   *     items: {
   *       type: SchemaType.ARRAY,
   *       items: { type: SchemaType.STRING }
   *     },
   *   },
   * };
   *
   * for await (const chunk of this.aiService.generateJsonOutputStream(
   *   'Generate a list of 100 product names',
   *   schema
   * )) {
   *   console.log(chunk);
   * }
   * ```
   */
  async *generateJsonOutputStream(
    prompt: string,
    schema: StructuredOutputSchema,
    modelName = GeminiModel.GEMINI_3_1_PRO_PREVIEW,
    config?: GenerationConfig
  ): AsyncGenerator<string, void, unknown> {
    try {
      const ai = this.getAiInstance();

      const model = getGenerativeModel(ai, {
        model: modelName,
        generationConfig: {
          ...(config ?? {}),
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      console.error('Error in JSON output stream:', error);
      throw error;
    }
  }

  /**
   * Generate structured output with multimodal input (text + images)
   *
   * Allows you to pass both text and images as input while still
   * receiving structured JSON output.
   *
   * @param prompt - The text prompt
   * @param inlineData - Array of inline data objects with mimeType and data
   * @param schema - The JSON schema object that defines the structure
   * @param modelName - The AI model to use (must support multimodal, defaults to gemini-2.5-pro-vision)
   * @param config - Optional generation configuration
   * @returns The structured JSON output as a string, or null if generation fails
   *
   * @example
   * ```typescript
   * const schema: Schema = {
   *   type: SchemaType.OBJECT,
   *   properties: {
   *     objects: {
   *       type: SchemaType.ARRAY,
   *       items: {
   *         type: SchemaType.OBJECT,
   *         properties: {
   *           name: { type: SchemaType.STRING },
   *           color: { type: SchemaType.STRING },
   *           position: { type: SchemaType.STRING },
   *         },
   *       },
   *     },
   *   },
   * };
   *
   * const result = await this.aiService.generateStructuredOutputWithImages(
   *   'Identify all objects in this image and describe them',
   *   [{ mimeType: 'image/jpeg', data: base64ImageData }],
   *   schema,
   *   'gemini-2.5-pro-vision'
   * );
   * ```
   */
  async generateStructuredOutputWithImages(
    prompt: string,
    inlineData: Array<{ mimeType: string; data: string }>,
    schema: StructuredOutputSchema,
    modelName = GeminiModel.GEMINI_3_PRO_IMAGE_PREVIEW,
    config?: GenerationConfig
  ): Promise<string | null> {
    try {
      const ai = this.getAiInstance();

      const model = getGenerativeModel(ai, {
        model: modelName,
        generationConfig: {
          ...(config ?? {}),
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      const imageParts: Part[] = inlineData.map((data) => ({
        inlineData: data
      }));

      const result = await model.generateContent([prompt, ...imageParts]);

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating structured output with images:', error);
      throw error;
    }
  }

  /**
   * Helper method to create a simple object schema
   *
   * @example
   * ```typescript
   * const schema = FirebaseAiService.createObjectSchema(
   *   {
   *     name: { type: SchemaType.STRING },
   *     age: { type: SchemaType.INTEGER },
   *     email: { type: SchemaType.STRING },
   *   },
   *   ['email']
   * );
   * ```
   */
  static createObjectSchema(
    properties: Record<string, StructuredOutputSchema>,
    optionalProperties?: string[]
  ): StructuredOutputSchema {
    return {
      type: SchemaType.OBJECT,
      properties,
      ...(optionalProperties && { optionalProperties })
    };
  }

  /**
   * Helper method to create an array schema
   *
   * @example
   * ```typescript
   * const schema = FirebaseAiService.createArraySchema(
   *   { type: SchemaType.STRING },
   *   10
   * );
   * ```
   */
  static createArraySchema(
    items: StructuredOutputSchema,
    maxItems?: number
  ): StructuredOutputSchema {
    return {
      type: SchemaType.ARRAY,
      items,
      ...(maxItems !== undefined && { maxItems })
    };
  }

  /**
   * Helper method to create an enum schema
   *
   * @example
   * ```typescript
   * const schema = FirebaseAiService.createEnumSchema([
   *   'option1',
   *   'option2',
   *   'option3',
   * ]);
   * ```
   */
  static createEnumSchema(enumValues: string[]): StructuredOutputSchema {
    return {
      type: SchemaType.STRING,
      enum: enumValues
    };
  }
}
