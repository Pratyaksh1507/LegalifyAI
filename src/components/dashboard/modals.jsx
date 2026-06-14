"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Settings, 
  X, 
  Camera, 
  Upload, 
  Check, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  FileText 
} from "lucide-react";

export function DashboardModals({
  activeModal,
  setActiveModal,
  avatarUrl,
  userInitial,
  fullName,
  userEmail,
  userRole,
  showAvatarPicker,
  setShowAvatarPicker,
  editName,
  setEditName,
  saving,
  saveSuccess,
  handleSaveName,
  handleSelectAvatar,
  fileInputRef,
  PRESET_AVATARS,
  emailUpdates,
  setEmailUpdates,
  emailMarketing,
  setEmailMarketing,
  emailSecurity,
  setEmailSecurity
}) {
  return (
    <AnimatePresence>
      {activeModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setActiveModal(null)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-popover border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                {activeModal === "account" && (
                  <User className="w-5 h-5 text-blue-400" />
                )}
                {activeModal === "email" && (
                  <Mail className="w-5 h-5 text-blue-400" />
                )}
                {activeModal === "settings" && (
                  <Settings className="w-5 h-5 text-blue-400" />
                )}
                <h3 className="text-lg font-semibold text-foreground">
                  {activeModal === "account" && "Account Details"}
                  {activeModal === "email" && "Email Preferences"}
                  {activeModal === "settings" && "Settings"}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-accent rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* ═══════ Account Details Tab ═══════ */}
              {activeModal === "account" && (
                <div className="space-y-5">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-5">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground text-2xl font-bold overflow-hidden">
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
                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">{fullName}</p>
                      <p className="text-muted-foreground text-sm">{userEmail}</p>
                      <p className="text-muted-foreground text-xs mt-1 capitalize">
                        Role: {userRole}
                      </p>
                      <button
                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        className="text-blue-400 text-xs mt-1.5 hover:text-blue-300 transition-colors"
                      >
                        {showAvatarPicker ? "Hide avatars" : "Change avatar"}
                      </button>
                    </div>
                  </div>

                  {/* ═══════ Avatar Picker Grid ═══════ */}
                  <AnimatePresence>
                    {showAvatarPicker && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-secondary border border-border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                              Choose an avatar
                            </span>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Upload className="w-3 h-3" />
                              Upload
                            </button>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {PRESET_AVATARS.map((url, i) => (
                              <button
                                key={i}
                                onClick={() => handleSelectAvatar(url)}
                                className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                  avatarUrl === url
                                    ? "border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                    : "border-border hover:border-muted-foreground"
                                }`}
                              >
                                <img
                                  src={url}
                                  alt={`Avatar ${i + 1}`}
                                  className="w-full h-full object-cover bg-secondary"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="h-px bg-border" />

                  {/* Editable Name */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      readOnly
                      className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-lg text-muted-foreground text-sm cursor-not-allowed"
                    />

                    <p className="text-muted-foreground text-xs mt-1">
                      Email cannot be changed from here.
                    </p>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveName}
                    disabled={saving || editName === fullName}
                    className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      "Saving..."
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" /> Saved
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              )}

              {/* ═══════ Email Preferences Tab ═══════ */}
              {activeModal === "email" && (
                <div className="space-y-1">
                  {/* Toggle Row */}
                  {[
                    {
                      icon: Bell,
                      label: "Product Updates",
                      desc: "Get notified about new features and tools.",
                      value: emailUpdates,
                      setter: setEmailUpdates,
                    },
                    {
                      icon: Mail,
                      label: "Marketing Emails",
                      desc: "Tips, insights, and offers from Legalify.",
                      value: emailMarketing,
                      setter: setEmailMarketing,
                    },
                    {
                      icon: Shield,
                      label: "Security Alerts",
                      desc: "Login activity and password changes.",
                      value: emailSecurity,
                      setter: setEmailSecurity,
                    },
                  ].map((pref) => (
                    <div
                      key={pref.label}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center">
                          <pref.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            {pref.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{pref.desc}</p>
                        </div>
                      </div>
                      {/* Toggle Switch */}
                      <button
                        onClick={() => pref.setter(!pref.value)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          pref.value ? "bg-blue-500" : "bg-accent"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                            pref.value ? "left-5" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══════ Settings Tab ═══════ */}
              {activeModal === "settings" && (
                <div className="space-y-1">
                  {[
                    {
                      icon: Moon,
                      label: "Appearance",
                      desc: "Dark mode is always on.",
                      action: "Dark",
                    },
                    {
                      icon: Globe,
                      label: "Language",
                      desc: "Interface language preference.",
                      action: "English",
                    },
                    {
                      icon: Shield,
                      label: "Privacy",
                      desc: "Manage data and privacy settings.",
                      action: "Manage",
                    },
                    {
                      icon: FileText,
                      label: "Export Data",
                      desc: "Download all your session data.",
                      action: "Export",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border group-hover:border-muted-foreground/30 transition-colors">
                        {item.action}
                      </span>
                    </div>
                  ))}

                  <div className="h-px bg-border my-2" />

                  {/* Danger Zone */}
                  <div className="p-4 rounded-lg border border-red-500/10 bg-red-500/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-400 font-medium">
                          Delete Account
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Permanently remove your account and all data.
                        </p>
                      </div>
                      <button className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
