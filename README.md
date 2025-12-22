# 位置情報ベース音楽推薦アプリ (MVP)

ユーザーが位置情報とメモを送信し、おすすめの音楽をSpotifyで再生できるWebアプリです。

## 技術スタック

- **Next.js 14** (App Router)
- **TypeScript**
- **レンダリング方式**: SSG (Static Site Generation)
- **Geolocation API**
- **Spotify Embed Widget**

## レンダリング方式: SSG

このアプリは **SSG (Static Site Generation)** を採用しています。

### SSGとは

- **ビルド時**に静的HTMLファイルを生成
- サーバーレスポンスが不要で、高速なページ読み込み
- CDNにデプロイ可能で、スケーラブル

### このアプリの構成

```
┌─────────────────────────────────────┐
│ ページ（SSG）                        │
│ - ビルド時に静的HTML生成             │
│ - クライアント側でハイドレーション    │
│ - 位置情報取得はクライアント側        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ API Routes（動的）                   │
│ - POST /api/events                  │
│ - サーバーレス関数として動作         │
│ - リクエストごとに実行               │
└─────────────────────────────────────┘
```

### ビルドと実行

```bash
# 開発サーバー（SSRモード）
npm run dev

# 本番ビルド（SSG）
npm run build

# 本番サーバー起動
npm run start
```

**ビルド時の動作:**
1. `app/page.tsx` が静的HTMLとして生成される
2. API Routes (`app/api/events/route.ts`) はサーバーレス関数として準備される
3. `.next` フォルダに最適化されたファイルが出力される

### デプロイ

SSGなので以下のプラットフォームに最適:
- **Vercel** (推奨)
- **Netlify**
- **AWS Amplify**
- **Cloudflare Pages**

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 機能

### ✅ 実装済み (MVP)

1. **位置情報取得**: Geolocation APIでユーザーの現在地を取得
2. **メモ入力**: 任意のテキストメモ
3. **ジャンル選択**: 音楽ジャンルを選択（Pop, Rock, Jazz等）
4. **サーバー送信**: POST /api/events にデータ送信
5. **楽曲推薦**: ジャンルに応じたダミートラックID返却
6. **プレビュー再生**: Spotify iFrame Widgetで楽曲再生
7. **データ保存**: メモリ + JSONファイル（data/events.json）

## API仕様

### POST /api/events

位置情報イベントを送信し、おすすめ楽曲を取得します。

**Request:**
```json
{
  "latitude": 35.6812,
  "longitude": 139.7671,
  "accuracy": 20.5,
  "memo": "渋谷の交差点で",
  "genre": "Pop"
}
```

**Response (成功):**
```json
{
  "success": true,
  "eventId": "evt_1234567890_a1b2c3d4",
  "timestamp": "2025-12-22T10:30:00.000Z",
  "spotifyTrackId": "3n3Ppam7vgaVa1iaRUc9Lp",
  "trackInfo": {
    "name": "Mr. Brightside",
    "artist": "The Killers"
  }
}
```

**Response (エラー):**
```json
{
  "success": false,
  "error": "Invalid location data"
}
```

### GET /api/events

すべてのイベントを取得（管理・デバッグ用）

**Response:**
```json
{
  "success": true,
  "events": [...]
}
```

## フォルダ構成

```
exp_cloud_aws/
├── app/
│   ├── api/
│   │   └── events/
│   │       └── route.ts          # イベント受信API
│   ├── lib/
│   │   ├── storage.ts            # データ永続化層
│   │   └── spotify.ts            # Spotify関連ユーティリティ
│   ├── types/
│   │   └── index.ts              # 型定義
│   ├── layout.tsx
│   └── page.tsx                  # メインUI
├── data/
│   └── events.json               # イベントデータ保存
├── package.json
├── tsconfig.json
└── next.config.js
```

## セキュリティ/プライバシー対応

### 実装済み

1. **同意文言表示**: UI上で位置情報の使用目的を明示
2. **バリデーション**: 緯度・経度・精度の妥当性チェック
3. **セキュリティヘッダー**: X-Content-Type-Options, X-Frame-Options等
4. **HTTPS推奨**: 本番環境ではHTTPS必須（Geolocation APIの要件）

### 今後の対応が必要な項目

