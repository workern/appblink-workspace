import 'package:firebase_ai/firebase_ai.dart' as ai;
import '../models/ai_model.dart';

/// Text generation service using Gemini models
class TextGenerationService {
  /// Generate text from a prompt
  ///
  /// Example:
  /// ```dart
  /// final service = TextGenerationService();
  /// final text = await service.generateText(
  ///   prompt: 'Write a professional product description for organic tomatoes',
  ///   model: AiModel.gemini25Flash,
  /// );
  /// ```
  Future<String?> generateText({
    required String prompt,
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
        generationConfig: config != null
            ? ai.GenerationConfig(
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
                topP: config.topP,
                topK: config.topK,
                stopSequences: config.stopSequences,
              )
            : null,
      );

      final response = await aiModel.generateContent([ai.Content.text(prompt)]);

      return response.text;
    } catch (e) {
      print('Error generating text: $e');
      rethrow;
    }
  }

  /// Generate text with streaming (for real-time output)
  ///
  /// Example:
  /// ```dart
  /// await for (final chunk in service.generateTextStream(prompt: 'Tell me a story')) {
  ///   print(chunk);
  /// }
  /// ```
  Stream<String> generateTextStream({
    required String prompt,
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
        generationConfig: config != null
            ? ai.GenerationConfig(
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
                topP: config.topP,
                topK: config.topK,
                stopSequences: config.stopSequences,
              )
            : null,
      );

      final stream = aiModel.generateContentStream([ai.Content.text(prompt)]);

      await for (final chunk in stream) {
        final text = chunk.text;
        if (text != null) {
          yield text;
        }
      }
    } catch (e) {
      print('Error in text stream: $e');
      rethrow;
    }
  }

  /// Summarize a long text
  ///
  /// Example:
  /// ```dart
  /// final summary = await service.summarize(
  ///   text: longArticleText,
  ///   maxLength: 200,
  /// );
  /// ```
  Future<String?> summarize({
    required String text,
    int? maxLength,
    AiModel model = AiModel.gemini25Flash,
  }) async {
    final prompt =
        '''
Summarize the following text${maxLength != null ? ' in approximately $maxLength words' : ''}:

$text
''';

    return generateText(prompt: prompt, model: model);
  }

  /// Extract key points from text
  Future<List<String>?> extractKeyPoints({
    required String text,
    int maxPoints = 5,
    AiModel model = AiModel.gemini25Flash,
  }) async {
    final prompt =
        '''
Extract up to $maxPoints key points from the following text.
Return only the key points as a numbered list.

$text
''';

    final response = await generateText(prompt: prompt, model: model);
    if (response == null) return null;

    // Parse numbered list
    final points = response
        .split('\n')
        .where((line) => line.trim().isNotEmpty)
        .map((line) => line.replaceAll(RegExp(r'^\d+\.\s*'), '').trim())
        .toList();

    return points;
  }

  /// Rephrase text in a different style
  ///
  /// Example:
  /// ```dart
  /// final professional = await service.rephrase(
  ///   text: 'This product is really good!',
  ///   style: 'professional and formal',
  /// );
  /// ```
  Future<String?> rephrase({
    required String text,
    required String style,
    AiModel model = AiModel.gemini25Flash,
  }) async {
    final prompt =
        '''
Rephrase the following text in a $style style:

$text
''';

    return generateText(prompt: prompt, model: model);
  }

  /// Generate a professional product description
  Future<String?> generateProductDescription({
    required String productName,
    String? category,
    List<String>? features,
    String? targetAudience,
    AiModel model = AiModel.gemini25Flash,
  }) async {
    final prompt =
        '''
Generate a professional, compelling product description for:

Product: $productName
${category != null ? 'Category: $category' : ''}
${features != null && features.isNotEmpty ? 'Key Features:\n${features.map((f) => '- $f').join('\n')}' : ''}
${targetAudience != null ? 'Target Audience: $targetAudience' : ''}

Make it engaging, highlight benefits, and suitable for e-commerce.
''';

    return generateText(prompt: prompt, model: model);
  }

  /// Translate text to another language
  Future<String?> translate({
    required String text,
    required String targetLanguage,
    String? sourceLanguage,
    AiModel model = AiModel.gemini25Flash,
  }) async {
    final prompt =
        '''
Translate the following text${sourceLanguage != null ? ' from $sourceLanguage' : ''} to $targetLanguage:

$text
''';

    return generateText(prompt: prompt, model: model);
  }

  /// Answer a question based on provided context
  Future<String?> answerQuestion({
    required String question,
    required String context,
    AiModel model = AiModel.gemini25Flash,
  }) async {
    final prompt =
        '''
Based on the following context, answer the question:

Context:
$context

Question: $question

Answer:
''';

    return generateText(prompt: prompt, model: model);
  }

  /// Generate creative content (story, poem, etc.)
  Future<String?> generateCreative({
    required String prompt,
    String type = 'story',
    AiModel model = AiModel.gemini25Pro,
  }) async {
    final fullPrompt = 'Write a $type: $prompt';

    return generateText(
      prompt: fullPrompt,
      model: model,
      config: const GenerationConfig(temperature: 0.9), // Higher creativity
    );
  }
}
