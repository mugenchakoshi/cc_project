import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

/**
 * セッション管理API
 * ユーザーごとに一意のIDを発行してCookieに保存
 */

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'user_session_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

/**
 * GET /api/session
 * 現在のセッションIDを取得、なければ新規発行
 */
export async function GET(request: NextRequest) {
  // 既存のセッションIDを取得
  let sessionId = request.cookies.get(COOKIE_NAME)?.value;

  // セッションIDがない場合は新規発行
  if (!sessionId) {
    sessionId = generateSessionId();
  }

  const response = NextResponse.json({
    sessionId,
    isNew: !request.cookies.get(COOKIE_NAME)?.value,
  });

  // Cookieを設定
  response.cookies.set(COOKIE_NAME, sessionId, {
    httpOnly: true,        // JavaScriptからアクセス不可（XSS対策）
    secure: process.env.NODE_ENV === 'production', // HTTPS必須（本番のみ）
    sameSite: 'lax',       // CSRF対策
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}

/**
 * セッションID生成
 */
function generateSessionId(): string {
  return `usr_${Date.now()}_${randomBytes(16).toString('hex')}`;
}
