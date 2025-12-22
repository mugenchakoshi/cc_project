// イベントデータの型定義
export interface LocationEvent {
  eventId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  memo?: string;
  genre?: string;
  timestamp: string;
  spotifyTrackId?: string;
}

// APIリクエストの型
export interface CreateEventRequest {
  latitude: number;
  longitude: number;
  accuracy: number;
  memo?: string;
  genre?: string;
}

// APIレスポンスの型
export interface CreateEventResponse {
  success: boolean;
  eventId?: string;
  timestamp?: string;
  spotifyTrackId?: string;
  trackInfo?: {
    name: string;
    artist: string;
  };
  error?: string;
}

// 音楽ジャンル
export const MUSIC_GENRES = [
  'Pop',
  'Rock',
  'Jazz',
  'Classical',
  'Electronic',
  'Hip Hop',
  'R&B',
  'Country',
  'Indie',
  'Alternative'
] as const;

export type MusicGenre = typeof MUSIC_GENRES[number];
