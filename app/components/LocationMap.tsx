'use client';

/**
 * Amazon Location Service を使用した地図コンポーネント
 */

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_MAP_CONFIG, MARKER_COLORS, getMapStyleUrl } from '../lib/aws-location';
import type { LocationEvent } from '../types';

export interface LocationMapProps {
  currentLocation?: { latitude: number; longitude: number } | null;
  events?: LocationEvent[];
  onMapLoad?: () => void;
}

export function LocationMap({ currentLocation, events = [], onMapLoad }: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const currentMarker = useRef<maplibregl.Marker | null>(null);
  const eventMarkers = useRef<maplibregl.Marker[]>([]);

  const [mapLoaded, setMapLoaded] = useState(false);

  /**
   * 地図の初期化
   */
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // MapLibre GL マップを初期化
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        // 注意: 実際の運用では Amazon Location Service の認証が必要
        // ここでは簡易的に OpenStreetMap タイルを使用
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm'
            }
          ]
        },
        center: DEFAULT_MAP_CONFIG.center,
        zoom: DEFAULT_MAP_CONFIG.zoom,
        minZoom: DEFAULT_MAP_CONFIG.minZoom,
        maxZoom: DEFAULT_MAP_CONFIG.maxZoom,
      });

      // ナビゲーションコントロール（ズームボタン）を追加
      map.current.addControl(
        new maplibregl.NavigationControl(),
        'top-right'
      );

      // 全画面表示コントロールを追加
      map.current.addControl(
        new maplibregl.FullscreenControl(),
        'top-right'
      );

      // 地図読み込み完了時
      map.current.on('load', () => {
        setMapLoaded(true);
        onMapLoad?.();
      });

    } catch (error) {
      console.error('地図の初期化に失敗しました:', error);
    }

    // クリーンアップ
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onMapLoad]);

  /**
   * 現在位置マーカーの更新
   */
  useEffect(() => {
    if (!map.current || !mapLoaded || !currentLocation) return;

    const { latitude, longitude } = currentLocation;

    // 既存のマーカーを削除
    if (currentMarker.current) {
      currentMarker.current.remove();
    }

    // 新しいマーカーを作成
    const el = document.createElement('div');
    el.className = 'current-location-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = MARKER_COLORS.current;
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';

    currentMarker.current = new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
          '<strong>現在位置</strong>'
        )
      )
      .addTo(map.current);

    // 地図を現在位置に移動
    map.current.flyTo({
      center: [longitude, latitude],
      zoom: 15,
      duration: 1000,
    });

  }, [currentLocation, mapLoaded]);

  /**
   * イベントピンの更新
   */
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // 既存のマーカーを削除
    eventMarkers.current.forEach(marker => marker.remove());
    eventMarkers.current = [];

    // 新しいマーカーを作成
    events.forEach((event, index) => {
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.style.width = '30px';
      el.style.height = '40px';
      el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTUgMEMxMC4wMjk0IDAgNiA0LjAyOTQzIDYgOUMwIDEwLjYyMTQgNyAxNiAxNSA0MEMyMyAxNiAyNCAxMC42MjE0IDI0IDlDMjQgNC4wMjk0MyAxOS45NzA2IDAgMTUgMFoiIGZpbGw9IiNFRjQ0NDQiLz48Y2lyY2xlIGN4PSIxNSIgY3k9IjkiIHI9IjUiIGZpbGw9IndoaXRlIi8+PC9zdmc+)';
      el.style.backgroundSize = 'contain';
      el.style.cursor = 'pointer';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([event.longitude, event.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; min-width: 200px;">
              <strong style="font-size: 14px;">${event.genre || 'ジャンル未選択'}</strong><br/>
              ${event.song ? `
                <div style="margin-top: 6px; padding: 6px; background-color: #f3f4f6; border-radius: 4px;">
                  <div style="font-size: 12px; font-weight: 600; color: #1f2937;">
                    🎵 ${event.song}
                  </div>
                  <div style="font-size: 11px; color: #6b7280;">
                    ${event.artist || '不明'}
                  </div>
                </div>
              ` : ''}
              ${event.memo ? `
                <div style="font-size: 12px; color: #666; margin-top: 6px;">
                  📝 ${event.memo}
                </div>
              ` : ''}
              <div style="font-size: 11px; color: #999; margin-top: 6px;">
                🕒 ${new Date(event.timestamp).toLocaleString('ja-JP')}
              </div>
            </div>
          `)
        )
        .addTo(map.current!);

      eventMarkers.current.push(marker);
    });

    // すべてのマーカーが表示されるように地図を調整
    if (events.length > 0) {
      const bounds = new maplibregl.LngLatBounds();

      events.forEach(event => {
        bounds.extend([event.longitude, event.latitude]);
      });

      if (currentLocation) {
        bounds.extend([currentLocation.longitude, currentLocation.latitude]);
      }

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    }

  }, [events, mapLoaded, currentLocation]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {!mapLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          地図を読み込み中...
        </div>
      )}
    </div>
  );
}
