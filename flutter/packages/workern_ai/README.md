# Workern AI

A comprehensive AI services package for all Workern apps, providing unified access to Firebase AI capabilities including image generation, text generation, and conversational AI.

## Features

- 🖼️ **Image Generation**: Create images from text prompts using Gemini and Imagen models
- ✍️ **Text Generation**: Generate, summarize, translate, and manipulate text
- 💬 **Chat/Conversational AI**: Build intelligent chatbots with conversation history
- 🎨 **Image Editing**: Edit and transform images using AI
- 🔍 **Image Analysis**: Understand and describe images with vision models
- 🌐 **Multilingual**: Built-in translation capabilities

## Installation

Add `workern_ai` to your app's `pubspec.yaml`:

```yaml
dependencies:
  workern_ai:
    path: ../../packages/workern_ai
```

Then run:

```bash
flutter pub get
```

## Setup

1. Ensure Firebase is configured in your app
2. Initialize Firebase AI in your app:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:workern_ai/workern_ai.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  runApp(MyApp());
}
```

## Usage

### Image Generation

Generate images from text prompts:

```dart
import 'package:workern_ai/workern_ai.dart';

final imageService = ImageGenerationService();

// Generate a product image
final imageBytes = await imageService.generateImage(
  prompt: 'Professional product photo of fresh organic tomatoes on a white background',
  model: AiModel.gemini25FlashImage, // 1024x1024px
);

// Use different models
final highResImage = await imageService.generateImage(
  prompt: 'High quality product photography of handmade ceramic mug',
  model: AiModel.gemini3ProImage, // 4096x4096px
);

// Image-to-image transformation
final transformedImage = await imageService.generateImageWithInput(
  prompt: 'Convert this to a professional product photo',
  inputImage: originalImageBytes,
);

// Edit existing images
final editedImage = await imageService.editImage(
  image: productImageBytes,
  prompt: 'Remove the background and add subtle shadows',
);

// Generate multiple variations
final variations = await imageService.generateVariations(
  originalImage: imageBytes,
  prompt: 'Create variations with different lighting',
  count: 3,
);
```

### Text Generation

Generate and manipulate text:

```dart
final textService = TextGenerationService();

// Generate product descriptions
final description = await textService.generateProductDescription(
  productName: 'Organic Tomatoes',
  category: 'Fresh Vegetables',
  features: ['Locally sourced', 'Pesticide-free', 'Farm fresh'],
  tone: 'professional',
);

// Summarize content
final summary = await textService.summarize(
  text: longArticle,
  maxLength: 200,
);

// Extract key points
final keyPoints = await textService.extractKeyPoints(
  text: meetingNotes,
  count: 5,
);

// Translate text
final hindi = await textService.translate(
  text: 'Welcome to our shop',
  targetLanguage: 'Hindi',
  sourceLanguage: 'English',
);

// Rephrase in different styles
final formal = await textService.rephrase(
  text: 'Hey, check out our new stuff!',
  style: 'formal',
);

// Answer questions
final answer = await textService.answerQuestion(
  question: 'What are the benefits of organic vegetables?',
  context: 'Our farm grows organic vegetables without pesticides...',
);

// Generate creative content
final story = await textService.generateCreative(
  prompt: 'Write a short story about a magical vegetable garden',
  type: 'story',
);

// Streaming text generation
await for (final chunk in textService.generateTextStream(
  prompt: 'Write a detailed blog post about sustainable farming',
)) {
  print(chunk); // Print each chunk as it arrives
}
```

### Chat/Conversational AI

Build intelligent chatbots:

```dart
// Create a chat session with system instruction
final chat = ChatService(
  model: AiModel.gemini25Flash,
  systemInstruction: 'You are a helpful shopping assistant for a grocery app. '
                      'Provide friendly and informative responses about products.',
);

// Send messages
final response1 = await chat.sendMessage('What fresh vegetables do you have?');
print(response1.content);

final response2 = await chat.sendMessage('Which ones are organic?');
print(response2.content);

