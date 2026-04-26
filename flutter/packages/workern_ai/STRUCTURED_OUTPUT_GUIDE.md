# Structured Output Service - Flutter

The `StructuredOutputService` in the `workern_ai` package allows you to generate structured outputs (JSON and enums) using Firebase AI Logic and the Gemini API.

## Features

- Generate JSON output that conforms to a specific schema
- Generate enum values for classification tasks
- Stream large JSON outputs for real-time display
- Multimodal input support (text + images)
- Helper methods for creating common schema types

## Installation

The service is exported from the `workern_ai` package:

```dart
import 'package:workern_ai/workern_ai.dart';
```

## Basic Usage

### Initialize Firebase

Make sure Firebase is initialized in your app:

```dart
await Firebase.initializeApp(
  options: DefaultFirebaseOptions.currentPlatform,
);
```

### Create Service Instance

```dart
final structuredOutputService = StructuredOutputService();
```

## Examples

### 1. Generate JSON Output

```dart
// Define a schema for character data
final jsonSchema = ai.Schema.object(
  properties: {
    'characters': ai.Schema.array(
      items: ai.Schema.object(
        properties: {
          'name': ai.Schema.string(),
          'age': ai.Schema.integer(),
          'species': ai.Schema.string(),
          'accessory': ai.Schema.enumString(
            enumValues: ['hat', 'belt', 'shoes']
          ),
        },
      ),
    ),
  },
  optionalProperties: ['accessory'],
);

// Generate structured output
final result = await structuredOutputService.generateJsonOutput(
  prompt: "Generate 10 animal-based characters for a children's card game",
  schema: jsonSchema,
  model: AiModel.gemini25Flash,
);

// Parse the JSON
final json = jsonDecode(result!);
print(json['characters']);
```

### 2. Generate Enum Output (Classification)

```dart
// Define enum schema
final enumSchema = ai.Schema.enumString(
  enumValues: ['drama', 'comedy', 'documentary']
);

// Classify content
final genre = await structuredOutputService.generateEnumOutput(
  prompt: '''
    The film aims to educate and inform viewers about real-life subjects,
    events, or people. It offers a factual record of a particular topic
    by combining interviews, historical footage, and narration.
  ''',
  schema: enumSchema,
  model: AiModel.gemini25Flash,
);

print('Genre: $genre'); // Output: "documentary"
```

### 3. Stream JSON Output

For large outputs, use streaming:

```dart
final schema = ai.Schema.object(
  properties: {
    'items': ai.Schema.array(
      items: ai.Schema.string(),
      maxItems: 100,
    ),
  },
);

await for (final chunk in structuredOutputService.generateJsonOutputStream(
  prompt: 'Generate 100 creative product names',
  schema: schema,
)) {
  print(chunk); // Print each chunk as it arrives
}
```

### 4. Multimodal Input (Text + Images)

```dart
import 'dart:typed_data';

// Load image bytes
final Uint8List imageBytes = await loadImageFromFile();

// Define schema for image analysis
final schema = ai.Schema.object(
  properties: {
    'objects': ai.Schema.array(
      items: ai.Schema.object(
        properties: {
          'name': ai.Schema.string(),
          'color': ai.Schema.string(),
          'position': ai.Schema.string(),
          'confidence': ai.Schema.number(),
        },
      ),
    ),
  },
);

// Analyze image with structured output
final result = await structuredOutputService.generateStructuredOutputWithImages(
  prompt: 'Identify all objects in this image and describe them',
  imageData: [imageBytes],
  imageMimeTypes: ['image/jpeg'],
  schema: schema,
  model: AiModel.gemini25ProVision,
);

final analysis = jsonDecode(result!);
print(analysis['objects']);
```

## Helper Methods

### Create Object Schema

```dart
final schema = StructuredOutputService.createObjectSchema(
  {
    'name': ai.Schema.string(),
    'age': ai.Schema.integer(),
    'email': ai.Schema.string(),
  },
  optionalProperties: ['email'],
);
```

### Create Array Schema

