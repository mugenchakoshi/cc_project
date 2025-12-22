'use client';

import { useState } from 'react';
import { MUSIC_GENRES, CreateEventResponse } from './types';

/**
 * このコンポーネントはSSG（Static Site Generation）で動作します
 *
 * Next.js App Routerでは、'use client'コンポーネントも
 * ビルド時に静的HTMLとして生成され、クライアント側でハイドレーションされます
 *
 * - ビルド時: 初期HTMLが静的生成される
 * - ランタイム: クライアント側で位置情報取得、API呼び出しが実行される
 */

export default function HomePage() {
  const [genre, setGenre] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [result, setResult] = useState<CreateEventResponse | null>(null);
  const [error, setError] = useState<string>('');

  /**
   * 位置情報取得＆送信
   */
  const handleSubmit = async () => {
    setLoading(true);
    setLocationStatus('位置情報を取得中...');
    setError('');
    setResult(null);

    try {
      // Geolocation API で位置情報取得
      if (!navigator.geolocation) {
        throw new Error('このブラウザは位置情報に対応していません');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 40000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      setLocationStatus(`位置情報取得成功 (精度: ${Math.round(accuracy)}m)`);

      // Next.js API Route経由でAWS API Gatewayに送信（CORS回避）
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: latitude,
          lng: longitude,
          note: memo.trim() || undefined,
          genre: genre || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: CreateEventResponse = await response.json();

      // デバッグ: レスポンスを確認
      console.log('API Response:', data);

      setResult(data);
      setLocationStatus('送信成功');

      // フォームリセット
      setMemo('');

    } catch (err: any) {
      console.error('Error:', err);
      if (err.code === 1) {
        setError('位置情報の取得が拒否されました。ブラウザの設定を確認してください。');
      } else if (err.code === 2) {
        setError('位置情報を取得できませんでした。');
      } else if (err.code === 3) {
        setError('位置情報の取得がタイムアウトしました。');
      } else {
        setError(err.message || 'エラーが発生しました');
      }
      setLocationStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        位置情報ベース音楽推薦アプリ (MVP)
      </h1>

      {/* フォーム */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            音楽ジャンル（任意）
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            disabled={loading}
          >
            <option value="">-- 選択してください --</option>
            {MUSIC_GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            メモ（任意）
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="今の気分や場所のメモを入力..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical'
            }}
            disabled={loading}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '処理中...' : '位置情報を取得して送信'}
        </button>
      </div>

      {/* ステータス表示 */}
      {locationStatus && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {locationStatus}
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '4px',
          marginBottom: '16px',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
            おすすめの楽曲
          </h2>

          {/* 楽曲情報 */}
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            <div><strong>楽曲名:</strong> {result.song}</div>
            <div><strong>アーティスト:</strong> {result.artist}</div>
            {result.location && (
              <div><strong>位置情報:</strong> {result.location.lat}, {result.location.lng}</div>
            )}
            <div><strong>Spotify Track ID:</strong> {result.spotify_id}</div>
          </div>

          {/* Spotify埋め込みWidget */}
          {result.spotify_id && (
            <div style={{ marginTop: '16px' }}>
              <iframe
                src={`https://open.spotify.com/embed/track/${result.spotify_id}`}
                width="100%"
                height="352"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: '8px' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
