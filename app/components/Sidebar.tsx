'use client';

/**
 * サイドバーコンポーネント
 * Google Maps風のUIを実現するためのサイドバー
 */

import { MUSIC_GENRES, CreateEventResponse, LocationEvent } from '../types';

export interface SidebarProps {
  genre: string;
  setGenre: (genre: string) => void;
  memo: string;
  setMemo: (memo: string) => void;
  loading: boolean;
  locationStatus: string;
  error: string;
  result: CreateEventResponse | null;
  onSubmit: () => void;
  events: LocationEvent[];
}

export function Sidebar({
  genre,
  setGenre,
  memo,
  setMemo,
  loading,
  locationStatus,
  error,
  result,
  onSubmit,
  events,
}: SidebarProps) {
  return (
    <div style={{
      width: '350px',
      height: '100%',
      backgroundColor: 'white',
      borderLeft: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ヘッダー */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          margin: 0,
        }}>
          位置情報ベース音楽推薦
        </h1>
      </div>

      {/* スクロール可能なコンテンツ */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
      }}>
        {/* フォーム */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              fontSize: '14px',
            }}>
              音楽ジャンル
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
              }}
            >
              <option value="">-- 選択してください --</option>
              {MUSIC_GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              fontSize: '14px',
            }}>
              メモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="今の気分や場所のメモ..."
              rows={3}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? '処理中...' : '📍 位置情報を取得して送信'}
          </button>
        </div>

        {/* ステータス */}
        {locationStatus && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}>
            {locationStatus}
          </div>
        )}

        {/* エラー */}
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            marginBottom: '16px',
            color: '#dc2626',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* 結果表示 */}
        {result && result.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '12px',
            }}>
              おすすめの楽曲
            </h2>

            <div style={{
              backgroundColor: '#f9fafb',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '13px',
            }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>{result[0].song}</strong>
              </div>
              <div style={{ color: '#6b7280', marginBottom: '8px' }}>
                {result[0].artist}
              </div>
              {result[0].location && (
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {result[0].location.lat}, {result[0].location.lng}
                </div>
              )}
            </div>

            {/* Spotify Widget */}
            {result[0].spotify_id && (
              <iframe
                src={`https://open.spotify.com/embed/track/${result[0].spotify_id}`}
                width="100%"
                height="200"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: '8px' }}
              />
            )}
          </div>
        )}

        {/* 送信履歴 */}
        {events.length > 0 && (
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: '#374151',
            }}>
              送信履歴 ({events.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {events.slice().reverse().slice(0, 10).map((event) => (
                <div
                  key={event.eventId}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    📍 {event.genre || 'ジャンル未選択'}
                  </div>
                  {event.memo && (
                    <div style={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}>
                      {event.memo}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {new Date(event.timestamp).toLocaleString('ja-JP')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
