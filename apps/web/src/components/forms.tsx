"use client";
import { useState, type FormEvent } from "react";
import { api, cities, levels, sports, type Match, type User } from "../lib/api";
import { Icon } from "./icons";

const message = (error: unknown) =>
  error instanceof Error ? error.message : "Có lỗi xảy ra. Vui lòng thử lại.";

export function AuthForm({
  register,
  onSuccess,
  onSwitch,
}: {
  register: boolean;
  onSuccess: (user: User) => void;
  onSwitch: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      onSuccess(
        await api<User>(`/auth/${register ? "register" : "login"}`, {
          method: "POST",
          body: JSON.stringify(values),
        }),
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      {register && (
        <label>
          Họ và tên
          <input
            name="name"
            autoComplete="name"
            placeholder="Tên đồng đội sẽ gọi bạn"
            required
            minLength={2}
            maxLength={80}
          />
        </label>
      )}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ban@example.com"
          required
          maxLength={254}
        />
      </label>
      <label>
        Mật khẩu
        <input
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          placeholder="Ít nhất 8 ký tự"
          minLength={8}
          maxLength={128}
          required
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary full" disabled={busy}>
        {busy ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập"}
        <Icon name="arrow" size={18} />
      </button>
      <p className="form-foot">
        {register ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
        <button type="button" className="text-button" onClick={onSwitch}>
          {register ? "Đăng nhập" : "Đăng ký ngay"}
        </button>
      </p>
    </form>
  );
}

function localDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function MatchForm({
  initial,
  onSuccess,
}: {
  initial?: Match;
  onSuccess: (match: Match) => void;
}) {
  const [positions, setPositions] = useState<
    { name: string; quantity: number }[]
  >([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedCity, setSelectedCity] = useState(initial?.city ?? cities[0]);
  const [tomorrow] = useState(() => {
    const date = new Date(Date.now() + 86400000);
    date.setHours(19, 0, 0, 0);
    return date;
  });
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const payload = {
      ...data,
      city: selectedCity,
      startsAt: new Date(data.startsAt as string).toISOString(),
      durationMinutes: Number(data.durationMinutes),
      fee: Number(data.fee),
      ...(!initial ? { capacity: Number(data.capacity), positions } : {}),
    };
    try {
      onSuccess(
        await api<Match>(initial ? `/matches/${initial.id}` : "/matches", {
          method: initial ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }),
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        Tên kèo
        <input
          name="title"
          placeholder="VD: Cầu lông sau giờ làm, đón bạn mới"
          defaultValue={initial?.title}
          minLength={5}
          maxLength={120}
          required
        />
      </label>
      <div className="form-grid">
        {!initial && (
          <label>
            Môn thể thao
            <select name="sport">
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Trình độ
          <select name="level" defaultValue={initial?.level ?? "all"}>
            {Object.entries(levels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bắt đầu (giờ trên thiết bị)
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={localDate(
              initial ? new Date(initial.startsAt) : tomorrow,
            )}
            min={localDate(new Date())}
            required
          />
        </label>
        <label>
          Thời lượng (phút)
          <input
            name="durationMinutes"
            type="number"
            min={30}
            max={360}
            defaultValue={initial?.durationMinutes ?? 90}
            required
          />
        </label>
        <label>
          Thành phố
          <input
            list="match-cities"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
          <datalist id="match-cities">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Quận / huyện
          <input
            name="district"
            defaultValue={initial?.district}
            placeholder="VD: Bình Thạnh"
            required
            minLength={2}
            maxLength={80}
          />
        </label>
      </div>
      <label>
        Tên sân
        <input
          name="venue"
          defaultValue={initial?.venue}
          placeholder="VD: Sân thể thao Gia Định"
          required
          minLength={2}
          maxLength={160}
        />
      </label>
      <label>
        Địa chỉ cụ thể
        <input
          name="address"
          defaultValue={initial?.address}
          placeholder="Số nhà, đường, phường"
          required
          minLength={5}
          maxLength={240}
        />
      </label>
      <div className="form-grid">
        {!initial && (
          <label>
            Tổng số người (gồm bạn)
            <input
              name="capacity"
              type="number"
              min={2}
              max={100}
              defaultValue={10}
              required
            />
          </label>
        )}
        <label>
          Chi phí dự kiến / người (VNĐ)
          <input
            name="fee"
            type="number"
            min={0}
            max={10000000}
            defaultValue={initial?.fee ?? 0}
            required
          />
        </label>
      </div>
      {!initial && (
        <fieldset className="positions-fieldset">
          <legend>
            Tuyển theo vị trí <span className="muted">(tùy chọn)</span>
          </legend>
          <p className="field-help">
            Chủ kèo đã chiếm 1 suất. Suất chưa phân vị trí dành cho người chơi
            tự do.
          </p>
          {positions.map((p, index) => (
            <div className="position-input" key={index}>
              <input
                aria-label={`Tên vị trí ${index + 1}`}
                placeholder="VD: Thủ môn"
                value={p.name}
                onChange={(e) =>
                  setPositions((items) =>
                    items.map((item, i) =>
                      i === index ? { ...item, name: e.target.value } : item,
                    ),
                  )
                }
                minLength={2}
                maxLength={60}
                required
              />
              <input
                aria-label={`Số lượng vị trí ${index + 1}`}
                type="number"
                min={1}
                max={99}
                value={p.quantity}
                onChange={(e) =>
                  setPositions((items) =>
                    items.map((item, i) =>
                      i === index
                        ? { ...item, quantity: Number(e.target.value) }
                        : item,
                    ),
                  )
                }
                required
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`Xóa vị trí ${index + 1}`}
                onClick={() =>
                  setPositions((items) => items.filter((_, i) => i !== index))
                }
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-button inline"
            disabled={positions.length >= 10}
            onClick={() =>
              setPositions((items) => [...items, { name: "", quantity: 1 }])
            }
          >
            <Icon name="plus" size={16} /> Thêm vị trí
          </button>
        </fieldset>
      )}
      <label>
        Lời nhắn cho đồng đội
        <textarea
          name="description"
          defaultValue={initial?.description}
          placeholder="Không khí trận, dụng cụ cần mang, cách chia tiền sân…"
          maxLength={3000}
          rows={4}
        />
      </label>
      <p className="field-help">
        Chi phí chỉ để tham khảo và được thanh toán trực tiếp. Ứng dụng chưa thu
        tiền hoặc đặt sân thay bạn.
        {initial &&
          " Môn thể thao, tổng số người và vị trí được giữ cố định sau khi tạo kèo."}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary full" disabled={busy}>
        {busy
          ? "Đang lưu…"
          : initial
            ? "Lưu thay đổi"
            : "Đăng kèo, tìm đồng đội"}
        <Icon name="arrow" size={18} />
      </button>
    </form>
  );
}

export function ProfileForm({
  user,
  onSuccess,
}: {
  user: User;
  onSuccess: (user: User) => void;
}) {
  const [selected, setSelected] = useState(user.sports);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      onSuccess(
        await api<User>("/auth/me", {
          method: "PATCH",
          body: JSON.stringify({ ...values, sports: selected }),
        }),
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <label>
        Họ và tên
        <input
          name="name"
          defaultValue={user.name}
          required
          minLength={2}
          maxLength={80}
        />
      </label>
      <label>
        Thành phố
        <input
          name="city"
          defaultValue={user.city}
          required
          minLength={2}
          maxLength={80}
        />
      </label>
      <label>
        Giới thiệu
        <textarea
          name="bio"
          defaultValue={user.bio}
          rows={3}
          maxLength={500}
          placeholder="Một chút về bạn và phong cách chơi…"
        />
      </label>
      <fieldset className="positions-fieldset">
        <legend>Môn yêu thích</legend>
        <div className="sport-choices">
          {sports.map((s) => (
            <label key={s.id} className="check-label">
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={(e) =>
                  setSelected((items) =>
                    e.target.checked
                      ? [...items, s.id]
                      : items.filter((id) => id !== s.id),
                  )
                }
              />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Đang lưu…" : "Lưu hồ sơ"}
        <Icon name="check" size={18} />
      </button>
    </form>
  );
}
