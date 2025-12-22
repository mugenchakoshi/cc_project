/** @type {import('next').NextConfig} */
const nextConfig = {
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
