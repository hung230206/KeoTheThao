"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";

export function TopNavigation() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/">KeoTheThao</Link>
        <nav className="nav" aria-label="Điều hướng chính">
          <Link href="/">Trang chủ</Link>
          {!ready ? null : user ? (
            <>
              <Link href="/profile">Hồ sơ</Link>
              <button className="link-button" onClick={handleLogout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <Link href="/login">Đăng nhập</Link>
              <Link className="button small" href="/register">Đăng ký</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
