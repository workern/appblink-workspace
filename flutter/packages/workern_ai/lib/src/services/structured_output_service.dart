import 'dart:typed_data';

import 'package:firebase_ai/firebase_ai.dart' as ai;
import '../models/ai_model.dart';

/// Structured output service using Gemini models
///
/// Generate structured output (like JSON and enums) using the Gemini API.
/// This service ensures that the model's generated output always adheres
/// to a specific schema.
///
/// Example usage for JSON output:
/// ```dart
/// final service = StructuredOutputService();
///
/// final jsonSchema = ai.Schema.object(
///   properties: {
///     'name': ai.Schema.string(),
///     'age': ai.Schema.integer(),
///     'email': ai.Schema.string(),
///   },
///   optionalProperties: ['email'],
/// );
///
/// final result = await service.generateJsonOutput(
///   prompt: 'Generate a user profile for John Doe, age 30',
///   schema: jsonSchema,
/// );
/// ```
///
/// Example usage for enum output:
/// ```dart
/// final enumSchema = ai.Schema.enumString(
///   enumValues: ['red', 'green', 'blue'],
/// );
///
/// final color = await service.generateEnumOutput(
///   prompt: 'What color is the sky on a clear day?',
///   schema: enumSchema,
/// );
/// ```
class StructuredOutputService {
  /// Generate structured JSON output from a prompt
  ///
  /// The model's response will conform to the provided [schema].
  /// By default, all fields are required unless specified in [optionalProperties]
  /// when creating the schema.
  ///
  /// Parameters:
  /// - [prompt]: The input prompt for the model
  /// - [schema]: The JSON schema object that defines the structure
  /// - [model]: The AI model to use (defaults to gemini25Flash)
  /// - [config]: Optional generation configuration
  ///
  /// Returns the structured JSON output as a string, or null if generation fails.
  ///
  /// Example:
  /// ```dart
  /// final jsonSchema = ai.Schema.object(
  ///   properties: {
  ///     'characters': ai.Schema.array(
  ///       items: ai.Schema.object(
  ///         properties: {
  ///           'name': ai.Schema.string(),
  ///           'age': ai.Schema.integer(),
  ///           'species': ai.Schema.string(),
  ///           'accessory': ai.Schema.enumString(
  ///             enumValues: ['hat', 'belt', 'shoes'],
  ///           ),
  ///         },
  ///       ),
  ///     ),
  ///   },
  ///   optionalProperties: ['accessory'],
  /// );
  ///
  /// final result = await service.generateJsonOutput(
  ///   prompt: "Generate 10 animal-based characters for a children's card game",
  ///   schema: jsonSchema,
  /// );
  /// ```
  Future<String?> generateJsonOutput({
    required String prompt,
    required ai.Schema schema,
    AiModel model = AiModel.gemini25Flash,
    GenerationConfig? config,
  }) async {
    try {
      if (!model.supports(ModelCapability.text)) {
        throw ArgumentError(
          'Model ${model.displayName} does not support text generation',
        );
      }

      final aiModel = ai.FirebaseAI.googleAI().generativeModel(
        model: model.modelId,
        generationConfig: ai.GenerationConfig(
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: config?.temperature,
          maxOutputTokens: config?.maxOutputTokens,
          topP: config?.topP,
          topK: config?.topK,
          stopSequences: config?.stopSequences,
        ),
      );

      final response = await aiModel.generateContent([ai.Content.text(prompt)]);

      return response.text;
    } catch (e) {
      print('Error generating JSON output: $e');
      rethrow;
    }
  }

  /// Generate enum output from a prompt
  ///
  /// Useful for classification tasks where you want the model to select
  /// one value from a predefined list of options.
  ///
  /// Parameters:
  /// - [prompt]: The input prompt for the model
  /// - [schema]: The enum schema defining valid values
  /// - [model]: The AI model to use (defaults to gemini25Flash)
  /// - [config]: Optional generation configuration
  ///
  /// Returns the selected enum value as a string, or null if generation fails.
  ///
  /// Example:
  /// ```dart
  /// final enumSchema = ai.Schema.enumString(
  ///   enumValues: ['drama', 'comedy', 'documentary'],
  /// );
  ///
  /// final genre = await service.generateEnumOutput(
  ///   prompt: '''
  ///     The film aims to educate and inform viewers about real-life subjects,
  ///     events, or people. It offers a factual record of a particular topic
  ///     by combining interviews, historical footage, and narration.
  ///   ''',
  ///   schema: enumSchema,
  /// );
  /// print(genre); // Output: "documentary"
  /// ```
  Future<String?> generateEnumOutput({
    required String prompt,
    required ai.Schema schema,
    AiModel model = AiModel.gemini25Flash,
    GenerationConfig? config,
  }) async {
    try {
      if (!model.supports(ModelCapability.text)) {
        throw ArgumentError(
          'Model ${model.displayName} does not support text generation',
        );
      }

      final aiModel = ai.FirebaseAI.googleAI().generativeModel(
        model: model.modelId,
        generationConfig: ai.GenerationConfig(
          responseMimeType: 'text/x.enum',
          responseSchema: schema,
          temperature: config?.temperature,
          maxOutputTokens: config?.maxOutputTokens,
          topP: config?.topP,
          topK: config?.topK,
          stopSequences: config?.stopSequences,
        ),
      );

      final response = await aiModel.generateContent([ai.Content.text(prompt)]);

      return response.text;
    } catch (e) {
      print('Error generating enum output: $e');
      rethrow;
    }
  }

