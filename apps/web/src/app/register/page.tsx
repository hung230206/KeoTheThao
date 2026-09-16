"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phoneNumber: "", password: "", role: "PLAYER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.push(`/verify?phone=${encodeURIComponent(form.phoneNumber)}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể đăng ký"); }
    finally { setLoading(false); }
  }
  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });
  return <main className="auth-page"><form className="form-card" onSubmit={submit}>
    <p className="eyebrow">Tạo tài khoản</p><h1>Tham gia KeoTheThao</h1>
    <label>Họ và tên<input required minLength={2} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} /></label>
    <label>Số điện thoại<input required inputMode="tel" pattern="[0-9+]{9,15}" value={form.phoneNumber} onChange={(e) => update("phoneNumber", e.target.value)} /></label>
    <label>Mật khẩu<input required type="password" minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} /></label>
    <label>Vai trò<select value={form.role} onChange={(e) => update("role", e.target.value)}><option value="PLAYER">Người chơi</option><option value="FIELD_OWNER">Chủ sân</option></select></label>
    {error && <p className="alert error">{error}</p>}<button className="button" disabled={loading}>{loading ? "Đang tạo..." : "Đăng ký"}</button>
    <p className="form-note">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>
  </form></main>;
}
