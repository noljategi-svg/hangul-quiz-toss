import { useApp } from '../store/AppContext';

const TABS = [
  { id: 'home',    icon: '🏠', label: '홈' },
  { id: 'quiz',    icon: '📝', label: '퀴즈' },
  { id: 'rank',    icon: '🏆', label: '랭킹' },
  { id: 'mission', icon: '🎯', label: '미션' },
];

export default function BottomNav() {
  const { currentPage, setCurrentPage } = useApp();

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`bottom-nav-btn ${currentPage === tab.id ? 'active' : ''}`}
          onClick={() => setCurrentPage(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
