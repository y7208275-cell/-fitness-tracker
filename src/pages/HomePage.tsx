import { useState, useEffect } from 'react';
import { getTodayBodyPart, getAllSessions, DEFAULT_SPLIT } from '../db';
import type { BodyPart, WorkoutSession } from '../types';

interface Props {
  onStartWorkout: (bodyPart: BodyPart) => void;
}

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export function HomePage({ onStartWorkout }: Props) {
  const [todayBodyPart, setTodayBodyPart] = useState<BodyPart | null>(null);
  const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [bp, sessions] = await Promise.all([
        getTodayBodyPart(),
        getAllSessions(),
      ]);
      setTodayBodyPart(bp);
      if (bp && sessions.length > 0) {
        const last = sessions.find(s => s.bodyPart === bp) || null;
        setLastSession(last);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center" style={{ paddingTop: '40vh' }}>加载中...</div>;
  }

  const today = new Date();
  const todayDow = today.getDay();
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="page">
      {/* Hero 区域 */}
      <div className="today-hero">
        <div className="today-label">
          {todayStr} · 周{DAY_NAMES[todayDow]}
        </div>
        {todayBodyPart ? (
          <>
            <div className="today-bodypart">{todayBodyPart}</div>
            <div className="today-last">
              {lastSession
                ? `上次练${todayBodyPart}：${lastSession.date}（${daysAgo(lastSession.date)}天前）`
                : '还没有训练记录'}
            </div>
            <div className="mt-16">
              <button
                className="btn btn-primary btn-block"
                style={{ fontSize: 18, padding: '16px 32px' }}
                onClick={() => onStartWorkout(todayBodyPart!)}
              >
                🏋️ 开始{todayBodyPart}训练
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="today-bodypart" style={{ fontSize: 48 }}>🛌</div>
            <div className="today-last">今天是休息日</div>
            <div className="mt-16">
              <button
                className="btn btn-outline btn-block"
                style={{ fontSize: 16, padding: '14px 28px' }}
                onClick={() => onStartWorkout('胸')}
              >
                💪 我也想练！
              </button>
            </div>
          </>
        )}
      </div>

      {/* 周排期 */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>📅 本周排期</div>
        <div className="week-bar">
          {DEFAULT_SPLIT.map((s) => (
            <div
              key={s.dayOfWeek}
              className={`week-day ${s.dayOfWeek === todayDow ? 'today' : ''} ${s.bodyPart ? 'work' : 'rest'}`}
            >
              <div className="day-name">周{DAY_NAMES[s.dayOfWeek]}</div>
              <div>{s.bodyPart || '休息'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function daysAgo(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}
