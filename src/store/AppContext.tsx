import { createContext, useContext, useState, useCallback } from 'react';
import type { Mode, Stats, ModeXP } from '../types';
import { loadStats, saveStats, loadModeXP, saveModeXP, loadNick } from '../utils/game';

interface AppState {
  mode: Mode;
  setMode: (m: Mode) => void;
  currentPage: string;
  setCurrentPage: (p: string) => void;
  stats: Stats;
  setStats: (s: Stats) => void;
  modeXP: ModeXP;
  setModeXP: (m: ModeXP) => void;
  nick: string;
  currentDiffLv: number;
  setCurrentDiffLv: (lv: number) => void;
  isAdminMode: boolean;
  refreshStats: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('spelling');
  const [currentPage, setCurrentPage] = useState('home');
  const [stats, setStatsState] = useState<Stats>(loadStats());
  const [modeXP, setModeXPState] = useState<ModeXP>(loadModeXP());
  const [nick] = useState(loadNick());
  const [currentDiffLv, setCurrentDiffLv] = useState(1);
  
  const isAdminMode = new URLSearchParams(window.location.search).get('admin') === 'hangul2024';

  const setStats = useCallback((s: Stats) => {
    setStatsState(s);
    saveStats(s);
  }, []);

  const setModeXP = useCallback((m: ModeXP) => {
    setModeXPState(m);
    saveModeXP(m);
  }, []);

  const refreshStats = useCallback(() => {
    setStatsState(loadStats());
    setModeXPState(loadModeXP());
  }, []);

  return (
    <AppContext.Provider value={{
      mode, setMode,
      currentPage, setCurrentPage,
      stats, setStats,
      modeXP, setModeXP,
      nick,
      currentDiffLv, setCurrentDiffLv,
      isAdminMode,
      refreshStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
