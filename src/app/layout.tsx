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
  title: {
    default: "Net-Work | Türkiye'nin İlk Komisyonsuz Freelancer Platformu",
    template: "%s | Net-Work"
  },
  description: "Türkiye'nin en güvenilir, tamamen ücretsiz ve komisyonsuz freelancer iş platformu. Hemen üye ol, ilan ver veya iş bul. Kesinti yok, limit yok.",
  keywords: ["freelancer", "iş ilanları", "komisyonsuz", "ücretsiz", "iş bul", "uzman kirala", "web tasarım", "yazılım", "grafik tasarım", "türkiye freelancer sitesi"],
  authors: [{ name: "Net-Work Ekibi" }],
  creator: "Net-Work",
  publisher: "Net-Work",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://net-work.com.tr", // Varsayılan domain
    title: "Net-Work | %100 Komisyonsuz ve Ücretsiz Freelancer Ağı",
    description: "Yeteneklerini sergile veya aradığın uzmanı hemen bul. Platform komisyonu olmadan özgürce çalışın.",
    siteName: "Net-Work",
    images: [
      {
        url: "/og-image.jpg", // Daha sonra eklenebilir
        width: 1200,
        height: 630,
        alt: "Net-Work Platform Tanıtımı",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Net-Work | Komisyon Yok, Özgürlük Var",
    description: "Türkiye'nin yeni nesil freelancer platformuna katılın.",
    images: ["/twitter-image.jpg"], // Daha sonra eklenebilir
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import AiAssistant from "@/components/AiAssistant";
import Footer from "@/components/Footer";
import FeedbackWidget from "@/components/FeedbackWidget";

import { ToastProvider } from "@/contexts/ToastContext";

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
            <ToastProvider>
              <EmailVerificationBanner />
              {children}
              <AiAssistant />
              <FeedbackWidget />
              <Footer />
            </ToastProvider>
          </NotificationProvider>
        </SuspensionGuard>
      </body>
    </html>
  );
}
