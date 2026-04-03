import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Agendly — Panel de Administración",
  description: "Gestiona tu agenda, servicios e ingresos desde un solo lugar.",
  authors: [{ name: "Saul Luviano Sanchez" }],
  verification: {
    facebook: "0nvntig6e9q8e4pkli7r6v9vgpxajq",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
