"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";

export function FloatingThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`absolute top-6 right-6 md:top-8 md:right-8 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-md ${
        theme === "light"
          ? "bg-white/80 border border-black/[0.08] text-zinc-800 hover:bg-white"
          : "bg-zinc-900/80 border border-white/10 text-white hover:bg-zinc-800"
      } ${className}`}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 w-full h-full transition-all duration-300 ${
            theme === "light"
              ? "scale-100 opacity-100 rotate-0"
              : "scale-50 opacity-0 -rotate-90"
          }`}
        />

        <Moon
          className={`absolute inset-0 w-full h-full transition-all duration-300 ${
            theme === "light"
              ? "scale-50 opacity-0 rotate-90"
              : "scale-100 opacity-100 rotate-0"
          }`}
        />
      </div>
    </motion.button>
  );
}
