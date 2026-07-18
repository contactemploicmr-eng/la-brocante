import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "./context/AuthContext";
// 🔥 Importe l'AuthProvider (ajuste le chemin si nécessaire, ex: '@/context/AuthContext' ou '@/app/context/AuthContext')

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
        {/* 🔥 On enveloppe tout le monde ici pour propager l'état d'authentification */}
        <AuthProvider>
          <Header />
          
          {/* Suppression du max-w-7xl pour laisser les pages respirer sur toute la largeur */}
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}


// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
// import Header from "@/components/Header";
// import Footer from "@/components/Footer";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "La Brocante - Votre Marketplace",
//   description: "Petites annonces et services de proximité",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="fr" className="h-full">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased font-sans m-0 p-0`}
//       >
//         <Header />
        
//         {/* Suppression du max-w-7xl pour laisser les pages respirer sur toute la largeur */}
//         <main className="flex-1 w-full flex flex-col">
//           {children}
//         </main>
        
//         <Footer />
//       </body>
//     </html>
//   );
// }