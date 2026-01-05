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
  // 曲情報（バックエンドから返される場合）
  song?: string;
  artist?: string;
}

// APIリクエストの型（API Gateway用）
export interface CreateEventRequest {
  lat: number;
  lng: number;
  note?: string;
  genre?: string;
}

// APIレスポンスの型（API Gateway用）
// POSTは直近3件の配列を返す
export interface CreateEventResponseItem {
  song: string;
  artist: string;
  location: {
    lat: string;
    lng: string;
  };
  spotify_id: string;
}

export type CreateEventResponse = CreateEventResponseItem[];

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
