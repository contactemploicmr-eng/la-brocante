import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "./context/AuthContext";
import { Suspense } from "react"; // 🔥 1. IMPORTATION DE SUSPENSE

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Brocante - Votre Marketplace",
  description: "Petites annonces et services de proximité",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased font-sans m-0 p-0`}
      >
        <AuthProvider>
          {/* 🔥 2. ON ENVELOPPE LE HEADER DANS SUSPENSE POUR SÉCURISER LES SEARCHPARAMS AU BUILD */}
          <Suspense fallback={<div className="w-full h-20 bg-white border-b border-slate-100 animate-pulse" />}>
            <Header />
          </Suspense>
          
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}