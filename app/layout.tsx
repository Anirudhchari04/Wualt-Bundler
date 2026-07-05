import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { ToastProvider } from "@/hooks/use-toast";
import { OfflineSyncProvider } from "@/hooks/use-offline-sync";
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
  title: "Bundle Tracker | Project Nexus",
  description: "Garment production bundle tracking and immutable scan audit trails.",
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
      <body className="min-h-full bg-slate-100 text-slate-900">
        <ToastProvider>
          <OfflineSyncProvider>
            <div className="flex min-h-screen flex-col">
              <Navigation />
              {children}
            </div>
          </OfflineSyncProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
