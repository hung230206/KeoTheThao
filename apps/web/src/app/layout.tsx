import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KeoTheThao",
  description: "KeoTheThao web platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

