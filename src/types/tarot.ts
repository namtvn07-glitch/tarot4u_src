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
  quote?: string;
  keywords?: string[];
  keywordsReversed?: string[];
  uprightKeywords?: string[];
  reversedKeywords?: string[];

  // Bí danh snake_case. KHÔNG thừa: cùng những component này còn nhận được
  // thẻ hình dạng DB (`Card` trong src/lib/cards.ts, dùng name_en/name_vi/
  // image_filename), nên khắp UI có chuỗi `card.nameVi || card.name_vi`.
  // Trước đây chỗ nào cũng ép `any` nên sự thật đó bị giấu — khai ra ở đây
  // để TypeScript mô tả đúng cái đang chạy.
  //
  // Dọn thật sự là chuẩn hoá thẻ DB về TarotCard ngay tại ranh giới rồi xoá
  // hẳn khối này, nhưng đó là đổi hành vi nên để thành việc riêng.
  name_en?: string;
  name_vi?: string;
  image_filename?: string;
  upright_keywords?: string[];
  reversed_keywords?: string[];
  summary?: string;
  psychologySummary?: string;
  uprightMeaning?: string;
  reversedMeaning?: string;
  careerFinance?: string;
  loveRelationship?: string;
  readingAdvice?: string;
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

// Dòng thô từ bảng `readings` của Supabase — đúng các cột mà trang lịch sử
// và trang chi tiết đang select. Tách ra đây vì cả 3 nơi cùng map một hình
// dạng này; để ở file types (không import gì) nên client lẫn server đều dùng
// được.
export interface DrawnCardRow {
  card_id: string;
  orientation?: CardOrientation;
  position?: number;
}

export interface ReadingRow {
  id: string;
  created_at: string;
  topic: string | null;
  tier?: string | null;
  question: string | null;
  cards_drawn: DrawnCardRow[] | null;
  personal_body: string | null;
}

// Dòng thô từ bảng `credit_ledger`, đúng các cột trang tài khoản select.
export interface CreditLedgerRow {
  id: string;
  delta: number;
  balance_after: number;
  reason: string;
  created_at: string;
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
