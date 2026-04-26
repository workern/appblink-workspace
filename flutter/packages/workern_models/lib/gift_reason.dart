/// Gift reason enum matching TypeScript GiftReason enum
enum GiftReason {
  VALENTINE,
  MARRIAGE_PROPOSAL,
  DATE_PROPOSAL,
  BOYFRIEND_PROPOSAL,
  GIRLFRIEND_PROPOSAL,
  ANNIVERSARY,
  BIRTHDAY,
  APOLOGY,
  JUST_BECAUSE,
  FIRST_DATE,
  LOVE_CONFESSION,
  // Holi Festival Gifts
  HOLI_COLOR_THROW,
  HOLI_PICHKARI_GAME,
  HOLI_GULAL_PACKET,
  HOLI_MEMORY_CAPSULE;

  String toJson() => name;

  static GiftReason fromJson(String json) {
    return GiftReason.values.firstWhere(
      (e) => e.name == json,
      orElse: () => GiftReason.VALENTINE,
    );
  }

  @override
  String toString() => name;
}

/// Helper function to convert question text with recipient name
typedef QuestionTextGenerator = String Function(String recipientName);

/// Email template metadata
class EmailTemplate {
  final String subject;
  final String greeting;
  final String message;

  const EmailTemplate({
    required this.subject,
    required this.greeting,
    required this.message,
  });

  Map<String, dynamic> toJson() => {
    'subject': subject,
    'greeting': greeting,
    'message': message,
  };

  factory EmailTemplate.fromJson(Map<String, dynamic> json) {
    return EmailTemplate(
      subject: json['subject'] as String,
      greeting: json['greeting'] as String,
      message: json['message'] as String,
    );
  }
}

/// Purchase completed email metadata
class PurchaseCompletedEmail {
  final String subject;
  final String greeting;
  final String celebrationTitle;
  final String celebrationMessage;
  final String nextStepsTitle;
  final String nextStepsMessage;

  const PurchaseCompletedEmail({
    required this.subject,
    required this.greeting,
    required this.celebrationTitle,
    required this.celebrationMessage,
    required this.nextStepsTitle,
    required this.nextStepsMessage,
  });

  Map<String, dynamic> toJson() => {
    'subject': subject,
    'greeting': greeting,
    'celebrationTitle': celebrationTitle,
    'celebrationMessage': celebrationMessage,
    'nextStepsTitle': nextStepsTitle,
    'nextStepsMessage': nextStepsMessage,
  };

  factory PurchaseCompletedEmail.fromJson(Map<String, dynamic> json) {
    return PurchaseCompletedEmail(
      subject: json['subject'] as String,
      greeting: json['greeting'] as String,
      celebrationTitle: json['celebrationTitle'] as String,
      celebrationMessage: json['celebrationMessage'] as String,
      nextStepsTitle: json['nextStepsTitle'] as String,
      nextStepsMessage: json['nextStepsMessage'] as String,
    );
  }
}

/// Yes clicked email metadata
class YesClickedEmail {
  final String subject;
  final String greeting;
  final String celebrationTitle;
  final String celebrationMessage;
  final String nextStepsTitle;
  final String nextStepsMessage;

  const YesClickedEmail({
    required this.subject,
    required this.greeting,
    required this.celebrationTitle,
    required this.celebrationMessage,
    required this.nextStepsTitle,
    required this.nextStepsMessage,
  });

  Map<String, dynamic> toJson() => {
    'subject': subject,
    'greeting': greeting,
    'celebrationTitle': celebrationTitle,
    'celebrationMessage': celebrationMessage,
    'nextStepsTitle': nextStepsTitle,
    'nextStepsMessage': nextStepsMessage,
  };

  factory YesClickedEmail.fromJson(Map<String, dynamic> json) {
    return YesClickedEmail(
      subject: json['subject'] as String,
      greeting: json['greeting'] as String,
      celebrationTitle: json['celebrationTitle'] as String,
      celebrationMessage: json['celebrationMessage'] as String,
      nextStepsTitle: json['nextStepsTitle'] as String,
      nextStepsMessage: json['nextStepsMessage'] as String,
    );
  }
}

/// Default recipient names by country
class DefaultRecipientName {
  final String us;
  final String india;
  final String uk;
  final String defaultName;

  const DefaultRecipientName({
    required this.us,
    required this.india,
    required this.uk,
    required this.defaultName,
  });

