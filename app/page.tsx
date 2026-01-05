'use client';

import { useState, useEffect } from 'react';
import { CreateEventResponse, LocationEvent } from './types';
import { LocationMap } from './components/LocationMap';
import { Sidebar } from './components/Sidebar';
import { useGeolocation } from './hooks/useGeolocation';

/**
 * このコンポーネントはSSG（Static Site Generation）で動作します
 *
 * Google Maps風のUIで位置情報ベースの音楽推薦を提供
 * - 左側: 地図表示（Amazon Location Service / OpenStreetMap）
 * - 右側: サイドバー（フォーム + 送信履歴）
 */

export const dynamic = 'force-static';

export default function HomePage() {
  // フォーム状態
  const [genre, setGenre] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [result, setResult] = useState<CreateEventResponse | null>(null);
  const [error, setError] = useState<string>('');

  // 送信履歴
  const [events, setEvents] = useState<LocationEvent[]>([]);

  // 位置情報フック（監視モード）
  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 40000,
    watch: false,  // ページ読み込み時から位置情報を自動取得
  });

  /**
   * セッション初期化（ユーザー識別用Cookie）
   */
  useEffect(() => {
    async function initSession() {
      try {
        await fetch('/api/session');
      } catch (error) {
        console.error('セッション初期化に失敗:', error);
      }
    }

    initSession();
  }, []);

  // 送信履歴の取得は不要（POSTレスポンスで直近3件が返る）

  /**
   * 位置情報取得＆送信
   */
  const handleSubmit = async () => {
    setLoading(true);
    setLocationStatus('位置情報を取得中...');
    setError('');
    setResult(null);

    try {
      // Geolocation APIで位置情報取得
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

      // POSTレスポンスは直近3件の配列
      // 最新の1件をresultに設定（Spotifyプレーヤー用）
      if (data.length > 0) {
        setResult(data);
      }

      // 配列をLocationEvent型に変換してeventsに設定
      const convertedEvents: LocationEvent[] = data.map((item, index) => ({
        eventId: `evt_${Date.now()}_${index}`,  // 仮のID
        latitude: parseFloat(item.location.lat),
        longitude: parseFloat(item.location.lng),
        accuracy: 0,  // レスポンスに含まれない
        genre: genre || undefined,
        memo: memo || undefined,
        timestamp: new Date().toISOString(),  // 仮のタイムスタンプ
        spotifyTrackId: item.spotify_id,
        song: item.song,
        artist: item.artist,
      }));

      setEvents(convertedEvents);
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

  // 現在位置（最後に送信した位置または取得中の位置）
  const currentLocation = geolocation.latitude && geolocation.longitude
    ? { latitude: geolocation.latitude, longitude: geolocation.longitude }
    : events.length > 0
    ? { latitude: events[events.length - 1].latitude, longitude: events[events.length - 1].longitude }
    : null;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
    }}>
      {/* 地図エリア */}
      <div style={{ flex: 1, position: 'relative' }}>
        <LocationMap
          currentLocation={currentLocation}
          events={events}
        />
      </div>

      {/* サイドバーエリア */}
      <Sidebar
        genre={genre}
        setGenre={setGenre}
        memo={memo}
        setMemo={setMemo}
        loading={loading}
        locationStatus={locationStatus}
        error={error}
        result={result}
        onSubmit={handleSubmit}
        events={events}
      />
    </div>
  );
}
