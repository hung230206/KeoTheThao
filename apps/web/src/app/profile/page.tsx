"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/auth-context";

const positions = { GK: "Thủ môn", DF: "Hậu vệ", MF: "Tiền vệ", FW: "Tiền đạo" } as const;

export default function ProfilePage() {
  const { user, ready, updateProfile } = useAuth();
  const router = useRouter();
  const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  useEffect(() => { if (ready && !user) router.replace("/login"); }, [ready, user, router]);
  if (!ready || !user) return <main className="main"><p>Đang tải hồ sơ...</p></main>;
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setNotice(""); const values = new FormData(event.currentTarget); const value = (name: string) => String(values.get(name) ?? ""); try { await updateProfile({ fullName: value("fullName"), gender: (value("gender") || null) as never, preferredPosition: (value("preferredPosition") || null) as never, dateOfBirth: value("dateOfBirth") || null, avatarUrl: value("avatarUrl") || null, bio: value("bio") || null }); setNotice("Hồ sơ đã được cập nhật."); } catch (r) { setError(r instanceof Error ? r.message : "Không thể cập nhật hồ sơ"); } }
  return <main className="main profile-layout"><section className="profile-summary"><div className="avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="Ảnh đại diện" /> : user.fullName.slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">Hồ sơ của bạn</p><h1>{user.fullName}</h1><p className="muted">{user.phoneNumber}</p><div className="badges"><span className="badge">{user.role === "PLAYER" ? "Người chơi" : user.role === "FIELD_OWNER" ? "Chủ sân" : "Quản trị viên"}</span><span className={`badge ${user.verificationStatus === "VERIFIED" ? "verified" : "pending"}`}>{user.verificationStatus === "VERIFIED" ? "Đã xác thực" : "Chưa xác thực"}</span></div>{user.verificationStatus !== "VERIFIED" && <Link className="text-link" href={`/verify?phone=${encodeURIComponent(user.phoneNumber)}`}>Xác thực tài khoản</Link>}</div></section>
    <form className="profile-form" onSubmit={submit}><h2>Chỉnh sửa thông tin</h2><div className="form-grid"><label>Họ và tên<input name="fullName" required minLength={2} defaultValue={user.fullName} /></label><label>Giới tính<select name="gender" defaultValue={user.gender ?? ""}><option value="">Chưa chọn</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></label><label>Ngày sinh<input name="dateOfBirth" type="date" defaultValue={user.dateOfBirth ?? ""} /></label><label>Vị trí sở trường<select name="preferredPosition" defaultValue={user.preferredPosition ?? ""}><option value="">Chưa chọn</option>{Object.entries(positions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div><label>Link ảnh đại diện<input name="avatarUrl" type="url" defaultValue={user.avatarUrl ?? ""} /></label><label>Giới thiệu<textarea name="bio" maxLength={500} defaultValue={user.bio ?? ""} /></label>{notice && <p className="alert success">{notice}</p>}{error && <p className="alert error">{error}</p>}<button className="button">Lưu thay đổi</button></form>
  </main>;
}
