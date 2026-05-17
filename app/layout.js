import './globals.css';

export const metadata = {
  title: 'LMS Platform',
  description: 'Production-ready learning management system built with Next.js App Router',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
