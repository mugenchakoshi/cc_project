/** @type {import('next').NextConfig} */
const nextConfig = {
  // 注意: API Routeをプロキシとして使用するため、output: 'export'は無効化
  // SSGページ + サーバーレスAPI Routeのハイブリッド構成

  // Spotify埋め込みWidgetのため
  images: {
    domains: ['i.scdn.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
