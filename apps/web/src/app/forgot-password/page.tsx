"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiRequest } from "../../lib/api-client";

export default function ForgotPasswordPage() {
  const [phoneNumber, setPhoneNumber] = useState(""); const [code, setCode] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [requested, setRequested] = useState(false); const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  async function requestCode(event: FormEvent) { event.preventDefault(); setError(""); try { await apiRequest("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ phoneNumber }) }); setRequested(true); setNotice("Mã khôi phục đã được gửi."); } catch (r) { setError(r instanceof Error ? r.message : "Không thể gửi mã"); } }
  async function reset(event: FormEvent) { event.preventDefault(); setError(""); try { await apiRequest("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ phoneNumber, code, newPassword }) }); setNotice("Đổi mật khẩu thành công. Hãy đăng nhập lại."); } catch (r) { setError(r instanceof Error ? r.message : "Không thể đổi mật khẩu"); } }
  return <main className="auth-page"><section className="form-card"><p className="eyebrow">Khôi phục tài khoản</p><h1>Quên mật khẩu</h1>
    {!requested ? <form onSubmit={requestCode}><label>Số điện thoại<input required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></label><button className="button">Gửi mã OTP</button></form> : <form onSubmit={reset}><label>Số điện thoại<input required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></label><label>Mã OTP<input required inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} /></label><label>Mật khẩu mới<input required type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label><button className="button">Đổi mật khẩu</button></form>}
    {notice && <p className="alert success">{notice}</p>}{error && <p className="alert error">{error}</p>}<p className="form-note"><Link href="/login">Quay lại đăng nhập</Link></p>
  </section></main>;
}
