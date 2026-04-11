import { useState, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { SPELLING, IDIOM, PROVERB } from '../data/questions';
import type { Question } from '../types';
import {
  getDailyQ, N, getLevel, LEVELS, calcPts,
  loadStats, saveStats, loadModeXP, saveModeXP,
  todayStr, getTier
} from '../utils/game';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

type GameState = 'selecting' | 'playing' | 'result';

export default function QuizPage() {
  const { mode, setMode, currentDiffLv, setCurrentDiffLv, nick, isAdminMode, stats, setStats, modeXP, setModeXP, setCurrentPage } = useApp();
  const [gameState, setGameState] = useState<GameState>('selecting');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('');
  const [toast, setToast] = useState('');

  const pool = mode === 'spelling' ? SPELLING : mode === 'idiom' ? IDIOM : PROVERB;
  const modeLabel = mode === 'spelling' ? '맞춤법' : mode === 'idiom' ? '사자성어' : '속담';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const startGame = useCallback(() => {
    const qs = getDailyQ(pool, N, currentDiffLv);
    setQuestions(qs);
    setQi(0);
    setScore(0);
    setAnswers([]);
    setAnswered(false);
    setSelectedAns(null);
    setGameState('playing');
  }, [pool, currentDiffLv]);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAns(idx);
    const q = questions[qi];
    const ok = idx === q.ans;
    if (ok) setScore(s => s + 1);
    setAnswers(prev => [...prev, ok]);
  };

  const handleNext = () => {
    if (qi + 1 >= N) {
      finishGame();
    } else {
      setQi(q => q + 1);
      setAnswered(false);
      setSelectedAns(null);
    }
  };

  const finishGame = () => {
    const finalScore = answers.filter(Boolean).length + (selectedAns === questions[qi]?.ans ? 1 : 0);
    
    // 점수/XP 저장
    const today = todayStr();
    const currentStats = loadStats();
    const currentModeXP = loadModeXP();
    
    if (currentStats.lastDate !== today) {
      // 오늘 처음 플레이
      let newStreak = currentStats.streak;
      if (finalScore >= Math.ceil(N * 0.4)) {
        if (currentStats.lastDate) {
          const last = new Date(currentStats.lastDate);
          const now = new Date(today);
          const diff = (now.getTime() - last.getTime()) / 86400000;
          newStreak = diff <= 1 ? currentStats.streak + 1 : 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 0;
      }

      const earnedPts = calcPts(finalScore, newStreak);
      const newStats = {
        ...currentStats,
        total: currentStats.total + 1,
        correct: currentStats.correct + finalScore,
        totalPts: currentStats.totalPts + earnedPts,
        streak: newStreak,
        lastDate: today,
        bestScore: Math.max(currentStats.bestScore, finalScore),
      };
      const newModeXP = {
        ...currentModeXP,
        [mode]: (currentModeXP[mode] || 0) + earnedPts,
      };
      
      saveStats(newStats);
      saveModeXP(newModeXP);
      setStats(newStats);
      setModeXP(newModeXP);

      // Firebase 랭킹 저장
      const rate = newStats.total > 0 ? Math.round(newStats.correct / (newStats.total * N) * 100) : 0;
      const tier = getTier(newStats.totalPts);
      addDoc(collection(db, 'rankings'), {
        nick,
        pts: newStats.totalPts,
        play: newStats.total,
        rate,
        tier: tier.name,
        spelling: newModeXP.spelling || 0,
        idiom: newModeXP.idiom || 0,
        proverb: newModeXP.proverb || 0,
        ts: serverTimestamp(),
      }).catch(console.error);
    }

    setGameState('result');
  };

  const q = questions[qi];

  // 등급 선택 화면
  if (gameState === 'selecting') {
    const xp = modeXP[mode] || 0;
    const curLv = getLevel(xp);

    return (
      <div className="page-scroll fade-up" style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {(['spelling', 'idiom', 'proverb'] as const).map(m => (
            <button key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: mode === m ? 'var(--ink)' : 'var(--border)',
                background: mode === m ? 'var(--ink)' : '#fff',
                color: mode === m ? 'var(--paper)' : 'var(--muted)',
                fontFamily: 'Noto Sans KR',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {m === 'spelling' ? '✏️ 맞춤법' : m === 'idiom' ? '📜 사자성어' : '📖 속담'}
            </button>
          ))}
        </div>

        <div className="section-title">📊 {modeLabel} 난이도 선택</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {LEVELS.map(lv => {
            const unlocked = isAdminMode || curLv.lv >= lv.lv;
            const active = currentDiffLv === lv.lv;
            return (
              <button key={lv.lv}
                onClick={() => unlocked && setCurrentDiffLv(lv.lv)}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  border: active ? `2px solid ${lv.color}` : '2px solid transparent',
                  background: active ? `${lv.color}08` : '#fff',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.45,
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span style={{ fontSize: 24 }}>{lv.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                    Lv.{lv.lv} {lv.name}
                    {!unlocked && ' 🔒'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    필요 XP: {lv.minXP}
                    {!unlocked && ` · 현재 ${xp} XP`}
                  </div>
                </div>
                {active && <span style={{ color: lv.color, fontSize: 18 }}>✓</span>}
              </button>
            );
          })}
        </div>

        <button className="btn-primary btn-accent" onClick={startGame}>
          {modeLabel} 시작하기 →
        </button>
      </div>
    );
  }

  // 결과 화면
  if (gameState === 'result') {
    const finalScore = answers.length;
    const pct = Math.round(finalScore / N * 100);
    const emoji = finalScore === N ? '🏆' : finalScore >= 8 ? '🌟' : finalScore >= 6 ? '👍' : '📚';

    return (
      <div className="page-scroll fade-up" style={{ padding: '20px 16px 0' }}>
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{emoji}</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>{finalScore} / {N}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>정답률 {pct}%</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={() => setGameState('selecting')} style={{ flex: 1 }}>
              다시 도전
            </button>
            <button className="btn-primary btn-accent" onClick={() => setCurrentPage('home')} style={{ flex: 1 }}>
              홈으로
            </button>
          </div>
        </div>

        {/* 오답 복습 */}
        {answers.some(a => !a) && (
          <>
            <div className="section-title">📖 오답 복습</div>
            {questions.map((q, i) => answers[i] === false ? (
              <div key={i} className="card" style={{ marginBottom: 10, borderLeft: '3px solid var(--accent)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{q.q}</div>
                <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, marginBottom: 4 }}>
                  ✅ 정답: {q.opts[q.ans]}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: q.exp }} />
              </div>
            ) : null)}
          </>
        )}
      </div>
    );
  }

  // 퀴즈 진행 화면
  if (!q) return null;

  return (
    <div className="page-scroll" style={{ padding: '16px 16px 0' }}>
      {/* 진행바 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>문제 {qi + 1} / {N}</span>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>점수: {score}</span>
        </div>
        <div style={{ background: 'var(--border)', borderRadius: 4, height: 4 }}>
          <div style={{ width: `${(qi / N) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* 문제 카드 */}
      <div className="card fade-up" style={{ marginBottom: 12, flexShrink: 0 }}>
        <div style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
          background: 'var(--paper2)', fontSize: 11, fontWeight: 700,
          color: 'var(--muted)', marginBottom: 10,
        }}>{modeLabel}</div>

        {q.idiom && (
          <div style={{
            padding: '10px 14px', background: 'var(--ink)', color: 'var(--paper)',
            borderRadius: 8, marginBottom: 10, fontSize: 15, fontWeight: 700,
            letterSpacing: 2, textAlign: 'center',
          }}>{q.idiom}</div>
        )}

        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>{q.q}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>💡 {q.hint}</div>
      </div>

      {/* 선택지 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.opts.map((opt, i) => {
          let bg = '#fff', border = 'var(--border)', color = 'var(--ink)';
          if (answered) {
            if (i === q.ans) { bg = '#edf7f1'; border = 'var(--green)'; color = 'var(--green)'; }
            else if (i === selectedAns && i !== q.ans) { bg = '#fef0ee'; border = 'var(--accent)'; color = 'var(--accent)'; }
          }
          return (
            <button key={i}
              onClick={() => handleAnswer(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                background: bg, border: `1.5px solid ${border}`, borderRadius: 10,
                cursor: answered ? 'default' : 'pointer',
                textAlign: 'left', width: '100%', transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: answered && i === q.ans ? 'var(--green)' : answered && i === selectedAns ? 'var(--accent)' : 'var(--paper2)',
                color: answered && (i === q.ans || i === selectedAns) ? '#fff' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12, flexShrink: 0,
              }}>
                {['A','B','C','D'][i]}
              </div>
              <span style={{ fontSize: 14, fontFamily: 'Noto Sans KR', fontWeight: 500, color }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* 해설 */}
      {answered && (
        <div className="fade-up" style={{
          padding: '12px 14px',
          background: selectedAns === q.ans ? '#edf7f1' : '#fef0ee',
          borderRadius: 8, marginTop: 10, flexShrink: 0,
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: selectedAns === q.ans ? 'var(--green)' : 'var(--accent)' }}>
            {selectedAns === q.ans ? '✅ 정답!' : '❌ 오답'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: q.exp }} />
          <button
            onClick={() => setShowReport(true)}
            style={{ marginTop: 8, background: 'none', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Noto Sans KR' }}
          >
            ⚠️ 오류 신고
          </button>
        </div>
      )}

      {answered && (
        <button className="btn-primary fade-up" onClick={handleNext} style={{ marginTop: 10, marginBottom: 8, flexShrink: 0 }}>
          {qi < N - 1 ? '다음 문제 →' : '결과 보기 🎉'}
        </button>
      )}

      {/* 신고 모달 */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>⚠️ 문제 오류 신고</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, padding: '8px 12px', background: 'var(--paper2)', borderRadius: 8 }}>
              [{modeLabel}] {q.q}
            </div>
            {['정답이 틀렸어요', '보기가 이상해요', '해설이 잘못됐어요', '문제가 중복돼요', '기타 오류'].map(type => (
              <button key={type}
                onClick={() => setReportType(type)}
                style={{
                  display: 'block', width: '100%', padding: '12px 14px', marginBottom: 8,
                  border: `1.5px solid ${reportType === type ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8, background: reportType === type ? '#fef0ee' : '#fff',
                  color: reportType === type ? 'var(--accent)' : 'var(--ink)',
                  fontFamily: 'Noto Sans KR', fontSize: 13, fontWeight: reportType === type ? 700 : 400,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >{type}</button>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setShowReport(false)} style={{ flex: 1, padding: '12px', border: '1.5px solid var(--border)', borderRadius: 8, background: '#fff', fontFamily: 'Noto Sans KR', fontWeight: 700, cursor: 'pointer' }}>취소</button>
              <button
                onClick={() => {
                  if (!reportType) return;
                  addDoc(collection(db, 'reports'), {
                    type: reportType, mode: modeLabel, lv: currentDiffLv,
                    q: q.q, opts: q.opts, ans: q.ans, exp: q.exp,
                    nick, status: '검토중', ts: serverTimestamp(),
                  }).catch(console.error);
                  setShowReport(false);
                  setReportType('');
                  showToast('신고가 접수됐어요 🙏');
                }}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontFamily: 'Noto Sans KR', fontWeight: 700, cursor: 'pointer' }}
              >신고하기</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
