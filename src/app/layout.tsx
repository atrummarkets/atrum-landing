import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Syne, Barlow_Condensed, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "atrum.fun";
const TITLE = "ATRUM — Private Prediction Markets";
const DESCRIPTION =
  "Wager in silence. No visible book, no name on the ledger, no crowd to copy you.";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE_ORIGIN}`),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://${SITE_ORIGIN}`,
    siteName: "ATRUM",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// The scene is authored against the void; the browser UI should match it
// rather than flash a light chrome bar on mobile.
export const viewport: Viewport = {
  themeColor: "#06070A",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${barlowCondensed.variable} ${manrope.variable} ${geistMono.variable}`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
