import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "tododo",
  description: "A self-hostable todo tracking application with recurring tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="antialiased">
        <Header />
        <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-3xl px-4 pb-20 pt-6 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
