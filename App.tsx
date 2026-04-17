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
    // ✅ FIX: height: 100% → 100% 유지하되 minHeight: 0 도 함께
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, width: '100%' }}>
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
      {/* ✅ FIX: minHeight: 0 이 핵심. flex 자식의 스크롤 컨테이너가 제대로 동작하려면 필수 */}
      <div style={{
        flex: '1 1 auto',
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
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
