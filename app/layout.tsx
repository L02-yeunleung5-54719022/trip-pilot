import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "中歐維維恩",
  description: "TripPilot 中歐生日旅行計劃",
  applicationName: "中歐維維恩",
  appleWebApp: {
    capable: true,
    title: "中歐維維恩",
    statusBarStyle: "default"
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#F7F1E7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
