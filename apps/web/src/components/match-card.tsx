import {
  dateLabel,
  initials,
  levels,
  money,
  sportInfo,
  timeLabel,
  type Match,
} from "../lib/api";
import { Icon, SportIcon } from "./icons";
import { useNow } from "../lib/use-now";

export function MatchCard({
  match,
  onSelect,
  label,
}: {
  match: Match;
  onSelect: (match: Match) => void;
  label?: string;
}) {
  const sport = sportInfo(match.sport);
  const now = useNow();
  const closed =
    match.status !== "open" || new Date(match.startsAt).getTime() <= now;
  return (
    <article className="match-card">
      <button
        type="button"
        className={`card-art ${sport.color}`}
        onClick={() => onSelect(match)}
        aria-label={`Xem kèo ${match.title}`}
      >
        <span className="sport-label">
          <SportIcon sport={match.sport} size={17} />
          {sport.name}
        </span>
        <span className="court-lines" aria-hidden="true">
          <span />
        </span>
        <span className="art-ball">
          <SportIcon sport={match.sport} size={76} />
        </span>
        <span
          className={`badge ${!closed && match.spotsLeft > 0 ? "light" : "neutral"}`}
        >
          {match.status === "cancelled"
            ? "Đã hủy"
            : match.status === "completed"
              ? "Hoàn thành"
              : closed
                ? "Đã bắt đầu"
                : match.spotsLeft > 0
                  ? `Còn ${match.spotsLeft} chỗ`
                  : "Đã đủ người"}
        </span>
      </button>
      <div className="card-content">
        <div className="card-date">
          <span>{dateLabel(match.startsAt)}</span>
          <span>{timeLabel(match.startsAt)}</span>
        </div>
        <h3>
          <button onClick={() => onSelect(match)}>{match.title}</button>
        </h3>
        <p className="card-place">
          <Icon name="pin" size={16} />
          <span>
            {match.venue}
            <small>
              {match.district} · {match.city}
            </small>
          </span>
        </p>
        <div className="card-level">
          <span>{levels[match.level]}</span>
          <span>{match.durationMinutes} phút</span>
        </div>
        <div className="card-bottom">
          <div className="player-preview">
            <div className="avatar-stack">
              {match.participants.slice(0, 3).map((p, i) => (
                <span
                  key={p.id}
                  className={`avatar tiny tint-${i}`}
                  title={p.name}
                >
                  {initials(p.name)}
                </span>
              ))}
            </div>
            <span>
              <strong>{match.playerCount}</strong>/{match.capacity}
            </span>
          </div>
          <div className="card-price">
            <strong>{money(match.fee)}</strong>
            {match.fee > 0 && <small>/ người</small>}
          </div>
        </div>
        {label && <div className="card-state">{label}</div>}
      </div>
    </article>
  );
}
