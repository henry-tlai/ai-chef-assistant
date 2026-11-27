
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavRail, TabBar } from "@/components/nav";

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
  description:
    "An AI cooking assistant that helps you discover recipes, save favorites, and follow step-by-step cooking instructions.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
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