```dart
final schema = StructuredOutputService.createArraySchema(
  ai.Schema.string(),
  maxItems: 50,
);
```

### Create Enum Schema

```dart
final schema = StructuredOutputService.createEnumSchema([
  'red', 'green', 'blue', 'yellow'
]);
```

## Schema Types

The service supports these schema types from Firebase AI:

- `Schema.string()` - String values
- `Schema.integer()` - Integer numbers
- `Schema.number()` - Floating point numbers
- `Schema.boolean()` - Boolean values
- `Schema.array(items: ...)` - Arrays with typed items
- `Schema.object(properties: ...)` - Objects with typed properties
- `Schema.enumString(enumValues: [...])` - Enum values

## Configuration

You can customize the generation with `GenerationConfig`:

```dart
final config = GenerationConfig(
  temperature: 0.7,        // Creativity (0.0-1.0)
  maxOutputTokens: 2048,   // Max response length
  topP: 0.9,               // Nucleus sampling
  topK: 40,                // Top-K sampling
);

final result = await structuredOutputService.generateJsonOutput(
  prompt: 'Your prompt here',
  schema: yourSchema,
  config: config,
);
```

## Available Models

Use models from the `AiModel` enum:

- `AiModel.gemini25Flash` - Fast, efficient (default for text)
- `AiModel.gemini25Pro` - Advanced reasoning
- `AiModel.gemini20Flash` - Balanced performance
- `AiModel.gemini25ProVision` - Multimodal (default for images)

## Error Handling

```dart
try {
  final result = await structuredOutputService.generateJsonOutput(
    prompt: 'Your prompt',
    schema: yourSchema,
  );

  if (result != null) {
    final data = jsonDecode(result);
    // Use structured data
  }
} catch (e) {
  print('Error: $e');
  // Handle error
}
```

## Best Practices

1. **Be Specific**: Clear prompts and field names improve accuracy
2. **Use Descriptions**: Add `description` fields to schema properties when needed
3. **Validate Output**: Always validate and parse JSON before using
4. **Handle Errors**: Wrap calls in try-catch blocks
5. **Choose Right Model**: Use faster models for simple tasks, advanced models for complex reasoning
6. **Optional Fields**: Mark fields as optional when they may not always be present

## Real-World Use Cases

### Recipe Generator

```dart
final recipeSchema = ai.Schema.object(
  properties: {
    'name': ai.Schema.string(),
    'prepTime': ai.Schema.integer(),
    'cookTime': ai.Schema.integer(),
    'servings': ai.Schema.integer(),
    'ingredients': ai.Schema.array(
      items: ai.Schema.object(
        properties: {
          'item': ai.Schema.string(),
          'amount': ai.Schema.string(),
        },
      ),
    ),
    'steps': ai.Schema.array(items: ai.Schema.string()),
    'difficulty': ai.Schema.enumString(
      enumValues: ['easy', 'medium', 'hard']
    ),
  },
);

final recipe = await structuredOutputService.generateJsonOutput(
  prompt: 'Create a pasta carbonara recipe',
  schema: recipeSchema,
);
```

### Sentiment Analysis

```dart
final sentimentSchema = ai.Schema.enumString(
  enumValues: ['positive', 'negative', 'neutral']
);

final sentiment = await structuredOutputService.generateEnumOutput(
  prompt: 'Analyze sentiment: "This product exceeded my expectations!"',
  schema: sentimentSchema,
);
```

### Product Catalog Generator

```dart
final catalogSchema = ai.Schema.object(
  properties: {
    'products': ai.Schema.array(
      items: ai.Schema.object(
        properties: {
          'id': ai.Schema.string(),
          'name': ai.Schema.string(),
          'description': ai.Schema.string(),
          'price': ai.Schema.number(),
          'category': ai.Schema.string(),
          'tags': ai.Schema.array(items: ai.Schema.string()),
        },
      ),
      maxItems: 20,
    ),
  },
);

final catalog = await structuredOutputService.generateJsonOutput(
  prompt: 'Generate 20 eco-friendly product ideas',
  schema: catalogSchema,
);
```
