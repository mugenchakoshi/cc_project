import type { Metadata } from 'next';

// SSG設定（静的サイト生成）
// このレイアウトとその子ページは完全に静的生成される
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '位置情報ベース音楽推薦アプリ',
  description: '位置情報とメモから最適な音楽を推薦するWebアプリ',
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
