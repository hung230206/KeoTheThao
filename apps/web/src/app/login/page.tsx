"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(phoneNumber, password);
      router.push("/profile");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Đăng nhập không thành công");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><form className="form-card" onSubmit={submit}>
    <p className="eyebrow">Chào mừng trở lại</p><h1>Đăng nhập</h1>
    <label>Số điện thoại<input required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} inputMode="tel" /></label>
    <label>Mật khẩu<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    {error && <p className="alert error">{error}</p>}
    <button className="button" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
    <p className="form-note"><Link href="/forgot-password">Quên mật khẩu?</Link> · Chưa có tài khoản? <Link href="/register">Đăng ký</Link></p>
  </form></main>;
}
