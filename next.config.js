/** @type {import('next').NextConfig} */
const nextConfig = {
  // S3での静的ホスティング用に完全静的エクスポート
  output: 'export',

  // Spotify埋め込みWidgetのため
  images: {
    domains: ['i.scdn.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
