"use client";
import { useEffect, useRef, useState } from "react";
import { useNow } from "../lib/use-now";
import {
  api,
  cities,
  dateLabel,
  initials,
  levels,
  requestLabels,
  sports,
  timeLabel,
  type Match,
  type Mine,
  type User,
} from "../lib/api";
import { Icon, SportIcon, type IconName } from "./icons";
import { MatchCard } from "./match-card";
import { Modal } from "./modal";
import { AuthForm, MatchForm, ProfileForm } from "./forms";
import { MatchDetail } from "./match-detail";

type View = "discover" | "mine" | "profile";
type Page = { items: Match[]; total: number; page: number; limit: number };
const emptyMine: Mine = { hosted: [], requests: [] };

export default function Dashboard() {
  const now = useNow();
  const [view, setView] = useState<View>("discover");
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [mine, setMine] = useState<Mine>(emptyMine);
  const [mineLoading, setMineLoading] = useState(false);
  const [mineError, setMineError] = useState("");
  const [tab, setTab] = useState<"hosted" | "requests">("hosted");
  const [modal, setModal] = useState<
    "login" | "register" | "create" | "edit" | null
  >(null);
  const [selected, setSelected] = useState<Match | null>(null);
  const [editMatch, setEditMatch] = useState<Match | undefined>();
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState("");
  const [date, setDate] = useState("");
  const [available, setAvailable] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("soonest");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setSessionReady(true));
  }, []);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("match");
    if (!id) return;
    let active = true;
    api<Match>(`/matches/${encodeURIComponent(id)}`)
      .then((data) => {
        if (active) setSelected(data);
      })
      .catch((err) => {
        if (active) setToast(err.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    let active = true;
    async function loadMine() {
      if (!user) return;
      setMineLoading(true);
      setMineError("");
      try {
        const data = await api<Mine>("/matches/mine");
        if (active) setMine(data);
      } catch (err) {
        if (active)
          setMineError(
            err instanceof Error ? err.message : "Không tải được kèo của bạn.",
          );
      } finally {
        if (active) setMineLoading(false);
      }
    }
    void loadMine();
    return () => {
      active = false;
    };
  }, [user, revision]);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page), sort });
      if (sport) params.set("sport", sport);
      if (city) params.set("city", city);
      if (level) params.set("level", level);
      if (query) params.set("q", query);
      if (available) params.set("available", "true");
      if (date) {
        params.set("from", `${date}T00:00:00+07:00`);
        params.set("to", `${date}T23:59:59.999+07:00`);
      }
      try {
        const data = await api<Page>(`/matches?${params}`);
        if (active) setResult(data);
      } catch (err) {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "Không tải được danh sách kèo.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [sport, city, level, date, query, available, page, sort, revision]);
  function refresh() {
    setRevision((r) => r + 1);
  }
  function notify(text: string) {
    setToast(text);
  }
  async function openMatch(match: Match) {
    const current = ++sequence.current;
    try {
      const [fresh, myMatches] = await Promise.all([
        api<Match>(`/matches/${match.id}`),
        user ? api<Mine>("/matches/mine") : Promise.resolve(null),
      ]);
      if (current === sequence.current) {
        if (myMatches) setMine(myMatches);
        setSelected(fresh);
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không mở được kèo.");
    }
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setMine(emptyMine);
      setView("discover");
      setSelected(null);
      notify("Đã đăng xuất. Hẹn gặp lại trên sân!");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không đăng xuất được.");
    }
  }
  function create() {
    if (!user) {
      setModal("login");
      return;
    }
    setModal("create");
  }
  function reset() {
    setSport("");
    setCity("");
    setLevel("");
    setDate("");
    setSearch("");
    setQuery("");
    setAvailable(false);
    setPage(1);
  }
  const nextMatch = [
    ...mine.hosted,
    ...mine.requests.filter((r) => r.status === "accepted").map((r) => r.match),
  ]
    .filter((m) => m.status === "open" && new Date(m.startsAt).getTime() > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const pendingCount = mine.hosted.reduce(
    (sum, m) => sum + (m.pendingCount ?? 0),
    0,
  );
  const filtersActive = !!(
    city ||
    level ||
    date ||
    search ||
    available ||
    sport
  );
  const navigation: { id: View; title: string; icon: IconName }[] = [
    { id: "discover", title: "Khám phá kèo", icon: "grid" },
    { id: "mine", title: "Kèo của tôi", icon: "calendar" },
    { id: "profile", title: "Hồ sơ cá nhân", icon: "user" },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          aria-label="KeoTheThao trang chủ"
          onClick={() => setView("discover")}
        >
          <span className="brand-mark">
            k<span>.</span>
          </span>
          <span>
            Kèo<span>Thể Thao</span>
          </span>
        </button>
        <p className="sidebar-caption">CHƠI CÙNG NHAU</p>
        <nav aria-label="Điều hướng chính">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${view === n.id ? "active" : ""}`}
              aria-label={n.title}
              onClick={() => setView(n.id)}
              aria-current={view === n.id ? "page" : undefined}
            >
              <Icon name={n.icon} />
              <span>{n.title}</span>
              {n.id === "mine" && pendingCount > 0 && (
                <span className="nav-count">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {nextMatch ? (
            <button className="up-next" onClick={() => openMatch(nextMatch)}>
              <span className="sidebar-caption">KÈO TIẾP THEO CỦA BẠN</span>
              <strong>{nextMatch.title}</strong>
              <span>
                <Icon name="clock" size={14} />
                {dateLabel(nextMatch.startsAt)} ·{" "}
                {timeLabel(nextMatch.startsAt)}
              </span>
              <span className="next-link">
                Xem kèo
                <Icon name="arrow" size={16} />
              </span>
            </button>
          ) : (
            <div className="sidebar-note">
              <span className="mini-court" aria-hidden="true">
                <SportIcon sport="football" size={30} />
              </span>
              <strong>
                Một kèo hay,
                <br />
                thêm một người bạn.
              </strong>
              <p>Tìm đồng đội, cùng ra sân và tận hưởng cuộc chơi.</p>
            </div>
          )}
          {user ? (
            <div className="sidebar-account">
              <button
                className="account-button"
                aria-label={`Hồ sơ của ${user.name}`}
                onClick={() => setView("profile")}
              >
                <span className="avatar">{initials(user.name)}</span>
                <span>
                  <strong>{user.name}</strong>
                  <small>Hồ sơ của bạn</small>
                </span>
              </button>
              <button
                className="icon-button"
                aria-label="Đăng xuất"
                onClick={logout}
              >
                <Icon name="logout" size={18} />
              </button>
            </div>
          ) : (
            <button
              className="button sidebar-login"
              onClick={() => setModal("login")}
            >
              Đăng nhập
              <Icon name="arrow" size={18} />
            </button>
          )}
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Sân chơi cộng đồng
            <Icon name="chevron" size={14} />
            <strong>{navigation.find((n) => n.id === view)?.title}</strong>
          </div>
          <div className="header-actions">
            <span className="timezone">Giờ Việt Nam · UTC+7</span>
            {!user && (
              <button className="text-button" onClick={() => setModal("login")}>
                Đăng nhập
              </button>
            )}
            <button className="button primary" onClick={create}>
              <Icon name="plus" size={18} />
              Tạo kèo mới
            </button>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Điều hướng di động">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "active" : ""}
              onClick={() => setView(n.id)}
            >
              <Icon name={n.icon} size={18} />
              {n.title}
            </button>
          ))}
        </nav>
        <main className="main-content" id="main-content">
          {view === "discover" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    <span />
                    KẾT NỐI ĐAM MÊ, CHƠI HẾT MÌNH
                  </p>
                  <h1>
                    Ra sân, gặp đồng đội<span>.</span>
                  </h1>
                  <p>
                    Một mình vẫn có đội. Tìm kèo phù hợp và bắt đầu cuộc chơi.
                  </p>
                </div>
                <div className="heading-stamp" aria-hidden="true">
                  <SportIcon sport="football" size={32} />
                  <span>
                    LET’S
                    <br />
                    PLAY!
                  </span>
                </div>
              </div>
              <div className="search-bar">
                <Icon name="search" size={22} />
                <input
                  aria-label="Tìm kèo, sân hoặc khu vực"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bạn muốn chơi ở đâu? Tìm tên kèo, sân, khu vực…"
                />
                {search && (
                  <button
                    className="icon-button"
                    aria-label="Xóa tìm kiếm"
                    onClick={() => setSearch("")}
                  >
                    <Icon name="close" size={17} />
                  </button>
                )}
                <span className="search-hint">TÌM KÈO CỦA BẠN</span>
              </div>
              <div
                className="sport-tabs"
                role="group"
                aria-label="Môn thể thao"
              >
                <button
                  className={!sport ? "selected" : ""}
                  aria-pressed={!sport}
                  onClick={() => {
                    setSport("");
                    setPage(1);
                  }}
                >
                  <Icon name="grid" size={20} />
                  Tất cả
                </button>
                {sports.map((s) => (
                  <button
                    key={s.id}
                    className={sport === s.id ? "selected" : ""}
                    aria-pressed={sport === s.id}
                    onClick={() => {
                      setSport(s.id);
                      setPage(1);
                    }}
                  >
                    <SportIcon sport={s.id} size={23} />
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="filter-bar">
                <div className="filter-control">
                  <Icon name="pin" size={17} />
                  <select
                    aria-label="Thành phố"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Tất cả thành phố</option>
                    {Array.from(
                      new Set([
                        ...cities,
                        ...(result?.items.map((m) => m.city) ?? []),
                      ]),
                    ).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-control">
                  <Icon name="calendar" size={17} />
                  <input
                    type="date"
                    aria-label="Ngày chơi (giờ Việt Nam)"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="filter-control">
                  <Icon name="filter" size={17} />
                  <select
                    aria-label="Trình độ"
                    value={level}
                    onChange={(e) => {
                      setLevel(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Mọi trình độ</option>
                    {Object.entries(levels)
                      .filter(([id]) => id !== "all")
                      .map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                  </select>
                </div>
                <label className="check-label availability">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => {
                      setAvailable(e.target.checked);
                      setPage(1);
                    }}
                  />
                  Chỉ kèo còn chỗ
                </label>
                {filtersActive && (
                  <button className="text-button reset" onClick={reset}>
                    Xóa bộ lọc
                  </button>
                )}
              </div>
              <div className="results-heading">
                <h2>
                  Kèo đang chờ bạn{" "}
                  <span className="count">
                    {loading ? "…" : (result?.total ?? 0)}
                  </span>
                </h2>
                <label>
                  Sắp xếp:
                  <select
                    aria-label="Sắp xếp kèo"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="soonest">Sắp diễn ra</option>
                    <option value="newest">Mới đăng</option>
                    <option value="fee">Chi phí thấp</option>
                  </select>
                </label>
              </div>
              {error ? (
                <div className="empty-state">
                  <Icon name="bolt" size={35} />
                  <h3>Chưa kết nối được sân chơi</h3>
                  <p>{error}</p>
                  <button className="button" onClick={refresh}>
                    Thử lại
                  </button>
                </div>
              ) : loading ? (
                <div
                  className="matches-grid"
                  aria-label="Đang tải kèo"
                  aria-busy="true"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div className="skeleton-card" key={n}>
                      <div />
                      <span />
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              ) : result?.items.length ? (
                <>
                  <div className="matches-grid">
                    {result.items.map((m) => (
                      <MatchCard key={m.id} match={m} onSelect={openMatch} />
                    ))}
                  </div>
                  {result.total > result.limit && (
                    <div className="pagination">
                      <button
                        className="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Trang trước
                      </button>
                      <span>
                        Trang {page} / {Math.ceil(result.total / result.limit)}
                      </span>
                      <button
                        className="button"
                        disabled={page * result.limit >= result.total}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Trang sau
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Icon name="search" size={36} />
                  <h3>Chưa tìm thấy kèo phù hợp</h3>
                  <p>Thử đổi bộ lọc, hoặc tự tạo kèo và rủ đồng đội nhé.</p>
                  <div>
                    <button className="button" onClick={reset}>
                      Xóa bộ lọc
                    </button>
                    <button className="button primary" onClick={create}>
                      Tạo kèo mới
                    </button>
                  </div>
                </div>
              )}
              <p className="listing-note">
                <Icon name="users" size={16} />
                Cùng xây dựng sân chơi thân thiện. Đến đúng giờ, tôn trọng đồng
                đội.
              </p>
            </>
          )}
          {view === "mine" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">LỊCH HẸN TRÊN SÂN</p>
                  <h1>
                    Kèo của tôi<span>.</span>
                  </h1>
                  <p>
                    Quản lý đội hình, duyệt đồng đội và theo dõi lời mời tham
                    gia.
                  </p>
                </div>
              </div>
              {!sessionReady ? (
                <p className="notice">Đang kiểm tra phiên đăng nhập…</p>
              ) : !user ? (
                <SignIn onClick={() => setModal("login")} />
              ) : (
                <>
                  <div className="my-summary">
                    <div>
                      <span>Kèo bạn tổ chức</span>
                      <strong>
                        {mine.hosted.length.toString().padStart(2, "0")}
                      </strong>
                    </div>
                    <div>
                      <span>Yêu cầu chờ bạn duyệt</span>
                      <strong>
                        {pendingCount.toString().padStart(2, "0")}
                      </strong>
                    </div>
                    <div>
                      <span>Kèo đã được nhận</span>
                      <strong>
                        {mine.requests
                          .filter((r) => r.status === "accepted")
                          .length.toString()
                          .padStart(2, "0")}
                      </strong>
                    </div>
                  </div>
                  <div className="my-tabs">
                    <button
                      className={tab === "hosted" ? "selected" : ""}
                      onClick={() => setTab("hosted")}
                    >
                      Tôi tổ chức ({mine.hosted.length})
                    </button>
                    <button
                      className={tab === "requests" ? "selected" : ""}
                      onClick={() => setTab("requests")}
                    >
                      Tôi xin tham gia ({mine.requests.length})
                    </button>
                    <button
                      className="text-button"
                      onClick={refresh}
                      disabled={mineLoading}
                    >
                      Làm mới
                    </button>
                  </div>
                  {mineError ? (
                    <div className="error" role="alert">
                      {mineError}
                      <button className="text-button" onClick={refresh}>
                        Thử lại
                      </button>
                    </div>
                  ) : mineLoading ? (
                    <p className="notice">Đang tải kèo của bạn…</p>
                  ) : (
                    <div className="matches-grid">
                      {tab === "hosted"
                        ? mine.hosted.map((m) => (
                            <MatchCard
                              key={m.id}
                              match={m}
                              onSelect={openMatch}
                              label={
                                m.pendingCount
                                  ? `${m.pendingCount} yêu cầu đang chờ duyệt`
                                  : "Bạn là chủ kèo"
                              }
                            />
                          ))
                        : mine.requests.map((r) => (
                            <MatchCard
                              key={r.id}
                              match={r.match}
                              onSelect={openMatch}
                              label={
                                r.match.status === "cancelled"
                                  ? "Kèo đã bị hủy"
                                  : requestLabels[r.status]
                              }
                            />
                          ))}
                    </div>
                  )}
                  {!mineLoading &&
                    !mineError &&
                    !(tab === "hosted"
                      ? mine.hosted.length
                      : mine.requests.length) && (
                      <div className="empty-state">
                        <Icon name="calendar" size={36} />
                        <h3>
                          {tab === "hosted"
                            ? "Kèo đầu tiên bắt đầu từ bạn"
                            : "Đội hình đang chờ bạn"}
                        </h3>
                        <p>
                          {tab === "hosted"
                            ? "Chọn sân, chọn giờ và tìm đồng đội cùng chơi."
                            : "Khám phá kèo phù hợp và gửi yêu cầu tham gia."}
                        </p>
                        <button
                          className="button primary"
                          onClick={
                            tab === "hosted"
                              ? create
                              : () => setView("discover")
                          }
                        >
                          {tab === "hosted" ? "Tạo kèo mới" : "Khám phá kèo"}
                        </button>
                      </div>
                    )}
                </>
              )}
            </>
          )}
          {view === "profile" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">ĐỒNG ĐỘI ƠI, CHÀO BẠN</p>
                  <h1>
                    Hồ sơ cá nhân<span>.</span>
                  </h1>
                  <p>Để mọi người hiểu hơn về bạn trước khi cùng ra sân.</p>
                </div>
              </div>
              {!sessionReady ? (
                <p className="notice">Đang tải hồ sơ…</p>
              ) : !user ? (
                <SignIn onClick={() => setModal("login")} />
              ) : (
                <div className="profile-layout">
                  <div className="profile-identity">
                    <span className="avatar huge">{initials(user.name)}</span>
                    <h2>{user.name}</h2>
                    <p>{user.email}</p>
                    <span>
                      <Icon name="pin" size={16} />
                      {user.city}
                    </span>
                    <button className="text-button danger" onClick={logout}>
                      <Icon name="logout" size={16} />
                      Đăng xuất
                    </button>
                  </div>
                  <div className="profile-form">
                    <h2>Thông tin của bạn</h2>
                    <ProfileForm
                      user={user}
                      onSuccess={(updated) => {
                        setUser(updated);
                        refresh();
                        notify("Đã cập nhật hồ sơ của bạn.");
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
        <footer className="page-footer">
          <span>© {new Date().getFullYear()} KèoThểThao</span>
          <span>Gặp nhau trên sân.</span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="bolt" size={18} />
          {toast}
          <button
            className="icon-button"
            aria-label="Đóng thông báo"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {(modal === "login" || modal === "register") && (
        <Modal
          title={modal === "login" ? "Chào mừng trở lại!" : "Gia nhập đội hình"}
          subtitle="Một tài khoản, nhiều cuộc hẹn trên sân."
          onClose={() => setModal(null)}
        >
          <AuthForm
            key={modal}
            register={modal === "register"}
            onSwitch={() => setModal(modal === "login" ? "register" : "login")}
            onSuccess={(account) => {
              setUser(account);
              setModal(null);
              notify(`Chào ${account.name}, cùng lên kèo nhé!`);
            }}
          />
        </Modal>
      )}
      {(modal === "create" || modal === "edit") && (
        <Modal
          wide
          title={modal === "edit" ? "Chỉnh sửa kèo" : "Lên kèo, tìm đồng đội"}
          subtitle="Chủ động một cuộc hẹn, kết nối thêm đam mê."
          onClose={() => setModal(null)}
        >
          <MatchForm
            initial={modal === "edit" ? editMatch : undefined}
            onSuccess={(match) => {
              setModal(null);
              setSelected(match);
              refresh();
              notify(
                modal === "edit"
                  ? "Đã lưu thay đổi kèo."
                  : "Kèo mới đã sẵn sàng đón đồng đội!",
              );
            }}
          />
        </Modal>
      )}
      {selected && !modal && (
        <Modal
          wide
          title={selected.title}
          onClose={() => {
            ++sequence.current;
            setSelected(null);
          }}
        >
          <MatchDetail
            key={selected.id}
            initial={selected}
            user={user}
            ownRequest={mine.requests.find((r) => r.match.id === selected.id)}
            onLogin={() => {
              setSelected(null);
              setModal("login");
            }}
            onChanged={refresh}
            onEdit={(match) => {
              setEditMatch(match);
              setSelected(null);
              setModal("edit");
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function SignIn({ onClick }: { onClick: () => void }) {
  return (
    <div className="empty-state">
      <Icon name="user" size={40} />
      <h3>Đăng nhập để vào đội hình</h3>
      <p>Kèo đã tạo và yêu cầu tham gia của bạn sẽ xuất hiện ở đây.</p>
      <button className="button primary" onClick={onClick}>
        Đăng nhập
        <Icon name="arrow" size={18} />
      </button>
    </div>
  );
}
