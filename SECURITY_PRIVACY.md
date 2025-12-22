# セキュリティ・プライバシー実装ガイド

## 1. 位置情報のプライバシー保護

### 1.1 同意取得（実装済み）

**現在の実装:**
- UI上で位置情報の使用目的を明示
- 「プライバシーについて」セクションに利用規約を表示

**推奨される改善:**
```typescript
// app/components/PrivacyConsent.tsx
'use client';
import { useState, useEffect } from 'react';

export function PrivacyConsent({ onConsent }: { onConsent: (agreed: boolean) => void }) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    // ローカルストレージから同意状態を読み込み
    const consent = localStorage.getItem('locationConsent');
    if (consent === 'true') {
      setAgreed(true);
      onConsent(true);
    }
  }, [onConsent]);

  const handleAgree = () => {
    localStorage.setItem('locationConsent', 'true');
    setAgreed(true);
    onConsent(true);
  };

  if (agreed) return null;

  return (
    <div className="consent-modal">
      <h2>位置情報の利用について</h2>
      <p>このアプリは以下の目的で位置情報を使用します:</p>
      <ul>
        <li>音楽推薦の精度向上</li>
        <li>サービス改善のための統計分析</li>
      </ul>
      <button onClick={handleAgree}>同意する</button>
    </div>
  );
}
```

### 1.2 位置精度の丸め（未実装 - 推奨）

プライバシー保護のため、位置情報を粗くする:

```typescript
// app/lib/privacy.ts
export function roundLocation(lat: number, lon: number, precision: number = 2): {
  latitude: number;
  longitude: number;
} {
  // precision=2: 約1km単位に丸める
  // precision=3: 約100m単位に丸める
  // precision=4: 約10m単位に丸める
  const factor = Math.pow(10, precision);
  return {
    latitude: Math.round(lat * factor) / factor,
    longitude: Math.round(lon * factor) / factor
  };
}

// 使用例（app/api/events/route.ts）
import { roundLocation } from '@/app/lib/privacy';

const { latitude, longitude } = roundLocation(body.latitude, body.longitude, 2);
```

**推奨精度:**
- 都市部: 100m単位 (precision=3)
- 郊外・田舎: 1km単位 (precision=2)

### 1.3 データ保存期間（未実装 - 推奨）

GDPRやプライバシー法に準拠するため、古いデータを自動削除:

```typescript
// app/lib/storage.ts に追加
export async function cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
  const events = await getAllEvents();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const filtered = events.filter(event => {
    const eventDate = new Date(event.timestamp);
    return eventDate > cutoffDate;
  });

  const deletedCount = events.length - filtered.length;
  eventsMemory = filtered;

  // ファイルに保存
  await fs.writeFile(EVENTS_FILE, JSON.stringify(filtered, null, 2));

  return deletedCount;
}

// 定期実行（例: Next.js API Route + Cron Job）
// app/api/cleanup/route.ts
export async function GET() {
  const deleted = await cleanupOldEvents(90); // 90日より古いデータを削除
  return NextResponse.json({ deleted });
}
```

