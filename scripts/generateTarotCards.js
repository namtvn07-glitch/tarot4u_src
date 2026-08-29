const fs = require("fs");
const path = require("path");

const cardsData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/cards.json"), "utf8"));
const baseContent = JSON.parse(fs.readFileSync(path.join(__dirname, "../scripts/base-content/output/base-content.json"), "utf8"));

// Create lookup for base content by card_id
const baseMap = {};
for (const item of baseContent) {
  if (!baseMap[item.card_id]) {
    baseMap[item.card_id] = {};
  }
  if (!baseMap[item.card_id][item.orientation]) {
    baseMap[item.card_id][item.orientation] = {};
  }
  baseMap[item.card_id][item.orientation][item.topic] = item;
}

const suitLabels = {
  wands: "Gậy",
  cups: "Cốc",
  swords: "Kiếm",
  pentacles: "Tiền"
};

const fullCards = cardsData.cards.map((c) => {
  const uprightContent = baseMap[c.id]?.upright || {};
  const reversedContent = baseMap[c.id]?.reversed || {};
  
  const arcanaLabel = c.arcana === "major" 
    ? "Bộ Ẩn Chính" 
    : (c.suit ? "Bộ " + (suitLabels[c.suit] || c.suit) : "Bộ Ẩn Phụ");

  const careerFinanceText = uprightContent.career?.summary || uprightContent.money?.summary || "Định hướng phát triển và nắm bắt cơ hội tài chính, công việc.";
  const loveText = uprightContent.love?.summary || "Mở lòng, gắn kết chân thành và đón nhận cảm xúc tích cực.";
  const psychologyText = uprightContent.general?.summary || uprightContent.mind?.summary || "Phản chiếu sự cân bằng và trạng thái nhận thức nội tâm.";
  const ventusAdviceText = uprightContent.general?.body?.slice(0, 240) || uprightContent.love?.body?.slice(0, 240) || "Hãy lắng nghe trực giác và đưa ra lựa chọn với sự bình tâm.";

  return {
    id: c.id,
    number: c.number,
    name: c.name_en,
    nameVi: c.name_vi,
    arcana: c.arcana,
    arcanaType: c.arcana === "major" ? "major" : (c.suit || "minor"),
    arcanaLabelVi: arcanaLabel,
    suit: c.suit || undefined,
    imageUrl: `/cards/${c.image_filename}`,
    image: `/cards/${c.image_filename}`,
    image_filename: c.image_filename,
    uprightKeywords: c.upright_keywords || [],
    reversedKeywords: c.reversed_keywords || [],
    keywords: c.upright_keywords || [],
    psychologySummary: psychologyText,
    careerFinance: careerFinanceText,
    loveRelationship: loveText,
    ventusAdvice: ventusAdviceText,
    quote: uprightContent.general?.summary || uprightContent.love?.summary || undefined
  };
});

const tsCode = `import { TarotCard, TopicItem } from "@/types/tarot";

export const CARD_BACK_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCMQ7TgNzaIKmSUtza16EjN59e_D9iWzcJQsxf1Vv-_YhdTn-W1Rk07WM0t0xjuXsL96UwFAX8VPmTsQWol_d5FMRtfEgH28Bo552t1VF7f1m-QCkLbMlyLGh0AcgpsRL9YBNV9sssluFMUM2m57OLBdWb9QhqkOSM34PafCu0G66DSogZgoCdvxMgf9YJ-FD8X-zJk-w7kvh5YUmxwL1heCpdBEXoNSg6t3qj4TSVyg6wLEQNy2tg";
export const VENTUS_TAROT_LOGO = "/cards/the-magician.jpg";

export const TOPICS: TopicItem[] = [
  {
    id: "general",
    nameVi: "Tổng Quan",
    descVi: "Bức tranh toàn cảnh về năng lượng và bài học cuộc sống hiện tại.",
    icon: "explore"
  },
  {
    id: "love",
    nameVi: "Tình Yêu",
    descVi: "Thấu hiểu các mối liên kết, rung động cảm xúc và chữa lành trái tim.",
    icon: "favorite"
  },
  {
    id: "career",
    nameVi: "Sự Nghiệp",
    descVi: "Soi sáng hướng đi nghề nghiệp, thử thách và cơ hội thăng tiến.",
    icon: "work"
  },
  {
    id: "finance",
    nameVi: "Tài Chính",
    descVi: "Dòng chảy thịnh vượng, đầu tư và cách quản lý tài nguyên.",
    icon: "monetization_on"
  },
  {
    id: "spiritual",
    nameVi: "Tâm Linh",
    descVi: "Khai mở trực giác, khám phá bóng tối nội tâm và phát triển nhận thức.",
    icon: "self_improvement"
  }
];

export const TAROT_CARDS: TarotCard[] = ${JSON.stringify(fullCards, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, "../src/data/tarotCards.ts"), tsCode, "utf8");
console.log("Successfully generated all " + fullCards.length + " cards in src/data/tarotCards.ts");
