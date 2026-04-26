# Structured Output Service - Angular

The `FirebaseAiService` in the `@workern/services` package allows you to generate structured outputs (JSON and enums) using the Google Generative AI SDK and Gemini models.

## Features

- Generate JSON output that conforms to a specific schema
- Generate enum values for classification tasks
- Stream large JSON outputs for real-time display
- Multimodal input support (text + images)
- Helper methods for creating common schema types

## Installation

The service is exported from the `@workern/services` package:

```typescript
import { FirebaseAiService } from '@workern/services';
```

## Setup

### 1. Initialize the Service

Initialize the service with your Google AI API key. Do this in your app initialization:

```typescript
import { APP_INITIALIZER } from '@angular/core';
import { FirebaseAiService } from '@workern/services';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (aiService: FirebaseAiService) => {
        return () => {
          aiService.initialize('YOUR_GOOGLE_AI_API_KEY');
        };
      },
      deps: [FirebaseAiService],
      multi: true
    }
    // ... other providers
  ]
};
```

### 2. Inject the Service

```typescript
import { Component, inject } from '@angular/core';
import { FirebaseAiService, Schema, SchemaType } from '@workern/services';

@Component({
  selector: 'app-your-component',
  template: '...'
})
export class YourComponent {
  private aiService = inject(FirebaseAiService);
}
```

## Examples

### 1. Generate JSON Output

```typescript
import { Schema, SchemaType } from '@google/genai';

async generateCharacters() {
  // Define a schema for character data
  const jsonSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      characters: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            age: { type: SchemaType.INTEGER },
            species: { type: SchemaType.STRING },
            accessory: {
              type: SchemaType.STRING,
              enum: ['hat', 'belt', 'shoes']
            },
          },
        },
      },
    },
    optionalProperties: ['accessory'],
  };

  // Generate structured output
  const result = await this.aiService.generateJsonOutput(
    "Generate 10 animal-based characters for a children's card game",
    jsonSchema
  );

  // Parse the JSON
  const data = JSON.parse(result!);
  console.log(data.characters);
}
```

### 2. Generate Enum Output (Classification)

```typescript
async classifyGenre() {
  // Define enum schema
  const enumSchema: Schema = {
    type: SchemaType.STRING,
    enum: ['drama', 'comedy', 'documentary'],
  };

  // Classify content
  const genre = await this.aiService.generateEnumOutput(
    `The film aims to educate and inform viewers about real-life subjects,
     events, or people. It offers a factual record of a particular topic
     by combining interviews, historical footage, and narration.`,
    enumSchema
  );

  console.log('Genre:', genre); // Output: "documentary"
}
```

### 3. Stream JSON Output

For large outputs, use streaming:

```typescript
async streamProducts() {
  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        maxItems: 100,
      },
    },
  };

  for await (const chunk of this.aiService.generateJsonOutputStream(
    'Generate 100 creative product names',
    schema
  )) {
    console.log(chunk); // Print each chunk as it arrives
  }
}
```

### 4. Multimodal Input (Text + Images)

```typescript
async analyzeImage(imageFile: File) {
  // Convert image to base64
  const base64Image = await this.fileToBase64(imageFile);

  // Define schema for image analysis
  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      objects: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            color: { type: SchemaType.STRING },
            position: { type: SchemaType.STRING },
            confidence: { type: SchemaType.NUMBER },
          },
        },
      },
    },
  };

  // Analyze image with structured output
  const result = await this.aiService.generateStructuredOutputWithImages(
    'Identify all objects in this image and describe them',
    [{ mimeType: 'image/jpeg', data: base64Image }],
    schema,
    'gemini-2.5-pro-vision'
  );

  const analysis = JSON.parse(result!);
  console.log(analysis.objects);
}

private async fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

## Helper Methods

### Create Object Schema

```typescript
const schema = FirebaseAiService.createObjectSchema(
  {
    name: { type: SchemaType.STRING },
    age: { type: SchemaType.INTEGER },
    email: { type: SchemaType.STRING }
  },
  ['email'] // optional properties
);
```

### Create Array Schema

```typescript
const schema = FirebaseAiService.createArraySchema(
  { type: SchemaType.STRING },
  50 // maxItems
);
```

### Create Enum Schema

```typescript
const schema = FirebaseAiService.createEnumSchema([
  'red',
  'green',
  'blue',
  'yellow'
]);
```

## Schema Types

The service supports these schema types:

- `SchemaType.STRING` - String values
- `SchemaType.INTEGER` - Integer numbers
- `SchemaType.NUMBER` - Floating point numbers
- `SchemaType.BOOLEAN` - Boolean values
- `SchemaType.ARRAY` - Arrays with typed items
- `SchemaType.OBJECT` - Objects with typed properties

## Configuration

You can customize the generation with `GenerationConfig`:

```typescript
const config = {
  temperature: 0.7, // Creativity (0.0-1.0)
  maxOutputTokens: 2048, // Max response length
  topP: 0.9, // Nucleus sampling
  topK: 40 // Top-K sampling
};

