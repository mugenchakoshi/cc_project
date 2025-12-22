import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '位置情報ベース音楽推薦アプリ',
  description: '位置情報とメモから最適な音楽を推薦するWebアプリ（MVP）',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
