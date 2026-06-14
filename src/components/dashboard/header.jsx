"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Settings,
  LogOut,
  X,
  Camera,
  ChevronRight,
  Menu
} from "lucide-react";

export function DashboardHeader({
  userName,
  fullName,
  userEmail,
  userInitial,
  avatarUrl,
  showProfile,
  setShowProfile,
  profileRef,
  handleLogout,
  openModal,
  activeTool,
  setActiveView,
  activeView,
  fileInputRef,
  handleAvatarUpload,
  uploading,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-6 md:px-10 py-4 md:py-6 flex justify-between items-center z-30 bg-transparent sticky top-0"
    >
      <div className="flex items-center gap-4 md:gap-6">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-accent border border-border text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground line-clamp-1">
            Welcome back, {userName || "..."} <span className="inline-block animate-bounce">👋</span>
          </h2>
          <p className="text-xs md:text-sm mt-0.5 md:mt-1 font-medium text-muted-foreground line-clamp-1">
            {activeTool ? `Working on ${activeTool}` : "What would you like to work on today?"}
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        {/* View Toggle */}
        <div className="hidden md:flex items-center rounded-xl p-1 bg-accent border border-border">
          {["tools", "clients"].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${activeView === view
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden transition-all duration-300 bg-secondary border-2 border-border text-foreground hover:border-blue-400/40"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              userInitial || "?"
            )}
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-3 w-[calc(100vw-2rem)] sm:w-80 rounded-2xl shadow-2xl overflow-hidden bg-popover/90 backdrop-blur-2xl border border-border/50 z-50 origin-top-right"
              >
                {/* Profile Header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                      Profile
                    </span>
                    <button
                      onClick={() => setShowProfile(false)}
                      className="transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Avatar with upload */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold overflow-hidden bg-secondary border border-border text-foreground">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          userInitial || "?"
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5 text-white" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-foreground">
                        {fullName}
                      </p>
                      <p className="text-xs truncate mt-0.5 text-muted-foreground">
                        {userEmail}
                      </p>
                      <span className="inline-block mt-2 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => openModal("account")}
                    className="w-full px-3 py-2.5 flex items-center justify-between rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Account Details</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => openModal("email")}
                    className="w-full px-3 py-2.5 flex items-center justify-between rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email Preferences</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => openModal("settings")}
                    className="w-full px-3 py-2.5 flex items-center justify-between rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Logout */}
                <div className="p-2 border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