// Stream responses for real-time feedback
await for (final chunk in chat.sendMessageStream('Tell me about tomatoes')) {
  print(chunk); // Display each chunk as it arrives
}

// Get conversation history
final history = chat.history;
for (final message in history) {
  print('${message.role.name}: ${message.content}');
}

// Summarize conversation
final summary = await chat.summarizeConversation();
print('Conversation summary: $summary');

// Clear history and start fresh
chat.clearHistory();
```

### Image Analysis

Understand and describe images:

```dart
final imageService = ImageGenerationService();

// Analyze product images
final description = await imageService.analyzeImage(
  image: productImageBytes,
  prompt: 'Describe this product in detail including quality, condition, and appearance',
);

// Extract information from images
final info = await imageService.analyzeImage(
  image: receiptImageBytes,
  prompt: 'Extract the total amount and date from this receipt',
);

// Quality check
final qualityCheck = await imageService.analyzeImage(
  image: productImageBytes,
  prompt: 'Assess the quality of this product. Is it fresh? Any defects?',
);
```

## AI Models

The package supports multiple AI models optimized for different use cases:

### Text Models

- `gemini25Flash` - Fast, cost-effective (recommended for most use cases)
- `gemini25Pro` - Advanced reasoning and complex tasks
- `gemini20Flash` - Balanced performance
- `gemini15Flash` - Legacy model
- `gemini15Pro` - Legacy advanced model

### Image Generation Models

- `gemini25FlashImage` - Fast image generation (1024x1024, recommended)
- `gemini3ProImage` - High quality images (4096x4096)
- `imagen4` - Highest quality photorealistic images
- `imagen4Fast` - Fast photorealistic generation
- `imagen4Ultra` - Premium quality with fine details

### Multimodal Models

- `gemini25ProVision` - Advanced image understanding
- `gemini15ProVision` - Legacy vision model

## Configuration

Customize generation behavior:

```dart
final config = GenerationConfig(
  temperature: 0.7,      // Creativity (0.0-2.0)
  maxOutputTokens: 1024, // Max length
  topP: 0.95,            // Diversity
  topK: 40,              // Vocabulary restriction
  stopSequences: ['END'], // Stop generation at these tokens
);

// Use with any service
final imageService = ImageGenerationService();
final image = await imageService.generateImage(
  prompt: 'Professional product photo',
  config: config,
);

final textService = TextGenerationService();
final text = await textService.generateText(
  prompt: 'Write a product description',
  config: config,
);
```

## Use Cases by App

### Sangrah (Shop Management)

- Generate product images from descriptions
- Create product descriptions automatically
- Translate product details to multiple languages
- Generate promotional content

### Nikat (Customer App)

- AI shopping assistant chatbot
- Product recommendations
- Translate app content for different languages
- Generate order summaries

### Promptkul (AI Tools)

- Image generation and editing
- Text generation utilities
- Creative content generation
- Multi-turn conversations

## Best Practices

1. **Model Selection**
   - Use `gemini25Flash` for most text tasks (fast, cost-effective)
   - Use `gemini25FlashImage` for quick image generation
   - Use `imagen4` for highest quality product photos
   - Use `gemini25Pro` for complex reasoning tasks

2. **Error Handling**

   ```dart
   try {
     final image = await imageService.generateImage(prompt: prompt);
     if (image == null) {
       // Handle null result
       ScaffoldMessenger.of(context).showSnackBar(
         SnackBar(content: Text('Image generation failed')),
       );
     }
   } catch (e) {
     print('Error: $e');
     // Handle error appropriately
   }
   ```

3. **Prompt Engineering**
   - Be specific and descriptive
   - Include context and requirements
   - Specify format when needed
   - Test different prompts for best results

4. **Performance**
   - Use streaming for long text generation
   - Cache frequently generated content
   - Use appropriate models for each task
   - Consider rate limits and costs

## Examples

See the `/examples` directory for complete sample applications:

- Product image generation
- Chatbot implementation
- Content creation tools
- Image editing workflows

## Support

For issues or questions about the Workern AI package, contact the Workern development team.

## License

Copyright © 2024 Workern. All rights reserved.
