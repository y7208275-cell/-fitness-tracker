import { useState, useEffect, useRef } from 'react';
import { getExercisesByBodyPart, saveSession } from '../db';
import type { BodyPart, Exercise, WorkoutExercise } from '../types';

interface Props {
  bodyPart: BodyPart | null;
}

export function WorkoutPage({ bodyPart }: Props) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [timer, setTimer] = useState(0);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<number>(0);

  // 计时
  useEffect(() => {
    if (started) {
      const interval = setInterval(() => {
        timerRef.current += 1;
        setTimer(timerRef.current);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [started]);

  // 加载动作库
  useEffect(() => {
    if (bodyPart) {
      getExercisesByBodyPart(bodyPart).then(setExerciseLibrary);
    }
  }, [bodyPart]);

  function addExercise(ex: Exercise) {
    const we: WorkoutExercise = {
      id: Date.now(),
      exerciseId: ex.id,
      exerciseName: ex.name,
      bodyPart: ex.bodyPart,
      sets: [{ id: Date.now(), weight: 0, reps: 0 }],
    };
    setExercises(prev => [...prev, we]);
    setShowPicker(false);
    if (!started) setStarted(true);
  }

  function updateSet(exIdx: number, setIdx: number, field: 'weight' | 'reps', value: number) {
    setExercises(prev => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  }

  function addSet(exIdx: number) {
    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = {
        ...next[exIdx],
        sets: [...next[exIdx].sets, { id: Date.now(), weight: 0, reps: 0 }],
      };
      return next;
    });
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises(prev => {
      const next = [...prev];
      const sets = next[exIdx].sets.filter((_, i) => i !== setIdx);
      if (sets.length === 0) {
        // 删除整个动作
        return next.filter((_, i) => i !== exIdx);
      }
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  }

  function removeExercise(exIdx: number) {
    setExercises(prev => prev.filter((_, i) => i !== exIdx));
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  async function finishWorkout() {
    if (exercises.length === 0) return;
    const duration = Math.max(1, Math.round(timer / 60));
    const ok = confirm(`本次训练 ${formatTime(timer)} (约${duration}分钟)，确定结束？`);
    if (!ok) return;

    const now = new Date();
    const session = {
      bodyPart: bodyPart || '胸' as BodyPart,
      date: now.toISOString().slice(0, 10),
      startTime: new Date(now.getTime() - timer * 1000).toISOString(),
      endTime: now.toISOString(),
      durationMinutes: duration,
      exercises,
    };
    await saveSession(session);
    setExercises([]);
    setTimer(0);
    timerRef.current = 0;
    setStarted(false);
    alert('✅ 训练保存成功！');
  }

  // 选部位引导
  const ALL_PARTS: BodyPart[] = ['胸', '背', '腿', '肩', '手臂'];
  const [selectPart, setSelectPart] = useState<BodyPart | null>(bodyPart || null);

  if (!selectPart) {
    return (
      <div className="page">
        <div className="page-title">🏋️ 开始训练</div>
        <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          选择今天练哪个部位
        </p>
        <div className="flex flex-wrap gap-8" style={{ justifyContent: 'center' }}>
          {ALL_PARTS.map(bp => (
            <button
              key={bp}
              className="btn btn-outline"
              style={{ minWidth: 80 }}
              onClick={() => {
                setSelectPart(bp);
                getExercisesByBodyPart(bp).then(setExerciseLibrary);
              }}
            >
              {bp}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* 顶部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }} onClick={() => setSelectPart(null)}>
            {selectPart} ▾
          </span>
        </div>
        <div className="timer-display">{formatTime(timer)}</div>
      </div>

      {/* 已添加的动作 */}
      {exercises.length === 0 && (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="icon">📋</div>
          <p>还没有添加动作</p>
        </div>
      )}

      {exercises.map((we, exIdx) => (
        <div key={we.id} className="exercise-item">
          <div className="exercise-header">
            <span className="exercise-name">{we.exerciseName}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => addSet(exIdx)}
                style={{ padding: '4px 10px', fontSize: 13 }}
              >
                +组
              </button>
              <button
                className="btn btn-sm"
                style={{ padding: '4px 10px', fontSize: 13, background: 'var(--danger)', color: 'white' }}
                onClick={() => removeExercise(exIdx)}
              >
                ✕
              </button>
            </div>
          </div>
          {we.sets.map((set, setIdx) => (
            <div key={set.id} className="set-row">
              <span className="set-number">{setIdx + 1}.</span>
              <input
                className="set-input"
                type="number"
                placeholder="重量"
                inputMode="decimal"
                value={set.weight || ''}
                onChange={e => updateSet(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
              />
              <span className="set-label">kg</span>
              <span style={{ color: 'var(--text-muted)' }}>×</span>
              <input
                className="set-input"
                type="number"
                placeholder="次数"
                inputMode="numeric"
                value={set.reps || ''}
                onChange={e => updateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
              />
              <span className="set-label">次</span>
              <button
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}
                onClick={() => removeSet(exIdx, setIdx)}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* 添加动作按钮 */}
      <button
        className="btn btn-outline btn-block mt-12"
        onClick={async () => {
          const lib = await getExercisesByBodyPart(selectPart);
          setExerciseLibrary(lib);
          setShowPicker(true);
        }}
      >
        + 添加动作
      </button>

      {/* 自定义动作快速输入 */}
      <div className="mt-12" style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          placeholder="自定义动作名..."
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const target = e.target as HTMLInputElement;
              const name = target.value.trim();
              if (name) {
                addExercise({
                  id: Date.now(),
                  name,
                  bodyPart: selectPart,
                  equipment: '其他',
                  custom: true,
                });
                target.value = '';
              }
            }
          }}
        />
      </div>

      {/* 结束训练 */}
      {exercises.length > 0 && (
        <div className="mt-16">
          <button className="btn btn-danger btn-block" onClick={finishWorkout}>
            🛑 结束训练（今日 {formatTime(timer)}）
          </button>
        </div>
      )}

      {/* 动作选择弹窗 */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>
              选择动作 · {selectPart}
            </div>
            {exerciseLibrary.map(ex => (
              <div
                key={ex.id}
                className="modal-item"
                onClick={() => addExercise(ex)}
              >
                {ex.name}
                <span className="sub"> · {ex.equipment}</span>
              </div>
            ))}
            <div style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: 13 }}>
              找不到？在上方直接输入自定义动作名
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