const result = await this.aiService.generateJsonOutput(
  'Your prompt here',
  yourSchema,
  'gemini-2.5-flash',
  config
);
```

## Available Models

- `gemini-2.5-flash` - Fast, efficient (default)
- `gemini-2.5-pro` - Advanced reasoning
- `gemini-2.0-flash` - Balanced performance
- `gemini-2.5-pro-vision` - Multimodal (for images)

## Error Handling

```typescript
try {
  const result = await this.aiService.generateJsonOutput(
    'Your prompt',
    yourSchema
  );

  if (result) {
    const data = JSON.parse(result);
    // Use structured data
  }
} catch (error) {
  console.error('AI Error:', error);
  // Handle error
}
```

## Using with Signals (Angular 20+)

```typescript
import { Component, signal } from '@angular/core';
import { FirebaseAiService } from '@workern/services';

@Component({
  selector: 'app-recipe-generator',
  template: `
    <div>
      @if (loading()) {
        <p>Generating recipe...</p>
      } @else if (recipe()) {
        <h2>{{ recipe()!.name }}</h2>
        <p>Prep time: {{ recipe()!.prepTime }} minutes</p>
        <ul>
          @for (ingredient of recipe()!.ingredients; track ingredient.item) {
            <li>{{ ingredient.amount }} {{ ingredient.item }}</li>
          }
        </ul>
      }
      <button (click)="generateRecipe()">Generate Recipe</button>
    </div>
  `
})
export class RecipeGeneratorComponent {
  private aiService = inject(FirebaseAiService);

  recipe = signal<any>(null);
  loading = signal(false);

  async generateRecipe() {
    this.loading.set(true);

    try {
      const schema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          prepTime: { type: SchemaType.INTEGER },
          cookTime: { type: SchemaType.INTEGER },
          servings: { type: SchemaType.INTEGER },
          ingredients: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                item: { type: SchemaType.STRING },
                amount: { type: SchemaType.STRING }
              }
            }
          },
          steps: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        }
      };

      const result = await this.aiService.generateJsonOutput(
        'Create a pasta carbonara recipe',
        schema
      );

      if (result) {
        this.recipe.set(JSON.parse(result));
      }
    } catch (error) {
      console.error('Failed to generate recipe:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
```

## Real-World Use Cases

### Sentiment Analysis Component

```typescript
@Component({
  selector: 'app-sentiment-analyzer',
  template: `
    <textarea [(ngModel)]="text" placeholder="Enter text to analyze"></textarea>
    <button (click)="analyzeSentiment()">Analyze</button>
    @if (sentiment()) {
      <p>Sentiment: {{ sentiment() }}</p>
    }
  `
})
export class SentimentAnalyzerComponent {
  private aiService = inject(FirebaseAiService);

  text = '';
  sentiment = signal<string | null>(null);

  async analyzeSentiment() {
    const schema = FirebaseAiService.createEnumSchema([
      'positive',
      'negative',
      'neutral'
    ]);

    const result = await this.aiService.generateEnumOutput(
      `Analyze sentiment: "${this.text}"`,
      schema
    );

    this.sentiment.set(result);
  }
}
```

### Product Catalog Generator

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
}

async generateProductCatalog(): Promise<Product[]> {
  const catalogSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      products: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            name: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            price: { type: SchemaType.NUMBER },
            category: { type: SchemaType.STRING },
            tags: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
        },
        maxItems: 20,
      },
    },
  };

  const result = await this.aiService.generateJsonOutput(
    'Generate 20 eco-friendly product ideas',
    catalogSchema
  );

  const data = JSON.parse(result!);
  return data.products;
}
```

## Best Practices

1. **Initialize Early**: Initialize the service in APP_INITIALIZER
2. **Be Specific**: Clear prompts and field names improve accuracy
3. **Validate Output**: Always validate and parse JSON before using
4. **Handle Errors**: Wrap calls in try-catch blocks
5. **Use Signals**: Leverage Angular signals for reactive UI updates
6. **Choose Right Model**: Use faster models for simple tasks
7. **Optional Fields**: Mark fields as optional when they may not always be present
8. **Type Safety**: Create TypeScript interfaces for your expected output
