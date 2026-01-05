/**
 * Amazon Location Service 設定
 *
 * このファイルは AWS Location Service の設定を管理します
 */

import { LocationClient } from '@aws-sdk/client-location';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

// 環境変数
export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1',
  identityPoolId: process.env.NEXT_PUBLIC_AWS_IDENTITY_POOL_ID || '',
  mapName: process.env.NEXT_PUBLIC_LOCATION_MAP_NAME || 'location-music-map',
} as const;

/**
 * Amazon Location Client を作成
 * Cognito Identity Pool を使用して認証（未認証ユーザー対応）
 */
export function createLocationClient(): LocationClient {
  if (!AWS_CONFIG.identityPoolId) {
    throw new Error('NEXT_PUBLIC_AWS_IDENTITY_POOL_ID is not set');
  }

  return new LocationClient({
    region: AWS_CONFIG.region,
    credentials: fromCognitoIdentityPool({
      clientConfig: { region: AWS_CONFIG.region },
      identityPoolId: AWS_CONFIG.identityPoolId,
    }),
  });
}

/**
 * MapLibre GL 用のスタイル URL を取得
 *
 * Amazon Location Service の地図タイルを使用するための URL
 */
export function getMapStyleUrl(): string {
  const { region, mapName } = AWS_CONFIG;

  // MapLibre GL スタイル記述子の URL
  return `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor`;
}

/**
 * 認証情報を含むトランスフォーム関数
 * MapLibre GL がタイルをリクエストする際に使用
 */
export async function transformRequest(url: string, resourceType: string) {
  if (resourceType === 'Style' && !url.includes('://')) {
    // 相対パスの場合は絶対パスに変換
    url = getMapStyleUrl();
  }

  // Amazon Location Service の URL の場合のみ認証情報を付与
  if (url.includes('amazonaws.com')) {
    const client = createLocationClient();
    const credentials = await client.config.credentials();

    return {
      url,
      headers: {
        'x-amz-date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
        'Authorization': `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/...`,
      },
    };
  }

  return { url };
}

/**
 * デフォルトの地図設定
 */
export const DEFAULT_MAP_CONFIG = {
  center: [139.7671, 35.6812] as [number, number], // 東京
  zoom: 12,
  minZoom: 2,
  maxZoom: 18,
} as const;

/**
 * マーカーの色設定
 */
export const MARKER_COLORS = {
  current: '#3B82F6',      // 現在位置（青）
  event: '#EF4444',        // イベントピン（赤）
  selected: '#10B981',     // 選択中（緑）
} as const;
