import { useState, useEffect } from 'react';
import { db, DEFAULT_SPLIT } from '../db';
import type { BodyPart, Exercise, FiveDaySplit, Equipment } from '../types';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
const ALL_PARTS: (BodyPart | null)[] = ['胸', '背', '腿', '肩', '手臂', null];

export function SettingsPage() {
  const [schedule, setSchedule] = useState<FiveDaySplit[]>(DEFAULT_SPLIT);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [addingPart, setAddingPart] = useState<BodyPart | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newExEquip, setNewExEquip] = useState<Equipment>('杠铃');

  useEffect(() => {
    // 加载排期
    db.appSettings.get(1).then(s => {
      if (s) setSchedule(s.splitSchedule);
    });
    // 加载所有动作
    db.exercises.toArray().then(setAllExercises);
  }, []);

  async function updateSchedule(dayOfWeek: number, bodyPart: BodyPart | null) {
    const next = schedule.map(s =>
      s.dayOfWeek === dayOfWeek ? { ...s, bodyPart } : s
    );
    setSchedule(next);
    await db.appSettings.put({ id: 1, splitSchedule: next });
  }

  async function addCustomExercise() {
    if (!newExName.trim() || !addingPart) return;
    const ex: Exercise = {
      id: Date.now(),
      name: newExName.trim(),
      bodyPart: addingPart,
      equipment: newExEquip,
      custom: true,
    };
    await db.exercises.put(ex);
    setAllExercises(prev => [...prev, ex]);
    setNewExName('');
    setAddingPart(null);
  }

  async function deleteExercise(id: number) {
    await db.exercises.delete(id);
    setAllExercises(prev => prev.filter(e => e.id !== id));
  }

  async function exportData() {
    const [exercises, sessions, settings] = await Promise.all([
      db.exercises.toArray(),
      db.workoutSessions.toArray(),
      db.appSettings.toArray(),
    ]);
    const json = JSON.stringify({ exercises, sessions, settings }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `健身数据备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page-title">⚙️ 设置</div>

      {/* 五分化排期 */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>📅 五分化排期</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          点击部位可以修改对应天的训练内容
        </p>
        {schedule.map(s => (
          <div key={s.dayOfWeek} className="setting-row">
            <span className="setting-label">
              周{DAY_NAMES[s.dayOfWeek]}
            </span>
            <select
              className="picker"
              value={s.bodyPart || '_rest'}
              onChange={e => updateSchedule(
                s.dayOfWeek,
                e.target.value === '_rest' ? null : e.target.value as BodyPart
              )}
            >
              {ALL_PARTS.map(bp => (
                <option key={bp || '_rest'} value={bp || '_rest'}>
                  {bp || '休息'}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* 动作库管理 */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>📋 动作库管理</div>
        <div className="flex flex-wrap gap-8 mb-8">
          {ALL_PARTS.filter(Boolean).map(bp => (
            <button
              key={bp}
              className={`filter-btn ${addingPart === bp ? 'active' : ''}`}
              onClick={() => setAddingPart(prev => prev === bp ? null : bp!)}
            >
              {bp}
            </button>
          ))}
        </div>

        {addingPart && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              className="input"
              placeholder="动作名"
              value={newExName}
              onChange={e => setNewExName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCustomExercise(); }}
              style={{ flex: 2 }}
            />
            <select
              className="picker"
              value={newExEquip}
              onChange={e => setNewExEquip(e.target.value as Equipment)}
              style={{ flex: 1 }}
            >
              {(['杠铃', '哑铃', '绳索', '器械', '自重', '其他'] as Equipment[]).map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={addCustomExercise}>
              添加
            </button>
          </div>
        )}

        {/* 分部位显示动作库 */}
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {ALL_PARTS.filter(Boolean).map(bp => {
            const partExercises = allExercises.filter(e => e.bodyPart === bp);
            return (
              <div key={bp!} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--text-heading)' }}>
                  {bp}
                </div>
                {partExercises.map(e => (
                  <div key={e.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    fontSize: 14,
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span>
                      {e.name}
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>
                        · {e.equipment}
                      </span>
                      {e.custom && <span className="tag" style={{ marginLeft: 6, fontSize: 11 }}>自定义</span>}
                    </span>
                    {e.custom && (
                      <button
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}
                        onClick={() => deleteExercise(e.id)}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 数据管理 */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>💾 数据管理</div>
        <button className="btn btn-outline btn-block" onClick={exportData}>
          📥 导出数据备份
        </button>
        <div className="mt-12">
          <button
            className="btn btn-danger btn-block"
            onClick={() => {
              if (confirm('确定要清除所有训练数据吗？此操作不可恢复！')) {
                db.workoutSessions.clear().then(() => alert('已清除'));
              }
            }}
          >
            🗑 清除所有训练记录
          </button>
        </div>
      </div>

      <div className="text-center" style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>
        健身记录 v1.0 · 数据仅存储在本地浏览器
      </div>
    </div>
  );
}
