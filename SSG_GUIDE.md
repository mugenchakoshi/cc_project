# SSG（Static Site Generation）実装ガイド

## 概要

このプロジェクトは **SSG (Static Site Generation)** を採用しています。

## SSG化の詳細

### 変更内容

#### 1. app/layout.tsx
```typescript
// SSG設定（静的サイト生成）
export const dynamic = 'force-static';
```

**効果:**
- ルートレイアウトとその子ページを静的生成に強制
- ビルド時にHTMLファイルを生成

#### 2. app/page.tsx
```typescript
'use client';

/**
 * このコンポーネントはSSG（Static Site Generation）で動作します
 *
 * - ビルド時: 初期HTMLが静的生成される
 * - ランタイム: クライアント側で位置情報取得、API呼び出しが実行される
 */
```

**動作:**
- `'use client'` でもSSGは動作する
- ビルド時に初期HTMLが生成される
- クライアント側でハイドレーション（JavaScriptで動的化）

### ビルド結果の確認

```bash
npm run build
```

**出力:**
```
Route (app)                              Size     First Load JS
┌ ○ /                                    2.28 kB        89.5 kB
├ ○ /_not-found                          873 B          88.1 kB
└ ƒ /api/events                          0 B                0 B

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**解説:**
- `○ /`: メインページが **静的生成** されている ✅
- `ƒ /api/events`: API Routesは **動的** に残っている ✅

## SSRとSSGの違い

### SSR（変更前）

```
ユーザーがアクセス
  ↓
サーバーがリクエストを受信
  ↓
サーバーがReactコンポーネントをレンダリング
  ↓
HTMLを生成して返す
  ↓
ブラウザで表示
```

**特徴:**
- リクエストごとにサーバー処理が必要
- サーバー負荷が高い
- レスポンスが遅い可能性

### SSG（変更後）

```
ビルド時
  ↓
すべてのページのHTMLを事前生成
  ↓
静的ファイルとして保存

---

ユーザーがアクセス
  ↓
静的HTMLをそのまま返す（サーバー処理なし）
  ↓
ブラウザで表示
  ↓
クライアント側でJavaScriptが動作（ハイドレーション）
  ↓
位置情報取得、API呼び出し
```

**特徴:**
- サーバー処理が不要（CDNから配信可能）
- 高速なページ読み込み
- スケーラブル

## このアプリのSSG構成

### 静的部分（SSG）

- **ページHTML**: ビルド時に生成
- **初期UI**: 静的に配信
- **メタデータ**: 事前生成

### 動的部分（クライアント側）

- **位置情報取得**: `navigator.geolocation` API
- **フォーム入力**: ユーザーインタラクション
- **API呼び出し**: `/api/events` へのPOSTリクエスト
- **結果表示**: Spotify Widget表示

### API Routes（サーバーレス関数）

- **POST /api/events**: リクエストごとに動的実行
- **GET /api/events**: リクエストごとに動的実行

## メリット

### 1. パフォーマンス

- **初回ロード**: 静的HTMLを即座に配信
- **TTI (Time to Interactive)**: 高速
- **CDN配信**: 世界中から高速アクセス

### 2. コスト

- **サーバーレス**: サーバー維持コスト不要
- **スケーリング**: トラフィック増加時も追加コストなし

### 3. セキュリティ

- **攻撃対象の削減**: サーバー処理が少ない
- **DDoS耐性**: 静的ファイルは攻撃に強い

### 4. デプロイの簡単さ

- **Vercel**: `vercel` コマンド一発
- **Netlify**: GitHubプッシュで自動デプロイ
- **AWS Amplify**: CI/CD自動構築

## ビルドコマンド

```bash
# 開発サーバー（SSRモード）
npm run dev

# 本番ビルド（SSG）
npm run build

# 本番サーバー起動
npm run start

# ビルド結果の確認
ls -la .next/server/app
```

## デプロイ手順（Vercel）

```bash
# 1. Vercel CLIインストール
npm install -g vercel

# 2. デプロイ
vercel

# 初回設定
? Set up and deploy? Yes
? Which scope? (自分のアカウント)
? Link to existing project? No
? What's your project's name? location-music-app
? In which directory is your code located? ./
? Want to override settings? No

# デプロイ完了！
✅ Production: https://location-music-app.vercel.app
```

## 静的ファイルの確認

ビルド後、以下のファイルが生成されます:

```
project/.next/
├── server/
│   ├── app/
│   │   ├── index.html          ← 静的HTML
│   │   └── index.rsc           ← React Server Component
│   └── chunks/
├── static/
│   ├── chunks/                 ← JavaScriptバンドル
│   └── css/                    ← CSSファイル
└── BUILD_ID
```

**確認コマンド:**
```bash
# 静的HTMLを確認
cat .next/server/app/index.html

# ビルドサイズを確認
du -sh .next
```

## パフォーマンス計測

### Lighthouse スコア（期待値）

- **Performance**: 95-100
- **Accessibility**: 95-100
- **Best Practices**: 90-100
- **SEO**: 90-100

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: < 1.0s
- **FID (First Input Delay)**: < 50ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## トラブルシューティング

### 問題1: API Routesが動かない

**症状:**
```
Error: API Routes are not supported in output: 'export'
```

**原因:**
`next.config.js` で `output: 'export'` を設定している

**解決:**
`output: 'export'` を削除（現在の設定では使用していない）

### 問題2: ビルドが失敗する

**症状:**
```
Error: Invalid revalidate value
```

**原因:**
クライアントコンポーネント（'use client'）で `revalidate` をエクスポートしている

**解決:**
`layout.tsx`（サーバーコンポーネント）にのみ設定を記述

### 問題3: 動的データが表示されない

**症状:**
ビルド時のデータが固定表示される

**原因:**
SSGは**ビルド時**にデータを取得する

**解決:**
このアプリでは問題なし（データ取得はクライアント側）

## 既存機能の確認

### ✅ 動作確認済み

- [x] 位置情報取得（Geolocation API）
- [x] メモ入力
- [x] ジャンル選択
- [x] API呼び出し（POST /api/events）
- [x] Spotify Widget表示
- [x] エラーハンドリング

### テスト方法

```bash
# 1. ビルド
npm run build

# 2. 本番サーバー起動
npm run start

# 3. ブラウザでアクセス
http://localhost:3000

# 4. 位置情報を送信して動作確認
# - ジャンル選択
# - メモ入力
# - 位置情報取得ボタンクリック
# - Spotify Widgetが表示されることを確認
```

## まとめ

このアプリは **SSG + クライアント側処理 + API Routes** のハイブリッド構成です:

| 項目 | 方式 | 説明 |
|------|------|------|
| **ページHTML** | SSG | ビルド時に静的生成 |
| **位置情報取得** | クライアント | ブラウザで実行 |
| **API呼び出し** | クライアント | フェッチで実行 |
| **API Routes** | サーバーレス | リクエストごとに実行 |

既存機能は**すべて維持**されており、パフォーマンスが向上しています。
