"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#FAF5EC] text-[#141413] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#FAF5EC] selection:text-[#865E16]">
      <div className="w-full max-w-md space-y-6">
        {/* Top Wordmark */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <span className="font-serif text-3xl font-normal tracking-tight text-[#141413]">
              Eras Studio
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
            <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#865E16] px-2.5 py-0.5 rounded-full bg-white border border-[#E8E8E3] shadow-soft-sm">
              Admin
            </span>
          </div>
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#865E16]">
            A Space for the Creative Spirit
          </p>
        </div>

        {/* Minimal Login Card */}
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-7 sm:p-9 shadow-soft-sm space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="font-serif text-xl font-normal text-[#141413]">Curatorial Sign In</h2>
            <p className="text-xs text-[#6E6E69] leading-relaxed">
              Enter administrative credentials to manage gallery roster, community operations, and curatorial workflows.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Admin username"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              disabled={isLoading}
              leftIcon={<User className="w-3.5 h-3.5 text-[#865E16]" />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              disabled={isLoading}
              leftIcon={<Lock className="w-3.5 h-3.5 text-[#865E16]" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#8A8A84] hover:text-[#141413] transition-colors focus:outline-none p-1 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              required
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#141413] hover:bg-[#2A2A28] text-white text-xs font-medium tracking-[0.08em] uppercase transition-all shadow-soft-sm disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Enter Studio"}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-[#8A8A85]">
          <span>Protected curatorial platform • </span>
          <span className="text-[#865E16] font-medium">Eras Studio</span>
        </div>
      </div>
    </div>
  );
}
