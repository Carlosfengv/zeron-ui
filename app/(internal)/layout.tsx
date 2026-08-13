import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProviders } from "@/app/app-providers";
import messages from "@docs/content/en/common.json";

export const metadata: Metadata = {
  metadataBase: new URL("https://zeron-ui.vercel.app"),
  title: "Zeron Design",
  description: "Open Source UI components created by @Zeron Design",
  icons: {
    icon: [
      { url: "/metadata/favicon.svg", type: "image/svg+xml" },
      { url: "/metadata/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/metadata/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/metadata/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/metadata/favicon.ico",
    apple: "/metadata/apple-touch-icon.png",
  },
  manifest: "/metadata/site.webmanifest",
  openGraph: {
    title: "Zeron Design",
    description: "Open Source UI components created by @Zeron Design",
    images: [{ url: "/metadata/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zeron Design",
    description: "Open Source UI components created by @Zeron Design",
    images: ["/metadata/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Font smoothing (antialiased/grayscale) is set globally in globals.css */}
      <body>
        <NextIntlClientProvider locale="en" messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
