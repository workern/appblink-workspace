export enum GiftReason {
  VALENTINE = 'VALENTINE',
  MARRIAGE_PROPOSAL = 'MARRIAGE_PROPOSAL',
  DATE_PROPOSAL = 'DATE_PROPOSAL',
  BOYFRIEND_PROPOSAL = 'BOYFRIEND_PROPOSAL',
  GIRLFRIEND_PROPOSAL = 'GIRLFRIEND_PROPOSAL',
  ANNIVERSARY = 'ANNIVERSARY',
  BIRTHDAY = 'BIRTHDAY',
  APOLOGY = 'APOLOGY',
  JUST_BECAUSE = 'JUST_BECAUSE',
  FIRST_DATE = 'FIRST_DATE',
  LOVE_CONFESSION = 'LOVE_CONFESSION',
  // Holi Festival Gifts
  HOLI_COLOR_THROW = 'HOLI_COLOR_THROW',
  HOLI_PICHKARI_GAME = 'HOLI_PICHKARI_GAME',
  HOLI_GULAL_PACKET = 'HOLI_GULAL_PACKET',
  HOLI_MEMORY_CAPSULE = 'HOLI_MEMORY_CAPSULE'
}

export interface GiftReasonMetadata {
  type: GiftReason;
  displayName: string;
  emoji: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundGradient: string; // CSS gradient for page backgrounds
  ctaText: string;
  questionText: (recipientName: string) => string;
  successMessage: string; // Message shown when recipient says yes
  successSubTitleMessage: string; // Subtitle shown below success message
  successImageUrl?: string; // Optional custom GIF URL for success state (defaults to standard celebration GIF if not provided)
  defaultRecipientName: {
    US: string;
    IN: string;
    UK: string;
    default: string;
  };
  // Email template specific fields
  email: {
    // Purchase completed email
    purchaseCompleted: {
      subject: string; // Email subject line template
      greeting: string; // Main heading in email
      celebrationTitle: string; // Title in the celebration section
      celebrationMessage: (recipientName: string) => string; // Message in celebration section
      nextStepsTitle: string; // Title for next steps section
      nextStepsMessage: (recipientName: string) => string; // Guidance message
    };
    // Website viewed email
    viewed: {
      subject: (recipientName: string) => string;
      greeting: string;
      message: (recipientName: string) => string;
    };
    // Yes button clicked email
    yesClicked: {
      subject: (recipientName: string) => string;
      greeting: string;
      celebrationTitle: string;
      celebrationMessage: (recipientName: string) => string;
      nextStepsTitle: string;
      nextStepsMessage: string;
    };
  };
  /** Set to true for Holi festival gifts that use interactive color-throw experience */
  isHoliGift?: boolean;
}

