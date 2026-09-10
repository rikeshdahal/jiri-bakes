import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import Header from '@/components/navigation/Header';

export const metadata: Metadata = {
  title: {
    default: 'Jiri Bakes – Simply Organic Artisan Bakery',
    template: '%s | Jiri Bakes',
  },
  description:
    'Handcrafted organic breads, cakes, and pastries from Lokanthali, Nepal. Where flour meets feeling.',
  keywords: ['bakery', 'organic', 'artisan', 'breads', 'cakes', 'pastries', 'nepal', 'lokanthali'],
  openGraph: {
    title: 'Jiri Bakes',
    description: 'Simply organic artisan baking from the heart of Lokanthali.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Jiri Bakes',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          <Header />
          <main>{children}</main>
        </AppShell>
      </body>
    </html>
  );
}
