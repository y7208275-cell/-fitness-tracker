import { useState, useEffect } from 'react';
import { getAllSessions } from '../db';
import type { WorkoutSession } from '../types';

const ALL_PARTS = ['全部', '胸', '背', '腿', '肩', '手臂'] as const;

export function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [filter, setFilter] = useState<string>('全部');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSessions().then(data => {
      setSessions(data);
      setLoading(false);
    });
  }, []);

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = filter === '全部'
    ? sessions
    : sessions.filter(s => s.bodyPart === filter);

  if (loading) {
    return <div className="text-center" style={{ paddingTop: '40vh' }}>加载中...</div>;
  }

  return (
    <div className="page">
      <div className="page-title">📊 训练历史</div>

      {/* 部位筛选 */}
      <div className="filter-bar">
        {ALL_PARTS.map(p => (
          <button
            key={p}
            className={`filter-btn ${filter === p ? 'active' : ''}`}
            onClick={() => setFilter(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>还没有训练记录</p>
          <p className="mt-12" style={{ fontSize: 14 }}>去"训练"页面开始第一次记录吧 💪</p>
        </div>
      )}

      {filtered.map(session => (
        <div
          key={session.id}
          className="history-item"
          onClick={() => toggleExpand(session.id!)}
        >
          <div className="history-item-header">
            <div>
              <span className="history-date">{session.date}</span>
              <span
                className="tag"
                style={{ marginLeft: 8, fontSize: 12 }}
              >
                {session.bodyPart}
              </span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {session.durationMinutes} 分钟
            </span>
          </div>

          {/* 折叠摘要 */}
          {!expanded.has(session.id!) && (
            <div className="history-summary">
              {session.exercises.map(e =>
                `${e.exerciseName} ${e.sets.map(s => `${s.weight}kg×${s.reps}`).join(' ')}`
              ).join(' · ')}
            </div>
          )}

          {/* 展开详情 */}
          {expanded.has(session.id!) && (
            <div style={{ marginTop: 12 }}>
              {session.exercises.map(e => (
                <div key={e.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {e.exerciseName}
                  </div>
                  <table style={{ width: '100%', fontSize: 13, color: 'var(--text)' }}>
                    <tbody>
                      {e.sets.map((s, i) => (
                        <tr key={s.id}>
                          <td style={{ color: 'var(--text-muted)', width: 30 }}>{i + 1}</td>
                          <td>{s.weight} kg</td>
                          <td style={{ color: 'var(--text-muted)' }}>×</td>
                          <td>{s.reps} 次</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
