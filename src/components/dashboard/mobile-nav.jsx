"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users } from "lucide-react";

export function MobileNav({ activeView, setActiveView, activeTool }) {
  return (
    <AnimatePresence>
      {!activeTool && (
        <motion.div
          initial={{ y: 56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 56, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-popover/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center justify-around h-14 px-4">
            <button
              onClick={() => setActiveView("tools")}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all min-h-[44px] ${
                activeView === "tools"
                  ? "text-blue-500"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-medium">Tools</span>
            </button>

            <button
              onClick={() => setActiveView("clients")}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all min-h-[44px] ${
                activeView === "clients"
                  ? "text-blue-500"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium">Clients</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
