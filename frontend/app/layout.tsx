import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavRail, TabBar } from "@/components/nav";
import type { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chef Assistant",
  description: "A cooking assistant that suggests recipes and walks you through them",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <div className="flex h-dvh flex-col md:flex-row">
          <NavRail />
          <main className="min-h-0 flex-1">{children}</main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}