  String getNameForCountry(String? countryCode) {
    if (countryCode == null) return defaultName;
    switch (countryCode.toUpperCase()) {
      case 'US':
        return us;
      case 'IN':
        return india;
      case 'UK':
      case 'GB':
        return uk;
      default:
        return defaultName;
    }
  }

  Map<String, dynamic> toJson() => {
    'US': us,
    'IN': india,
    'UK': uk,
    'default': defaultName,
  };

  factory DefaultRecipientName.fromJson(Map<String, dynamic> json) {
    return DefaultRecipientName(
      us: json['US'] as String,
      india: json['IN'] as String,
      uk: json['UK'] as String,
      defaultName: json['default'] as String,
    );
  }
}

/// Metadata for each gift reason type
class GiftReasonMetadata {
  final GiftReason type;
  final String displayName;
  final String emoji;
  final String description;
  final String primaryColor;
  final String secondaryColor;
  final String backgroundGradient;
  final String ctaText;
  final String questionText;
  final String successMessage;
  final String successSubTitleMessage;
  final String? successImageUrl;
  final DefaultRecipientName defaultRecipientName;

  /// True for Holi festival gifts that use interactive color-throw experience
  final bool isHoliGift;

  const GiftReasonMetadata({
    required this.type,
    required this.displayName,
    required this.emoji,
    required this.description,
    required this.primaryColor,
    required this.secondaryColor,
    required this.backgroundGradient,
    required this.ctaText,
    required this.questionText,
    required this.successMessage,
    required this.successSubTitleMessage,
    this.successImageUrl,
    required this.defaultRecipientName,
    this.isHoliGift = false,
  });

  /// Get question text with recipient name replaced
  String getQuestionText(String recipientName) {
    return questionText.replaceAll('{{name}}', recipientName);
  }

  Map<String, dynamic> toJson() => {
    'type': type.toJson(),
    'displayName': displayName,
    'emoji': emoji,
    'description': description,
    'primaryColor': primaryColor,
    'secondaryColor': secondaryColor,
    'backgroundGradient': backgroundGradient,
    'ctaText': ctaText,
    'questionText': questionText,
    'successMessage': successMessage,
    'successSubTitleMessage': successSubTitleMessage,
    'successImageUrl': successImageUrl,
    'defaultRecipientName': defaultRecipientName.toJson(),
    'isHoliGift': isHoliGift,
  };

  factory GiftReasonMetadata.fromJson(Map<String, dynamic> json) {
    return GiftReasonMetadata(
      type: GiftReason.fromJson(json['type'] as String),
      displayName: json['displayName'] as String,
      emoji: json['emoji'] as String,
      description: json['description'] as String,
      primaryColor: json['primaryColor'] as String,
      secondaryColor: json['secondaryColor'] as String,
      backgroundGradient: json['backgroundGradient'] as String,
      ctaText: json['ctaText'] as String,
      questionText: json['questionText'] as String,
      successMessage: json['successMessage'] as String,
      successSubTitleMessage: json['successSubTitleMessage'] as String,
      successImageUrl: json['successImageUrl'] as String?,
      defaultRecipientName: DefaultRecipientName.fromJson(
        json['defaultRecipientName'] as Map<String, dynamic>,
      ),
      isHoliGift: json['isHoliGift'] as bool? ?? false,
    );
  }
}

