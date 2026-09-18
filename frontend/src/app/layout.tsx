import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI DAO Community - Activity Hub",
  description: "A centralized platform for community posts and notes with AI synergy detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable}>
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
