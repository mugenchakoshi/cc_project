/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的エクスポート（S3配信用）
  // API RoutesはAPI Gateway + Lambdaで実装するため、静的エクスポートを有効化
  output: 'export',

  // Spotify埋め込みWidgetのため
  images: {
    domains: ['i.scdn.co'],
    unoptimized: true, // 静的エクスポート時は画像最適化を無効化
  },
};

module.exports = nextConfig;
