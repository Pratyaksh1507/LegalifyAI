"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  MoreVertical,
  Briefcase,
  Clock,
  Calendar,
  IndianRupee,
} from "lucide-react";

// Mock data
const mockClients = [
  {
    id: "1",
    name: "Acme Corp",
    type: "Corporate",
    status: "Active",
    email: "legal@acmecorp.com",
    phone: "+1 (555) 123-4567",
    activeCases: 3,
    lastContact: "2 hours ago",
    avatar:
      "https://api.dicebear.com/9.x/shapes/svg?seed=Acme&backgroundColor=3b82f6",
  },
  {
    id: "2",
    name: "Sarah Jenkins",
    type: "Individual",
    status: "Pending",
    email: "s.jenkins@example.com",
    phone: "+1 (555) 987-6543",
    activeCases: 1,
    lastContact: "1 day ago",
    avatar:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah&backgroundColor=10b981",
  },
  {
    id: "3",
    name: "Nexus Technologies",
    type: "Corporate",
    status: "Active",
    email: "contracts@nexus.io",
    phone: "+1 (555) 456-7890",
    activeCases: 5,
    lastContact: "3 days ago",
    avatar:
      "https://api.dicebear.com/9.x/shapes/svg?seed=Nexus&backgroundColor=8b5cf6",
  },
  {
    id: "4",
    name: "Global Logistics Ltd",
    type: "Corporate",
    status: "Inactive",
    email: "compliance@globallogistics.com",
    phone: "+44 20 7123 4567",
    activeCases: 0,
    lastContact: "2 weeks ago",
    avatar:
      "https://api.dicebear.com/9.x/shapes/svg?seed=Global&backgroundColor=64748b",
  },
  {
    id: "5",
    name: "David Chen",
    type: "Individual",
    status: "Active",
    email: "david.c@example.com",
    phone: "+1 (555) 222-3333",
    activeCases: 2,
    lastContact: "5 hours ago",
    avatar:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=David&backgroundColor=f59e0b",
  },
];

export function ClientsManager() {
  const [search, setSearch] = useState("");
  const [activeSidebarTab, setActiveSidebarTab] = useState("billing");

  const filteredClients = mockClients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-full mx-auto flex h-full z-10 relative">
      {/* ══════════ LEFT MAIN AREA ══════════ */}
      <div className="flex-1 flex flex-col px-6 lg:px-12 py-8 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10 mt-6 lg:mt-0">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight mb-2">
              Client Directory
            </h1>
            <p className="text-zinc-500 text-sm">
              Manage your active clients, cases, and communications.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group w-full md:w-64">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors z-10" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="relative w-full pl-10 pr-4 py-2.5 bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:bg-[rgba(255,255,255,0.05)] focus:ring-1 focus:ring-white/20 transition-all z-10"
              />
            </div>
            <button className="relative group px-4 py-2.5 bg-white text-black font-semibold rounded-xl text-sm flex items-center gap-2 hover:bg-zinc-200 transition-colors shrink-0">
              <div className="absolute inset-0 bg-white/50 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredClients.map((client, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                ease: "easeOut",
              }}
              key={client.id}
              className="group relative bg-[rgba(255,255,255,0.02)] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-[rgba(255,255,255,0.04)]"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <img
                    src={client.avatar}
                    alt={client.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-black"
                  />
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {client.type === "Corporate" ? (
                        <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                      ) : (
                        <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span className="text-xs text-zinc-500">
                        {client.type}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 relative z-10 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400">{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400">{client.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400">
                    Last contact: {client.lastContact}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      client.status === "Active"
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : client.status === "Pending"
                          ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                          : "bg-zinc-500"
                    }`}
                  />
                  <span className="text-xs font-medium text-zinc-400">
                    {client.status}
                  </span>
                </div>
                <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  {client.activeCases} Active Cases
                </span>
              </div>
            </motion.div>
          ))}

          {filteredClients.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-[rgba(255,255,255,0.01)]">
              <Building2 className="w-12 h-12 text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium text-zinc-300 mb-1">
                No clients found
              </h3>
              <p className="text-zinc-500 text-sm">
                Try adjusting your search query or add a new client.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ RIGHT SIDEBAR ══════════ */}
      <div className="w-80 shrink-0 border-l border-white/5 bg-black/20 backdrop-blur-xl flex flex-col p-6 h-full overflow-y-auto custom-scrollbar">
        {/* Tabs Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-8 border border-white/10">
          <button
            onClick={() => setActiveSidebarTab("deadlines")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSidebarTab === "deadlines"
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Deadlines
          </button>
          <button
            onClick={() => setActiveSidebarTab("billing")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSidebarTab === "billing"
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            Billing
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeSidebarTab === "billing" ? (
            <motion.div
              key="billing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {/* Billing Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <IndianRupee className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold">Billing</h3>
                </div>
                <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                  + Add
                </button>
              </div>

              {/* Billing Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] text-zinc-400 font-medium mb-1">
                    Total
                  </span>
                  <span className="text-sm text-white font-bold">₹0</span>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-shadow">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] text-amber-500/80 font-medium mb-1">
                    Outstanding
                  </span>
                  <span className="text-sm text-amber-500 font-bold">₹0</span>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-shadow">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] text-emerald-500/80 font-medium mb-1">
                    Paid
                  </span>
                  <span className="text-sm text-emerald-500 font-bold">₹0</span>
                </div>
              </div>

              {/* Empty State */}
              <div className="border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center mt-2 bg-[rgba(255,255,255,0.01)]">
                <IndianRupee className="w-8 h-8 text-zinc-600 mb-3" />
                <p className="text-zinc-500 text-xs">
                  No billing entries added yet.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="deadlines"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {/* Deadlines Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
                    <Calendar className="w-4 h-4 text-violet-400" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">
                    Upcoming Deadlines
                  </h3>
                </div>
                <button className="px-3 py-1 bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium rounded-lg transition-colors shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                  + Add
                </button>
              </div>

              {/* Deadlines Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_0_15px_rgba(239,68,68,0.05)] hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-shadow">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] text-red-500/80 font-medium mb-1">
                    Overdue
                  </span>
                  <span className="text-sm text-red-500 font-bold">0</span>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-shadow">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] text-amber-500/80 font-medium mb-1">
                    Due Soon
                  </span>
                  <span className="text-sm text-amber-500 font-bold">0</span>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_0_15px_rgba(59,130,246,0.05)] hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-shadow">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] text-blue-500/80 font-medium mb-1">
                    Upcoming
                  </span>
                  <span className="text-sm text-blue-500 font-bold">0</span>
                </div>
              </div>

              {/* Empty State */}
              <div className="border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center mt-2 bg-[rgba(255,255,255,0.01)]">
                <Calendar className="w-8 h-8 text-zinc-600 mb-3" />
                <p className="text-zinc-500 text-xs">No deadlines added yet.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
