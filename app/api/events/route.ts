import { NextRequest, NextResponse } from 'next/server';
import { CreateEventRequest, CreateEventResponse, LocationEvent } from '@/app/types';
import { saveEvent } from '@/app/lib/storage';
import { getRecommendedTrack } from '@/app/lib/spotify';
import { randomBytes } from 'crypto';

/**
 * イベントID生成
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

/**
 * 位置情報の検証
 */
function validateLocation(lat: number, lon: number, accuracy: number): boolean {
  // 緯度: -90 ~ 90
  if (lat < -90 || lat > 90) return false;
  // 経度: -180 ~ 180
  if (lon < -180 || lon > 180) return false;
  // 精度: 正の数
  if (accuracy < 0) return false;
  return true;
}

/**
 * POST /api/events
 * 位置情報イベントを受信し、おすすめ楽曲を返す
 *
 * 将来的な拡張案:
 * - クエリパラメータ ?mode=end で「セッション終了モード」を実装可能
 * - または別エンドポイント POST /api/sessions/end を作成
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateEventRequest = await request.json();

    // バリデーション
    const { latitude, longitude, accuracy, memo, genre } = body;

    if (!latitude || !longitude || accuracy === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: latitude, longitude, accuracy'
        } as CreateEventResponse,
        { status: 400 }
      );
    }

    if (!validateLocation(latitude, longitude, accuracy)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid location data'
        } as CreateEventResponse,
        { status: 400 }
      );
    }

    // イベントID生成
    const eventId = generateEventId();
    const timestamp = new Date().toISOString();

    // おすすめトラック取得（現在はダミー、将来的にはML/AIエンジンと連携）
    const recommendedTrack = getRecommendedTrack(genre, latitude, longitude);

    // イベント保存
    const event: LocationEvent = {
      eventId,
      latitude,
      longitude,
      accuracy,
      memo,
      genre,
      timestamp,
      spotifyTrackId: recommendedTrack.trackId
    };

    await saveEvent(event);

    // レスポンス
    const response: CreateEventResponse = {
      success: true,
      eventId,
      timestamp,
      spotifyTrackId: recommendedTrack.trackId,
      trackInfo: {
        name: recommendedTrack.name,
        artist: recommendedTrack.artist
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error processing event:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      } as CreateEventResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/events
 * すべてのイベントを取得（管理用）
 */
export async function GET() {
  try {
    const { getAllEvents } = await import('@/app/lib/storage');
    const events = await getAllEvents();
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
