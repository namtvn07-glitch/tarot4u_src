export type AppScreen = 'home' | 'quick-read' | 'deep-read' | 'library' | 'card-detail' | 'account';

export type ArcanaType = 'major' | 'minor' | 'cups' | 'swords' | 'wands' | 'pentacles';
export type CardSuit = 'wands' | 'cups' | 'swords' | 'pentacles';
export type CardOrientation = 'upright' | 'reversed';

export type Topic = 'love' | 'career' | 'finance' | 'spiritual' | 'general';
export type TarotTopic = Topic;
export type TarotSpread = 'single' | 'three_card' | 'celtic_cross';

export interface TopicItem {
  id: Topic | string;
  nameVi: string;
  descVi: string;
  icon: string;
}

export interface TarotCard {
  id: string;
  number: number | string;
  name: string;
  nameVi: string;
  arcana?: 'major' | 'minor';
  arcanaType?: ArcanaType;
  arcanaLabelVi?: string;
  suit?: CardSuit;
  image?: string;
  imageUrl?: string;
  image_filename?: string;
  quote?: string;
  keywords?: string[];
  keywordsReversed?: string[];
  uprightKeywords?: string[];
  reversedKeywords?: string[];
  summary?: string;
  psychologySummary?: string;
  uprightMeaning?: string;
  reversedMeaning?: string;
  careerFinance?: string;
  loveRelationship?: string;
  ventusAdvice?: string;
  element?: 'Lửa' | 'Nước' | 'Khí' | 'Đất' | string;
  astrology?: string;
}

export interface DrawnCard {
  card: TarotCard;
  orientation: CardOrientation;
  positionName: string;
  meaningText?: string;
}

export interface ReadingHistoryItem {
  id: string;
  date: string;
  topic?: string;
  topicVi?: string;
  type?: 'deep' | 'quick';
  category?: string;
  categoryVi?: string;
  categoryIcon?: string;
  title?: string;
  summary?: string;
  question?: string;
  cards: {
    card?: TarotCard;
    name?: string;
    nameVi?: string;
    image?: string;
    imageUrl?: string;
    orientation?: CardOrientation;
    position?: string;
    positionLabel?: string;
    positionLabelVi?: string;
  }[];
  personalBody?: string;
  aiInterpretation?: string;
  isFavorite?: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  credits: number;
  avatarUrl?: string;
  isLoggedIn: boolean;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonusCredits?: number;
  priceVnd: number;
  priceFormatted?: string;
  description?: string;
  popular?: boolean;
  isPopular?: boolean;
  iconName?: string;
  features?: string[];
}
