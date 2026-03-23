import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Users,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  TrendingUp,
  Calendar,
  Trash2,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  adminGetStats,
  adminGetUsers,
  adminToggleUserActive,
  adminToggleUserAdmin,
  adminDeleteUser,
  adminGetDownloads,
  adminDeleteDownload,
} from "../services/api";

// ── helpers ─────────────────────────────────────────────────────────────────

const fmtBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let s = bytes;
  let i = 0;
  while (s >= 1024 && i < units.length - 1) { s /= 1024; i++; }
  return `${s.toFixed(1)} ${units[i]}`;
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "#e8472a" }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-md transition-all duration-200 hover:border-[rgba(255,255,255,0.12)]">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}22`, color }}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-textPrimary">{value}</p>
        <p className="text-sm font-medium text-textSecondary">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-[#55556A]">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-textPrimary">{title}</h2>
      {children}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    completed: "border-[rgba(48,209,88,0.3)] bg-[rgba(48,209,88,0.12)] text-[#7CE89A]",
    failed: "border-[rgba(255,69,58,0.3)] bg-[rgba(255,69,58,0.12)] text-[#FF8B85]",
    processing: "border-[rgba(255,214,10,0.3)] bg-[rgba(255,214,10,0.12)] text-[#FFE37A]",
    pending: "border-[rgba(255,214,10,0.3)] bg-[rgba(255,214,10,0.12)] text-[#FFE37A]",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, setPage, total, perPage }) {
  const hasNext = page * perPage < total;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-textSecondary">
      <span>{total} record{total !== 1 ? "s" : ""}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] transition hover:border-[rgba(232,71,42,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={14} />
        </button>
        <span>Page {page}</span>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => setPage((p) => p + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] transition hover:border-[rgba(232,71,42,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Users table ───────────────────────────────────────────────────────────────

function UsersTable() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const PER_PAGE = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const res = await adminGetUsers({ page, per_page: PER_PAGE, search: debouncedSearch || undefined });
      setUsers(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load users");
    }
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (id) => {
    try {
      const res = await adminToggleUserActive(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: res.data.is_active } : u)),
      );
    } catch {
      toast.error("Failed to update user");
    }
  };

  const handleToggleAdmin = async (id) => {
    try {
      const res = await adminToggleUserAdmin(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_admin: res.data.is_admin } : u)),
      );
    } catch {
      toast.error("Failed to update user");
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Delete user "${email}"? This cannot be undone.`)) return;
    try {
      await adminDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => t - 1);
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-md">
      <SectionHeader title="Users">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email…"
            className="h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] pl-8 pr-3 text-sm text-textPrimary placeholder-[#55556A] outline-none transition focus:border-[rgba(232,71,42,0.5)]"
          />
        </div>
      </SectionHeader>

      <div className="overflow-auto">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr>
              {["Email", "Name", "Provider", "Downloads", "Joined", "Status", "Role", "Actions"].map((h) => (
                <th key={h} className="border-b border-[rgba(255,255,255,0.06)] p-2.5 text-left text-xs font-medium text-textSecondary">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="group transition hover:bg-[rgba(255,255,255,0.02)]">
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 text-textPrimary">{u.email}</td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 text-textSecondary">{u.full_name || "—"}</td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5">
                  <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2 py-0.5 text-xs text-textSecondary capitalize">{u.auth_provider}</span>
                </td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 font-mono text-textSecondary">{u.download_count}</td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 font-mono text-xs text-textSecondary">
                  {format(new Date(u.created_at), "yyyy-MM-dd")}
                </td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] uppercase ${u.is_active ? "border-[rgba(48,209,88,0.3)] bg-[rgba(48,209,88,0.1)] text-[#7CE89A]" : "border-[rgba(255,69,58,0.3)] bg-[rgba(255,69,58,0.1)] text-[#FF8B85]"}`}>
                    {u.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5">
                  {u.is_admin && (
                    <span className="inline-flex rounded-full border border-[rgba(232,71,42,0.35)] bg-[rgba(232,71,42,0.1)] px-2 py-0.5 text-[11px] text-[#FF8F87]">Admin</span>
                  )}
                </td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title={u.is_active ? "Deactivate" : "Activate"}
                      onClick={() => handleToggleActive(u.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-textSecondary transition hover:border-[rgba(232,71,42,0.4)] hover:text-textPrimary"
                    >
                      {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                    </button>
                    <button
                      type="button"
                      title={u.is_admin ? "Remove admin" : "Make admin"}
                      onClick={() => handleToggleAdmin(u.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-textSecondary transition hover:border-[rgba(232,71,42,0.4)] hover:text-textPrimary"
                    >
                      {u.is_admin ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                    </button>
                    <button
                      type="button"
                      title="Delete user"
                      onClick={() => handleDelete(u.id, u.email)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(255,69,58,0.3)] bg-[rgba(255,69,58,0.08)] text-[#FF8B85] transition hover:bg-[rgba(255,69,58,0.18)]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!users.length && (
        <p className="py-8 text-center text-sm text-textSecondary">No users found.</p>
      )}
      <Pagination page={page} setPage={setPage} total={total} perPage={PER_PAGE} />
    </section>
  );
}

// ── Downloads table ───────────────────────────────────────────────────────────

function DownloadsTable() {
  const [downloads, setDownloads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const PER_PAGE = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const res = await adminGetDownloads({
        page,
        per_page: PER_PAGE,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      setDownloads(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load downloads");
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this download record?")) return;
    try {
      await adminDeleteDownload(id);
      setDownloads((prev) => prev.filter((d) => d.id !== id));
      setTotal((t) => t - 1);
      toast.success("Download deleted");
    } catch {
      toast.error("Failed to delete download");
    }
  };

  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-md">
      <SectionHeader title="All Downloads">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search title…"
              className="h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] pl-8 pr-3 text-sm text-textPrimary placeholder-[#55556A] outline-none transition focus:border-[rgba(232,71,42,0.5)]"
            />
          </div>
          <div className="relative flex items-center">
            <Filter size={13} className="absolute left-3 text-textSecondary" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] pl-8 pr-3 text-sm text-textPrimary outline-none transition focus:border-[rgba(232,71,42,0.5)]"
            >
              <option value="">All status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>
      </SectionHeader>

      <div className="overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr>
              {["Thumb", "Title", "User", "Type", "Quality", "Size", "Status", "Date", ""].map((h) => (
                <th key={h} className="border-b border-[rgba(255,255,255,0.06)] p-2.5 text-left text-xs font-medium text-textSecondary">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {downloads.map((d) => (
              <tr key={d.id} className="transition hover:bg-[rgba(255,255,255,0.02)]">
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5">
                  {d.thumbnail_url ? (
                    <img src={d.thumbnail_url} alt="" className="h-9 w-16 rounded-md object-cover" loading="lazy" />
                  ) : (
                    <div className="h-9 w-16 rounded-md bg-[rgba(255,255,255,0.05)]" />
                  )}
                </td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 max-w-[220px]">
                  <span className="line-clamp-2 text-xs text-textPrimary">{d.title || "Untitled"}</span>
                </td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 text-xs text-textSecondary">
                  {d.user_email || <span className="italic text-[#44445A]">Anonymous</span>}
                </td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 text-xs capitalize text-textSecondary">{d.format_type}</td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 font-mono text-xs text-textSecondary">{d.quality || "—"}</td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 font-mono text-xs text-textSecondary">{fmtBytes(d.file_size_bytes)}</td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5">
                  <StatusBadge status={d.status} />
                </td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5 font-mono text-xs text-textSecondary">
                  {format(new Date(d.created_at), "MM-dd HH:mm")}
                </td>
                <td className="border-b border-[rgba(255,255,255,0.04)] p-2.5">
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(255,69,58,0.3)] bg-[rgba(255,69,58,0.08)] text-[#FF8B85] transition hover:bg-[rgba(255,69,58,0.18)]"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!downloads.length && (
        <p className="py-8 text-center text-sm text-textSecondary">No downloads found.</p>
      )}
      <Pagination page={page} setPage={setPage} total={total} perPage={PER_PAGE} />
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("users");

  useEffect(() => {
    adminGetStats()
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Failed to load stats"));
  }, []);

  const statCards = stats
    ? [
        { icon: Users, label: "Total Users", value: stats.total_users, sub: `${stats.active_users} active`, color: "#818cf8" },
        { icon: Download, label: "Total Downloads", value: stats.total_downloads, sub: `${stats.downloads_today} today`, color: "#e8472a" },
        { icon: CheckCircle2, label: "Completed", value: stats.completed_downloads, color: "#30D158" },
        { icon: XCircle, label: "Failed", value: stats.failed_downloads, color: "#FF453A" },
        { icon: Clock, label: "Pending / Processing", value: stats.pending_downloads, color: "#FFD60A" },
        { icon: Calendar, label: "This Week", value: stats.downloads_this_week, color: "#38bdf8" },
        { icon: TrendingUp, label: "Today", value: stats.downloads_today, color: "#f472b6" },
        { icon: HardDrive, label: "Total Storage", value: fmtBytes(stats.total_bytes), color: "#a78bfa" },
      ]
    : [];

  return (
    <div className="grid gap-6 py-10 pb-16">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight">
          Admin{" "}
          <span className="bg-gradient-to-r from-[#e8472a] to-[#ff7a52] bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
        <p className="animate-fade-up-d1 mt-1.5 text-sm text-textSecondary">
          Manage users, monitor downloads, and keep everything healthy.
        </p>
      </div>

      {/* Stats grid */}
      {stats ? (
        <div className="animate-fade-up-d1 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint: skeleton placeholder
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]" />
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="animate-fade-up-d2 flex gap-2 border-b border-[rgba(255,255,255,0.07)] pb-0">
        {[
          { id: "users", label: "Users" },
          { id: "downloads", label: "Downloads" },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              "rounded-t-xl border-b-2 px-5 py-2.5 text-sm font-medium transition-all duration-200",
              tab === id
                ? "border-[#e8472a] text-textPrimary"
                : "border-transparent text-textSecondary hover:text-textPrimary",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tables */}
      <div className="animate-fade-up-d3">
        {tab === "users" ? <UsersTable /> : <DownloadsTable />}
      </div>
    </div>
  );
}
