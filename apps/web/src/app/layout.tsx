import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KèoThểThao | Ra sân, gặp đồng đội",
  description:
    "Tìm kèo thể thao, kết nối đồng đội và tổ chức trận giao lưu gần bạn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <a className="skip-link" href="#main-content">
          Chuyển đến nội dung
        </a>
        {children}
      </body>
    </html>
  );
}
