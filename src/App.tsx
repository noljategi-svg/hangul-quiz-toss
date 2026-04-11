import { AppProvider, useApp } from './store/AppContext';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import RankPage from './pages/RankPage';
import MissionPage from './pages/MissionPage';
import './index.css';

function AppContent() {
  const { currentPage } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {currentPage !== 'quiz' && (
        <div style={{
          padding: '14px 16px 10px',
          background: '#fff',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
        }}>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>
            오늘의 <span style={{ color: 'var(--accent)' }}>한국어</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {currentPage === 'rank' ? '🏆 랭킹' : currentPage === 'mission' ? '🎯 미션' : '매일 새로운 퀴즈'}
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {currentPage === 'home'    && <HomePage />}
        {currentPage === 'quiz'    && <QuizPage />}
        {currentPage === 'rank'    && <RankPage />}
        {currentPage === 'mission' && <MissionPage />}
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
