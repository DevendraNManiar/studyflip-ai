import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import RealtimeAlerts from "@/components/shared/RealtimeAlerts";
import AIChatAssistant from "@/components/shared/AIChatAssistant";

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
    default: "NexCart | Curated Luxury E-Commerce",
    template: "%s | NexCart Luxury"
  },
  description: "Bespoke online shopping experience for audio acoustics, mechanical watches, and artisan leather duffels. Pure minimalist design, premium quality.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "NexCart | Curated Luxury E-Commerce",
    description: "Bespoke online shopping experience. Pure minimalist design, premium quality.",
    url: "/",
    siteName: "NexCart",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexCart | Curated Luxury E-Commerce",
    description: "Bespoke online shopping experience. Pure minimalist design, premium quality.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <Providers>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <RealtimeAlerts />
          <AIChatAssistant />
        </Providers>
      </body>
    </html>
  );
}

