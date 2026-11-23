import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: { default: "The Year Wheel", template: "%s · The Year Wheel" },
  description: "Find out what's happening on any date in 2027: 12,669 holidays, events, observances, births and deaths on one interactive wheel.",
};
export const viewport: Viewport = { themeColor: "#242322", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
