"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Success: redirect to dashboard
      router.push("/admin/overview");
      router.refresh();
    } catch (err) {
      console.error("Login submission error:", err);
      setError("Unable to connect to authentication service. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (!supabase) {
        throw new Error("Supabase authentication client is not available.");
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin/overview`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: unknown) {
      console.error("Google sign-in error:", err);
      const message =
        err instanceof Error ? err.message : "Google authentication is not configured for this admin instance.";
      setError(
        message.includes("configuration") || message.includes("not enabled") || message.includes("provider")
          ? "Google Single Sign-On is not configured for administrator domain. Please sign in with admin username and password."
          : message
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#141413] flex flex-col lg:flex-row antialiased selection:bg-[#FAF5EC] selection:text-[#865E16]">
      {/* Left Column: Portrait Artwork Display */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen items-center justify-center p-8 lg:p-12 xl:p-16 bg-white select-none">
        <div className="relative w-full max-w-[460px] xl:max-w-[500px] h-[580px] xl:h-[700px] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#ECECE8] bg-[#FAF8F5]">
          <img
            src="/images/admin-login-artwork.jpg"
            alt="Botanical Floral Art"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute bottom-6 left-6 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[10px] font-semibold tracking-wider uppercase text-[#141413] shadow-md border border-black/5">
            BOTANICAL FLORAL ART
          </div>
        </div>
      </div>

      {/* Right Column: Centered Admin Login Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-12 bg-white">
        <div className="w-full max-w-sm sm:max-w-md mx-auto space-y-8">
          {/* Brand & Heading matching reference */}
          <div className="text-center space-y-1.5">
            <div className="font-serif font-bold text-lg sm:text-xl tracking-[0.25em] text-[#1B365D] uppercase">
              ERAS
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal text-[#141413] tracking-tight pt-2">
              Welcome Back
            </h1>
            <p className="font-serif italic text-xl sm:text-2xl text-[#6E6E69]">
              Admin Console
            </p>
            <p className="text-xs text-[#7A7A75] leading-relaxed max-w-xs mx-auto pt-1">
              Enter administrative credentials to manage gallery roster, community operations, and curatorial workflows.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs leading-relaxed animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Minimal Underline Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Username / Email Field */}
              <div className="space-y-1">
                <label
                  htmlFor="username"
                  className="text-xs font-normal text-[#8A8A85] block select-none"
                >
                  Email or Username
                </label>
                <div className="border-b border-[#D8D8D3] focus-within:border-[#141413] transition-colors py-1">
                  <input
                    id="username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    placeholder="admin@erasstudio.com or username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-transparent py-1 text-sm text-[#141413] placeholder-[#BCBCB6] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password Field with Eye Toggle */}
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-xs font-normal text-[#8A8A85] block select-none"
                >
                  Password
                </label>
                <div className="relative border-b border-[#D8D8D3] focus-within:border-[#141413] transition-colors py-1 flex items-center">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-transparent py-1 pr-8 text-sm text-[#141413] placeholder-[#BCBCB6] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 text-[#8A8A85] hover:text-[#141413] transition-colors focus:outline-none p-1 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#5A5A55] hover:text-[#141413] transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#C8C8C3] text-[#141413] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#141413]"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[#8A8A85] hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-[#141413] hover:bg-[#2A2A28] active:scale-[0.99] text-white text-sm font-medium tracking-[0.02em] shadow-sm transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Log in"
                )}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-[#F4F4F2] hover:bg-[#EAEAE8] active:scale-[0.99] text-[#141413] text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2.5 border border-black/[0.04] cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Log in with Google</span>
              </button>
            </div>
          </form>

          {/* Understated Links and Labels */}
          <div className="text-center pt-2 text-xs text-[#8A8A85] space-y-1">
            <p>
              Protected curatorial platform •{" "}
              <a href="/" className="text-[#141413] hover:underline font-medium">
                Return to Gallery
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Assistance Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#EAEAE5] space-y-4">
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-normal text-[#141413]">
                Curatorial Access Recovery
              </h3>
              <p className="text-xs text-[#6E6E69] leading-relaxed">
                For administrative security, credential resets require verification through the studio security directory. Please contact your systems administrator or write to{" "}
                <a
                  href="mailto:security@erasstudio.com"
                  className="text-[#141413] font-medium underline"
                >
                  security@erasstudio.com
                </a>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-full bg-[#141413] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