/// Gift reason metadata registry
class GiftReasonMetadataRegistry {
  static const Map<GiftReason, GiftReasonMetadata> metadata = {
    GiftReason.VALENTINE: GiftReasonMetadata(
      type: GiftReason.VALENTINE,
      displayName: "Valentine's Day",
      emoji: '💘',
      description: "Perfect for expressing your feelings on Valentine's Day",
      primaryColor: '#E11D48',
      secondaryColor: '#9F1239',
      backgroundGradient:
          'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
      ctaText: 'Be My Valentine?',
      questionText: '{{name}}, Will You Be My Valentine?',
      successMessage: "It's a date then!",
      successSubTitleMessage: 'Thank you for making my day special!',
      defaultRecipientName: DefaultRecipientName(
        us: 'Sarah',
        india: 'Simran',
        uk: 'Emily',
        defaultName: 'Simran',
      ),
    ),
    GiftReason.MARRIAGE_PROPOSAL: GiftReasonMetadata(
      type: GiftReason.MARRIAGE_PROPOSAL,
      displayName: 'Marriage Proposal',
      emoji: '💍',
      description: 'Pop the question in a unique and memorable way',
      primaryColor: '#BE185D',
      secondaryColor: '#881337',
      backgroundGradient:
          'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
      ctaText: 'Marry Me?',
      questionText: '{{name}}, Will You Marry Me?',
      successMessage: "I can't wait to marry you!",
      successSubTitleMessage: "You've just made me the happiest person alive!",
      defaultRecipientName: DefaultRecipientName(
        us: 'Sarah',
        india: 'Aditi',
        uk: 'Emma',
        defaultName: 'Aditi',
      ),
    ),
    GiftReason.DATE_PROPOSAL: GiftReasonMetadata(
      type: GiftReason.DATE_PROPOSAL,
      displayName: 'Date Proposal',
      emoji: '🌹',
      description: 'Ask someone out on a date in a creative way',
      primaryColor: '#C026D3',
      secondaryColor: '#7E22CE',
      backgroundGradient:
          'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
      ctaText: 'Go On A Date?',
      questionText: '{{name}}, Would You Like To Go On A Date With Me?',
      successMessage: "It's a date then!",
      successSubTitleMessage: "Can't wait to spend time with you!",
      defaultRecipientName: DefaultRecipientName(
        us: 'Jessica',
        india: 'Ananya',
        uk: 'Sophie',
        defaultName: 'Ananya',
      ),
    ),
    GiftReason.BOYFRIEND_PROPOSAL: GiftReasonMetadata(
      type: GiftReason.BOYFRIEND_PROPOSAL,
      displayName: 'Boyfriend Proposal',
      emoji: '💙',
      description: 'Ask him to be your boyfriend',
      primaryColor: '#2563EB',
      secondaryColor: '#1E3A8A',
      backgroundGradient:
          'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
      ctaText: 'Be My Boyfriend?',
      questionText: '{{name}}, Will You Be My Boyfriend?',
      successMessage: "You're my boyfriend now!",
      successSubTitleMessage: 'This is the beginning of something beautiful!',
      defaultRecipientName: DefaultRecipientName(
        us: 'Ryan',
        india: 'Rahul',
        uk: 'James',
        defaultName: 'Rahul',
      ),
    ),
    GiftReason.GIRLFRIEND_PROPOSAL: GiftReasonMetadata(
      type: GiftReason.GIRLFRIEND_PROPOSAL,
      displayName: 'Girlfriend Proposal',
      emoji: '💗',
      description: 'Ask her to be your girlfriend',
      primaryColor: '#DB2777',
      secondaryColor: '#831843',
      backgroundGradient:
          'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
      ctaText: 'Be My Girlfriend?',
      questionText: '{{name}}, Will You Be My Girlfriend?',
      successMessage: "You're my girlfriend now!",
      successSubTitleMessage: 'This is the beginning of something beautiful!',
      defaultRecipientName: DefaultRecipientName(
        us: 'Emily',
        india: 'Divya',
        uk: 'Sophie',
        defaultName: 'Divya',
      ),
    ),
    GiftReason.ANNIVERSARY: GiftReasonMetadata(
      type: GiftReason.ANNIVERSARY,
      displayName: 'Anniversary Gift',
      emoji: '🎂',
      description: 'Celebrate your special day together',
      primaryColor: '#7C3AED',
      secondaryColor: '#4C1D95',
      successImageUrl:
          'https://i.pinimg.com/736x/4e/b2/38/4eb238041cfc82d880ca61870fde8aca.jpg',
      backgroundGradient:
          'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #d8b4fe 100%)',
      ctaText: 'Happy Anniversary!',
      questionText: '{{name}}, Happy Anniversary My Love! Did You Like It?',
      successMessage: "Here's to many more years together!",
      successSubTitleMessage: 'Every moment with you is a celebration!',
      defaultRecipientName: DefaultRecipientName(
        us: 'Emma',
        india: 'Kavya',
        uk: 'Olivia',
        defaultName: 'Kavya',
      ),
    ),
    GiftReason.BIRTHDAY: GiftReasonMetadata(
      type: GiftReason.BIRTHDAY,
      displayName: 'Birthday Gift',
      emoji: '🎉',
      description: 'Make their birthday extra special',
      primaryColor: '#EA580C',
      secondaryColor: '#9A3412',
      backgroundGradient:
          'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
      ctaText: 'Happy Birthday!',
      questionText: '{{name}}, Happy Birthday! Did You Like It?',
      successMessage: "Let's make it the best birthday ever!",
      successSubTitleMessage: "Here's to celebrating you today!",
      defaultRecipientName: DefaultRecipientName(
        us: 'Mia',
        india: 'Aditi',
        uk: 'Amelia',
        defaultName: 'Aditi',
      ),
    ),
    GiftReason.APOLOGY: GiftReasonMetadata(
      type: GiftReason.APOLOGY,
      displayName: 'Apology',
      emoji: '🙏',
      description: 'Say sorry in a heartfelt way',
      primaryColor: '#4F46E5',
      secondaryColor: '#312E81',
      successImageUrl:
          'https://i.pinimg.com/originals/9a/75/32/9a7532b2e066d41c9940e0d5c1ad5ba6.gif',
      backgroundGradient:
          'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
      ctaText: 'Forgive Me?',
      questionText: '{{name}}, I\'m Really Sorry. Will You Forgive Me?',
      successMessage: 'Thank you for forgiving me!',
      successSubTitleMessage: "I'm truly sorry and value our relationship!",
      defaultRecipientName: DefaultRecipientName(
        us: 'Rachel',
        india: 'Kavya',
        uk: 'Grace',
        defaultName: 'Kavya',
      ),
    ),
    GiftReason.JUST_BECAUSE: GiftReasonMetadata(
      type: GiftReason.JUST_BECAUSE,
      displayName: 'Just Because',
      emoji: '🌟',
      description: 'No reason needed to make someone smile',
      primaryColor: '#0D9488',
      secondaryColor: '#134E4A',
      backgroundGradient:
          'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #99f6e4 100%)',
      ctaText: "You're Special!",
      questionText:
          '{{name}}, Just Wanted To Say You\'re Amazing! Did You Like It?',
      successMessage: 'You made my day!',
      successSubTitleMessage: 'Every moment with you is special!',
      defaultRecipientName: DefaultRecipientName(
        us: 'Lily',
        india: 'Isha',
        uk: 'Charlotte',
        defaultName: 'Isha',
      ),
    ),
    GiftReason.FIRST_DATE: GiftReasonMetadata(
      type: GiftReason.FIRST_DATE,
      displayName: 'First Date',
      emoji: '✨',
      description: 'Celebrate your first date together',
      primaryColor: '#F59E0B',
      secondaryColor: '#92400E',
      backgroundGradient:
          'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)',
      ctaText: 'First Date!',
      questionText:
          '{{name}}, Thanks For An Amazing First Date! Did You Enjoy It?',
      successMessage: "I had a wonderful time!",
      successSubTitleMessage: "Can't wait for our next adventure!",
      defaultRecipientName: DefaultRecipientName(
        us: 'Alex',
        india: 'Priya',
        uk: 'Zoe',
        defaultName: 'Priya',
      ),
    ),
    GiftReason.LOVE_CONFESSION: GiftReasonMetadata(
      type: GiftReason.LOVE_CONFESSION,
      displayName: 'Love Confession',
      emoji: '❤️',
      description: 'Tell someone you love them',
      primaryColor: '#DC2626',
      secondaryColor: '#991B1B',
      backgroundGradient:
          'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)',
      ctaText: 'I Love You!',
      questionText: '{{name}}, I Love You! Do You Feel The Same?',
      successMessage: 'I love you too!',
      successSubTitleMessage: 'This is the start of something beautiful!',
      defaultRecipientName: DefaultRecipientName(
        us: 'Taylor',
        india: 'Riya',
        uk: 'Lucy',
        defaultName: 'Riya',
      ),
    ),
    // Holi Festival Gifts
    GiftReason.HOLI_COLOR_THROW: GiftReasonMetadata(
      type: GiftReason.HOLI_COLOR_THROW,
      displayName: 'Throw Colors!',
      emoji: '🎨',
      description:
          'Throw virtual Holi colors on your friend in an interactive experience',
      primaryColor: '#FF6B35',
      secondaryColor: '#E91E63',
      backgroundGradient:
          'linear-gradient(135deg, #fff3e0 0%, #fce4ec 40%, #e8f5e9 70%, #e3f2fd 100%)',
      ctaText: 'Happy Holi!',
      questionText: '{{name}}, Bura Na Mano Holi Hai! 🎨',
      successMessage: 'Happy Holi! 🌈',
      successSubTitleMessage: 'May your life be as colorful as this Holi!',
      isHoliGift: true,
      defaultRecipientName: DefaultRecipientName(
        us: 'Friend',
        india: 'Yaar',
        uk: 'Mate',
        defaultName: 'Yaar',
      ),
    ),
    GiftReason.HOLI_PICHKARI_GAME: GiftReasonMetadata(
      type: GiftReason.HOLI_PICHKARI_GAME,
      displayName: 'Pichkari Game',
      emoji: '💦',
      description:
          'Gift a fun virtual pichkari game where they spray colors to unlock your message',
      primaryColor: '#0288D1',
      secondaryColor: '#01579B',
      backgroundGradient:
          'linear-gradient(135deg, #e1f5fe 0%, #fff9c4 40%, #fce4ec 70%, #e8f5e9 100%)',
      ctaText: 'Spray & Reveal!',
      questionText: '{{name}}, Your Pichkari is Loaded! 💦',
      successMessage: "You've Been Drenched! Happy Holi! 🌊",
      successSubTitleMessage: 'May your life be splashed with joy and color!',
      isHoliGift: true,
      defaultRecipientName: DefaultRecipientName(
        us: 'Friend',
        india: 'Dost',
        uk: 'Mate',
        defaultName: 'Dost',
      ),
    ),
    GiftReason.HOLI_GULAL_PACKET: GiftReasonMetadata(
      type: GiftReason.HOLI_GULAL_PACKET,
      displayName: 'Gulal Packet',
      emoji: '🌺',
      description:
          'A virtual gulal packet that explodes with colors and reveals heartfelt color meanings',
      primaryColor: '#FF8F00',
      secondaryColor: '#B71C1C',
      backgroundGradient:
          'linear-gradient(135deg, #fff8e1 0%, #fce4ec 50%, #f3e5f5 100%)',
      ctaText: 'Open Gulal!',
      questionText: '{{name}}, Your Gulal Packet Has Arrived! 🌺',
      successMessage: 'Happy Holi! These Colors Are for You 🌈',
      successSubTitleMessage:
          'Each color in this gulal holds a special meaning for you',
      isHoliGift: true,
      defaultRecipientName: DefaultRecipientName(
        us: 'Friend',
        india: 'Yaar',
        uk: 'Mate',
        defaultName: 'Yaar',
      ),
    ),
    GiftReason.HOLI_MEMORY_CAPSULE: GiftReasonMetadata(
      type: GiftReason.HOLI_MEMORY_CAPSULE,
      displayName: 'Memory Capsule',
      emoji: '📸',
      description:
          'A Holi memory capsule with a personal message that reveals through colorful animation',
      primaryColor: '#9C27B0',
      secondaryColor: '#4A148C',
      backgroundGradient:
          'linear-gradient(135deg, #f3e5f5 0%, #fff9c4 40%, #fce4ec 70%, #e8f5e9 100%)',
      ctaText: 'Open Capsule!',
      questionText: '{{name}}, A Holi Memory Capsule Awaits You! 📸',
      successMessage: 'Happy Holi! This One is Special for You 🌈',
      successSubTitleMessage:
          'Wishing you colors, joy, and beautiful memories this Holi!',
      isHoliGift: true,
      defaultRecipientName: DefaultRecipientName(
        us: 'Friend',
        india: 'Yaar',
        uk: 'Mate',
        defaultName: 'Yaar',
      ),
    ),
  };

  static GiftReasonMetadata getMetadata(GiftReason reason) {
    return metadata[reason] ?? metadata[GiftReason.VALENTINE]!;
  }

  static List<GiftReasonMetadata> getAllMetadata() {
    return metadata.values.toList();
  }

  static List<GiftReasonMetadata> getFeaturedGifts() {
    return [
      metadata[GiftReason.VALENTINE]!,
      metadata[GiftReason.MARRIAGE_PROPOSAL]!,
      metadata[GiftReason.DATE_PROPOSAL]!,
      metadata[GiftReason.BOYFRIEND_PROPOSAL]!,
      metadata[GiftReason.GIRLFRIEND_PROPOSAL]!,
      metadata[GiftReason.LOVE_CONFESSION]!,
    ];
  }
}