  /// Generate structured JSON output with streaming
  ///
  /// Similar to [generateJsonOutput] but returns a stream for real-time output.
  /// Useful for large outputs where you want to show progress to the user.
  ///
  /// Parameters:
  /// - [prompt]: The input prompt for the model
  /// - [schema]: The JSON schema object that defines the structure
  /// - [model]: The AI model to use (defaults to gemini25Flash)
  /// - [config]: Optional generation configuration
  ///
  /// Returns a stream of string chunks.
  ///
  /// Example:
  /// ```dart
  /// final schema = ai.Schema.object(
  ///   properties: {
  ///     'items': ai.Schema.array(items: ai.Schema.string()),
  ///   },
  /// );
  ///
  /// await for (final chunk in service.generateJsonOutputStream(
  ///   prompt: 'Generate a list of 100 product names',
  ///   schema: schema,
  /// )) {
  ///   print(chunk);
  /// }
  /// ```
  Stream<String> generateJsonOutputStream({
    required String prompt,
    required ai.Schema schema,
    AiModel model = AiModel.gemini25Flash,
    GenerationConfig? config,
  }) async* {
    try {
      if (!model.supports(ModelCapability.text)) {
        throw ArgumentError(
          'Model ${model.displayName} does not support text generation',
        );
      }

      final aiModel = ai.FirebaseAI.googleAI().generativeModel(
        model: model.modelId,
        generationConfig: ai.GenerationConfig(
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: config?.temperature,
          maxOutputTokens: config?.maxOutputTokens,
          topP: config?.topP,
          topK: config?.topK,
          stopSequences: config?.stopSequences,
        ),
      );

      final stream = aiModel.generateContentStream([ai.Content.text(prompt)]);

      await for (final chunk in stream) {
        final text = chunk.text;
        if (text != null) {
          yield text;
        }
      }
    } catch (e) {
      print('Error in JSON output stream: $e');
      rethrow;
    }
  }

  /// Generate structured output with multimodal input (text + images)
  ///
  /// Allows you to pass both text and images as input while still
  /// receiving structured JSON output.
  ///
  /// Parameters:
  /// - [prompt]: The text prompt
  /// - [imageData]: List of image data (bytes)
  /// - [imageMimeTypes]: List of MIME types for the images (e.g., 'image/jpeg')
  /// - [schema]: The JSON schema object that defines the structure
  /// - [model]: The AI model to use (must support multimodal)
  /// - [config]: Optional generation configuration
  ///
  /// Returns the structured JSON output as a string, or null if generation fails.
  ///
  /// Example:
  /// ```dart
  /// final schema = ai.Schema.object(
  ///   properties: {
  ///     'objects': ai.Schema.array(
  ///       items: ai.Schema.object(
  ///         properties: {
  ///           'name': ai.Schema.string(),
  ///           'color': ai.Schema.string(),
  ///           'position': ai.Schema.string(),
  ///         },
  ///       ),
  ///     ),
  ///   },
  /// );
  ///
  /// final result = await service.generateStructuredOutputWithImages(
  ///   prompt: 'Identify all objects in this image and describe them',
  ///   imageData: [imageBytes],
  ///   imageMimeTypes: ['image/jpeg'],
  ///   schema: schema,
  ///   model: AiModel.gemini25ProVision,
  /// );
  /// ```
  Future<String?> generateStructuredOutputWithImages({
    required String prompt,
    required List<Uint8List> imageData,
    required List<String> imageMimeTypes,
    required ai.Schema schema,
    AiModel model = AiModel.gemini25ProVision,
    GenerationConfig? config,
  }) async {
    try {
      if (!model.supports(ModelCapability.multimodal)) {
        throw ArgumentError(
          'Model ${model.displayName} does not support multimodal input',
        );
      }

      if (imageData.length != imageMimeTypes.length) {
        throw ArgumentError('Number of images must match number of MIME types');
      }

      final aiModel = ai.FirebaseAI.googleAI().generativeModel(
        model: model.modelId,
        generationConfig: ai.GenerationConfig(
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: config?.temperature,
          maxOutputTokens: config?.maxOutputTokens,
          topP: config?.topP,
          topK: config?.topK,
          stopSequences: config?.stopSequences,
        ),
      );

      final content = <ai.Part>[
        ai.TextPart(prompt),
        for (var i = 0; i < imageData.length; i++)
          ai.InlineDataPart(imageMimeTypes[i], imageData[i]),
      ];

      final response = await aiModel.generateContent([
        ai.Content.multi(content),
      ]);

      return response.text;
    } catch (e) {
      print('Error generating structured output with images: $e');
      rethrow;
    }
  }

  /// Helper method to create a simple object schema
  ///
  /// Example:
  /// ```dart
  /// final schema = StructuredOutputService.createObjectSchema({
  ///   'name': ai.Schema.string(),
  ///   'age': ai.Schema.integer(),
  ///   'email': ai.Schema.string(),
  /// }, optionalProperties: ['email']);
  /// ```
  static ai.Schema createObjectSchema(
    Map<String, ai.Schema> properties, {
    List<String>? optionalProperties,
  }) {
    return ai.Schema.object(
      properties: properties,
      optionalProperties: optionalProperties,
    );
  }

  /// Helper method to create an array schema
  ///
  /// Example:
  /// ```dart
  /// final schema = StructuredOutputService.createArraySchema(
  ///   ai.Schema.string(),
  ///   maxItems: 10,
  /// );
  /// ```
  static ai.Schema createArraySchema(ai.Schema items, {int? maxItems}) {
    return ai.Schema.array(items: items, maxItems: maxItems);
  }

  /// Helper method to create an enum schema
  ///
  /// Example:
  /// ```dart
  /// final schema = StructuredOutputService.createEnumSchema([
  ///   'option1',
  ///   'option2',
  ///   'option3',
  /// ]);
  /// ```
  static ai.Schema createEnumSchema(List<String> enumValues) {
    return ai.Schema.enumString(enumValues: enumValues);
  }
}
