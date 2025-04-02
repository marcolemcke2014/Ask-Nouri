/**
 * Types related to user feedback and ratings
 */

// Feedback sentiment
export enum FeedbackSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

// Post-meal feeling
export enum PostMealFeeling {
  GREAT = 'great',
  GOOD = 'good',
  OKAY = 'okay',
  NOT_GREAT = 'not_great',
  BAD = 'bad',
}

// Feedback category
export enum FeedbackCategory {
  ACCURACY = 'accuracy',
  RECOMMENDATION = 'recommendation',
  USER_EXPERIENCE = 'user_experience',
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  OTHER = 'other',
}

// Meal feedback request
export type MealFeedbackRequest = {
  userId?: string;
  analysisId?: string;
  menuItemId?: string;
  dishName: string;
  rating: number; // 1-5 star rating
  followedRecommendation?: boolean;
  notes?: string;
  feelingAfter?: PostMealFeeling;
  symptoms?: string[];
  wouldEatAgain?: boolean;
};

// App feedback request
export type AppFeedbackRequest = {
  userId?: string;
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  message: string;
  screenPath?: string;
  appVersion?: string;
  deviceInfo?: {
    platform: string;
    browser?: string;
    screenSize?: string;
  };
};

// Feature request
export type FeatureRequest = {
  userId?: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  useCase?: string;
  willingness?: 'would_pay' | 'would_use' | 'nice_to_have';
};

// Bug report
export type BugReport = {
  userId?: string;
  title: string;
  description: string;
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  screenshot?: string; // base64 encoded image
  logs?: string;
  deviceInfo?: {
    platform: string;
    browser?: string;
    screenSize?: string;
    os?: string;
    appVersion?: string;
  };
  priority?: 'low' | 'medium' | 'high' | 'critical';
};

// AI accuracy feedback
export type AIAccuracyFeedback = {
  userId?: string;
  analysisId: string;
  menuItemId: string;
  issue: 'wrong_rating' | 'wrong_tags' | 'wrong_nutrition' | 'missing_ingredients' | 'other';
  details?: string;
  correctedValue?: string;
}; 