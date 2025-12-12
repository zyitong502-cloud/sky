import { ThemeColor, TarotCard } from './types';

export const THEMES: Record<string, ThemeColor> = {
  DESERT: {
    primary: '#FFD700', // Gold
    secondary: '#FF8C00', // Dark Orange
    accent: '#F4A460', // Sandy Brown
    background: '#3d1c02', // Deep Brownish Red
  },
  GRASSLAND: {
    primary: '#7CFC00', // Lawn Green
    secondary: '#20B2AA', // Light Sea Green
    accent: '#F0FFF0', // Honeydew
    background: '#1a472a', // Deep Forest Green
  },
  RAINFOREST: {
    primary: '#00BFFF', // Deep Sky Blue
    secondary: '#483D8B', // Dark Slate Blue
    accent: '#E6E6FA', // Lavender
    background: '#0a0a23', // Very Dark Blue
  },
  VALLEY: {
    primary: '#FF69B4', // Hot Pink
    secondary: '#FF4500', // Orange Red
    accent: '#FFDAB9', // Peach Puff
    background: '#4a0e0e', // Dark Reddish
  },
  GALAXY: {
    primary: '#00FFFF', // Cyan
    secondary: '#9370DB', // Medium Purple
    accent: '#E0FFFF', // Light Cyan
    background: '#0f172a', // Slate 900
  },
  ASCENSION: {
    primary: '#FFFFFF', 
    secondary: '#87CEEB', 
    accent: '#FFFFFF',
    background: '#4ca1ff', // Blue Sky
  }
};

export const MAX_SPEED = 2.0;
export const MIN_SPEED = 0.1;
export const ACCELERATION_RATE = 0.05;
export const DECELERATION_RATE = 0.02;
export const TOTAL_ANGEL_COUNT = 15;
export const ANGEL_PARTICLE_COUNT = 600;
export const COLLECTION_DISTANCE_THRESHOLD = 100.0;

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name: "The Fool", nameCN: "愚者", meaning: "新的开始，自由的灵魂，无限的潜力，相信直觉的冒险。" },
  { id: 1, name: "The Magician", nameCN: "魔术师", meaning: "创造力，意志力，化腐朽为神奇，掌握命运的主动权。" },
  { id: 2, name: "The High Priestess", nameCN: "女祭司", meaning: "直觉，神秘，内在的声音，静默中的智慧。" },
  { id: 3, name: "The Empress", nameCN: "皇后", meaning: "丰饶，母性，自然的馈赠，感官的愉悦与创造力的开花结果。" },
  { id: 4, name: "The Emperor", nameCN: "皇帝", meaning: "权威，结构，稳固的基础，理性的领导与守护。" },
  { id: 5, name: "The Hierophant", nameCN: "教皇", meaning: "传统，精神指引，信仰的力量，群体中的智慧传承。" },
  { id: 6, name: "The Lovers", nameCN: "恋人", meaning: "爱，和谐，重要的抉择，灵魂的共鸣与结合。" },
  { id: 7, name: "The Chariot", nameCN: "战车", meaning: "意志的胜利，克服障碍，明确的目标，掌控冲突并前行。" },
  { id: 8, name: "Strength", nameCN: "力量", meaning: "内在的勇气，耐心，以柔克刚，对他人的宽容与爱。" },
  { id: 9, name: "The Hermit", nameCN: "隐士", meaning: "内省，寻找真理，独处的智慧，来自内心深处的指引。" },
  { id: 10, name: "Wheel of Fortune", nameCN: "命运之轮", meaning: "循环，改变，机遇，顺应命运的流转。" },
  { id: 11, name: "Justice", nameCN: "正义", meaning: "公平，真理，因果循环，诚实面对自己的内心。" },
  { id: 12, name: "The Hanged Man", nameCN: "倒吊人", meaning: "换个角度看世界，牺牲与奉献，等待中的智慧，放下执念。" },
  { id: 13, name: "Death", nameCN: "死神", meaning: "结束与重生，彻底的改变，放下过去，迎接新的阶段。" },
  { id: 14, name: "Temperance", nameCN: "节制", meaning: "平衡，治愈，融合，寻找生活中的中庸之道。" },
  { id: 15, name: "The Devil", nameCN: "恶魔", meaning: "束缚，欲望，物质的诱惑，正视内心的阴影。" },
  { id: 16, name: "The Tower", nameCN: "高塔", meaning: "突变，觉醒，打破旧有的结构，虽然痛苦却是必要的重建。" },
  { id: 17, name: "The Star", nameCN: "星星", meaning: "希望，灵感，宁静，治愈的能量，指引方向的光芒。" },
  { id: 18, name: "The Moon", nameCN: "月亮", meaning: "潜意识，梦境，不安与迷惑，探索内心未知的领域。" },
  { id: 19, name: "The Sun", nameCN: "太阳", meaning: "喜悦，成功，活力，纯真的快乐，光明的前景。" },
  { id: 20, name: "Judgement", nameCN: "审判", meaning: "觉醒，复活，内心的召唤，清晰的判断与新的决定。" },
  { id: 21, name: "The World", nameCN: "世界", meaning: "圆满，完成，达成目标，完美的旅程终点，也是新的起点。" }
];