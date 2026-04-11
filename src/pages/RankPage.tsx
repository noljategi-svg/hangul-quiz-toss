import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { getTier, loadModeXP } from '../utils/game';
import { collection, orderBy, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { RankEntry } from '../types';

type RankTab = 'all' | 'week' | 'spelling' | 'idiom' | 'proverb';

const TAB_INFO: { key: RankTab; label: string }[] = [
  { key: 'all',      label: '🏆 전체' },
  { key: 'week',     label: '📅 주간' },
  { key: 'spelling', label: '✏️ 맞춤법' },
  { key: 'idiom',    label: '📜 사자성어' },
  { key: 'proverb',  label: '📖 속담' },
];

export default function RankPage() {
  const { stats, nick } = useApp();
  const modeXP = loadModeXP();
  const [tab, setTab] = useState<RankTab>('all');
  const [rows, setRows] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const tier = getTier(stats.totalPts);
  const myRate = stats.total > 0
    ? Math.min(Math.round(stats.correct / (stats.total * 10) * 100), 100)
    : 0;

  useEffect(() => {
    setLoading(true);
    loadRanking(tab).then(data => {
      // 내 항목 합산
      const myEntry: RankEntry = {
        nick,
        pts: stats.totalPts,
        play: stats.total,
        rate: myRate,
        tier: tier.name,
        spelling: modeXP.spelling || 0,
        idiom: modeXP.idiom || 0,
        proverb: modeXP.proverb || 0,
        isMe: true,
      };

      let combined = [...data, myEntry];
      const field = tab === 'spelling' || tab === 'idiom' || tab === 'proverb' ? tab : 'pts';
      combined.sort((a, b) => ((b as any)[field] || 0) - ((a as any)[field] || 0));

      // 중복 닉네임 제거
      const seen: Record<string, boolean> = {};
      combined = combined.filter(p => {
        if (p.isMe) { seen[p.nick] = true; return true; }
        if (seen[p.nick]) return false;
        seen[p.nick] = true;
        return true;
      });

      setRows(combined.slice(0, 20));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tab, stats.totalPts]);

  async function loadRanking(t: RankTab): Promise<RankEntry[]> {
    try {
      const field = t === 'spelling' || t === 'idiom' || t === 'proverb' ? t : 'pts';
      const q = query(collection(db, 'rankings'), orderBy(field, 'desc'), limit(50));
      const snap = await getDocs(q);
      const result: RankEntry[] = [];
      snap.forEach(doc => result.push(doc.data() as RankEntry));

      if (t === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return result.filter((r: any) => !r.ts || (r.ts?.toDate && r.ts.toDate() >= weekAgo));
      }
      return result;
    } catch {
      return [];
    }
  }

  const myIdx = rows.findIndex(r => r.isMe);
  const myRank = myIdx >= 0 ? myIdx + 1 : '?';

  const getDispPts = (r: RankEntry) => {
    if (tab === 'spelling') return r.spelling || 0;
    if (tab === 'idiom') return r.idiom || 0;
    if (tab === 'proverb') return r.proverb || 0;
    return r.pts;
  };

  return (
    <div className="page-scroll" style={{ padding: '20px 16px 0' }}>
      {/* 내 순위 카드 */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--ink)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 20,
        }}>
          {typeof myRank === 'number' && myRank <= 3
            ? ['🥇','🥈','🥉'][myRank - 1]
            : myRank}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>나 ({nick})</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {stats.total}회 플레이 · 정답률 {myRate}% · {tier.icon} {tier.name}
          </div>
        </div>
        <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--accent)' }}>
          {stats.totalPts.toLocaleString()}
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400, textAlign: 'right' }}>pts</div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {TAB_INFO.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              border: `1.5px solid ${tab === t.key ? 'var(--ink)' : 'var(--border)'}`,
              background: tab === t.key ? 'var(--ink)' : '#fff',
              color: tab === t.key ? 'var(--paper)' : 'var(--muted)',
              fontFamily: 'Noto Sans KR',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* 랭킹 리스트 */}
      <div className="section-title">
        {TAB_INFO.find(t => t.key === tab)?.label} 랭킹
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
          ⏳ 불러오는 중...
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
          아직 랭킹 데이터가 없습니다!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r, i) => {
            const rtier = getTier(r.pts);
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div key={i} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: r.isMe ? '#fff8f6' : '#fff',
                border: r.isMe ? '1.5px solid var(--accent)' : '1.5px solid transparent',
              }}>
                <div style={{
                  width: 32, minWidth: 32, textAlign: 'center',
                  fontWeight: 900, fontSize: i < 3 ? 20 : 14,
                  color: i < 3 ? undefined : 'var(--muted)',
                }}>
                  {i < 3 ? medals[i] : i + 1}
                </div>
                <div style={{ fontSize: 20 }}>
                  {r.isMe ? '😊' : ['🧑','👩','🧓','👦','👧','🧔','👨'][i % 7]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.isMe ? `나 (${nick})` : r.nick || '익명'}
                    {r.isMe && ' 👈'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                    {r.play || 0}회 · 정답률 {r.rate || 0}%
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--accent)' }}>
                    {getDispPts(r).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{rtier.icon} {rtier.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