**Cronジョブ設定例（Vercel）:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cleanup",
    "schedule": "0 0 * * *"
  }]
}
```

## 2. APIセキュリティ

### 2.1 レート制限（未実装 - 推奨）

DDoS攻撃や悪用を防ぐため:

```typescript
// app/lib/rateLimit.ts
import { NextRequest } from 'next/server';

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  request: NextRequest,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1分
): { allowed: boolean; remaining: number } {
  // IPアドレスまたはユーザーIDをキーとする
  const key = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = requestCounts.get(key);

  if (!record || now > record.resetAt) {
    // 新しいウィンドウ
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// 使用例（app/api/events/route.ts）
import { rateLimit } from '@/app/lib/rateLimit';

export async function POST(request: NextRequest) {
  const { allowed, remaining } = rateLimit(request, 10, 60000);

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // 通常の処理...
}
```

### 2.2 入力バリデーション（一部実装済み）

**現在の実装:**
- 緯度・経度・精度の範囲チェック

**追加推奨:**
```typescript
// app/lib/validation.ts
export function validateMemo(memo?: string): boolean {
  if (!memo) return true; // 任意項目

  // 長さ制限（1000文字以内）
  if (memo.length > 1000) return false;

  // XSS対策: HTMLタグを含まない
  if (/<[^>]*>/g.test(memo)) return false;

  return true;
}

export function validateGenre(genre?: string): boolean {
  if (!genre) return true; // 任意項目

  const validGenres = ['Pop', 'Rock', 'Jazz', /* ... */];
  return validGenres.includes(genre);
}

// app/api/events/route.ts で使用
import { validateMemo, validateGenre } from '@/app/lib/validation';

if (!validateMemo(memo)) {
  return NextResponse.json(
    { success: false, error: 'Invalid memo format' },
    { status: 400 }
  );
}
```

### 2.3 CORS設定（本番環境で必要）

```typescript
// next.config.js に追加
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
      ],
    },
  ];
}
```

## 3. データ暗号化

### 3.1 通信の暗号化（HTTPS必須）

**開発環境:**
- `localhost` では自動的にHTTPでOK（Geolocation APIの例外）

**本番環境:**
- HTTPS必須（Let's Encrypt等で証明書取得）
- Vercel/Netlifyなどは自動でHTTPS提供

### 3.2 データベース暗号化（DB移行時）

**DynamoDB:**
```typescript
// 暗号化オプション有効化
const table = new dynamodb.Table(this, 'EventsTable', {
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  // または CUSTOMER_MANAGED で独自KMSキー使用
});
```

**PostgreSQL (例: RDS):**
- 保存時の暗号化（Encryption at Rest）
- 転送時の暗号化（SSL/TLS）

### 3.3 アプリケーションレベルの暗号化

機密性の高い位置情報を暗号化して保存:

```typescript
// app/lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.ENCRYPTION_KEY!; // 32バイトの秘密鍵（環境変数）

export function encryptLocation(lat: number, lon: number): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(KEY, 'hex'), iv);

  const data = JSON.stringify({ lat, lon });
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex')
  });
}

export function decryptLocation(encryptedData: string): { lat: number; lon: number } {
  const { iv, encrypted, authTag } = JSON.parse(encryptedData);

  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(KEY, 'hex'),
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
```

**.env.local:**
```
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

## 4. 認証・認可

### 4.1 AWS Cognito統合（将来）

```typescript
// app/lib/auth.ts
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

export async function authenticateUser(username: string, password: string) {
  const client = new CognitoIdentityProviderClient({ region: 'ap-northeast-1' });

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.COGNITO_CLIENT_ID!,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  });

  const response = await client.send(command);
  return response.AuthenticationResult?.IdToken;
}

// ミドルウェアで認証チェック
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // トークン検証...

  return NextResponse.next();
}

export const config = {
  matcher: '/api/events/:path*'
};
```

### 4.2 セッション管理

```typescript
// app/lib/session.ts
import { v4 as uuidv4 } from 'uuid';

export interface Session {
  sessionId: string;
  userId?: string;
  createdAt: string;
  expiresAt: string;
}

export function createSession(userId?: string): Session {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24時間

  return {
    sessionId: uuidv4(),
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}
```

## 5. ロギング・監査

### 5.1 アクセスログ

```typescript
// app/lib/logger.ts
export function logAccess(request: NextRequest, response: NextResponse) {
  const log = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    ip: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
    status: response.status
  };

  console.log(JSON.stringify(log));
  // 本番環境ではCloudWatch Logsやログ管理サービスに送信
}
```

### 5.2 エラー監視

**Sentry統合例:**
```typescript
// app/api/events/route.ts
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    // 処理...
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: 'events',
        method: 'POST'
      }
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 6. チェックリスト

### 開発環境
- [x] 位置情報の使用目的を明示
- [x] HTTPSまたはlocalhostで動作
- [x] 基本的な入力バリデーション
- [ ] 同意管理の実装
- [ ] レート制限の実装

### 本番環境
- [ ] HTTPS必須
- [ ] 位置精度の丸め
- [ ] データ保存期間の設定
- [ ] 古いデータの自動削除
- [ ] レート制限（API Gateway等）
- [ ] 認証・認可（Cognito等）
- [ ] データベース暗号化
- [ ] アクセスログ・監査ログ
- [ ] エラー監視（Sentry等）
- [ ] GDPR/プライバシー法対応
- [ ] プライバシーポリシーの公開

## 7. 参考リンク

- [GDPR](https://gdpr.eu/)
- [個人情報保護委員会](https://www.ppc.go.jp/)
- [Geolocation API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Geolocation_API)
- [AWS セキュリティベストプラクティス](https://aws.amazon.com/security/best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
