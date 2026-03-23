import { useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Save,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

// ── helpers ───────────────────────────────────────────────────────────────────

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const baseURL = import.meta.env.VITE_API_URL || "";

function Avatar({ url, name, size = 80 }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (url) {
    return (
      <img
        src={`${baseURL}${url}`}
        alt={name || "avatar"}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size / 3 }}
      className="flex items-center justify-center rounded-full bg-[rgba(232,71,42,0.18)] font-bold text-[#e8472a]"
    >
      {initials}
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────

function Card({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6 backdrop-blur-md">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(232,71,42,0.12)] text-[#e8472a]">
          <Icon size={16} />
        </span>
        <h2 className="text-base font-semibold text-textPrimary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar);
  const changePassword = useAuthStore((state) => state.changePassword);

  // Profile form
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: fullName.trim() || null });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP or GIF images are accepted");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err?.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPw(true);
    setPwSuccess(false);
    try {
      await changePassword({ current_password: currentPw, new_password: newPw });
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) return null;

  return (
    <div className="grid gap-6 py-10 pb-16">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight">
          My{" "}
          <span className="bg-gradient-to-r from-[#e8472a] to-[#ff7a52] bg-clip-text text-transparent">
            Profile
          </span>
        </h1>
        <p className="animate-fade-up-d1 mt-1.5 text-sm text-textSecondary">
          Manage your account details, avatar, and security settings.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* ── Avatar + Profile info ── */}
        <Card title="Profile Information" icon={UserRound}>
          {/* Avatar picker */}
          <div className="mb-6 flex items-center gap-5">
            <div className="relative">
              <Avatar url={user.avatar_url} name={user.full_name || user.email} size={80} />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[rgba(10,10,15,1)] bg-[#e8472a] text-white transition hover:bg-[#ff5c3a] disabled:opacity-60"
              >
                {uploadingAvatar ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Camera size={13} />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="font-semibold text-textPrimary">{user.full_name || "—"}</p>
              <p className="text-sm text-textSecondary">{user.email}</p>
              <p className="mt-1 text-xs text-[#55556A]">
                Provider:{" "}
                <span className="capitalize text-textSecondary">{user.auth_provider}</span>
                {user.is_admin && (
                  <span className="ml-2 rounded-full border border-[rgba(232,71,42,0.35)] bg-[rgba(232,71,42,0.12)] px-2 py-0.5 text-[10px] text-[#FF8F87]">
                    Admin
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-[#55556A]">
                Click the camera icon to change your avatar (max 5 MB)
              </p>
            </div>
          </div>

          {/* Name form */}
          <form onSubmit={handleSaveProfile} className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-textSecondary" htmlFor="full-name">
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
                placeholder="Your name"
                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-textPrimary placeholder-[#55556A] outline-none transition-all duration-200 focus:border-[rgba(232,71,42,0.5)] focus:shadow-[0_0_0_3px_rgba(232,71,42,0.1)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-textSecondary" htmlFor="profile-email">
                Email <span className="text-[#55556A]">(cannot be changed)</span>
              </label>
              <input
                id="profile-email"
                type="email"
                value={user.email}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-textSecondary outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8472a] py-3 text-sm font-semibold text-white transition hover:bg-[#ff5c3a] hover:shadow-[0_0_20px_rgba(232,71,42,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save Changes
            </button>
          </form>
        </Card>

        {/* ── Change Password ── */}
        <Card title="Change Password" icon={KeyRound}>
          {user.auth_provider !== "email" ? (
            <div className="flex items-start gap-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-textSecondary">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#FFD60A]" />
              Password change is not available for {user.auth_provider} accounts. You signed in
              using {user.auth_provider} OAuth.
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="grid gap-4">
              {pwSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-[rgba(48,209,88,0.3)] bg-[rgba(48,209,88,0.08)] px-4 py-3 text-sm text-[#4ade80]">
                  <CheckCircle2 size={15} />
                  Password changed successfully!
                </div>
              )}
              <div>
                <label
                  className="mb-1.5 block text-sm text-textSecondary"
                  htmlFor="current-pw"
                >
                  Current password
                </label>
                <input
                  id="current-pw"
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Your current password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-textPrimary placeholder-[#55556A] outline-none transition-all duration-200 focus:border-[rgba(232,71,42,0.5)] focus:shadow-[0_0_0_3px_rgba(232,71,42,0.1)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-textSecondary" htmlFor="new-pw">
                  New password
                </label>
                <input
                  id="new-pw"
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-textPrimary placeholder-[#55556A] outline-none transition-all duration-200 focus:border-[rgba(232,71,42,0.5)] focus:shadow-[0_0_0_3px_rgba(232,71,42,0.1)]"
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-sm text-textSecondary"
                  htmlFor="confirm-pw"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-pw"
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  minLength={8}
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-textPrimary placeholder-[#55556A] outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(232,71,42,0.1)]",
                    confirmPw && newPw !== confirmPw
                      ? "border-[rgba(255,69,58,0.5)] bg-[rgba(255,69,58,0.05)] focus:border-[rgba(255,69,58,0.7)]"
                      : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] focus:border-[rgba(232,71,42,0.5)]",
                  ].join(" ")}
                />
                {confirmPw && newPw !== confirmPw && (
                  <p className="mt-1 text-xs text-[#FF8B85]">Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={savingPw || (!!confirmPw && newPw !== confirmPw)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8472a] py-3 text-sm font-semibold text-white transition hover:bg-[#ff5c3a] hover:shadow-[0_0_20px_rgba(232,71,42,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPw ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <KeyRound size={15} />
                )}
                Change Password
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
