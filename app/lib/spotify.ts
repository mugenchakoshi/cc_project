import { MusicGenre } from '../types';

/**
 * Spotify埋め込みWidgetのURL生成
 * @param trackId Spotify Track ID
 * @returns 埋め込み用URL
 */
export function getSpotifyEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}`;
}

/**
 * ダミーのSpotify Track IDを返す
 * 将来的にはSpotify APIまたは推薦エンジンと連携
 *
 * @param genre 音楽ジャンル
 * @param latitude 緯度（将来的に位置ベース推薦に使用）
 * @param longitude 経度（将来的に位置ベース推薦に使用）
 * @returns Spotify Track ID
 */
export function getRecommendedTrack(
  genre?: string,
  latitude?: number,
  longitude?: number
): { trackId: string; name: string; artist: string } {
  // ジャンル別のダミートラック（実在するSpotify Track ID）
  const tracksByGenre: Record<string, { trackId: string; name: string; artist: string }> = {
    'Pop': {
      trackId: '3n3Ppam7vgaVa1iaRUc9Lp',
      name: 'Mr. Brightside',
      artist: 'The Killers'
    },
    'Rock': {
      trackId: '7qiZfU4dY1lWllzX7mPBI',
      name: 'Shape of You',
      artist: 'Ed Sheeran'
    },
    'Jazz': {
      trackId: '5JLLLP6jaHsJJPoXkEvz7z',
      name: 'Take Five',
      artist: 'Dave Brubeck'
    },
    'Classical': {
      trackId: '4RVnAU35WRWra6OZ3OHw11',
      name: 'Clair de Lune',
      artist: 'Claude Debussy'
    },
    'Electronic': {
      trackId: '0DiWol3AO6WpXZgp0goxAV',
      name: 'One More Time',
      artist: 'Daft Punk'
    },
    'Hip Hop': {
      trackId: '3a1lNhkSLSkpJE4MSHpDu9',
      name: 'Lose Yourself',
      artist: 'Eminem'
    },
    'R&B': {
      trackId: '0cqRj7pUJDkTCEsJkx8snD',
      name: 'Blinding Lights',
      artist: 'The Weeknd'
    },
    'Country': {
      trackId: '4GFlMXKTDSAJeUiKDWjLVy',
      name: 'Jolene',
      artist: 'Dolly Parton'
    },
    'Indie': {
      trackId: '3qiyyUfYe7CRYLucrPmulD',
      name: 'Electric Feel',
      artist: 'MGMT'
    },
    'Alternative': {
      trackId: '6b2RcmUt1g9N9mQ1ArY0vj',
      name: 'Creep',
      artist: 'Radiohead'
    }
  };

  // デフォルトトラック
  const defaultTrack = {
    trackId: '3n3Ppam7vgaVa1iaRUc9Lp',
    name: 'Mr. Brightside',
    artist: 'The Killers'
  };

  // ジャンルが指定されていればそれに応じたトラックを返す
  if (genre && tracksByGenre[genre]) {
    return tracksByGenre[genre];
  }

  return defaultTrack;
}

/**
 * 将来的なSpotify API連携の例（プレースホルダー）
 *
 * 必要な実装:
 * 1. Spotify OAuth認証
 * 2. アクセストークン取得
 * 3. Recommendations API呼び出し
 * 4. 位置情報・時間・気分に基づく推薦ロジック
 */
export async function getSpotifyRecommendations(
  accessToken: string,
  params: {
    genre?: string;
    mood?: string;
    location?: { lat: number; lon: number };
    time?: Date;
  }
): Promise<any> {
  // TODO: 実装例
  // const response = await fetch('https://api.spotify.com/v1/recommendations', {
  //   headers: {
  //     'Authorization': `Bearer ${accessToken}`
  //   },
  //   method: 'GET',
  //   // params: seed_genres, target_energy, etc.
  // });
  // return response.json();

  throw new Error('Not implemented - placeholder for future Spotify API integration');
}
