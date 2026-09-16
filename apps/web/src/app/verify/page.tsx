"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "../../lib/api-client";

export default function VerifyPage() {
  const params = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState(params.get("phone") ?? "");
  const [code, setCode] = useState(""); const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); try { await apiRequest("/auth/verify", { method: "POST", body: JSON.stringify({ phoneNumber, code }) }); setNotice("Xác thực thành công. Bạn có thể đăng nhập ngay."); } catch (r) { setError(r instanceof Error ? r.message : "Xác thực không thành công"); } }
  async function resend() { setError(""); try { await apiRequest("/auth/verify/resend", { method: "POST", body: JSON.stringify({ phoneNumber }) }); setNotice("Mã mới đã được gửi."); } catch (r) { setError(r instanceof Error ? r.message : "Không thể gửi lại mã"); } }
  return <main className="auth-page"><form className="form-card" onSubmit={submit}><p className="eyebrow">Bảo mật tài khoản</p><h1>Xác thực số điện thoại</h1>
    <label>Số điện thoại<input required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></label><label>Mã OTP<input required inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} /></label>
    {notice && <p className="alert success">{notice}</p>}{error && <p className="alert error">{error}</p>}<button className="button">Xác thực</button><button className="link-button center" type="button" onClick={resend}>Gửi lại mã</button><p className="form-note"><Link href="/login">Đến trang đăng nhập</Link></p>
  </form></main>;
}
