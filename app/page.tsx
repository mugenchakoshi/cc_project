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
 * - 左側: 地図表示（OpenStreetMap）
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
    enableHighAccuracy: false, // 高速化のためfalseに変更（Wi-Fi/IPベースの位置情報を使用）
    timeout: 10000, // タイムアウトを10秒に短縮（40秒から変更）
    maximumAge: 60000, // 1分以内のキャッシュを使用可能に（0から変更）
    watch: true,  // 位置情報を継続的に追跡（マーカー更新用）
  });

  /**
   * セッション初期化（ユーザー識別用 - localStorage）
   */
  useEffect(() => {
    // localStorage にセッションIDがなければ生成
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('user_session_id');
      if (!sessionId) {
        sessionId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('user_session_id', sessionId);
      }
    }
  }, []);

  /**
   * useGeolocationフックの状態を監視・デバッグ
   */
  useEffect(() => {
    console.log('Geolocation state:', {
      latitude: geolocation.latitude,
      longitude: geolocation.longitude,
      error: geolocation.error,
      loading: geolocation.loading,
      isWatching: geolocation.isWatching,
    });

    if (geolocation.error) {
      console.error('Geolocation error:', geolocation.error);
      setError(`位置情報監視エラー: ${geolocation.error}`);
    }
  }, [geolocation.error, geolocation.latitude, geolocation.longitude, geolocation.loading, geolocation.isWatching]);

  // 送信履歴の取得は不要（POSTレスポンスで直近3件が返る）

  /**
   * 位置情報取得＆送信
   */
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      let latitude: number;
      let longitude: number;
      let accuracy: number;

      // 既に取得済みの位置情報がある場合はそれを使用（高速化）
      if (geolocation.latitude && geolocation.longitude) {
        latitude = geolocation.latitude;
        longitude = geolocation.longitude;
        accuracy = geolocation.accuracy || 0;
      } else {
        // 位置情報が取得されていない場合のみ新規取得
        if (!navigator.geolocation) {
          throw new Error('このブラウザは位置情報に対応していません');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false, // 高速化のためfalseに変更
            timeout: 10000, // タイムアウトを10秒に短縮
            maximumAge: 60000 // 1分以内のキャッシュを使用可能に
          });
        });

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        accuracy = position.coords.accuracy;
      }

      // localStorage からセッションIDを取得
      const sessionId = localStorage.getItem('user_session_id');

      // リクエストボディを構築（undefined/nullを除外）
      const requestBody: Record<string, any> = {
        lat: latitude,
        lng: longitude,
      };

      // オプショナルフィールドを追加（空文字列やundefinedは除外）
      if (memo && memo.trim()) {
        requestBody.note = memo.trim();
      }
      if (genre && genre.trim()) {
        requestBody.genre = genre.trim();
      }
      if (sessionId) {
        requestBody.user_id = sessionId;
      }

      // デバッグ: リクエストボディをログ出力
      console.log('Request body:', requestBody);
      console.log('Request body (JSON):', JSON.stringify(requestBody));

      // AWS API Gatewayに直接送信
      const response = await fetch('https://n3j0j9wpk7.execute-api.us-east-1.amazonaws.com/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // デバッグ: レスポンスステータスをログ出力
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // レスポンスボディを取得（エラー時も含む）
      const responseText = await response.text();
      console.log('Response body (raw):', responseText);

      if (!response.ok) {
        // エラーレスポンスの詳細を取得
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('Error response:', errorData);
        } catch (e) {
          // JSONパースに失敗した場合は生のテキストを使用
          errorMessage = responseText || errorMessage;
        }
        
        // ステータスコードに応じたエラーオブジェクトを作成
        const error = new Error(errorMessage);
        (error as any).statusCode = response.status;
        throw error;
      }

      // レスポンスをパース
      let data: CreateEventResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      // デバッグ: レスポンスを確認
      console.log('API Response:', data);

      // POSTレスポンスは過去5件の配列
      // 最新の1件をresultに設定（Spotifyプレーヤー用）
      if (data.length > 0) {
        setResult(data);
      }

      // 配列をLocationEvent型に変換してeventsに設定
      const convertedEvents: LocationEvent[] = data.map((item, index) => ({
        eventId: `evt_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 11)}`,  // 一意のID
        latitude: parseFloat(item.location.lat),
        longitude: parseFloat(item.location.lng),
        accuracy: 0,  // レスポンスに含まれない
        // 最新の1件（index 0）のみ現在のフォーム値を使用、過去の4件はundefined
        genre: index === 0 ? (genre || undefined) : undefined,
        memo: index === 0 ? (memo || undefined) : undefined,
        timestamp: new Date(Date.now() - index * 60000).toISOString(),  // 過去のイベントは時間をずらす
        spotifyTrackId: item.spotify_id,
        song: item.song,
        artist: item.artist,
      }));

      setEvents(convertedEvents);

      // フォームリセット
      setMemo('');

    } catch (err: any) {
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        name: err.name,
        stack: err.stack,
        fullError: err
      });

      // 位置情報取得エラー
      if (err.code === 1) {
        setError('位置情報の取得が拒否されました。ブラウザの設定を確認してください。');
      } else if (err.code === 2) {
        setError('位置情報を取得できませんでした。');
      } else if (err.code === 3) {
        setError('位置情報の取得がタイムアウトしました。');
      } 
      // 503 Service Unavailable エラー
      else if (err.statusCode === 503 || (err.message && err.message.includes('Service Unavailable'))) {
        setError('サービスが一時的に利用できません。しばらく待ってから再度お試しください。');
      }
      // 504 Gateway Timeout エラー
      else if (err.statusCode === 504 || (err.message && err.message.includes('Gateway Timeout'))) {
        setError('リクエストがタイムアウトしました。時間をおいて再度お試しください。');
      }
      // 500 Internal Server Error
      else if (err.statusCode === 500) {
        setError('サーバーエラーが発生しました。しばらく待ってから再度お試しください。');
      }
      // ネットワークエラー（CORS、接続エラーなど）
      else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('ネットワークエラーが発生しました。API Gatewayへの接続を確認してください。');
      }
      // APIエラー
      else if (err.message && err.message.includes('API Error')) {
        setError(err.message);
      }
      // その他のエラー
      else {
        setError(err.message || 'エラーが発生しました');
      }
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
