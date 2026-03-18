import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Net-Work | Türkiye'nin İlk Komisyonsuz Freelancer Platformu",
    template: "%s | Net-Work"
  },
  description: "Türkiye'nin en güvenilir, tamamen ücretsiz ve komisyonsuz freelancer iş platformu. Hemen üye ol, ilan ver veya iş bul. Kesinti yok, limit yok.",
  robots: {
    index: true,
    follow: true,
  },
};

import AiAssistant from "@/components/AiAssistant";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/contexts/ToastContext";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}>
        <SessionProvider>
          <ToastProvider>
            {children}
            <AiAssistant />
            <Footer />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
