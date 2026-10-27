"use client";
import { useEffect, useState } from "react";
import {
  api,
  dateLabel,
  initials,
  levels,
  money,
  requestLabels,
  sportInfo,
  timeLabel,
  type HostRequest,
  type JoinRequest,
  type Match,
  type User,
} from "../lib/api";
import { Icon, SportIcon } from "./icons";
import { useNow } from "../lib/use-now";

export function MatchDetail({
  initial,
  user,
  ownRequest,
  onLogin,
  onChanged,
  onEdit,
}: {
  initial: Match;
  user: User | null;
  ownRequest?: JoinRequest;
  onLogin: () => void;
  onChanged: () => void;
  onEdit: (match: Match) => void;
}) {
  const [match, setMatch] = useState(initial);
  const [statusOverride, setStatus] = useState<JoinRequest["status"]>();
  const status = statusOverride ?? ownRequest?.status;
  const [requests, setRequests] = useState<HostRequest[]>([]);
  const [positionId, setPositionId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const [confirm, setConfirm] = useState<
    "cancelled" | "completed" | "withdraw" | null
  >(null);
  const isHost = match.hostId === user?.id;
  const now = useNow();
  const isOpen =
    match.status === "open" && new Date(match.startsAt).getTime() > now;
  const generalSlots =
    match.capacity -
    1 -
    match.positions.reduce((sum, p) => sum + p.quantity, 0);
  const allocatedFilled = match.positions.reduce((sum, p) => sum + p.filled, 0);
  const generalLeft = Math.max(
    0,
    generalSlots - (match.playerCount - 1 - allocatedFilled),
  );
  useEffect(() => {
    if (!isHost) return;
    let active = true;
    api<HostRequest[]>(`/matches/${initial.id}/requests`)
      .then((data) => {
        if (active) setRequests(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [initial.id, isHost]);
  async function action(
    path: string,
    method: string,
    body?: unknown,
    nextStatus?: typeof status,
  ) {
    setBusy(true);
    setError("");
    try {
      await api(path, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setMatch(await api<Match>(`/matches/${match.id}`));
      if (isHost)
        setRequests(await api<HostRequest[]>(`/matches/${match.id}/requests`));
      if (nextStatus) setStatus(nextStatus);
      setConfirm(null);
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thực hiện được thao tác.",
      );
    } finally {
      setBusy(false);
    }
  }
  const info = sportInfo(match.sport);
  return (
    <div className="detail">
      <div className="share-line">
        <button
          className="text-button inline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${window.location.origin}/?match=${match.id}`,
              );
              setError("");
              setShared(true);
            } catch {
              setError(
                "Không sao chép được. Liên kết kèo: " +
                  `${window.location.origin}/?match=${match.id}`,
              );
            }
          }}
        >
          <Icon name="external" size={15} />
          {shared ? "Đã sao chép liên kết" : "Chia sẻ kèo"}
        </button>
      </div>
      <div className={`detail-banner ${info.color}`}>
        <SportIcon sport={match.sport} size={58} />
        <div>
          <span className="sport-label">{info.name}</span>
          <p>{levels[match.level]}</p>
        </div>
        <span className={`badge ${match.status === "open" ? "light" : ""}`}>
          {match.status === "cancelled"
            ? "Đã hủy"
            : match.status === "completed"
              ? "Đã hoàn thành"
              : !isOpen
                ? "Đã bắt đầu"
                : match.spotsLeft
                  ? `Còn ${match.spotsLeft} chỗ`
                  : "Đã đủ người"}
        </span>
      </div>
      <div className="detail-facts">
        <div>
          <Icon name="calendar" />
          <span>
            {dateLabel(match.startsAt)}
            <small>
              {timeLabel(match.startsAt)} · {match.durationMinutes} phút · Giờ
              Việt Nam
            </small>
          </span>
        </div>
        <div>
          <Icon name="pin" />
          <span>
            {match.venue}
            <small>
              {match.address}, {match.district}, {match.city}
            </small>
          </span>
        </div>
        <div>
          <Icon name="users" />
          <span>
            {match.playerCount}/{match.capacity} người
            <small>Đã bao gồm chủ kèo</small>
          </span>
        </div>
        <div>
          <Icon name="bolt" />
          <span>
            {money(match.fee)}
            <small>Chi phí dự kiến mỗi người, trả tại sân</small>
          </span>
        </div>
      </div>
      <section className="detail-section">
        <h3>Lời nhắn từ chủ kèo</h3>
        <p className="description">
          {match.description || "Cùng ra sân và có một buổi chơi thật vui!"}
        </p>
        <div className="host-line">
          <span className="avatar">{initials(match.host.name)}</span>
          <span>
            <strong>{match.host.name}</strong>
            <small>Chủ kèo · {match.host.city}</small>
          </span>
        </div>
      </section>
      {!!match.positions.length && (
        <section className="detail-section">
          <h3>Đội hình đang tìm</h3>
          <div className="position-tags">
            {match.positions.map((p) => (
              <span className="position-tag" key={p.id}>
                {p.name}
                <strong>
                  {p.filled}/{p.quantity}
                </strong>
              </span>
            ))}
          </div>
        </section>
      )}
      <section className="detail-section">
        <h3>
          Đồng đội đã có mặt{" "}
          <span className="muted">({match.playerCount})</span>
        </h3>
        <div className="roster">
          {match.participants.map((p) => (
            <div key={p.id}>
              <span className="avatar small">{initials(p.name)}</span>
              <span>
                {p.name}
                {p.id === match.hostId && <small>Chủ kèo</small>}
              </span>
            </div>
          ))}
        </div>
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {isHost ? (
        <section className="detail-section host-management">
          <div className="section-title">
            <h3>
              Yêu cầu tham gia{" "}
              <span className="count">
                {requests.filter((r) => r.status === "pending").length}
              </span>
            </h3>
            {isOpen && (
              <button
                className="text-button inline"
                onClick={() => onEdit(match)}
              >
                <Icon name="edit" size={16} />
                Sửa kèo
              </button>
            )}
          </div>
          {!requests.length && (
            <p className="muted">
              Chưa có yêu cầu tham gia. Chia sẻ kèo để tìm thêm đồng đội nhé.
            </p>
          )}
          {requests.map((r) => (
            <div className="request-row" key={r.id}>
              <span className="avatar small">{initials(r.user.name)}</span>
              <div className="request-content">
                <strong>{r.user.name}</strong>
                <small>
                  {r.position?.name ?? "Vị trí tự do"} ·{" "}
                  {requestLabels[r.status]}
                </small>
                {r.message && <p>{r.message}</p>}
              </div>
              {r.status === "pending" && isOpen && (
                <div className="request-actions">
                  <button
                    className="button small-button"
                    disabled={busy}
                    onClick={() =>
                      action(`/matches/${match.id}/requests/${r.id}`, "PATCH", {
                        status: "rejected",
                      })
                    }
                  >
                    Từ chối
                  </button>
                  <button
                    className="button primary small-button"
                    disabled={busy}
                    onClick={() =>
                      action(`/matches/${match.id}/requests/${r.id}`, "PATCH", {
                        status: "accepted",
                      })
                    }
                  >
                    Duyệt
                  </button>
                </div>
              )}
            </div>
          ))}
          {match.status === "open" && (
            <div className="manage-footer">
              <button
                className="text-button danger"
                disabled={busy}
                onClick={() => setConfirm("cancelled")}
              >
                Hủy kèo
              </button>
              {!isOpen && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => setConfirm("completed")}
                >
                  Đánh dấu hoàn thành
                </button>
              )}
            </div>
          )}
        </section>
      ) : !user ? (
        <div className="join-panel">
          <p>Đăng nhập để gửi lời chào và xin một suất trên sân.</p>
          <button className="button primary full" onClick={onLogin}>
            Đăng nhập để tham gia
            <Icon name="arrow" size={18} />
          </button>
        </div>
      ) : !isOpen ? (
        <div className="notice">
          Kèo đã đóng hoặc đã bắt đầu. Hẹn bạn ở trận tiếp theo!
        </div>
      ) : status === "accepted" || status === "pending" ? (
        <div className="join-panel">
          <div className="notice success">
            <Icon name="check" />
            {status === "accepted"
              ? "Bạn đã có suất. Hẹn gặp bạn trên sân!"
              : "Đã gửi yêu cầu. Đang chờ chủ kèo duyệt."}
          </div>
          <button
            className="text-button danger"
            disabled={busy}
            onClick={() => setConfirm("withdraw")}
          >
            {status === "accepted" ? "Rời kèo" : "Rút yêu cầu"}
          </button>
        </div>
      ) : match.spotsLeft <= 0 ? (
        <div className="notice">
          Kèo đã đủ người. Bạn có thể quay lại khi có người rời kèo.
        </div>
      ) : (
        <form
          className="join-panel form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            action(
              `/matches/${match.id}/requests`,
              "POST",
              { ...(positionId ? { positionId } : {}), message: note },
              "pending",
            );
          }}
        >
          <h3>
            {status === "rejected"
              ? "Gửi lại lời mời tham gia"
              : "Một suất dành cho bạn"}
          </h3>
          {!!match.positions.length && (
            <label>
              Vị trí muốn chơi
              <select
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                required={!generalLeft}
              >
                <option value="" disabled={!generalLeft}>
                  {generalLeft
                    ? `Vị trí tự do (${generalLeft} chỗ)`
                    : "Chọn vị trí đang tuyển"}
                </option>
                {match.positions.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={p.filled >= p.quantity}
                  >
                    {p.name} · còn {p.quantity - p.filled} chỗ
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Lời nhắn (tùy chọn)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Chào đội! Mình thường chơi ở vị trí…"
            />
          </label>
          <button className="button primary full" disabled={busy}>
            {busy ? "Đang gửi…" : "Xin tham gia kèo"}
            <Icon name="arrow" size={18} />
          </button>
          <p className="field-help">
            Chủ kèo sẽ duyệt yêu cầu. Gửi yêu cầu chưa giữ chỗ cho bạn.
          </p>
        </form>
      )}
      {confirm && (
        <div className="confirm-panel" role="alert">
          <strong>
            {confirm === "withdraw"
              ? "Bạn muốn rút khỏi kèo này?"
              : confirm === "cancelled"
                ? "Hủy kèo và các yêu cầu đang chờ?"
                : "Xác nhận kèo đã diễn ra?"}
          </strong>
          <div>
            <button
              className="button"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Quay lại
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                confirm === "withdraw"
                  ? action(
                      `/matches/${match.id}/requests/me`,
                      "DELETE",
                      undefined,
                      "cancelled",
                    )
                  : action(`/matches/${match.id}/status`, "PATCH", {
                      status: confirm,
                    })
              }
            >
              {busy ? "Đang xử lý…" : "Xác nhận"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
