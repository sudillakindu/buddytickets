import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

const primaryFont = localFont({
  src: './assets/fonts/momo-trust-display-regular.ttf',
  variable: '--font-primary',
  display: 'swap',
});

const secondaryFont = localFont({
  src: './assets/fonts/geom-regular.ttf',
  variable: '--font-secondary',
  display: 'swap',
});

const tertiaryFont = localFont({
  src: './assets/fonts/bagel-fat-one-regular.ttf',
  variable: '--font-tertiary',
  display: 'swap',
});

const specialFont = localFont({
  src: './assets/fonts/tanheadline-regular.ttf',
  variable: '--font-special',
  display: 'swap',
});

const BASE_URL = 'https://buddyticket.store';
const SITE_NAME = 'BuddyTickets';
const DESCRIPTION = 'Complete production-grade ticket-selling web application';
const OG_IMAGE = '/og-image.png';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} | Secure Ticket Selling Platform`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Secure Ticket Selling Platform`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Secure Ticket Selling Platform`,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const fontVariables = [
  primaryFont.variable,
  secondaryFont.variable,
  tertiaryFont.variable,
  specialFont.variable,
].join(' ');

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${fontVariables} antialiased bg-white text-zinc-950`}>
        <div className="flex flex-col min-h-[100dvh] bg-background">
          {children}
        </div>
        <Toaster defaultPosition="top-right" />
      </body>
    </html>
  );
}