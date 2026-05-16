import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "TripPilot",
  description: "A mobile-first travel planning PWA for multi-city trips.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TripPilot"
  },
  icons: {
    icon: "/manifest.json",
    apple: "/manifest.json"
  }
};

export const viewport: Viewport = {
  themeColor: "#0891b2",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