export const GIFT_REASON_METADATA: Record<GiftReason, GiftReasonMetadata> = {
  [GiftReason.VALENTINE]: {
    type: GiftReason.VALENTINE,
    displayName: "Valentine's Day",
    emoji: '💘',
    description: "Perfect for expressing your feelings on Valentine's Day",
    primaryColor: '#E11D48',
    secondaryColor: '#9F1239',
    backgroundGradient:
      'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
    ctaText: 'Be My Valentine?',
    questionText: (name) => `${name}, Will You Be My Valentine?`,
    successMessage: "It's a date then!",
    successSubTitleMessage: 'Thank you for making my day special!',
    defaultRecipientName: {
      US: 'Sarah',
      IN: 'Simran',
      UK: 'Emily',
      default: 'Simran'
    },
    email: {
      purchaseCompleted: {
        subject:
          "💝 Your Valentine's Website is Ready! Share it with {{recipientName}}",
        greeting: "Your Valentine's Website is Ready!",
        celebrationTitle: '✨ Love is Just a Click Away! ✨',
        celebrationMessage: (name) =>
          `Your romantic gesture has been beautifully crafted. Share this special link with ${name} and let the magic unfold!`,
        nextStepsTitle: '💡 Next Steps - Share the Love!',
        nextStepsMessage: (name) =>
          `Copy the link above and send it to ${name}. You'll receive an email notification when they click "Yes" on your Valentine's question! 💕`
      },
      viewed: {
        subject: (name) => `🎉 ${name} just viewed your Valentine's gift!`,
        greeting: "Someone's Checking Out Your Valentine's Gift!",
        message: (name) =>
          `${name} just viewed your personalized Valentine's website! Your romantic gesture is being discovered right now. 💕`
      },
      yesClicked: {
        subject: (name) =>
          `💖 ${name} said YES! They loved your Valentine's gift!`,
        greeting: 'They Said YES!',
        celebrationTitle: '💕 Love is in the Air! 💕',
        celebrationMessage: (name) =>
          `Your romantic gesture has touched their heart. This is a special moment – ${name} is responding to your Valentine's message with a big YES!`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          "Now that they've said yes, it might be the perfect time to reach out and make plans! Keep the Valentine's magic going."
      }
    }
  },

  [GiftReason.MARRIAGE_PROPOSAL]: {
    type: GiftReason.MARRIAGE_PROPOSAL,
    displayName: 'Marriage Proposal',
    emoji: '💍',
    description: 'Pop the question in a unique and memorable way',
    primaryColor: '#BE185D',
    secondaryColor: '#881337',
    backgroundGradient:
      'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
    ctaText: 'Marry Me?',
    questionText: (name) => `${name}, Will You Marry Me?`,
    successMessage: "I can't wait to marry you!",
    successSubTitleMessage: "You've just made me the happiest person alive!",
    defaultRecipientName: {
      US: 'Sarah',
      IN: 'Aditi',
      UK: 'Emma',
      default: 'Aditi'
    },
    email: {
      purchaseCompleted: {
        subject:
          '💍 Your Marriage Proposal Website is Ready! Time to Pop the Question to {{recipientName}}',
        greeting: 'Your Marriage Proposal Website is Ready!',
        celebrationTitle: '✨ Will You Marry Me? ✨',
        celebrationMessage: (name) =>
          `Your heartfelt proposal has been beautifully prepared. Share this special moment with ${name} and make it unforgettable!`,
        nextStepsTitle: '💡 Next Steps - Make it Special!',
        nextStepsMessage: (name) =>
          `Copy the link above and share it with ${name} when the moment feels right. You'll receive an email notification when they respond to your proposal! 💍`
      },
      viewed: {
        subject: (name) => `💍 ${name} just viewed your marriage proposal!`,
        greeting: "Someone's Viewing Your Proposal!",
        message: (name) =>
          `${name} just viewed your marriage proposal website! This could be the moment that changes everything. 💍`
      },
      yesClicked: {
        subject: (name) => `💍 ${name} said YES to your proposal!`,
        greeting: 'THEY SAID YES!',
        celebrationTitle: "💍 You're Getting Married! 💍",
        celebrationMessage: (name) =>
          `${name} accepted your proposal! This is the beginning of your beautiful journey together. Congratulations!`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          "Time to celebrate and start planning your life together! This is a moment you'll treasure forever."
      }
    }
  },

  [GiftReason.DATE_PROPOSAL]: {
    type: GiftReason.DATE_PROPOSAL,
    displayName: 'Date Proposal',
    emoji: '🌹',
    description: 'Ask someone out on a date in a creative way',
    primaryColor: '#C026D3',
    secondaryColor: '#7E22CE',
    backgroundGradient:
      'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
    ctaText: 'Go On A Date?',
    questionText: (name) => `${name}, Would You Like To Go On A Date With Me?`,
    successMessage: "It's a date then!",
    successSubTitleMessage: "Can't wait to spend time with you!",
    defaultRecipientName: {
      US: 'Jessica',
      IN: 'Ananya',
      UK: 'Sophie',
      default: 'Ananya'
    },
    email: {
      purchaseCompleted: {
        subject:
          '🌹 Your Date Proposal Website is Ready! Ask {{recipientName}} Out',
        greeting: 'Your Date Proposal Website is Ready!',
        celebrationTitle: '✨ Ready for a Date? ✨',
        celebrationMessage: (name) =>
          `Your creative invitation has been crafted. Share this special link with ${name} and see if they'll say yes to a date!`,
        nextStepsTitle: '💡 Next Steps - Take the Leap!',
        nextStepsMessage: (name) =>
          `Copy the link above and send it to ${name}. You'll receive an email notification when they respond to your date invitation! 🌹`
      },
      viewed: {
        subject: (name) => `🌹 ${name} just viewed your date invitation!`,
        greeting: "Someone's Looking at Your Date Proposal!",
        message: (name) =>
          `${name} just viewed your date proposal website! They're considering your invitation right now. 🌹`
      },
      yesClicked: {
        subject: (name) => `🌹 ${name} said YES to the date!`,
        greeting: 'They Want to Go Out!',
        celebrationTitle: "✨ It's a Date! ✨",
        celebrationMessage: (name) =>
          `${name} said yes to your date invitation! Get ready for a wonderful time together.`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          'Time to plan the perfect date! Make it memorable and enjoy getting to know each other better.'
      }
    }
  },

  [GiftReason.BOYFRIEND_PROPOSAL]: {
    type: GiftReason.BOYFRIEND_PROPOSAL,
    displayName: 'Boyfriend Proposal',
    emoji: '💙',
    description: 'Ask him to be your boyfriend',
    primaryColor: '#2563EB',
    secondaryColor: '#1E3A8A',
    backgroundGradient:
      'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
    ctaText: 'Be My Boyfriend?',
    questionText: (name) => `${name}, Will You Be My Boyfriend?`,
    successMessage: "You're my boyfriend now!",
    successSubTitleMessage: 'This is the beginning of something beautiful!',
    defaultRecipientName: {
      US: 'Ryan',
      IN: 'Rahul',
      UK: 'James',
      default: 'Rahul'
    },
    email: {
      purchaseCompleted: {
        subject:
          '💙 Your Boyfriend Proposal Website is Ready! Ask {{recipientName}} to Be Yours',
        greeting: 'Your Boyfriend Proposal Website is Ready!',
        celebrationTitle: '✨ Be My Boyfriend? ✨',
        celebrationMessage: (name) =>
          `Your heartfelt question has been created. Share this special link with ${name} and take your relationship to the next level!`,
        nextStepsTitle: '💡 Next Steps - Make it Official!',
        nextStepsMessage: (name) =>
          `Copy the link above and send it to ${name}. You'll receive an email notification when he responds! 💙`
      },
      viewed: {
        subject: (name) => `💙 ${name} just viewed your boyfriend proposal!`,
        greeting: "He's Checking Out Your Proposal!",
        message: (name) =>
          `${name} just viewed your boyfriend proposal website! He's considering taking things to the next level. 💙`
      },
      yesClicked: {
        subject: (name) => `💙 ${name} said YES! He's your boyfriend now!`,
        greeting: 'He Said YES!',
        celebrationTitle: "💙 You're Official! 💙",
        celebrationMessage: (name) =>
          `${name} wants to be your boyfriend! Your relationship just reached a beautiful new milestone.`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          'Celebrate your new relationship status! This is the beginning of something special.'
      }
    }
  },

  [GiftReason.GIRLFRIEND_PROPOSAL]: {
    type: GiftReason.GIRLFRIEND_PROPOSAL,
    displayName: 'Girlfriend Proposal',
    emoji: '💗',
    description: 'Ask her to be your girlfriend',
    primaryColor: '#DB2777',
    secondaryColor: '#831843',
    backgroundGradient:
      'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
    ctaText: 'Be My Girlfriend?',
    questionText: (name) => `${name}, Will You Be My Girlfriend?`,
    successMessage: "You're my girlfriend now!",
    successSubTitleMessage: 'This is the beginning of something beautiful!',
    defaultRecipientName: {
      US: 'Emily',
      IN: 'Divya',
      UK: 'Sophie',
      default: 'Divya'
    },
    email: {
      purchaseCompleted: {
        subject:
          '💗 Your Girlfriend Proposal Website is Ready! Ask {{recipientName}} to Be Yours',
        greeting: 'Your Girlfriend Proposal Website is Ready!',
        celebrationTitle: '✨ Be My Girlfriend? ✨',
        celebrationMessage: (name) =>
          `Your heartfelt question has been created. Share this special link with ${name} and take your relationship to the next level!`,
        nextStepsTitle: '💡 Next Steps - Make it Official!',
        nextStepsMessage: (name) =>
          `Copy the link above and send it to ${name}. You'll receive an email notification when she responds! 💗`
      },
      viewed: {
        subject: (name) => `💗 ${name} just viewed your girlfriend proposal!`,
        greeting: "She's Checking Out Your Proposal!",
        message: (name) =>
          `${name} just viewed your girlfriend proposal website! She's considering taking things to the next level. 💗`
      },
      yesClicked: {
        subject: (name) => `💗 ${name} said YES! She's your girlfriend now!`,
        greeting: 'She Said YES!',
        celebrationTitle: "💗 You're Official! 💗",
        celebrationMessage: (name) =>
          `${name} wants to be your girlfriend! Your relationship just reached a beautiful new milestone.`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          'Celebrate your new relationship status! This is the beginning of something special.'
      }
    }
  },

  [GiftReason.ANNIVERSARY]: {
    type: GiftReason.ANNIVERSARY,
    displayName: 'Anniversary Gift',
    emoji: '🎂',
    description: 'Celebrate your special day together',
    primaryColor: '#7C3AED',
    secondaryColor: '#4C1D95',
    backgroundGradient:
      'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #d8b4fe 100%)',
    ctaText: 'Happy Anniversary!',
    questionText: (name) =>
      `${name}, Happy Anniversary My Love! Did You Like It?`,
    successMessage: "Here's to many more years together!",
    successSubTitleMessage: 'Every moment with you is a celebration!',
    successImageUrl:
      'https://i.pinimg.com/736x/4e/b2/38/4eb238041cfc82d880ca61870fde8aca.jpg',
    defaultRecipientName: {
      US: 'Emma',
      IN: 'Kavya',
      UK: 'Olivia',
      default: 'Kavya'
    },
    email: {
      purchaseCompleted: {
        subject:
          '🎂 Your Anniversary Gift Website is Ready! Celebrate with {{recipientName}}',
        greeting: 'Your Anniversary Gift Website is Ready!',
        celebrationTitle: '✨ Celebrating Your Love! ✨',
        celebrationMessage: (name) =>
          `Your beautiful anniversary surprise has been created. Share this special link with ${name} and celebrate your journey together!`,
        nextStepsTitle: '💡 Next Steps - Celebrate Together!',
        nextStepsMessage: (name) =>
          `Copy the link above and share it with ${name}. Make this anniversary extra special! 🎂`
      },
      viewed: {
        subject: (name) => `🎂 ${name} just viewed your anniversary gift!`,
        greeting: "They're Viewing Your Anniversary Surprise!",
        message: (name) =>
          `${name} just viewed your anniversary gift website! Your thoughtful gesture is being discovered right now. 🎂`
      },
      yesClicked: {
        subject: (name) => `🎂 ${name} loved your anniversary gift!`,
        greeting: 'They Loved It!',
        celebrationTitle: '🎂 Happy Anniversary! 🎂',
        celebrationMessage: (name) =>
          `${name} appreciated your anniversary gift! Here's to celebrating the beautiful journey you've shared together.`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          'Keep making memories together! Every anniversary is a milestone worth celebrating.'
      }
    }
  },

  [GiftReason.BIRTHDAY]: {
    type: GiftReason.BIRTHDAY,
    displayName: 'Birthday Gift',
    emoji: '🎉',
    description: 'Make their birthday extra special',
    primaryColor: '#EA580C',
    secondaryColor: '#9A3412',
    backgroundGradient:
      'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
    ctaText: 'Happy Birthday!',
    questionText: (name) => `${name}, Happy Birthday! Did You Like It?`,
    successMessage: "Let's make it the best birthday ever!",
    successSubTitleMessage: "Here's to celebrating you today!",
    defaultRecipientName: {
      US: 'Mia',
      IN: 'Aditi',
      UK: 'Amelia',
      default: 'Aditi'
    },
    email: {
      purchaseCompleted: {
        subject:
          '🎉 Your Birthday Gift Website is Ready! Surprise {{recipientName}}',
        greeting: 'Your Birthday Gift Website is Ready!',
        celebrationTitle: '✨ Happy Birthday! ✨',
        celebrationMessage: (name) =>
          `Your birthday surprise has been beautifully created. Share this special link with ${name} and make their day unforgettable!`,
        nextStepsTitle: '💡 Next Steps - Spread the Birthday Joy!',
        nextStepsMessage: (name) =>
          `Copy the link above and send it to ${name}. Make their birthday extra special! 🎉`
      },
      viewed: {
        subject: (name) => `🎉 ${name} just viewed your birthday gift!`,
        greeting: "They're Opening Your Birthday Surprise!",
        message: (name) =>
          `${name} just viewed your birthday gift website! Your birthday surprise is being discovered right now. 🎉`
      },
      yesClicked: {
        subject: (name) => `🎉 ${name} loved your birthday gift!`,
        greeting: 'They Loved It!',
        celebrationTitle: '🎉 Birthday Joy! 🎉',
        celebrationMessage: (name) =>
          `${name} appreciated your birthday gift! You've made their special day even more memorable.`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          'Time to celebrate together! Make this birthday one to remember.'
      }
    }
  },

  [GiftReason.APOLOGY]: {
    type: GiftReason.APOLOGY,
    displayName: 'Apology',
    emoji: '🙏',
    description: 'Say sorry in a heartfelt way',
    primaryColor: '#4F46E5',
    secondaryColor: '#312E81',
    backgroundGradient:
      'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
    ctaText: 'Forgive Me?',
    questionText: (name) => `${name}, I'm Really Sorry. Will You Forgive Me?`,
    successMessage: 'Thank you for forgiving me!',
    successSubTitleMessage: "I'm truly sorry and value our relationship!",
    successImageUrl:
      'https://i.pinimg.com/originals/9a/75/32/9a7532b2e066d41c9940e0d5c1ad5ba6.gif',
    defaultRecipientName: {
      US: 'Rachel',
      IN: 'Kavya',
      UK: 'Grace',
      default: 'Kavya'
    },
    email: {
      purchaseCompleted: {
        subject:
          '🙏 Your Apology Website is Ready! Make Amends with {{recipientName}}',
        greeting: 'Your Apology Website is Ready!',
        celebrationTitle: '✨ A Heartfelt Sorry ✨',
        celebrationMessage: (name) =>
          `Your sincere apology has been crafted. Share this special link with ${name} and show how much you care!`,
        nextStepsTitle: '💡 Next Steps - Make Things Right!',
        nextStepsMessage: (name) =>
          `Copy the link above and send it to ${name}. You'll receive an email notification when they respond to your apology! 🙏`
      },
      viewed: {
        subject: (name) => `🙏 ${name} just viewed your apology!`,
        greeting: "They're Reading Your Apology!",
        message: (name) =>
          `${name} just viewed your apology website! Your sincere message is reaching them. 🙏`
      },
      yesClicked: {
        subject: (name) => `🙏 ${name} forgave you!`,
        greeting: 'They Forgave You!',
        celebrationTitle: '✨ Forgiveness ✨',
        celebrationMessage: (name) =>
          `${name} accepted your apology! This is a step towards healing and moving forward together.`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          'Keep the communication open and work on rebuilding trust. Actions speak louder than words.'
      }
    }
  },

  [GiftReason.JUST_BECAUSE]: {
    type: GiftReason.JUST_BECAUSE,
    displayName: 'Just Because',
    emoji: '🌟',
    description: 'No reason needed to make someone smile',
    primaryColor: '#0D9488',
    secondaryColor: '#134E4A',
    backgroundGradient:
      'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #99f6e4 100%)',
    ctaText: "You're Special!",
    questionText: (name) =>
      `${name}, Just Wanted To Say You're Amazing! Did You Like It?`,
    successMessage: 'You made my day!',
    successSubTitleMessage: 'Every moment with you is special!',
    defaultRecipientName: {
      US: 'Lily',
      IN: 'Isha',
      UK: 'Charlotte',
      default: 'Isha'
    },
    email: {
      purchaseCompleted: {
        subject:
          "🌟 Your 'Just Because' Gift Website is Ready! Brighten {{recipientName}}'s Day",
        greeting: "Your 'Just Because' Gift Website is Ready!",
        celebrationTitle: "✨ You're Special! ✨",
        celebrationMessage: (name) =>
          `Your thoughtful gesture has been created. Share this special link with ${name} and brighten their day!`,
        nextStepsTitle: '💡 Next Steps - Spread the Joy!',
        nextStepsMessage: (name) =>
          `Copy the link above and send it to ${name}. Sometimes the best gifts come without a reason! 🌟`
      },
      viewed: {
        subject: (name) => `🌟 ${name} just viewed your 'Just Because' gift!`,
        greeting: "They're Discovering Your Surprise!",
        message: (name) =>
          `${name} just viewed your 'Just Because' gift website! Your thoughtful gesture is bringing a smile to their face. 🌟`
      },
      yesClicked: {
        subject: (name) => `🌟 ${name} loved your surprise!`,
        greeting: 'They Loved It!',
        celebrationTitle: '✨ Joy Delivered! ✨',
        celebrationMessage: (name) =>
          `${name} appreciated your thoughtful gesture! Random acts of kindness like this make the world brighter.`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          'Keep spreading joy and making people smile! Sometimes the best moments are the unexpected ones.'
      }
    }
  },

  [GiftReason.FIRST_DATE]: {
    type: GiftReason.FIRST_DATE,
    displayName: 'First Date',
    emoji: '☕',
    description: 'Celebrate or reminisce about your first date',
    primaryColor: '#B45309',
    secondaryColor: '#78350F',
    backgroundGradient:
      'linear-gradient(135deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)',
    ctaText: 'Remember Our First Date?',
    questionText: (name) => `${name}, Remember When We First Met?`,
    successMessage: 'What a special memory!',
    successSubTitleMessage: "Here's to many more memories together!",
    defaultRecipientName: {
      US: 'Hannah',
      IN: 'Divya',
      UK: 'Isabella',
      default: 'Divya'
    },
    email: {
      purchaseCompleted: {
        subject:
          '☕ Your First Date Memory Website is Ready! Share it with {{recipientName}}',
        greeting: 'Your First Date Memory Website is Ready!',
        celebrationTitle: '✨ Remember When We First Met? ✨',
        celebrationMessage: (name) =>
          `Your beautiful memory has been captured. Share this special link with ${name} and relive that magical first moment!`,
        nextStepsTitle: '💡 Next Steps - Relive the Memory!',
        nextStepsMessage: (name) =>
          `Copy the link above and send it to ${name}. Take a trip down memory lane together! ☕`
      },
      viewed: {
        subject: (name) => `☕ ${name} just viewed your first date memory!`,
        greeting: "They're Looking Back at Your First Date!",
        message: (name) =>
          `${name} just viewed your first date memory website! They're reliving that special moment with you. ☕`
      },
      yesClicked: {
        subject: (name) => `☕ ${name} cherished the first date memory!`,
        greeting: 'They Remember Too!',
        celebrationTitle: '✨ Special Memories ✨',
        celebrationMessage: (name) =>
          `${name} enjoyed reminiscing about your first date! Those beautiful first moments are treasures worth remembering.`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          'Keep creating new memories together! Every moment with them can become a cherished memory.'
      }
    }
  },

  [GiftReason.LOVE_CONFESSION]: {
    type: GiftReason.LOVE_CONFESSION,
    displayName: 'Love Confession',
    emoji: '❤️',
    description: 'Tell someone you love them for the first time',
    primaryColor: '#DC2626',
    secondaryColor: '#7F1D1D',
    backgroundGradient:
      'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
    ctaText: 'I Love You!',
    questionText: (name) => `${name}, I Love You! Do You Love Me Too?`,
    successMessage: 'I love you too!',
    successSubTitleMessage: 'You mean everything to me!',
    defaultRecipientName: {
      US: 'Sophia',
      IN: 'Natasha',
      UK: 'Ella',
      default: 'Natasha'
    },
    email: {
      purchaseCompleted: {
        subject:
          '❤️ Your Love Confession Website is Ready! Say "I Love You" to {{recipientName}}',
        greeting: 'Your Love Confession Website is Ready!',
        celebrationTitle: '✨ I Love You! ✨',
        celebrationMessage: (name) =>
          `Your heartfelt confession has been created. Share this special link with ${name} and express your love!`,
        nextStepsTitle: '💡 Next Steps - Share Your Love!',
        nextStepsMessage: (name) =>
          `Copy the link above and send it to ${name}. You'll receive an email notification when they see your message! ❤️`
      },
      viewed: {
        subject: (name) => `❤️ ${name} just viewed your love confession!`,
        greeting: "They're Reading Your Love Confession!",
        message: (name) =>
          `${name} just viewed your love confession website! Your heartfelt message is reaching them right now. ❤️`
      },
      yesClicked: {
        subject: (name) => `❤️ ${name} loves you too!`,
        greeting: 'The Feeling is Mutual!',
        celebrationTitle: '❤️ Love Returned! ❤️',
        celebrationMessage: (name) =>
          `${name} reciprocated your love! This is the beginning of a beautiful love story.`,
        nextStepsTitle: "💡 What's Next?",
        nextStepsMessage:
          'Celebrate your mutual love! This is a moment to treasure as you begin this journey together.'
      }
    }
  },

  [GiftReason.HOLI_COLOR_THROW]: {
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
    questionText: (name) => `${name}, Bura Na Mano Holi Hai! 🎨`,
    successMessage: 'Happy Holi! 🌈',
    successSubTitleMessage: 'May your life be as colorful as this Holi!',
    isHoliGift: true,
    defaultRecipientName: {
      US: 'Friend',
      IN: 'Yaar',
      UK: 'Mate',
      default: 'Yaar'
    },
    email: {
      purchaseCompleted: {
        subject:
          '🎨 Your Holi Color Throw is Ready! Send it to {{recipientName}}',
        greeting: 'Your Holi Surprise is Ready!',
        celebrationTitle: '🌈 Bura Na Mano, Holi Hai! 🌈',
        celebrationMessage: (name) =>
          `Your colorful surprise for ${name} has been created! Share the link and let the colors fly!`,
        nextStepsTitle: '💡 Next Steps - Throw the Colors!',
        nextStepsMessage: (name) =>
          `Copy the link and send it to ${name} on WhatsApp. They tap the screen and get drenched in Holi colors! 🎨`
      },
      viewed: {
        subject: (name) => `🎨 ${name} just opened your Holi surprise!`,
        greeting: "They've Opened Your Holi Gift!",
        message: (name) =>
          `${name} just opened your Holi color throw! They are about to get drenched in virtual Holi colors! 🌈`
      },
      yesClicked: {
        subject: (name) => `🌈 ${name} got drenched in your Holi colors!`,
        greeting: 'Colors Thrown Successfully!',
        celebrationTitle: '🎨 Happy Holi! 🎨',
        celebrationMessage: (name) =>
          `${name} experienced your colorful Holi surprise! May this Holi bring joy and happiness to both of you.`,
        nextStepsTitle: '💡 Keep Celebrating!',
        nextStepsMessage:
          'Wishing you a very Happy Holi! May all the colors of Holi fill your life with joy and happiness.'
      }
    }
  },

  [GiftReason.HOLI_PICHKARI_GAME]: {
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
    questionText: (name) => `${name}, Your Pichkari is Loaded! 💦`,
    successMessage: "You've Been Drenched! Happy Holi! 🌊",
    successSubTitleMessage: 'May your life be splashed with joy and color!',
    isHoliGift: true,
    defaultRecipientName: {
      US: 'Friend',
      IN: 'Dost',
      UK: 'Mate',
      default: 'Dost'
    },
    email: {
      purchaseCompleted: {
        subject: '💦 Your Pichkari Game is Ready! Send it to {{recipientName}}',
        greeting: 'Your Holi Pichkari Game is Ready!',
        celebrationTitle: '💦 Load the Pichkari! 💦',
        celebrationMessage: (name) =>
          `Your interactive Holi pichkari game for ${name} is ready! Send them the link and let the fun begin!`,
        nextStepsTitle: '💡 Next Steps - Send the Pichkari!',
        nextStepsMessage: (name) =>
          `Share the link with ${name}. They spray 5 color targets and unlock your special Holi message! 💦`
      },
      viewed: {
        subject: (name) => `💦 ${name} is playing your Pichkari Game!`,
        greeting: "They're Playing Your Holi Game!",
        message: (name) =>
          `${name} just opened your Holi Pichkari game! They're spraying color targets to unlock your message. 💦`
      },
      yesClicked: {
        subject: (name) => `💦 ${name} completed your Pichkari challenge!`,
        greeting: 'Game Completed!',
        celebrationTitle: '🎉 They Sprayed Every Target! 🎉',
        celebrationMessage: (name) =>
          `${name} completed your Holi pichkari challenge and unlocked your message! Happy Holi!`,
        nextStepsTitle: '💡 Keep the Fun Going!',
        nextStepsMessage:
          'Spread the Holi spirit! Share this game with more friends and family to celebrate together.'
      }
    }
  },

  [GiftReason.HOLI_GULAL_PACKET]: {
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
    questionText: (name) => `${name}, Your Gulal Packet Has Arrived! 🌺`,
    successMessage: 'Happy Holi! These Colors Are for You 🌈',
    successSubTitleMessage:
      'Each color in this gulal holds a special meaning for you',
    isHoliGift: true,
    defaultRecipientName: {
      US: 'Friend',
      IN: 'Yaar',
      UK: 'Mate',
      default: 'Yaar'
    },
    email: {
      purchaseCompleted: {
        subject: '🌺 Your Gulal Packet is Ready! Send it to {{recipientName}}',
        greeting: 'Your Digital Gulal Packet is Ready!',
        celebrationTitle: '🌺 Open the Gulal! 🌺',
        celebrationMessage: (name) =>
          `Your beautiful digital gulal packet for ${name} is ready! Each color carries a special meaning just for them.`,
        nextStepsTitle: '💡 Next Steps - Send the Gulal!',
        nextStepsMessage: (name) =>
          `Share the link with ${name}. They tap to burst the gulal and discover what each color means for them! 🌺`
      },
      viewed: {
        subject: (name) => `🌺 ${name} just opened your Gulal Packet!`,
        greeting: "They've Received Your Gulal!",
        message: (name) =>
          `${name} just opened your digital gulal packet! They are discovering the colorful meanings you've sent them. 🌺`
      },
      yesClicked: {
        subject: (name) => `🌺 ${name} loved your Gulal Packet!`,
        greeting: 'Gulal Received with Love!',
        celebrationTitle: '🌈 Colors of Joy! 🌈',
        celebrationMessage: (name) =>
          `${name} loved the colors in your gulal packet! Your thoughtful Holi gift brought joy to their day.`,
        nextStepsTitle: '💡 Keep Celebrating!',
        nextStepsMessage:
          'May the colors of Holi brighten every day of your year! Wishing you a joyful and colorful festival.'
      }
    }
  },

  [GiftReason.HOLI_MEMORY_CAPSULE]: {
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
    questionText: (name) => `${name}, A Holi Memory Capsule Awaits You! 📸`,
    successMessage: 'Happy Holi! This One is Special for You 🌈',
    successSubTitleMessage:
      'Wishing you colors, joy, and beautiful memories this Holi!',
    isHoliGift: true,
    defaultRecipientName: {
      US: 'Friend',
      IN: 'Yaar',
      UK: 'Mate',
      default: 'Yaar'
    },
    email: {
      purchaseCompleted: {
        subject:
          '📸 Your Holi Memory Capsule is Ready! Send it to {{recipientName}}',
        greeting: 'Your Holi Memory Capsule is Ready!',
        celebrationTitle: '📸 Open the Memory Capsule! 📸',
        celebrationMessage: (name) =>
          `Your Holi memory capsule for ${name} has been sealed with love! Share the link and let the memories unfold.`,
        nextStepsTitle: '💡 Next Steps - Send the Capsule!',
        nextStepsMessage: (name) =>
          `Share the link with ${name}. They open the capsule through a colorful Holi animation and discover your special message! 📸`
      },
      viewed: {
        subject: (name) => `📸 ${name} just opened your Holi Memory Capsule!`,
        greeting: "They've Opened Your Memory Capsule!",
        message: (name) =>
          `${name} just opened your Holi memory capsule! Your heartfelt Holi message is being revealed to them right now. 📸`
      },
      yesClicked: {
        subject: (name) => `📸 ${name} loved your Holi Memory Capsule!`,
        greeting: 'Memory Capsule Opened!',
        celebrationTitle: '🌈 Beautiful Memories! 🌈',
        celebrationMessage: (name) =>
          `${name} loved your Holi memory capsule! Your thoughtful gesture made this Holi extra special for them.`,
        nextStepsTitle: '💡 Keep Creating Memories!',
        nextStepsMessage:
          'Life is made of beautiful moments like these. Wishing you a very Happy Holi filled with joy and colorful memories!'
      }
    }
  }
};
