import { useCallback, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuthStore } from "../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const register = useAuthStore((state) => state.register);
  const loginWithGoogleCredential = useAuthStore((state) => state.loginWithGoogleCredential);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await register({
        full_name: fullName.trim() || null,
        email,
        password,
      });
      toast.success("Account created");
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setIsSubmitting(true);
      try {
        await loginWithGoogleCredential(credential);
        toast.success("Signed up with Google");
        navigate("/");
      } catch (error) {
        toast.error(error?.response?.data?.detail || "Google sign-up failed");
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
            Create account
          </h1>
          <p className="animate-fade-up-d1 mt-2 text-sm text-textSecondary">
            Join KhDownloader and manage your downloads.
          </p>
        </div>

        <div className="animate-fade-up-d2 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur-md">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm text-textSecondary" htmlFor="register-name">
                Full name <span className="text-[#55556A]">(optional)</span>
              </label>
              <input
                id="register-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-textPrimary placeholder-[#55556A] outline-none transition-all duration-200 focus:border-[rgba(232,71,42,0.5)] focus:shadow-[0_0_0_3px_rgba(232,71,42,0.1)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-textSecondary" htmlFor="register-email">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-textPrimary placeholder-[#55556A] outline-none transition-all duration-200 focus:border-[rgba(232,71,42,0.5)] focus:shadow-[0_0_0_3px_rgba(232,71,42,0.1)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-textSecondary" htmlFor="register-password">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
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
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-textSecondary">
            <span className="h-px flex-1 bg-[rgba(255,255,255,0.06)]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[rgba(255,255,255,0.06)]" />
          </div>

          <GoogleAuthButton onCredential={handleGoogleCredential} disabled={isSubmitting} />

          <p className="mt-5 text-center text-sm text-textSecondary">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-[#e8472a] no-underline hover:text-[#ff5c3a] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
