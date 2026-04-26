/// AI Model types and configurations
enum AiModel {
  // Text Generation Models
  gemini25Flash('gemini-2.5-flash', ModelCapability.text),
  gemini25Pro('gemini-2.5-pro', ModelCapability.text),
  gemini20Flash('gemini-2.0-flash', ModelCapability.text),
  gemini15Flash('gemini-1.5-flash', ModelCapability.text),
  gemini15Pro('gemini-1.5-pro', ModelCapability.text),

  // Image Generation Models (Gemini "nano banana")
  gemini3ProImage(
    'gemini-3-pro-image-preview',
    ModelCapability.imageGeneration,
  ),
  gemini25FlashImage('gemini-2.5-flash-image', ModelCapability.imageGeneration),

  // Imagen Models (dedicated image generation)
  imagen4('imagen-4.0-generate-001', ModelCapability.imageGeneration),
  imagen4Fast('imagen-4.0-fast-generate-001', ModelCapability.imageGeneration),
  imagen4Ultra(
    'imagen-4.0-ultra-generate-001',
    ModelCapability.imageGeneration,
  ),

  // Multimodal Models (text + image understanding)
  gemini25ProVision('gemini-2.5-pro-vision', ModelCapability.multimodal),
  gemini15ProVision('gemini-1.5-pro-vision', ModelCapability.multimodal);

  const AiModel(this.modelId, this.capability);

  final String modelId;
  final ModelCapability capability;

  /// User-friendly display name
  String get displayName {
    switch (this) {
      case AiModel.gemini25Flash:
        return 'Gemini 2.5 Flash';
      case AiModel.gemini25Pro:
        return 'Gemini 2.5 Pro';
      case AiModel.gemini20Flash:
        return 'Gemini 2.0 Flash';
      case AiModel.gemini15Flash:
        return 'Gemini 1.5 Flash';
      case AiModel.gemini15Pro:
        return 'Gemini 1.5 Pro';
      case AiModel.gemini3ProImage:
        return 'Gemini 3 Pro Image';
      case AiModel.gemini25FlashImage:
        return 'Gemini 2.5 Flash Image';
      case AiModel.imagen4:
        return 'Imagen 4';
      case AiModel.imagen4Fast:
        return 'Imagen 4 Fast';
      case AiModel.imagen4Ultra:
        return 'Imagen 4 Ultra';
      case AiModel.gemini25ProVision:
        return 'Gemini 2.5 Pro Vision';
      case AiModel.gemini15ProVision:
        return 'Gemini 1.5 Pro Vision';
    }
  }

  /// Model description
  String get description {
    switch (this) {
      case AiModel.gemini25Flash:
        return 'Fast, efficient text generation';
      case AiModel.gemini25Pro:
        return 'Advanced text generation with reasoning';
      case AiModel.gemini20Flash:
        return 'Balanced speed and quality';
      case AiModel.gemini15Flash:
        return 'Lightweight text model';
      case AiModel.gemini15Pro:
        return 'Powerful text understanding';
      case AiModel.gemini3ProImage:
        return '4K resolution image generation';
      case AiModel.gemini25FlashImage:
        return '1024px fast image generation';
      case AiModel.imagen4:
        return 'High-quality image generation';
      case AiModel.imagen4Fast:
        return 'Fast image generation';
      case AiModel.imagen4Ultra:
        return 'Ultra high-quality images';
      case AiModel.gemini25ProVision:
        return 'Advanced vision understanding';
      case AiModel.gemini15ProVision:
        return 'Image and text understanding';
    }
  }

  /// Check if model supports specific capability
  bool supports(ModelCapability cap) {
    return capability == cap || capability == ModelCapability.multimodal;
  }

  /// Get all models that support a specific capability
  static List<AiModel> getModelsForCapability(ModelCapability capability) {
    return AiModel.values.where((model) => model.supports(capability)).toList();
  }

  /// Check if this is an Imagen model (uses different API)
  bool get isImagenModel => modelId.startsWith('imagen-');
}

/// Model capabilities
enum ModelCapability {
  text,
  imageGeneration,
  imageUnderstanding,
  multimodal, // Both text and image
}

/// Generation configuration
class GenerationConfig {
  final double? temperature;
  final int? maxOutputTokens;
  final double? topP;
  final int? topK;
  final List<String>? stopSequences;

  const GenerationConfig({
    this.temperature,
    this.maxOutputTokens,
    this.topP,
    this.topK,
    this.stopSequences,
  });

  Map<String, dynamic> toJson() {
    return {
      if (temperature != null) 'temperature': temperature,
      if (maxOutputTokens != null) 'maxOutputTokens': maxOutputTokens,
      if (topP != null) 'topP': topP,
      if (topK != null) 'topK': topK,
      if (stopSequences != null) 'stopSequences': stopSequences,
    };
  }
}

/// Safety settings
enum HarmCategory { harassment, hateSpeech, sexuallyExplicit, dangerousContent }

enum HarmBlockThreshold {
  blockNone,
  blockLowAndAbove,
  blockMediumAndAbove,
  blockOnlyHigh,
}

class SafetySetting {
  final HarmCategory category;
  final HarmBlockThreshold threshold;

  const SafetySetting({required this.category, required this.threshold});
}
