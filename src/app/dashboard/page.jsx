"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardMain } from "@/components/dashboard/main";
import { DashboardModals } from "@/components/dashboard/modals";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { supabase } from "@/lib/supabase";
import { Network, FileText, MessageSquare, Scale, Sun, Moon, Search, History, PanelLeftClose } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { formatTimeAgo, getIconForTool, normalizeToolName } from "@/lib/utils";

// 20 preset avatars using DiceBear API with diverse styles
const PRESET_AVATARS = [
  // Adventurer style
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Leo&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Aria&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Max&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Luna&backgroundColor=c0aede",
  // Avataaars style
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Maya&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Oscar&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Zoe&backgroundColor=c0aede",
  // Lorelei style
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Jack&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Ivy&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Sam&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Mia&backgroundColor=c0aede",
  // Notionists style
  "https://api.dicebear.com/9.x/notionists/svg?seed=Kai&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Noa&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Raj&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Ava&backgroundColor=c0aede",
  // Fun Emoji style
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Happy&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Cool&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Star&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Wink&backgroundColor=c0aede",
];


export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userInitial, setUserInitial] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const profileRef = useRef(null);
  const fileInputRef = useRef(null);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sidebar
  const [sessionSearch, setSessionSearch] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [collapsedFlyout, setCollapsedFlyout] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Credits
  const [credits, setCredits] = useState(null);
  const [creditsUsed, setCreditsUsed] = useState(null);

  const fetchCredits = React.useCallback(async (token) => {
    try {
      const res = await fetch("/api/user/quota", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setCreditsUsed(data.credits_used);
      }
    } catch (err) {
      console.error("[Dashboard] Failed to fetch credits:", err);
    }
  }, []);

  // Track window width for responsive flyout
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Views
  const [activeView, setActiveView] = useState("tools");
  const [activeTool, setActiveTool] = useState(null);

  // Email preferences
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [emailSecurity, setEmailSecurity] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      // getSession automatically parses the URL hash on OAuth redirects
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const user = session.user;
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User";
        if (mounted) {
          setFullName(name);
          setEditName(name);
          setUserName(name.split(" ")[0]);
          setUserInitial(name.charAt(0).toUpperCase());
          setUserEmail(user.email || "");
          setAvatarUrl(user.user_metadata?.avatar_url || "");
          setUserRole(user.user_metadata?.role || "user");
          
          if (session.access_token) {
            fetchCredits(session.access_token);
          }
        }
      } else {
        // If no session and no access_token in URL hash, redirect to login
        if (mounted && !window.location.hash.includes("access_token")) {
          router.push("/login");
        }
      }
    };

    checkAuth();

    // Listen for auth state changes (e.g., when hash is parsed and user is signed in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkAuth();
      } else if (event === "SIGNED_OUT") {
        if (mounted) router.push("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, fetchCredits]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: { full_name: editName },
      });
      setFullName(editName);
      setUserName(editName.split(" ")[0]);
      setUserInitial(editName.charAt(0).toUpperCase());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const openModal = (tab) => {
    setShowProfile(false);
    setActiveModal(tab);
  };

  const handleSelectAvatar = async (url) => {
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: url },
      });
      setAvatarUrl(url);
      setShowAvatarPicker(false);
    } catch (err) {
      console.error("Avatar update failed:", err);
    }
  };

  // Session history state
  const [sessions, setSessions] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("legalify-sessions");
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse sessions from localStorage");
      }
    }
  }, []);

  const [refresh, setRefresh] = useState(0);

  // Trigger a re-render every minute to update relative time strings
  useEffect(() => {
    const interval = setInterval(() => {
      setRefresh((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Create new session helper
  const handleSessionCreate = React.useCallback(async (title, tool) => {
    setSessions(prev => {
      const newSession = {
        id: `s-${Date.now()}`,
        title,
        tool,
        time: new Date().toISOString(),
      };

      const updated = [newSession, ...prev].slice(0, 50); // Keep max 50 sessions
      localStorage.setItem("legalify-sessions", JSON.stringify(updated));
      return updated;
    });

    // Refresh credits after each tool usage
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      fetchCredits(session.access_token);
    }
  }, [fetchCredits]);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(sessionSearch.toLowerCase()),
  );

  return (
    <div
      className="h-screen flex relative overflow-hidden transition-colors duration-500 bg-black"
    >
      {/* ═══════════════════════════════════════ */}
      {/* ═══════════ SHARED BACKGROUND ═════════ */}
      {/* ═══════════════════════════════════════ */}
      {/* Fading Background grid dots */}
      <div
        className={`absolute inset-0 pointer-events-none z-0 ${theme === "light" ? "opacity-[0.02]" : "opacity-[0.05]"}`}
        style={{
          backgroundImage:
            theme === "light"
              ? "radial-gradient(circle, black 1px, transparent 1px)"
              : "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(circle at center, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black, transparent 80%)",
        }}
      />

      {/* Animated Ambient background glows */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      // className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.8, 1.2, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      //className="absolute top-1/3 right-10 w-[600px] h-[600px] bg-violet-500/10 blur-[150px] rounded-full pointer-events-none z-0"
      />

      {/* ═══════════════════════════════════════ */}
      {/* ═══════════ SIDEBAR ═══════════════════ */}
      {/* ═══════════════════════════════════════ */}
      <DashboardSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        theme={theme}
        sessionSearch={sessionSearch}
        setSessionSearch={setSessionSearch}
        filteredSessions={filteredSessions}
        collapsedFlyout={collapsedFlyout}
        setCollapsedFlyout={setCollapsedFlyout}
        activeTool={activeTool}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        credits={credits}
        creditsUsed={creditsUsed}
        userRole={userRole}
      />

      {/* ═══════════ Collapsed Flyout Panels ═══════════ */}
      <AnimatePresence>
        {isSidebarCollapsed && collapsedFlyout && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
              onClick={() => setCollapsedFlyout(null)}
            />

            {/* Flyout Panel */}
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className={`fixed top-0 bottom-0 ${windowWidth < 768 ? "left-[280px] w-[calc(100vw-280px)]" : "left-[80px] w-[280px]"} bg-popover/95 backdrop-blur-xl border-r border-border z-50 flex flex-col shadow-2xl`}
            >
              {/* Flyout Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  {collapsedFlyout === "search" ? (
                    <Search className="w-4 h-4 text-blue-400" />
                  ) : (
                    <History className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-sm font-semibold text-foreground">
                    {collapsedFlyout === "search"
                      ? "Search"
                      : "Recent Sessions"}
                  </span>
                </div>
                <button
                  onClick={() => setCollapsedFlyout(null)}
                  className="w-11 h-11 flex items-center justify-center rounded-lg bg-accent border border-border text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Flyout Content */}
              {collapsedFlyout === "search" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-4 pt-4 pb-3">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors z-10" />
                      <input
                        type="text"
                        placeholder="Search sessions..."
                        value={sessionSearch}
                        onChange={(e) => setSessionSearch(e.target.value)}
                        autoFocus
                        className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground text-base md:text-sm placeholder-muted-foreground focus:outline-none focus:border-blue-500/30 focus:bg-card focus:ring-1 focus:ring-blue-500/20 transition-all relative z-10"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
                    {filteredSessions.length === 0 ? (
                      <div className="px-3 py-10 text-center flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground text-sm">No results</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredSessions.map((session) => {
                          const toolName = normalizeToolName(session.tool);
                          return (
                            <button
                              key={session.id}
                              className="w-full py-3 px-3 flex items-center gap-3 rounded-xl text-left hover:bg-accent border border-transparent hover:border-border transition-all duration-200 group min-h-[44px]"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${theme === "light"
                                    ? toolName === "draft"
                                      ? "bg-blue-100 text-blue-700 group-hover:bg-blue-200"
                                      : toolName === "review"
                                        ? "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200"
                                        : toolName === "research"
                                          ? "bg-violet-100 text-violet-700 group-hover:bg-violet-200"
                                          : toolName === "pdf chat"
                                            ? "bg-rose-100 text-rose-700 group-hover:bg-rose-200"
                                            : "bg-amber-100 text-amber-700 group-hover:bg-amber-200"
                                    : toolName === "draft"
                                      ? "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20"
                                      : toolName === "review"
                                        ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20"
                                        : toolName === "research"
                                          ? "bg-violet-500/10 text-violet-500 group-hover:bg-violet-500/20"
                                          : toolName === "pdf chat"
                                            ? "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20"
                                            : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"
                                  }`}
                              >
                                {(() => {
                                  const Icon = getIconForTool(toolName);
                                  return <Icon className="w-3.5 h-3.5" />;
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-[13px] font-medium truncate transition-colors text-foreground/70 group-hover:text-foreground"
                                >
                                  {session.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[10px] font-medium ${theme === "light"
                                      ? toolName === "draft"
                                        ? "text-blue-700"
                                        : toolName === "review"
                                          ? "text-emerald-700"
                                          : toolName === "research"
                                            ? "text-violet-700"
                                            : toolName === "pdf chat"
                                              ? "text-rose-700"
                                              : "text-amber-700"
                                      : toolName === "draft"
                                        ? "text-blue-500"
                                        : toolName === "review"
                                          ? "text-emerald-500"
                                          : toolName === "research"
                                            ? "text-violet-500"
                                            : toolName === "pdf chat"
                                              ? "text-rose-500"
                                              : "text-amber-500"
                                    }`}>
                                    {toolName === "pdf chat" ? "pdf chat" : toolName === "draft" ? "draft" : toolName === "research" ? "research" : toolName === "review" ? "review" : toolName === "arguments" ? "arguments" : toolName}
                                  </span>
                                  <span className="text-[10px] text-border">
                                    ·
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatTimeAgo(session.time)}
                                  </span>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {collapsedFlyout === "history" && (
                <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
                  {filteredSessions.length === 0 ? (
                    <div className="px-3 py-10 text-center flex flex-col items-center justify-center">
                      <History className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-sm">No sessions found</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {filteredSessions.map((session) => {
                        const toolName = normalizeToolName(session.tool);
                        return (
                          <button
                            key={session.id}
                            className="w-full py-3 px-3 flex items-center gap-3 rounded-xl text-left hover:bg-accent border border-transparent hover:border-border transition-all duration-200 group min-h-[44px]"
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${theme === "light"
                                  ? toolName === "draft"
                                    ? "bg-blue-100 text-blue-700 group-hover:bg-blue-200"
                                    : toolName === "review"
                                      ? "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200"
                                      : toolName === "research"
                                        ? "bg-violet-100 text-violet-700 group-hover:bg-violet-200"
                                        : toolName === "pdf chat"
                                          ? "bg-rose-100 text-rose-700 group-hover:bg-rose-200"
                                          : "bg-amber-100 text-amber-700 group-hover:bg-amber-200"
                                  : toolName === "draft"
                                    ? "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20"
                                    : toolName === "review"
                                      ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20"
                                      : toolName === "research"
                                        ? "bg-violet-500/10 text-violet-500 group-hover:bg-violet-500/20"
                                        : toolName === "pdf chat"
                                          ? "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20"
                                          : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"
                                }`}
                            >
                              {(() => {
                                const Icon = getIconForTool(toolName);
                                return <Icon className="w-3.5 h-3.5" />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[13px] font-medium truncate transition-colors text-foreground/70 group-hover:text-foreground"
                              >
                                {session.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] font-medium ${theme === "light"
                                    ? toolName === "draft"
                                      ? "text-blue-700"
                                      : toolName === "review"
                                        ? "text-emerald-700"
                                        : toolName === "research"
                                          ? "text-violet-700"
                                          : toolName === "pdf chat"
                                            ? "text-rose-700"
                                            : "text-amber-700"
                                    : toolName === "draft"
                                      ? "text-blue-500"
                                      : toolName === "review"
                                        ? "text-emerald-500"
                                        : toolName === "research"
                                          ? "text-violet-500"
                                          : toolName === "pdf chat"
                                            ? "text-rose-500"
                                            : "text-amber-500"
                                  }`}>
                                  {toolName === "pdf chat" ? "pdf chat" : toolName === "draft" ? "draft" : toolName === "research" ? "research" : toolName === "review" ? "review" : toolName === "arguments" ? "arguments" : toolName}
                                </span>
                                <span className="text-[10px] text-border">
                                  ·
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatTimeAgo(session.time)}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════ */}
      {/* ═══════════ MAIN CONTENT AREA ═════════ */}
      {/* ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent z-10">
        {/* ═══════════ Header ═══════════ */}
        {!activeTool && (
          <DashboardHeader
            userName={userName}
            fullName={fullName}
            userEmail={userEmail}
            userInitial={userInitial}
            avatarUrl={avatarUrl}
            userRole={userRole}
            showProfile={showProfile}
            setShowProfile={setShowProfile}
            profileRef={profileRef}
            handleLogout={handleLogout}
            openModal={openModal}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            setActiveView={setActiveView}
            activeView={activeView}
            fileInputRef={fileInputRef}
            handleAvatarUpload={handleAvatarUpload}
            uploading={uploading}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        )}

        {/* ═══════════ Main Content ═══════════ */}
        <DashboardMain
          activeView={activeView}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          setActiveView={setActiveView}
          onSessionCreate={handleSessionCreate}
        />

      </div>
      {/* Close main content area */}

      {/* ═══════════════════════════════════════════ */}
      {/* ═══════════ SETTINGS MODAL ═══════════════ */}
      {/* ═══════════════════════════════════════════ */}
      {/* ═══════════ Modals ═══════════ */}
      <DashboardModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        avatarUrl={avatarUrl}
        userInitial={userInitial}
        fullName={fullName}
        userEmail={userEmail}
        userRole={userRole}
        showAvatarPicker={showAvatarPicker}
        setShowAvatarPicker={setShowAvatarPicker}
        editName={editName}
        setEditName={setEditName}
        saving={saving}
        saveSuccess={saveSuccess}
        handleSaveName={handleSaveName}
        handleSelectAvatar={handleSelectAvatar}
        fileInputRef={fileInputRef}
        PRESET_AVATARS={PRESET_AVATARS}
        emailUpdates={emailUpdates}
        setEmailUpdates={setEmailUpdates}
        emailMarketing={emailMarketing}
        setEmailMarketing={setEmailMarketing}
        emailSecurity={emailSecurity}
        setEmailSecurity={setEmailSecurity}
      />
      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeView={activeView}
        setActiveView={setActiveView}
        activeTool={activeTool}
      />
    </div>
  );
}
