# AWS Location Service セットアップガイド

このガイドでは、Amazon Location Serviceを使用した地図機能を有効にするための設定手順を説明します。

## 📝 現在の状態

現在、アプリは **OpenStreetMap** のタイルを使用して地図を表示しています。
Amazon Location Serviceに切り替えると、以下のメリットがあります：

- ✅ AWS環境との統合
- ✅ より高度な地図機能
- ✅ プライバシー重視のデータ管理
- ✅ 無料枠あり（月5万リクエスト）

## 🚀 セットアップ手順

### ステップ1: AWS CLIのインストール

まだインストールしていない場合：

**Windows:**
```bash
# MSI インストーラーをダウンロード
# https://aws.amazon.com/cli/

# または Chocolatey
choco install awscli
```

**macOS/Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### ステップ2: AWS認証情報の設定

```bash
aws configure

# 以下を入力
AWS Access Key ID: your_access_key_id
AWS Secret Access Key: your_secret_access_key
Default region name: ap-northeast-1
Default output format: json
```

### ステップ3: Amazon Location Mapの作成

```bash
# マップを作成
aws location create-map \
  --map-name location-music-map \
  --configuration Style=VectorEsriNavigation \
  --pricing-plan RequestBasedUsage \
  --region ap-northeast-1

# 作成されたマップを確認
aws location describe-map --map-name location-music-map
```

**利用可能なスタイル:**
- `VectorEsriNavigation` - ナビゲーション向け（推奨）
- `VectorEsriStreets` - ストリート地図
- `VectorEsriTopographic` - 地形図
- `VectorHereBerlin` - Here社のBerlinスタイル

### ステップ4: Cognito Identity Poolの作成

```bash
# Identity Poolを作成
aws cognito-identity create-identity-pool \
  --identity-pool-name LocationMusicAppPool \
  --allow-unauthenticated-identities \
  --region ap-northeast-1

# 出力されたIdentityPoolIdをメモ
```

**出力例:**
```json
{
    "IdentityPoolId": "ap-northeast-1:12345678-1234-1234-1234-123456789012",
    "IdentityPoolName": "LocationMusicAppPool",
    "AllowUnauthenticatedIdentities": true
}
```

### ステップ5: IAMロールとポリシーの設定

**5-1. IAMポリシーの作成**

```bash
# policy.json ファイルを作成
cat > location-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "geo:GetMap*",
        "geo:GetMapTile",
        "geo:GetMapStyleDescriptor",
        "geo:GetMapSprites",
        "geo:GetMapGlyphs"
      ],
      "Resource": "arn:aws:geo:ap-northeast-1:*:map/location-music-map"
    }
  ]
}
EOF

# ポリシーを作成
aws iam create-policy \
  --policy-name LocationMusicMapPolicy \
  --policy-document file://location-policy.json
```

**5-2. IAMロールの作成**

```bash
# trust-policy.json を作成
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "YOUR_IDENTITY_POOL_ID"
        }
      }
    }
  ]
}
EOF

# ロールを作成
aws iam create-role \
  --role-name CognitoLocationMusicRole \
  --assume-role-policy-document file://trust-policy.json

# ポリシーをロールにアタッチ
aws iam attach-role-policy \
  --role-name CognitoLocationMusicRole \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/LocationMusicMapPolicy
```

**5-3. Cognito Identity PoolにロールをアタッチPR**

```bash
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id YOUR_IDENTITY_POOL_ID \
  --roles unauthenticated=arn:aws:iam::YOUR_ACCOUNT_ID:role/CognitoLocationMusicRole
```

### ステップ6: 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```bash
cd project

cat > .env.local <<EOF
# AWS Region
NEXT_PUBLIC_AWS_REGION=ap-northeast-1

# Amazon Location Service - Map Name
NEXT_PUBLIC_LOCATION_MAP_NAME=location-music-map

# Cognito Identity Pool ID
NEXT_PUBLIC_AWS_IDENTITY_POOL_ID=ap-northeast-1:12345678-1234-1234-1234-123456789012
EOF
```

**注意:**
- `NEXT_PUBLIC_` プレフィックスが必要（ブラウザで使用するため）
- `.env.local` は `.gitignore` に追加済み（コミットしない）

### ステップ7: アプリケーションコードの更新

現在は OpenStreetMap を使用していますが、Amazon Location に切り替えるには：

**app/components/LocationMap.tsx を更新:**

```typescript
// 現在（OpenStreetMap）
style: {
  version: 8,
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      // ...
    }
  },
  // ...
}

// Amazon Location に変更
import { getMapStyleUrl, transformRequest } from '../lib/aws-location';

style: getMapStyleUrl(),
transformRequest: transformRequest,
```

### ステップ8: テスト実行

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 を開く
# 地図が表示されることを確認
```

## 🔍 トラブルシューティング

### エラー1: "Access Denied"

**原因:** IAMポリシーが正しく設定されていない

**解決:**
```bash
# ポリシーを確認
aws iam get-policy --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/LocationMusicMapPolicy

# ロールにポリシーがアタッチされているか確認
aws iam list-attached-role-policies --role-name CognitoLocationMusicRole
```

### エラー2: "Map not found"

**原因:** マップ名が正しくない

**解決:**
```bash
# 作成されたマップを確認
aws location list-maps

# 環境変数を確認
cat .env.local
```

### エラー3: "Identity Pool ID not set"

**原因:** 環境変数が読み込まれていない

**解決:**
```bash
# .env.local が正しい場所にあるか確認
ls -la .env.local

# サーバーを再起動
npm run dev
```

## 💰 料金について

### 無料枠
- マップタイル: **50,000リクエスト/月**
- Places検索: 1,000リクエスト/月

### 料金（無料枠超過時）
- マップタイル: $0.04 / 1,000リクエスト
- Places検索: $5.00 / 1,000リクエスト

### 月間1,000ユーザーの試算
```
想定:
- 1ユーザーあたり月5回アクセス = 5,000アクセス
- 1アクセスあたり20タイル読み込み = 100,000タイル

コスト:
- 無料枠: 50,000タイル
- 有料: 50,000タイル × $0.04/1,000 = $2.00

合計: 約$2.00/月（約300円）
```

## 📚 参考リンク

- [Amazon Location Service ドキュメント](https://docs.aws.amazon.com/location/)
- [MapLibre GL JS ドキュメント](https://maplibre.org/maplibre-gl-js-docs/api/)
- [AWS CLI リファレンス](https://docs.aws.amazon.com/cli/)
- [Cognito Identity Pool 設定](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html)

## ✅ チェックリスト

- [ ] AWS CLIをインストール
- [ ] AWS認証情報を設定
- [ ] Amazon Location Mapを作成
- [ ] Cognito Identity Poolを作成
- [ ] IAMロールとポリシーを設定
- [ ] `.env.local` ファイルを作成
- [ ] アプリケーションコードを更新
- [ ] テスト実行して動作確認

## 🎉 完了後

Amazon Location Serviceの設定が完了すると：

1. ✅ 地図タイルがAWSから配信される
2. ✅ AWSのCDN（CloudFront）経由で高速配信
3. ✅ AWS環境内でのデータ管理
4. ✅ より高度な地図機能が利用可能

お疲れ様でした！
