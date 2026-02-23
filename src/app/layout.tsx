import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";

const primaryFont = localFont({
  src: "./assets/fonts/momo-trust-display-regular.ttf",
  variable: "--font-primary",
});

const secondaryFont = localFont({
  src: "./assets/fonts/geom-regular.ttf",
  variable: "--font-secondary",
});

const tertiaryFont = localFont({
  src: "./assets/fonts/bagel-fat-one-regular.ttf",
  variable: "--font-tertiary",
});

const specialFont = localFont({
  src: "./assets/fonts/tanheadline-regular.ttf",
  variable: "--font-special",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://buddyticket.store"),
  title: "BuddyTickets | Secure Ticket Selling Platform",
  description: "Complete production-grade ticket-selling web application",
  openGraph: {
    title: "BuddyTickets",
    description: "Complete production-grade ticket-selling web application",
    url: "https://buddyticket.store",
    siteName: "BuddyTickets",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BuddyTickets - Secure Ticket Selling Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuddyTickets | Secure Ticket Selling Platform",
    description: "Complete production-grade ticket-selling web application",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${primaryFont.variable} ${secondaryFont.variable} ${tertiaryFont.variable} ${specialFont.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}