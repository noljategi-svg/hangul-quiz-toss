import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { todayStr } from '../utils/game';

interface MissionItem {
  id: string;
  icon: string;
  name: string;
  desc: string;
  pts: number;
  done: boolean;
}

export default function MissionPage() {
  const { stats } = useApp();
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [resetTime, setResetTime] = useState('');

  useEffect(() => {
    const today = todayStr();
    const savedMissions = JSON.parse(localStorage.getItem('kq_missions') || `{"date":"","dm1":false,"dm2":false,"dm3":false,"dm4":false}`);
    const dm = savedMissions.date === today ? savedMissions : { date: today, dm1: false, dm2: false, dm3: false, dm4: false };

    setMissions([
      { id: 'dm1', icon: '🎯', name: '오늘의 퀴즈 완료', desc: '맞춤법·사자성어·속담 중 1회 완료', pts: 30, done: dm.dm1 },
      { id: 'dm2', icon: '⭐', name: '8개 이상 정답', desc: '한 게임에서 8개 이상 맞추기', pts: 20, done: dm.dm2 },
      { id: 'dm3', icon: '🏆', name: '오늘 만점 달성', desc: '10/10 완벽한 점수', pts: 50, done: dm.dm3 },
      { id: 'dm4', icon: '🔥', name: '두 카테고리 완료', desc: '오늘 2가지 모드 플레이', pts: 50, done: dm.dm4 },
    ]);

    // 리셋까지 남은 시간
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setResetTime(`${h}시간 ${m}분 후 리셋`);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, []);

  const totalPts = missions.filter(m => m.done).reduce((s, m) => s + m.pts, 0);
  const doneCnt = missions.filter(m => m.done).length;

  return (
    <div className="page-scroll" style={{ padding: '20px 16px 0' }}>
      {/* 일일 미션 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>📅 일일 미션</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{resetTime}</div>
      </div>

      {/* 진행 상황 바 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{doneCnt} / {missions.length} 완료</span>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>+{totalPts} pts</span>
        </div>
        <div style={{ background: 'var(--paper2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{
            width: `${doneCnt / missions.length * 100}%`,
            height: '100%', background: 'var(--accent)', borderRadius: 4,
            transition: 'width 0.5s',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {missions.map(m => (
          <div key={m.id} className="card" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            opacity: m.done ? 0.7 : 1,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: m.done ? '#edf7f1' : 'var(--paper2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>{m.done ? '✅' : m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, textDecoration: m.done ? 'line-through' : 'none', color: m.done ? 'var(--muted)' : 'var(--ink)' }}>
                {m.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.desc}</div>
            </div>
            <div style={{
              padding: '4px 10px', borderRadius: 20,
              background: m.done ? '#edf7f1' : 'var(--paper2)',
              color: m.done ? 'var(--green)' : 'var(--muted)',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>+{m.pts}pts</div>
          </div>
        ))}
      </div>

      {/* 주간 미션 */}
      <div className="section-title">📆 주간 미션</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {[
          { icon: '📝', name: '이번 주 5일 플레이', desc: '월~일 중 5일 이상 퀴즈 완료', pts: 100 },
          { icon: '🎯', name: '주간 만점 3회', desc: '이번 주 10/10 만점 3번 달성', pts: 150 },
          { icon: '⚡', name: '두 모드 각 3회 완료', desc: '맞춤법 3회 + 사자성어 3회', pts: 200 },
          { icon: '📊', name: '주간 정답률 80%+', desc: '이번 주 평균 정답률 80% 이상', pts: 120 },
        ].map((m, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--paper2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>{m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.desc}</div>
            </div>
            <div style={{
              padding: '4px 10px', borderRadius: 20,
              background: 'var(--paper2)', color: 'var(--muted)',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>+{m.pts}pts</div>
          </div>
        ))}
      </div>

      {/* 내 통계 */}
      <div className="section-title">📈 내 통계</div>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {[
          { label: '총 플레이', value: stats.total + '회' },
          { label: '누적 점수', value: stats.totalPts.toLocaleString() + 'pts' },
          { label: '연속 플레이', value: stats.streak + '일 🔥' },
          { label: '최고 점수', value: (stats.bestScore || 0) + '/' + 10 },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
