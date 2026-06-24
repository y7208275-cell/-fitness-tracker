// 数据类型定义

/** 训练部位 */
export type BodyPart = '胸' | '背' | '腿' | '肩' | '手臂';

/** 设备类型 */
export type Equipment = '杠铃' | '哑铃' | '绳索' | '器械' | '自重' | '其他';

/** 预设动作 */
export interface Exercise {
  id: number;
  name: string;
  bodyPart: BodyPart;
  equipment: Equipment;
  /** 是否为用户自定义动作 */
  custom: boolean;
}

/** 单组记录 */
export interface WorkoutSet {
  id: number;
  /** 重量(kg) */
  weight: number;
  /** 次数 */
  reps: number;
}

/** 训练中的一个动作记录 */
export interface WorkoutExercise {
  id: number;
  exerciseId: number;
  exerciseName: string;
  bodyPart: BodyPart;
  sets: WorkoutSet[];
}

/** 一次完整的训练会话 */
export interface WorkoutSession {
  id?: number;
  date: string; // ISO date YYYY-MM-DD
  bodyPart: BodyPart;
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  durationMinutes: number;
  exercises: WorkoutExercise[];
}

/** 五分化排期设置 */
export interface FiveDaySplit {
  /** 0=周一, 1=周二... */
  dayOfWeek: number;
  bodyPart: BodyPart | null; // null 表示休息日
}

/** 应用设置 */
export interface AppSettings {
  id: number;
  splitSchedule: FiveDaySplit[];
}
