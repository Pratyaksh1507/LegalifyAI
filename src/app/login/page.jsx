"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Crown,
  Users,
  Zap,
  FileText,
  Shield,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("user");
  const [mode, setMode] = useState("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firmName, setFirmName] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: { role },
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role,
              ...(role === "professional" && firmName
                ? { firm_name: firmName }
                : {}),
            },
          },
        });
        if (error) throw error;
        if (data?.session) {
          router.push("/dashboard");
        } else {
          setError("Check your email for a confirmation link!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const isPro = role === "professional";

  // Pro features list for the right panel
  const proFeatures = [
    {
      icon: Users,
      title: "Client Management",
      desc: "Full CRM to track clients, matters & billing",
    },
    {
      icon: FileText,
      title: "Unlimited Drafting",
      desc: "Generate contracts & notices without limits",
    },
    {
      icon: Zap,
      title: "Priority AI Engine",
      desc: "Faster responses with dedicated compute",
    },
    {
      icon: Shield,
      title: "Privileged Workspace",
      desc: "End-to-end encrypted attorney-client space",
    },
  ];

  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    // Check if user is already signed in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && active) {
        router.push("/dashboard");
      }
    };

    checkSession();

    const timer = setTimeout(() => {
      if (active) {
        setMounted(true);
      }
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [router]);

  const isLight = mounted && theme === "light";

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: isLight ? '#ffffff' : '#050507' }}
    >
      {/* ═══════════ LEFT PANEL — Auth Form ═══════════ */}
      <div
        className="w-full lg:w-[520px] min-h-screen flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden"
        style={{
          background: isLight ? '#ffffff' : '#050507',
          borderRight: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Subtle pro glow when professional selected */}
        <AnimatePresence>
          {isPro && (
            <motion.div
              key="pro-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 20% 0%, rgba(245,158,11,0.06) 0%, transparent 60%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Top: Back link */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm transition-colors group"
            style={{ color: isLight ? '#888' : 'rgba(255,255,255,0.4)' }}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </Link>
        </div>

        {/* Middle: Auth Content */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Pro Badge Banner */}
              <AnimatePresence>
                {isPro && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/8 border border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-amber-300 leading-tight">
                          Professional Account
                        </p>
                        <p className="text-[10px] text-amber-400/60 mt-0.5">
                          Full access to Clients CRM & Priority AI
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full tracking-wider">
                        PRO
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Heading */}
              <h1
                className="text-[28px] font-bold mb-1.5 tracking-[-0.02em]"
                style={{ color: isLight ? '#111' : '#f5f5f5' }}
              >
                {mode === "signin" ? "Welcome back" : "Create an account"}
              </h1>
              <p
                className="text-sm mb-8"
                style={{ color: isLight ? '#888' : 'rgba(255,255,255,0.4)' }}
              >
                {mode === "signin"
                  ? isPro
                    ? "Sign in to your professional workspace"
                    : "Sign in to continue to Legalify"
                  : isPro
                    ? "Join Legalify as a verified legal professional"
                    : "Get started with Legalify for free"}
              </p>

              {/* Google SSO — Premium Surface */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-70 group"
                style={{
                  background: isLight ? '#f5f5f5' : 'rgba(255,255,255,0.06)',
                  border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                  color: isLight ? '#222' : '#e5e5e5',
                  boxShadow: isLight
                    ? '0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                    : '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-medium">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-7">
                <div
                  className="flex-1 h-px"
                  style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }}
                />
                <span
                  className="text-[11px] uppercase tracking-widest font-medium"
                  style={{ color: isLight ? '#bbb' : 'rgba(255,255,255,0.2)' }}
                >
                  or
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }}
                />
              </div>

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-5">
                {mode === "signup" && (
                  <div>
                    <label
                      className="block text-[11px] font-semibold mb-2 uppercase tracking-[0.1em]"
                      style={{ color: isLight ? '#999' : 'rgba(255,255,255,0.35)' }}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                      style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                        color: isLight ? '#111' : '#f5f5f5',
                      }}
                    />
                  </div>
                )}

                {/* Professional-only: Firm / Practice Area */}
                <AnimatePresence>
                  {isPro && mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs font-medium text-amber-400/80 mb-1.5 uppercase tracking-wider">
                        Firm / Practice Area
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                        <input
                          type="text"
                          value={firmName}
                          onChange={(e) => setFirmName(e.target.value)}
                          placeholder="Sharma & Associates, Corporate Law..."
                          className="w-full pl-10 pr-3.5 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/30 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label
                    className="block text-[11px] font-semibold mb-2 uppercase tracking-[0.1em]"
                    style={{ color: isLight ? '#999' : 'rgba(255,255,255,0.35)' }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                    style={{
                      background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                      color: isLight ? '#111' : '#f5f5f5',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[11px] font-semibold mb-2 uppercase tracking-[0.1em]"
                    style={{ color: isLight ? '#999' : 'rgba(255,255,255,0.35)' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl text-sm pr-11 transition-all duration-200 focus:outline-none"
                      style={{
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                        color: isLight ? '#111' : '#f5f5f5',
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: isLight ? '#bbb' : 'rgba(255,255,255,0.25)' }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {mode === "signin" && (
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        className="text-xs font-medium transition-colors"
                        style={{ color: isLight ? '#999' : 'rgba(255,255,255,0.35)' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Role Selector — Pill Segmented Control ── */}
                <div>
                  <label
                    className="block text-[11px] font-semibold mb-2 uppercase tracking-[0.1em]"
                    style={{ color: isLight ? '#999' : 'rgba(255,255,255,0.35)' }}
                  >
                    I am a
                  </label>
                  <div
                    className="relative flex p-1 rounded-xl"
                    style={{
                      background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                      border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Sliding highlight */}
                    <motion.div
                      className="absolute top-1 bottom-1 rounded-lg"
                      animate={{
                        left: role === 'user' ? '4px' : '50%',
                        width: 'calc(50% - 6px)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{
                        background: isPro
                          ? 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(234,179,8,0.12) 100%)'
                          : isLight ? '#fff' : 'rgba(255,255,255,0.08)',
                        border: isPro
                          ? '1px solid rgba(245,158,11,0.3)'
                          : isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isPro
                          ? '0 0 16px rgba(245,158,11,0.15)'
                          : isLight ? '0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                    {/* User Button */}
                    <button
                      id="role-user"
                      type="button"
                      onClick={() => setRole("user")}
                      className="flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200"
                      style={{
                        color: role === 'user'
                          ? (isLight ? '#111' : '#f5f5f5')
                          : (isLight ? '#999' : 'rgba(255,255,255,0.35)'),
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      User
                    </button>

                    {/* Professional Button */}
                    <button
                      id="role-professional"
                      type="button"
                      onClick={() => setRole("professional")}
                      className="flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200"
                      style={{
                        color: isPro ? '#f59e0b' : (isLight ? '#999' : 'rgba(255,255,255,0.35)'),
                      }}
                    >
                      <Crown
                        className="w-4 h-4 transition-colors"
                        style={{ color: isPro ? '#fbbf24' : (isLight ? '#ccc' : 'rgba(255,255,255,0.25)') }}
                      />
                      Professional
                      {isPro && (
                        <span
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded-full tracking-wider leading-none"
                          style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}
                        >
                          PRO
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error / Success */}
                {error && (
                  <p
                    className={`text-xs text-center py-2 px-3 rounded-lg ${
                      error.includes("Check your email")
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-70"
                  style={
                    isPro
                      ? {
                          background: 'linear-gradient(135deg, #f59e0b, #eab308)',
                          color: '#000',
                          boxShadow: '0 0 24px rgba(245,158,11,0.3)',
                        }
                      : {
                          background: isLight ? '#111' : '#f5f5f5',
                          color: isLight ? '#fff' : '#111',
                          boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(255,255,255,0.05)',
                        }
                  }
                >
                  {isLoading
                    ? "Please wait..."
                    : mode === "signin"
                      ? isPro
                        ? "Sign In to Pro Workspace →"
                        : "Sign In"
                      : isPro
                        ? "Create Pro Account →"
                        : "Create Account"}
                </button>
              </form>

              {/* Toggle sign in / sign up */}
              <p
                className="text-sm text-center mt-6"
                style={{ color: isLight ? '#999' : 'rgba(255,255,255,0.4)' }}
              >
                {mode === "signin" ? (
                  <>
                    No account?{" "}
                    <button
                      onClick={() => {
                        setMode("signup");
                        setError("");
                      }}
                      className="font-medium hover:underline"
                      style={{ color: isPro ? '#f59e0b' : (isLight ? '#111' : '#f5f5f5') }}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("signin");
                        setError("");
                      }}
                      className="font-medium hover:underline"
                      style={{ color: isPro ? '#f59e0b' : (isLight ? '#111' : '#f5f5f5') }}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: Legal */}
        <p
          className="text-[11px] text-center relative z-10"
          style={{ color: isLight ? '#bbb' : 'rgba(255,255,255,0.2)' }}
        >
          By continuing, you agree to our{" "}
          <Link
            href="#"
            className="underline transition-colors"
            style={{ color: isLight ? '#999' : 'rgba(255,255,255,0.35)' }}
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="#"
            className="underline transition-colors"
            style={{ color: isLight ? '#999' : 'rgba(255,255,255,0.35)' }}
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* ═══════════ RIGHT PANEL — Brand / Pro Features ═══════════ */}
      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: isLight ? '#f8f9fb' : '#0a0a0f' }}
      >
        {/* Multi-layered ambient glow orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[20%] w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: isLight ? 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[15%] w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{ background: isLight ? 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-[50%] right-[30%] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: isLight ? 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: isLight
              ? "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Decorative gradient border left edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-px"
          style={{ background: isLight ? 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.06), transparent)' : 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.06), transparent)' }}
        />

        <AnimatePresence mode="wait">
          {!isPro ? (
            /* ── Default Brand Panel ── */
            <motion.div
              key="brand-panel"
              initial={{ opacity: 0, x: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -30, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative z-10 max-w-lg text-center px-8"
            >
              {/* Logo with animated float */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-[98px] h-[98px] rounded-3xl flex items-center justify-center mx-auto mb-12 relative overflow-hidden"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)',
                  border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isLight
                    ? '0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.04)'
                    : '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Symbol scaled down for better padding within the frame */}
                <img
                  src="/legalify-orbit-center.png"
                  alt="Legalify"
                  className="w-full h-full object-contain scale-[1.2]"
                  style={{ filter: 'drop-shadow(0 4px 12px rgba(59,130,246,0.3))' }}
                />
              </motion.div>

              <h2
                className="text-[2.75rem] font-bold mb-5 tracking-[-0.03em] leading-[1.1]"
                style={{ color: isLight ? '#111' : '#f5f5f5' }}
              >
                Legal work,
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: isLight
                      ? 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)'
                      : 'linear-gradient(135deg, #60a5fa, #a78bfa, #22d3ee)',
                    backgroundSize: '200% 200%',
                    animation: 'gradientShift 4s ease infinite',
                  }}
                >
                  reimagined.
                </span>
              </h2>
              <p
                className="text-[15px] leading-relaxed mb-12 max-w-sm mx-auto"
                style={{ color: isLight ? '#666' : 'rgba(255,255,255,0.5)' }}
              >
                Draft contracts, review documents, and research case law — all
                powered by AI that understands the law.
              </p>

              {/* Glassmorphic Trust indicators */}
              <div
                className="flex items-center justify-center gap-0 rounded-2xl overflow-hidden"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.03)',
                  border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: isLight
                    ? '0 4px 24px rgba(0,0,0,0.06)'
                    : '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                {[
                  { value: "5", label: "AI Tools" },
                  { value: "10x", label: "Faster" },
                  { value: "24/7", label: "Available" },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className="flex-1 text-center py-5"
                    style={i > 0 ? { borderLeft: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' } : {}}
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ color: isLight ? '#111' : '#f5f5f5' }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className="text-[10px] mt-1 uppercase tracking-[0.15em] font-medium"
                      style={{ color: isLight ? '#999' : 'rgba(255,255,255,0.35)' }}
                    >
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ── Pro Features Panel ── */
            <motion.div
              key="pro-panel"
              initial={{ opacity: 0, x: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -30, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative z-10 max-w-md w-full px-8"
            >
              {/* Amber ambient glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/[0.05] blur-[160px] rounded-full pointer-events-none" />

              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/25 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                >
                  <Crown className="w-5 h-5 text-amber-400" />
                </motion.div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400/80 uppercase">
                  Professional Plan
                </span>
              </div>

              <h2
                className="text-3xl font-bold mb-2 tracking-tight leading-[1.2] text-foreground"
              >
                Built for legal
                <br />
                <span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
                >
                  professionals.
                </span>
              </h2>
              <p
                className="text-sm leading-relaxed mb-8 text-muted-foreground"
              >
                Everything in the free plan, plus a full practice management
                suite built for lawyers and firms.
              </p>

              <div className="space-y-2.5 mb-8">
                {proFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className="flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300 group bg-card border-border hover:border-amber-500/40 hover:bg-amber-500/5"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20"
                    >
                      <feature.icon
                        className="w-4 h-4 text-amber-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] font-semibold leading-tight text-foreground"
                      >
                        {feature.title}
                      </p>
                      <p
                        className="text-[11px] mt-0.5 text-muted-foreground"
                      >
                        {feature.desc}
                      </p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 transition-all shrink-0 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5"
                    />
                  </motion.div>
                ))}
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-xl border bg-card border-border"
              >
                <div className="flex -space-x-2">
                  {[
                    "bg-violet-500",
                    "bg-blue-500",
                    "bg-emerald-500",
                    "bg-rose-500",
                  ].map((color, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full ${color} border-2 flex items-center justify-center text-[10px] font-bold text-white border-background`}
                    >
                      {["A", "R", "S", "M"][i]}
                    </div>
                  ))}
                </div>
                <p
                  className="text-xs text-muted-foreground"
                >
                  <span
                    className="font-semibold text-foreground"
                  >
                    2,400+
                  </span>{" "}
                  legal professionals trust Legalify
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
