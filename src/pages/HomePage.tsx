import { useApp } from '../store/AppContext';
import { SPELLING } from '../data/questions';
import { IDIOM } from '../data/questions';
import { PROVERB } from '../data/questions';
import { getLevel, getTier, loadModeXP, LEVELS } from '../utils/game';
import type { Mode } from '../types';

const MODE_INFO = {
  spelling: { icon: '✏️', label: '맞춤법', count: SPELLING.length, color: '#1a5fa8' },
  idiom:    { icon: '📜', label: '사자성어', count: IDIOM.length, color: '#c84b2f' },
  proverb:  { icon: '📖', label: '속담', count: PROVERB.length, color: '#2d7a4f' },
};

export default function HomePage() {
  const { stats, setMode, setCurrentPage, setCurrentDiffLv } = useApp();
  const modeXP = loadModeXP();
  const tier = getTier(stats.totalPts);

  const handleModeStart = (m: Mode) => {
    setMode(m);
    const xp = modeXP[m] || 0;
    const lv = getLevel(xp);
    setCurrentDiffLv(lv.lv);
    setCurrentPage('quiz');
  };

  return (
    <div className="page-scroll" style={{ padding: '0 0 16px' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, var(--ink) 0%, #3d2510 100%)',
        padding: '24px 20px 28px',
        color: 'var(--paper)',
        position: 'relative',
        overflowY: 'auto',
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 160, height: 160,
          background: 'rgba(255,255,255,0.04)', borderRadius: '0 0 0 100%' }} />
        
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
          오늘의 <span style={{ color: 'var(--accent)' }}>한국어</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(250,246,239,0.6)', marginBottom: 20 }}>
          매일 10문제 · 맞춤법 · 사자성어 · 속담
        </div>

        {/* 내 현황 */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            {tier.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(250,246,239,0.7)', marginBottom: 2 }}>
              {tier.name} · {stats.totalPts.toLocaleString()} pts
            </div>
            <div style={{ fontSize: 12, color: 'rgba(250,246,239,0.5)' }}>
              🔥 {stats.streak}일 연속 · 총 {stats.total}회 플레이
            </div>
          </div>
        </div>

        {/* 문제 수 */}
        <div style={{ display: 'flex', gap: 0, marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
          {Object.entries(MODE_INFO).map(([, info], i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--paper)' }}>
                {Math.floor(info.count / 100) * 100}+
              </div>
              <div style={{ fontSize: 10, color: 'rgba(250,246,239,0.5)', marginTop: 2 }}>{info.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* 카테고리별 등급 & 도전 */}
        <div className="section-title">🎯 오늘 도전할 수 있는 것</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {(Object.entries(MODE_INFO) as [Mode, typeof MODE_INFO[Mode]][]).map(([m, info]) => {
            const xp = modeXP[m] || 0;
            const lv = getLevel(xp);
            const nextLv = LEVELS.find(l => l.minXP > xp);
            const progress = nextLv
              ? Math.round((xp - lv.minXP) / (lv.maxXP - lv.minXP) * 100)
              : 100;

            return (
              <div key={m} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${info.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {info.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{info.label}</span>
                      <span style={{ fontSize: 11, color: lv.color, fontWeight: 700 }}>
                        {lv.icon} {lv.name} · {xp} XP
                      </span>
                    </div>
                    <div style={{ background: 'var(--paper2)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: lv.color, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleModeStart(m)}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--ink)',
                      color: 'var(--paper)',
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: 'Noto Sans KR',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    도전
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 통계 */}
        <div className="section-title">📊 내 현황</div>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', padding: '16px 8px' }}>
          {[
            { label: '연속', value: `${stats.streak}🔥` },
            { label: '총플레이', value: stats.total },
            { label: '누적점수', value: stats.totalPts },
            { label: '티어', value: tier.icon + ' ' + tier.name },
          ].map((item, i) => (
            <div key={i} style={{ borderRight: i < 3 ? '1px solid var(--border)' : 'none', padding: '0 4px' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent)' }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
