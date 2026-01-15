import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FaciliteADV - Gestão Jurídica",
  description: "Software jurídico moderno para advogados que querem facilitar sua advocacia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50`}>
        {children}
      </body>
    </html>
  );
}
