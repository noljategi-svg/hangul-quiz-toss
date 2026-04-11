export type Mode = 'spelling' | 'idiom' | 'proverb';

export interface Question {
  lv: number;
  q: string;
  hint: string;
  opts: string[];
  ans: number;
  exp: string;
  idiom?: string;
}

export interface Level {
  lv: number;
  name: string;
  icon: string;
  minXP: number;
  maxXP: number;
  color: string;
}

export interface Stats {
  streak: number;
  lastDate: string;
  total: number;
  correct: number;
  totalPts: number;
  bestScore: number;
}

export interface ModeXP {
  spelling: number;
  idiom: number;
  proverb: number;
}

export interface RankEntry {
  nick: string;
  pts: number;
  play: number;
  rate: number;
  tier: string;
  spelling?: number;
  idiom?: number;
  proverb?: number;
  isMe?: boolean;
}

export interface Mission {
  date: string;
  dm1: boolean;
  dm2: boolean;
  dm3: boolean;
  dm4: boolean;
}

export interface Report {
  type: string;
  mode: string;
  lv: number;
  q: string;
  opts: string[];
  ans: number;
  exp: string;
  nick: string;
  status: string;
}
