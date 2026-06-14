"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ToolSelector } from "@/components/tools/tool-selector";
import { ClientsManager } from "@/components/dashboard/clients-manager";
import { AIDrafting } from "@/components/tools/ai-drafting";
import { AIResearch } from "@/components/tools/ai-research";
import { AIReview } from "@/components/tools/ai-review";
import { AIPdfChat } from "@/components/tools/ai-pdf-chat";
import { CaseArguments } from "@/components/tools/case-arguments";
export function DashboardMain({ 
  activeView, 
  activeTool, 
  setActiveTool, 
  setActiveView,
  onSessionCreate 
}) {
  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden bg-transparent z-10 ${!activeTool ? "pb-[calc(56px+env(safe-area-inset-bottom))]" : ""} md:pb-0`}>
      {/* ═══════════ Main Content ═══════════ */}
      {activeView === "tools" ? (
        <motion.main
          key="tools-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 flex flex-col items-center justify-center px-8 py-12 z-10 min-h-0 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {!activeTool ? (
              <motion.div
                key="orbital"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full flex items-center justify-center"
              >
                <ToolSelector
                  onToolSelect={(id) => setActiveTool(id)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="w-full h-full flex flex-col overflow-hidden"
              >
                <button
                  onClick={() => setActiveTool(null)}
                  className="self-start mb-4 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="text-sm font-medium">Back to Tools</span>
                </button>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {activeTool === "draft" && <AIDrafting onSessionCreate={onSessionCreate} />}
                  {activeTool === "research" && <AIResearch onSessionCreate={onSessionCreate} />}
                  {activeTool === "review" && <AIReview onSessionCreate={onSessionCreate} />}
                  {activeTool === "pdf-chat" && <AIPdfChat onSessionCreate={onSessionCreate} />}
                  {activeTool === "arguments" && <CaseArguments onSessionCreate={onSessionCreate} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.main>
      ) : activeView === "clients" ? (
        <motion.main
          key="clients-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
        >
          <ClientsManager />
        </motion.main>
      ) : null}
    </div>
  );
}