1. **位置精度の丸め**:
   - プライバシー保護のため、位置情報を100m〜1km単位に丸める
   - 例: `Math.round(lat * 100) / 100` で小数点2桁に丸める

2. **データ保存期間**:
   - イベントデータの保存期間を設定（例: 30日、90日）
   - 定期的な自動削除処理

3. **ユーザー認証**:
   - 不正利用防止のため認証機能を追加
   - AWS Cognito等との連携

4. **レート制限**:
   - API呼び出し回数制限（DDoS対策）
   - IPアドレスまたはユーザーIDベース

5. **データ暗号化**:
   - DBへの保存時に位置情報を暗号化
   - 通信はHTTPS必須

6. **同意管理**:
   - Cookie/ローカルストレージで同意状態を保存
   - 同意なしでは位置情報を取得しない

## 将来の拡張案

### 1. AWS連携

```
┌─────────────┐
│   Browser   │
│ (Next.js UI)│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  API Gateway    │  ← 認証（Cognito）
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Lambda      │  ← 推薦ロジック
│  (Node.js/Python)│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│DynamoDB│ │  S3      │
│(Events)│ │(Logs)    │
└────────┘ └──────────┘
```

**実装ステップ:**
1. DynamoDBテーブル作成（events, users）
2. Lambda関数デプロイ（推薦エンジン）
3. API Gateway設定
4. Cognito認証統合

### 2. Spotify API連携

現在はダミーのトラックIDを返していますが、本格的な推薦を実装する場合:

1. **Spotify OAuth認証**:
   - ユーザーがSpotifyアカウントでログイン
   - アクセストークン取得

2. **Recommendations API**:
   - ジャンル、気分、時間帯に基づく推薦
   - ユーザーの過去の再生履歴を考慮

3. **実装例**:
```typescript
// app/lib/spotify.ts に追加
export async function getSpotifyRecommendations(
  accessToken: string,
  params: {
    genre?: string;
    mood?: string;
    location?: { lat: number; lon: number };
  }
) {
  const response = await fetch('https://api.spotify.com/v1/recommendations', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    // seed_genres, target_energy等のパラメータ
  });
  return response.json();
}
```

### 3. 位置ベース推薦

- **天気情報連携**:
  - OpenWeatherMap API等で現在地の天気取得
  - 雨の日は落ち着いた曲、晴れの日は明るい曲

- **時間帯考慮**:
  - 朝: エネルギッシュな曲
  - 昼: 集中できる曲
  - 夜: リラックスできる曲

- **場所の特性**:
  - Google Places APIでカフェ、公園等を判定
  - 場所に応じたプレイリスト

### 4. DB移行

現在はJSONファイル保存ですが、本番環境では:

**オプション1: DynamoDB**
```typescript
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

export async function saveEvent(event: LocationEvent) {
  const client = new DynamoDBClient({ region: 'ap-northeast-1' });
  await client.send(new PutItemCommand({
    TableName: 'music-events',
    Item: { ... }
  }));
}
```

**オプション2: PostgreSQL (Supabase/Neon)**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

export async function saveEvent(event: LocationEvent) {
  await supabase.from('events').insert(event);
}
```

### 5. 「終了ボタン」機能の実装案

現在は没ですが、将来的に実装する場合:

**パターン1: クエリパラメータ**
```typescript
// POST /api/events?mode=end
if (request.nextUrl.searchParams.get('mode') === 'end') {
  // セッション終了処理
  // 複数イベントを集計して最適な楽曲を推薦
}
```

**パターン2: 別エンドポイント**
```typescript
// POST /api/sessions/end
export async function POST(request: NextRequest) {
  const { sessionId } = await request.json();
  // セッション内のすべてのイベントを集計
  // 総合的な推薦を返す
}
```

## トラブルシューティング

### 位置情報が取得できない

- **HTTPS必須**: ローカル開発では `localhost` でOKですが、本番環境ではHTTPSが必要
- **ブラウザの許可**: 位置情報の許可を求めるダイアログで「許可」を選択
- **精度**: 屋内やGPS信号が弱い場所では精度が低下

### Spotifyが再生されない

- **Track IDの確認**: コンソールでTrack IDが正しく取得されているか確認
- **埋め込みURL**: `https://open.spotify.com/embed/track/{trackId}` 形式が正しいか確認
- **ブラウザの互換性**: Safari等で再生制限がある場合あり

## ライセンス

MIT
