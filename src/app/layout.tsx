import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/layout/AppHeader'; // Import AppHeader

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Subtitle Weaver',
  description: 'Advanced subtitle editor and translator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppProvider>
          <div className="min-h-screen flex flex-col w-full max-w-screen-2xl mx-auto">
            <AppHeader />
            <main className="flex-1 flex flex-col overflow-hidden">
              {children}
            </main>
          </div>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
