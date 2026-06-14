"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  History,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Settings,
  HelpCircle,
  User,
  Mail,
  ChevronRight,
  X,
  Camera
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { formatTimeAgo, getIconForTool, normalizeToolName } from "@/lib/utils";



export function DashboardSidebar({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  theme,
  sessionSearch,
  setSessionSearch,
  filteredSessions,
  collapsedFlyout,
  setCollapsedFlyout,
  activeTool,
  activeView,
  setActiveView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  credits,
  creditsUsed,
  userRole,
}) {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* ─── Mobile Backdrop ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: windowWidth < 768 
            ? (isMobileMenuOpen ? 280 : 0) 
            : (isSidebarCollapsed ? 72 : 280),
          x: windowWidth < 768 
            ? (isMobileMenuOpen ? 0 : -280) 
            : 0,
          opacity: 1
        }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className={`h-screen flex flex-col z-[50] fixed md:relative shrink-0 transition-colors duration-500 bg-sidebar/60 backdrop-blur-xl border-r border-border pl-[env(safe-area-inset-left)]`}
      >
      <div className="flex-1 flex flex-col w-full h-full overflow-visible relative">
        {/* ─── Logo Header ─── */}
        <div className="relative group/logo-header">
          <div
            className={`flex items-center transition-all duration-400 ease-out ${isSidebarCollapsed ? "justify-center px-3 py-5" : "justify-between px-5 py-5"}`}
          >
            {/* Logo */}
            <Link
              href="/dashboard"
              className="relative flex items-center gap-3 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.04)] active:scale-95"
            >
              <motion.img
                src="/legalify-logo.png"
                alt="Legalify"
                className={`object-contain transition-all duration-300 ${isSidebarCollapsed ? "group-hover/logo-header:opacity-0" : ""}`}
                initial={{
                  width: isSidebarCollapsed ? 48 : 44,
                  height: isSidebarCollapsed ? 56 : 52,
                }}
                animate={{
                  width: isSidebarCollapsed ? 48 : 44,
                  height: isSidebarCollapsed ? 56 : 52,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  filter:
                    theme === "light"
                      ? "brightness(0) drop-shadow(0 0 4px rgba(0,0,0,0.05))"
                      : "drop-shadow(0 0 8px rgba(255,255,255,0.1))",
                }}
              />

              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  <span
                    className="text-[15px] font-bold tracking-tight text-foreground"
                  >
                    Legalify
                  </span>
                  <span
                    className="text-[10px] font-medium tracking-wide text-muted-foreground"
                  >
                    AI Legal Platform
                  </span>
                </motion.div>
              )}
            </Link>

               {/* Collapse / Expand Button */}
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed ? (
                  <motion.button
                    key="collapse-btn"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setIsSidebarCollapsed(true)}
                    aria-expanded={true}
                    aria-label="Collapse sidebar"
                    className="w-11 h-11 flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0 bg-accent border border-border hover:bg-accent/80 text-muted-foreground hover:text-foreground hidden md:flex"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    aria-expanded={false}
                    aria-label="Expand sidebar"
                    className="absolute inset-0 m-auto w-11 h-11 flex items-center justify-center rounded-xl backdrop-blur-sm transition-all duration-300 cursor-pointer z-20 opacity-0 group-hover/logo-header:opacity-100 md:opacity-0 md:group-hover/logo-header:opacity-100 scale-90 group-hover/logo-header:scale-100 bg-card/90 border border-border hover:bg-accent text-muted-foreground hover:text-foreground shadow-sm hidden md:flex"
                  >
                    <PanelLeftOpen className="w-4.5 h-4.5" />
                  </button>
                )}
              </AnimatePresence>

              {/* Mobile Close Button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg bg-accent border border-border text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* ─── Search (expanded inline) ─── */}
        <AnimatePresence>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pt-3 pb-1">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-blue-400 transition-colors z-10" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={sessionSearch || ""}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 rounded-lg text-base md:text-[13px] focus:outline-none transition-all relative z-10 bg-secondary border border-border text-foreground placeholder-muted-foreground focus:border-blue-400 focus:bg-card"
                  />

                  <kbd
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 rounded font-mono z-10 text-muted-foreground bg-accent border border-border"
                  >
                    ⌘K
                  </kbd>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Session History (expanded inline) ─── */}
        <AnimatePresence>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 custom-scrollbar"
            >
              <div className="flex items-center gap-2 px-2 py-2.5">
                <span
                  className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground"
                >
                  Recent Sessions
                </span>
              </div>
              {(!filteredSessions || filteredSessions.length === 0) ? (
                <div className="px-3 py-10 text-center flex flex-col items-center justify-center">
                  <History
                    className="w-7 h-7 mb-2 text-muted-foreground"
                  />
                  <p
                    className="text-xs text-muted-foreground"
                  >
                    No sessions found
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredSessions.map((session) => {
                    const toolName = normalizeToolName(session.tool);
                    return (
                      <button
                        key={session.id}
                        className="w-full py-3 px-3 flex items-center gap-2.5 rounded-lg text-left transition-all duration-200 group hover:bg-accent min-h-[44px]"
                      >
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-300 ${theme === "light"
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
                            <span
                              className={`text-[10px] font-medium ${theme === "light"
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
                                }`}
                            >
                              {toolName === "pdf chat" ? "pdf chat" : toolName === "draft" ? "draft" : toolName === "research" ? "research" : toolName === "review" ? "review" : toolName === "arguments" ? "arguments" : toolName}
                            </span>
                            <span
                              className="text-[10px] text-border"
                            >
                              ·
                            </span>
                            <span
                              className="text-[10px] text-muted-foreground"
                            >
                              {formatTimeAgo(session.time)}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Collapsed: Quick Action Icons ─── */}
        {isSidebarCollapsed && (
          <div className="flex flex-col items-center gap-1.5 px-3 pt-4">
            <button
              onClick={() =>
                setCollapsedFlyout(
                  collapsedFlyout === "search" ? null : "search",
                )
              }
              className={`w-11 h-11 flex items-center justify-center rounded-lg transition-all duration-200 group ${collapsedFlyout === "search"
                  ? "bg-blue-500/15 text-blue-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              aria-label="Search sessions"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setCollapsedFlyout(
                  collapsedFlyout === "history" ? null : "history",
                )
              }
              className={`w-11 h-11 flex items-center justify-center rounded-lg transition-all duration-200 group ${collapsedFlyout === "history"
                  ? "bg-blue-500/15 text-blue-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              aria-label="Recent sessions"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        )}
        {isSidebarCollapsed && <div className="flex-1" />}







        {/* ─── AI Credits ─── */}
        <div
          className={`border-t border-border ${isSidebarCollapsed ? "p-2.5" : "p-4"}`}
        >
          <div
            className={`rounded-xl relative overflow-hidden group bg-card border border-border ${isSidebarCollapsed
                ? "p-2.5 flex items-center justify-center"
                : "p-4"
              }`}
          >
            <div
              className={`flex items-center relative z-10 ${isSidebarCollapsed ? "justify-center" : "justify-between mb-3"}`}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className="text-[13px] font-semibold text-foreground"
                  >
                    AI Credits
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[11px] font-medium text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                  {credits === null ? "—" : `${credits - (creditsUsed ?? 0)} left`}
                </span>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="relative z-10">
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-1">
                  <motion.div
                    className={`h-full ${
                      credits !== null && (credits - (creditsUsed ?? 0)) <= 3
                        ? "bg-red-500"
                        : credits !== null && (credits - (creditsUsed ?? 0)) <= Math.ceil(credits * 0.25)
                          ? "bg-amber-500"
                          : "bg-blue-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: credits !== null && credits > 0
                        ? `${Math.max(0, ((credits - (creditsUsed ?? 0)) / credits) * 100)}%`
                        : "0%"
                    }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>
                    {userRole === "professional" ? "Professional Plan" : "Trial Account"}
                  </span>
                  <button className="hover:text-foreground hover:underline transition-colors">
                    Upgrade
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </motion.aside>
    </>
  );
}
