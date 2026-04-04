import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zorvexa Local Ranker — AI-Powered Local SEO Tool",
  description: "Discover exactly how your local business ranks on Google, spy on top competitors, and uncover hidden keyword opportunities powered by AI.",
  keywords: ["local SEO", "SEO ranking tool", "local business SEO", "competitor analysis", "keyword research", "AI SEO"],
  openGraph: {
    title: "Zorvexa Local Ranker — AI-Powered Local SEO",
    description: "Instant AI-powered local SEO audits. Find your rank, spy on competitors, and discover untapped keywords.",
    type: "website",
  },
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
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
