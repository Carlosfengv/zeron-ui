import type { Metadata } from "next";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ShapeProvider } from "@/lib/shape-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ProIconProvider } from "@/lib/pro-icon-provider";
import { BrandPlaygroundProvider } from "@/docs/brand-playground";
import { ShapeShortcut } from "@/docs/shape-shortcut";
import { SidebarLayout } from "@/docs/site/sidebar-layout";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.zerondesign.com"),
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
        {/* reducedMotion="user" makes every framer-motion component honor the
            OS "reduce motion" setting: transform / scale / position / layout
            animations are dropped, opacity and color fades are kept. One switch
            for the whole system — see motion-guidelines.md. */}
        <MotionConfig reducedMotion="user">
          <ShapeProvider defaultShape="rounded">
            <ProIconProvider>
              <ShapeShortcut />
              <ThemeProvider>
                <BrandPlaygroundProvider>
                  <SidebarLayout>{children}</SidebarLayout>
                  <Analytics />
                  <SpeedInsights />
                </BrandPlaygroundProvider>
              </ThemeProvider>
            </ProIconProvider>
          </ShapeProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
