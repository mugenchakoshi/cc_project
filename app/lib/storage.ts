import { LocationEvent } from '../types';
import fs from 'fs/promises';
import path from 'path';

// メモリストレージ（開発用）
let eventsMemory: LocationEvent[] = [];

// JSONファイルパス
const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

/**
 * データディレクトリの初期化
 */
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create data directory:', error);
  }
}

/**
 * イベントを保存
 * 将来的にはDB（DynamoDB、PostgreSQL等）に移行可能
 */
export async function saveEvent(event: LocationEvent): Promise<void> {
  // メモリに保存
  eventsMemory.push(event);

  // JSONファイルにも保存（永続化）
  try {
    await ensureDataDir();
    await fs.writeFile(EVENTS_FILE, JSON.stringify(eventsMemory, null, 2));
  } catch (error) {
    console.error('Failed to save event to file:', error);
    // ファイル保存失敗でもメモリには残っているのでエラーを投げない
  }
}

/**
 * すべてのイベントを取得
 */
export async function getAllEvents(): Promise<LocationEvent[]> {
  // 初回ロード時にファイルから読み込み
  if (eventsMemory.length === 0) {
    try {
      const data = await fs.readFile(EVENTS_FILE, 'utf-8');
      eventsMemory = JSON.parse(data);
    } catch (error) {
      // ファイルが存在しない場合は空配列
      eventsMemory = [];
    }
  }
  return eventsMemory;
}

/**
 * イベントIDで検索
 */
export async function getEventById(eventId: string): Promise<LocationEvent | null> {
  const events = await getAllEvents();
  return events.find(e => e.eventId === eventId) || null;
}

/**
 * DB移行時のマイグレーション用関数（プレースホルダー）
 * 例: DynamoDB, PostgreSQL, MongoDB等への移行
 */
export async function migrateToDatabase(): Promise<void> {
  // TODO: 将来的にDB移行する際の実装
  // const events = await getAllEvents();
  // await db.events.insertMany(events);
  throw new Error('Not implemented - placeholder for future DB migration');
}
