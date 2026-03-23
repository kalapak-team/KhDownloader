import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileImage, FilePlus2, FileText, History, LogOut, Shield, UserRound, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [scrolled, setScrolled] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pdfMenuRef = useRef(null);
  const location = useLocation();
  const isPdfActive = location.pathname === "/pdf-to-jpg" || location.pathname === "/jpg-to-pdf" || location.pathname === "/merge-pdf";

  useEffect(() => {
    setMenuOpen(false);
    setPdfOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(e.target)) {
        setPdfOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const linkBase =
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm no-underline transition-all duration-200";
  const linkActive =
    "border-[rgba(232,71,42,0.55)] bg-[rgba(232,71,42,0.12)] text-textPrimary";
  const linkIdle =
    "border-[rgba(255,255,255,0.08)] text-textSecondary hover:border-[rgba(232,71,42,0.4)] hover:bg-[rgba(232,71,42,0.08)] hover:text-textPrimary";

  return (
    <header
      className={[
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.88)] shadow-[0_4px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          : "border-b border-transparent bg-[rgba(10,10,15,0.5)] backdrop-blur-md",
      ].join(" ")}
    >
      <div className="mx-auto flex h-[68px] w-[min(1080px,calc(100vw-32px))] items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5 font-heading text-[1.1rem] font-bold text-textPrimary no-underline"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(232,71,42,0.18)] text-[#e8472a] transition-colors duration-200 group-hover:bg-[rgba(232,71,42,0.28)]">
            <Download size={16} />
          </span>
          <span className="relative">
            KhDownloader
            <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-[#e8472a] transition-all duration-300 group-hover:w-full" />
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
          >
            <History size={14} />
            History
          </NavLink>

          {/* PDF Tools dropdown */}
          <div className="relative" ref={pdfMenuRef}>
            <button
              type="button"
              onClick={() => setPdfOpen((o) => !o)}
              className={`${linkBase} ${isPdfActive ? linkActive : linkIdle}`}
            >
              <FileImage size={14} />
              PDF Tools
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${pdfOpen ? "rotate-180" : ""}`}
              />
            </button>
            {pdfOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[180px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.09)] bg-[rgba(15,15,20,0.96)] shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                <NavLink
                  to="/pdf-to-jpg"
                  onClick={() => setPdfOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-4 py-3 text-sm no-underline transition-colors duration-150 ${
                      isActive
                        ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]"
                        : "text-textSecondary hover:bg-[rgba(232,71,42,0.07)] hover:text-textPrimary"
                    }`
                  }
                >
                  <FileImage size={15} />
                  PDF → JPG
                </NavLink>
                <div className="mx-3 h-px bg-[rgba(255,255,255,0.06)]" />
                <NavLink
                  to="/jpg-to-pdf"
                  onClick={() => setPdfOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-4 py-3 text-sm no-underline transition-colors duration-150 ${
                      isActive
                        ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]"
                        : "text-textSecondary hover:bg-[rgba(232,71,42,0.07)] hover:text-textPrimary"
                    }`
                  }
                >
                  <FileText size={15} />
                  JPG → PDF
                </NavLink>
                <div className="mx-3 h-px bg-[rgba(255,255,255,0.06)]" />
                <NavLink
                  to="/merge-pdf"
                  onClick={() => setPdfOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-4 py-3 text-sm no-underline transition-colors duration-150 ${
                      isActive
                        ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]"
                        : "text-textSecondary hover:bg-[rgba(232,71,42,0.07)] hover:text-textPrimary"
                    }`
                  }
                >
                  <FilePlus2 size={15} />
                  Merge PDF
                </NavLink>
              </div>
            )}
          </div>

          {user ? (
            <>
              {user.is_admin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
                >
                  <Shield size={14} />
                  Admin
                </NavLink>
              )}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `inline-flex items-center justify-center rounded-full border p-0.5 no-underline transition-all duration-200 ${
                    isActive
                      ? "border-[#e8472a] shadow-[0_0_8px_rgba(232,71,42,0.35)]"
                      : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(232,71,42,0.5)]"
                  }`
                }
                title={user.full_name || user.email}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(232,71,42,0.18)] text-xs font-bold text-[#e8472a]">
                    {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className={`${linkBase} ${linkIdle}`}
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#e8472a] px-4 py-2 text-sm font-semibold text-white no-underline transition-all duration-200 hover:bg-[#ff5c3a] hover:shadow-[0_0_16px_rgba(232,71,42,0.4)]"
              >
                Register
              </NavLink>
            </>
          )}
        </nav>

        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="group relative flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[rgba(232,71,42,0.5)] hover:bg-[rgba(232,71,42,0.1)] md:hidden"
        >
          <span
            className={[
              "block h-[2px] w-5 rounded-full bg-current transition-all duration-300",
              menuOpen
                ? "translate-y-[7px] rotate-45 text-[#e8472a]"
                : "text-textSecondary group-hover:text-[#e8472a]",
            ].join(" ")}
          />
          <span
            className={[
              "block h-[2px] rounded-full bg-current transition-all duration-300",
              menuOpen
                ? "w-0 opacity-0 text-[#e8472a]"
                : "w-5 text-textSecondary group-hover:text-[#e8472a]",
            ].join(" ")}
          />
          <span
            className={[
              "block h-[2px] w-5 rounded-full bg-current transition-all duration-300",
              menuOpen
                ? "-translate-y-[7px] -rotate-45 text-[#e8472a]"
                : "text-textSecondary group-hover:text-[#e8472a]",
            ].join(" ")}
          />
        </button>
      </div>

      {/* ─── Mobile Menu ─── */}
      {menuOpen && (
        <div className="border-t border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.96)] backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex w-[min(1080px,calc(100vw-32px))] flex-col gap-0.5 py-3 pb-5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm no-underline transition-colors ${isActive ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]" : "text-textSecondary hover:bg-[rgba(255,255,255,0.05)] hover:text-textPrimary"}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm no-underline transition-colors ${isActive ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]" : "text-textSecondary hover:bg-[rgba(255,255,255,0.05)] hover:text-textPrimary"}`
              }
            >
              <History size={15} />
              History
            </NavLink>

            {/* PDF Tools group */}
            <div className="mt-1">
              <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-[#55556A]">
                PDF Tools
              </p>
              <NavLink
                to="/pdf-to-jpg"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm no-underline transition-colors ${isActive ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]" : "text-textSecondary hover:bg-[rgba(255,255,255,0.05)] hover:text-textPrimary"}`
                }
              >
                <FileImage size={15} />
                PDF → JPG
              </NavLink>
              <NavLink
                to="/jpg-to-pdf"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm no-underline transition-colors ${isActive ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]" : "text-textSecondary hover:bg-[rgba(255,255,255,0.05)] hover:text-textPrimary"}`
                }
              >
                <FileText size={15} />
                JPG → PDF
              </NavLink>
              <NavLink
                to="/merge-pdf"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm no-underline transition-colors ${isActive ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]" : "text-textSecondary hover:bg-[rgba(255,255,255,0.05)] hover:text-textPrimary"}`
                }
              >
                <FilePlus2 size={15} />
                Merge PDF
              </NavLink>
            </div>

            {/* Auth */}
            <div className="mt-2 flex flex-col gap-0.5 border-t border-[rgba(255,255,255,0.06)] pt-2">
              {user ? (
                <>
                  {user.is_admin && (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm no-underline transition-colors ${isActive ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]" : "text-textSecondary hover:bg-[rgba(255,255,255,0.05)] hover:text-textPrimary"}`
                      }
                    >
                      <Shield size={15} />
                      Admin
                    </NavLink>
                  )}
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm no-underline transition-colors ${isActive ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]" : "text-textSecondary hover:bg-[rgba(255,255,255,0.05)] hover:text-textPrimary"}`
                    }
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <UserRound size={15} />
                    )}
                    Profile
                  </NavLink>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm text-textSecondary transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-textPrimary"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm no-underline transition-colors ${isActive ? "bg-[rgba(232,71,42,0.12)] text-[#e8472a]" : "text-textSecondary hover:bg-[rgba(255,255,255,0.05)] hover:text-textPrimary"}`
                    }
                  >
                    Login
                  </NavLink>
                  <Link
                    to="/register"
                    className="mx-4 mt-1 flex items-center justify-center rounded-xl bg-[#e8472a] py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[#ff5c3a]"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
