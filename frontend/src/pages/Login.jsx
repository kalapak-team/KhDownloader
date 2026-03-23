import { useCallback, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const loginWithGoogleCredential = useAuthStore((state) => state.loginWithGoogleCredential);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Welcome back");
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setIsSubmitting(true);
      try {
        await loginWithGoogleCredential(credential);
        toast.success("Logged in with Google");
        navigate("/");
      } catch (error) {
        toast.error(error?.response?.data?.detail || "Google login failed");
      } finally {
        setIsSubmitting(false);
      }
    },
    [loginWithGoogleCredential, navigate],
  );

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="animate-fade-up text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold tracking-tight">
            Welcome back
          </h1>
          <p className="animate-fade-up-d1 mt-2 text-sm text-textSecondary">
            Sign in to your account to continue.
          </p>
        </div>

        <div className="animate-fade-up-d2 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur-md">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm text-textSecondary" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-textPrimary placeholder-[#55556A] outline-none transition-all duration-200 focus:border-[rgba(232,71,42,0.5)] focus:shadow-[0_0_0_3px_rgba(232,71,42,0.1)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-textSecondary" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                required
                minLength={8}
                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-textPrimary placeholder-[#55556A] outline-none transition-all duration-200 focus:border-[rgba(232,71,42,0.5)] focus:shadow-[0_0_0_3px_rgba(232,71,42,0.1)]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl bg-[#e8472a] py-3 text-base font-semibold text-white shadow-[0_4px_20px_rgba(232,71,42,0.28)] transition-all duration-200 hover:bg-[#ff5c3a] hover:shadow-[0_4px_28px_rgba(232,71,42,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-textSecondary">
            <span className="h-px flex-1 bg-[rgba(255,255,255,0.06)]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[rgba(255,255,255,0.06)]" />
          </div>

          <GoogleAuthButton onCredential={handleGoogleCredential} disabled={isSubmitting} />

          <p className="mt-5 text-center text-sm text-textSecondary">
            No account yet?{" "}
            <Link to="/register" className="font-medium text-[#e8472a] no-underline hover:text-[#ff5c3a] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
