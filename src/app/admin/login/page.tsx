"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load remembered admin username/email
  useEffect(() => {
    try {
      const saved = localStorage.getItem("eras_remembered_admin");
      if (saved) {
        setUsername(saved);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both email/username and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Save or clear remembered admin username/email
      try {
        if (rememberMe) {
          localStorage.setItem("eras_remembered_admin", username.trim());
        } else {
          localStorage.removeItem("eras_remembered_admin");
        }
      } catch {
        // Ignore localStorage access errors
      }

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

      // Success: redirect to admin dashboard
      router.push("/admin/overview");
      router.refresh();
    } catch (err) {
      console.error("Login submission error:", err);
      setError("Unable to connect to authentication service. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-scope min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12 selection:bg-[#000000] selection:text-white">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        {/* Left Column: Artwork Card */}
        <div className="relative w-full aspect-[4/5] max-h-[580px] md:max-h-[640px] rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-neutral-900 select-none">
          <Image
            src="/images/blue-lily-artwork.jpg"
            alt="Blue Lily Botanical Art"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />

          {/* Floating Pill Badge: matching reference screenshot */}
          <div className="absolute bottom-6 left-6 z-10 bg-white border border-[#C7C7C7] px-4 py-1.5 sm:px-5 sm:py-2 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center">
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: "#323232",
                fontWeight: 500,
              }}
              className="text-[10px] sm:text-[11px] uppercase tracking-wider"
            >
              BLUE LILY BOTANICAL ART
            </span>
          </div>
        </div>

        {/* Right Column: Sign In Form & Brand */}
        <div className="w-full max-w-[390px] mx-auto flex flex-col justify-center">
          
          {/* Brand Header: ERAS */}
          <div className="text-center mb-6 flex justify-center">
            <Image
              src="/images/eras-logo.png"
              alt="ERAS"
              width={140}
              height={35}
              className="h-7 w-auto object-contain select-none"
              priority
            />
          </div>

          {/* Main Titles: Welcome Back & Admin Console */}
          <div className="text-center mb-8">
            <h1
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: "#000000",
                fontWeight: 500,
              }}
              className="text-3xl sm:text-[34px] tracking-tight leading-tight"
            >
              Welcome Back
            </h1>
            <p
              style={{
                fontFamily: "'Century Schoolbook', 'Playfair Display', Georgia, serif",
                color: "rgba(79.69, 79.69, 79.69, 0.75)",
                fontStyle: "italic",
                fontWeight: 700,
              }}
              className="text-2xl sm:text-[28px] mt-0.5"
            >
              Admin Console
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs flex items-start gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email / Username Field */}
            <div>
              <label
                htmlFor="username"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: "#929292",
                  fontWeight: 500,
                }}
                className="block text-xs mb-1 select-none"
              >
                Email
              </label>
              <input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: "#343434",
                }}
                className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-2 outline-none transition-colors"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: "#929292",
                  fontWeight: 500,
                }}
                className="block text-xs mb-1 select-none"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: "#343434",
                  }}
                  className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-2 pr-8 outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-2 text-[#343434] hover:text-black transition-colors cursor-pointer p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border border-[#CBCBCB] text-[#181A1F] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#181A1F]"
                />
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: "#929292",
                    fontWeight: 500,
                  }}
                  className="text-xs"
                >
                  Remember me
                </span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  setError("Admin password reset is managed by system administrators. Please contact your lead curator.");
                }}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: "#BDBDBD",
                  fontWeight: 500,
                }}
                className="text-xs hover:text-[#343434] transition-colors cursor-pointer"
              >
                Forgot password?
              </a>
            </div>

            {/* Primary Log In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: "#181A1F",
                  borderRadius: 9999,
                  fontFamily: "'Poppins', sans-serif",
                  color: "white",
                  fontWeight: 500,
                }}
                className="w-full h-11 sm:h-12 hover:bg-black active:scale-[0.99] text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Log in</span>
                )}
              </button>
            </div>
          </form>

          {/* Understated Return Link */}
          <div className="text-center pt-6 text-xs text-[#8A8A85]">
            <Link
              href="/"
              className="text-[#8A8A85] hover:text-[#141413] transition-colors inline-flex items-center gap-1 font-medium"
            >
              <span>← Return to Gallery</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
