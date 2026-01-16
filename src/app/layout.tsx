import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NotificationProvider } from "@/contexts/NotificationContext";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import SuspensionGuard from "@/components/SuspensionGuard";
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
  title: "Net-Work - Türkiye'nin En Büyük Freelancer Platformu",
  description: "LinkedIn doğrulamalı, güvenilir ve komisyonsuz iş birliği platformu.",
};

import AiAssistant from "@/components/AiAssistant";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}
      >
        <SuspensionGuard>
          <NotificationProvider>
            <EmailVerificationBanner />
            {children}
            <AiAssistant />
            <Footer />
          </NotificationProvider>
        </SuspensionGuard>
      </body>
    </html>
  );
}
