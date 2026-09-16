import type { Metadata } from "next";
import "./globals.css";
import { TopNavigation } from "../components/top-navigation";
import { AuthProvider } from "../context/auth-context";

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
      <body>
        <AuthProvider>
          <div className="shell">
            <TopNavigation />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

