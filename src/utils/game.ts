import type { Level, Stats, ModeXP, Question } from '../types'; // eslint-disable-line

export const LEVELS: Level[] = [
  { lv: 1, name: '입문', icon: '🌱', minXP: 0,    maxXP: 100,  color: '#8a7a6a' },
  { lv: 2, name: '초급', icon: '📖', minXP: 100,  maxXP: 300,  color: '#2d7a4f' },
  { lv: 3, name: '중급', icon: '✏️', minXP: 300,  maxXP: 700,  color: '#1a5fa8' },
  { lv: 4, name: '고급', icon: '🔥', minXP: 700,  maxXP: 1500, color: '#c84b2f' },
  { lv: 5, name: '마스터', icon: '👑', minXP: 1500, maxXP: 9999, color: '#d4a017' },
];

export const N = 10;
export const USER_MAX_FREE_LV = 2;

export function getLevel(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getLevelProgress(xp: number): number {
  const lv = getLevel(xp);
  const range = lv.maxXP - lv.minXP;
  const progress = xp - lv.minXP;
  return Math.min(Math.round(progress / range * 100), 100);
}

export function calcPts(score: number, streak: number): number {
  let pts = score * 10;
  if (score === N) pts += 50;
  pts += streak * 5;
  if (score / N * 100 >= 80) pts += 20;
  return pts;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function loadStats(): Stats {
  return JSON.parse(localStorage.getItem('kq_stats2') || 
    '{"streak":0,"lastDate":"","total":0,"correct":0,"totalPts":0,"bestScore":0}');
}

export function saveStats(stats: Stats): void {
  localStorage.setItem('kq_stats2', JSON.stringify(stats));
}

export function loadModeXP(): ModeXP {
  return JSON.parse(localStorage.getItem('kq_mode_xp') || 
    '{"spelling":0,"idiom":0,"proverb":0}');
}

export function saveModeXP(modeXP: ModeXP): void {
  localStorage.setItem('kq_mode_xp', JSON.stringify(modeXP));
}

export function loadNick(): string {
  return localStorage.getItem('kq_nick') || '익명';
}

export function saveNick(nick: string): void {
  localStorage.setItem('kq_nick', nick);
}

// 문제 랜덤 셔플 + 보기 순서도 섞기
export function getDailyQ(data: Question[], n: number, diffLv: number): Question[] {
  let filtered = data.filter(q => !q.lv || q.lv === diffLv);
  if (filtered.length < n) filtered = data;

  // 문제 셔플
  const arr = [...filtered];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // 보기 순서 셔플
  return arr.slice(0, n).map(q => {
    const indices = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const newOpts = indices.map(idx => q.opts[idx]);
    const newAns = indices.indexOf(q.ans);
    return { ...q, opts: newOpts, ans: newAns };
  });
}

// 티어 계산
export const TIERS = [
  { name: '마스터',  cls: 'tier-master',   min: 3000, icon: '👑' },
  { name: '다이아',  cls: 'tier-diamond',  min: 1500, icon: '💎' },
  { name: '플래티넘', cls: 'tier-platinum', min: 800,  icon: '🏆' },
  { name: '골드',    cls: 'tier-gold',     min: 400,  icon: '🥇' },
  { name: '실버',    cls: 'tier-silver',   min: 150,  icon: '🥈' },
  { name: '브론즈',  cls: 'tier-bronze',   min: 0,    icon: '🥉' },
];

export function getTier(pts: number) {
  return TIERS.find(t => pts >= t.min) || TIERS[TIERS.length - 1];
}
