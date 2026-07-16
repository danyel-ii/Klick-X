import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Study Blocks",
  title: "Study Blocks",
  description: "Local-first study planning in 30-minute blocks.",
  manifest: "/manifest.webmanifest?v=klick-x-icon-20260716",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Study Blocks",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.png?v=klick-x-20260716", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192-grayscale.png?v=klick-x-20260716", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512-grayscale.png?v=klick-x-20260716", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon-grayscale.png?v=klick-x-20260716", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#171611",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
