import Dexie, { type Table } from 'dexie';
import type { Exercise, WorkoutSession, AppSettings, BodyPart, FiveDaySplit } from './types';

class FitnessDB extends Dexie {
  exercises!: Table<Exercise, number>;
  workoutSessions!: Table<WorkoutSession, number>;
  appSettings!: Table<AppSettings, number>;

  constructor() {
    super('FitnessTrackerDB');
    this.version(1).stores({
      exercises: '++id, bodyPart, name',
      workoutSessions: '++id, date, bodyPart',
      appSettings: 'id',
    });
  }
}

export const db = new FitnessDB();

// ===== 预设动作库 =====

const PRESET_EXERCISES: Omit<Exercise, 'id'>[] = [
  // 胸
  { name: '平板卧推', bodyPart: '胸', equipment: '杠铃', custom: false },
  { name: '上斜卧推', bodyPart: '胸', equipment: '杠铃', custom: false },
  { name: '上斜卧推', bodyPart: '胸', equipment: '哑铃', custom: false },
  { name: '平板卧推', bodyPart: '胸', equipment: '哑铃', custom: false },
  { name: '哑铃飞鸟', bodyPart: '胸', equipment: '哑铃', custom: false },
  { name: '龙门夹胸', bodyPart: '胸', equipment: '绳索', custom: false },
  { name: '双杠臂屈伸', bodyPart: '胸', equipment: '自重', custom: false },
  { name: '器械推胸', bodyPart: '胸', equipment: '器械', custom: false },
  { name: '下斜卧推', bodyPart: '胸', equipment: '杠铃', custom: false },
  // 背
  { name: '引体向上', bodyPart: '背', equipment: '自重', custom: false },
  { name: '杠铃划船', bodyPart: '背', equipment: '杠铃', custom: false },
  { name: '高位下拉', bodyPart: '背', equipment: '器械', custom: false },
  { name: '坐姿划船', bodyPart: '背', equipment: '器械', custom: false },
  { name: '单臂哑铃划船', bodyPart: '背', equipment: '哑铃', custom: false },
  { name: '硬拉', bodyPart: '背', equipment: '杠铃', custom: false },
  { name: 'T杠划船', bodyPart: '背', equipment: '杠铃', custom: false },
  // 腿
  { name: '深蹲', bodyPart: '腿', equipment: '杠铃', custom: false },
  { name: '腿举', bodyPart: '腿', equipment: '器械', custom: false },
  { name: '腿弯举', bodyPart: '腿', equipment: '器械', custom: false },
  { name: '腿屈伸', bodyPart: '腿', equipment: '器械', custom: false },
  { name: '罗马尼亚硬拉', bodyPart: '腿', equipment: '杠铃', custom: false },
  { name: '哑铃箭步蹲', bodyPart: '腿', equipment: '哑铃', custom: false },
  { name: '保加利亚分腿蹲', bodyPart: '腿', equipment: '哑铃', custom: false },
  { name: '臀推', bodyPart: '腿', equipment: '杠铃', custom: false },
  // 肩
  { name: '哑铃推举', bodyPart: '肩', equipment: '哑铃', custom: false },
  { name: '侧平举', bodyPart: '肩', equipment: '哑铃', custom: false },
  { name: '前平举', bodyPart: '肩', equipment: '哑铃', custom: false },
  { name: '面拉', bodyPart: '肩', equipment: '绳索', custom: false },
  { name: '阿诺德推举', bodyPart: '肩', equipment: '哑铃', custom: false },
  { name: '杠铃提拉', bodyPart: '肩', equipment: '杠铃', custom: false },
  { name: '反向飞鸟', bodyPart: '肩', equipment: '器械', custom: false },
  // 手臂
  { name: '杠铃弯举', bodyPart: '手臂', equipment: '杠铃', custom: false },
  { name: '哑铃弯举', bodyPart: '手臂', equipment: '哑铃', custom: false },
  { name: '锤式弯举', bodyPart: '手臂', equipment: '哑铃', custom: false },
  { name: '绳索下压', bodyPart: '手臂', equipment: '绳索', custom: false },
  { name: '窄距卧推', bodyPart: '手臂', equipment: '杠铃', custom: false },
  { name: '牧师凳弯举', bodyPart: '手臂', equipment: '哑铃', custom: false },
  { name: '仰卧臂屈伸', bodyPart: '手臂', equipment: '哑铃', custom: false },
];

// 默认五分化排期
export const DEFAULT_SPLIT: FiveDaySplit[] = [
  { dayOfWeek: 1, bodyPart: '胸' },   // 周一
  { dayOfWeek: 2, bodyPart: '背' },   // 周二
  { dayOfWeek: 3, bodyPart: '腿' },   // 周三
  { dayOfWeek: 4, bodyPart: '肩' },   // 周四
  { dayOfWeek: 5, bodyPart: '手臂' }, // 周五
  { dayOfWeek: 6, bodyPart: null },   // 周六休息
  { dayOfWeek: 0, bodyPart: null },   // 周日休息
];

// ===== 初始化函数 =====

export async function initDB() {
  // 初始化预设动作库（仅首次）
  const count = await db.exercises.count();
  if (count === 0) {
    await db.exercises.bulkAdd(
      PRESET_EXERCISES.map((e, i) => ({ ...e, id: i + 1 }))
    );
  }

  // 初始化设置（仅首次）
  const settings = await db.appSettings.get(1);
  if (!settings) {
    await db.appSettings.put({
      id: 1,
      splitSchedule: DEFAULT_SPLIT,
    });
  }
}

// ===== 辅助查询函数 =====

/** 获取今天的训练部位 */
export async function getTodayBodyPart(): Promise<BodyPart | null> {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const settings = await db.appSettings.get(1);
  const schedule = settings?.splitSchedule || DEFAULT_SPLIT;
  const entry = schedule.find(s => s.dayOfWeek === dayOfWeek);
  return entry?.bodyPart || null;
}

/** 获取某部位的所有动作 */
export async function getExercisesByBodyPart(bodyPart: BodyPart): Promise<Exercise[]> {
  return db.exercises.where('bodyPart').equals(bodyPart).toArray();
}

/** 获取所有训练会话，按日期倒序 */
export async function getAllSessions(): Promise<WorkoutSession[]> {
  return db.workoutSessions.orderBy('date').reverse().toArray();
}

/** 保存完整的训练会话 */
export async function saveSession(session: WorkoutSession): Promise<number> {
  return db.workoutSessions.put(session);
}
