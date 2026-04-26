import 'package:firebase_ai/firebase_ai.dart' as ai;
import '../models/ai_model.dart';

/// Chat service for conversational AI
class ChatService {
  final AiModel model;
  final GenerationConfig? config;
  late final ai.ChatSession _chatSession;
  final List<ChatMessage> _history = [];

  ChatService({
    this.model = AiModel.gemini25Flash,
    this.config,
    String? systemInstruction,
  }) {
    if (!model.supports(ModelCapability.text)) {
      throw ArgumentError('Model ${model.displayName} does not support chat');
    }

    final aiModel = ai.FirebaseAI.googleAI().generativeModel(
      model: model.modelId,
      generationConfig: config != null
          ? ai.GenerationConfig(
              temperature: config!.temperature,
              maxOutputTokens: config!.maxOutputTokens,
              topP: config!.topP,
              topK: config!.topK,
              stopSequences: config!.stopSequences,
            )
          : null,
      systemInstruction: systemInstruction != null
          ? ai.Content.system(systemInstruction)
          : null,
    );

    _chatSession = aiModel.startChat();
  }

  /// Send a message and get a response
  ///
  /// Example:
  /// ```dart
  /// final chat = ChatService(
  ///   systemInstruction: 'You are a helpful shopping assistant',
  /// );
  ///
  /// final response = await chat.sendMessage('What products do you recommend?');
  /// print(response.text);
  /// ```
  Future<ChatMessage> sendMessage(String message) async {
    try {
      final userMessage = ChatMessage(
        role: ChatRole.user,
        content: message,
        timestamp: DateTime.now(),
      );
      _history.add(userMessage);

      final response = await _chatSession.sendMessage(ai.Content.text(message));

      final assistantMessage = ChatMessage(
        role: ChatRole.assistant,
        content: response.text ?? '',
        timestamp: DateTime.now(),
      );
      _history.add(assistantMessage);

      return assistantMessage;
    } catch (e) {
      print('Error sending message: $e');
      rethrow;
    }
  }

  /// Send a message with streaming response
  ///
  /// Example:
  /// ```dart
  /// await for (final chunk in chat.sendMessageStream('Tell me about your products')) {
  ///   print(chunk);
  /// }
  /// ```
  Stream<String> sendMessageStream(String message) async* {
    try {
      _history.add(
        ChatMessage(
          role: ChatRole.user,
          content: message,
          timestamp: DateTime.now(),
        ),
      );

      final stream = _chatSession.sendMessageStream(ai.Content.text(message));

      final buffer = StringBuffer();

      await for (final chunk in stream) {
        final text = chunk.text;
        if (text != null) {
          buffer.write(text);
          yield text;
        }
      }

      _history.add(
        ChatMessage(
          role: ChatRole.assistant,
          content: buffer.toString(),
          timestamp: DateTime.now(),
        ),
      );
    } catch (e) {
      print('Error in message stream: $e');
      rethrow;
    }
  }

  /// Get chat history
  List<ChatMessage> get history => List.unmodifiable(_history);

  /// Clear chat history and start a new session
  void clearHistory() {
    _history.clear();
  }

  /// Get a summary of the conversation
  Future<String?> summarizeConversation() async {
    if (_history.isEmpty) return null;

    final conversation = _history
        .map((msg) => '${msg.role.name}: ${msg.content}')
        .join('\n');

    final aiModel = ai.FirebaseAI.googleAI().generativeModel(
      model: model.modelId,
    );

    final response = await aiModel.generateContent([
      ai.Content.text(
        'Summarize the following conversation concisely:\n\n$conversation',
      ),
    ]);

    return response.text;
  }
}

/// Chat message
class ChatMessage {
  final ChatRole role;
  final String content;
  final DateTime timestamp;

  const ChatMessage({
    required this.role,
    required this.content,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'role': role.name,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      role: ChatRole.values.firstWhere((r) => r.name == json['role']),
      content: json['content'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}

/// Chat roles
enum ChatRole { user, assistant, system }
