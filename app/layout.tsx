import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Sidebar } from "@/app/components/sidebar";
import { CommandPalette } from "@/app/components/command-palette";
import { HydrationGate } from "@/app/components/hydration-gate";
import { ToastProvider } from "@/app/components/ui/toast";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "2nd Brain",
  description: "Personal knowledge management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-zinc-950 text-zinc-100 antialiased`}>
        <HydrationGate>
          <div className="flex min-h-screen bg-zinc-950">
            <Sidebar />
            <main className="min-w-0 flex-1 p-6">{children}</main>
          </div>
          <CommandPalette />
          <ToastProvider />
          <ConfirmDialog />
        </HydrationGate>
      </body>
    </html>
  );
}
