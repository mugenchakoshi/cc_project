/** @type {import('next').NextConfig} */
const nextConfig = {
  // SSG（静的サイト生成）の設定
  // 注意: output: 'export' は使用しない（API Routesを保持するため）

  // ページの静的生成を優先
  // experimental: {
  //   appDir: true, // App Router（既定で有効）
  // },

  // Spotify埋め込みWidgetのため
  images: {
    domains: ['i.scdn.co'],
  },

  // 本番環境でのセキュリティヘッダー
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
