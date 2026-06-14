"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileSearch,
  ScrollText,
  MessageSquare,
  Scale,
  ArrowRight,
  Zap,
} from "lucide-react";
import { SparklesCore } from "@/components/ui/sparkles";
import { useTheme } from "@/components/theme-provider";

const tools = [
  {
    id: "draft",
    name: "Draft",
    fullName: "AI Drafting",
    description:
      "Generate legal documents from scratch or with uploaded context. AI drafts contracts, notices, and agreements in seconds.",
    icon: FileText,
    color: "#3b82f6",
    accent: "59, 130, 246",
    link: "/tools/draft",
  },
  {
    id: "review",
    name: "Review",
    fullName: "Smart Review",
    description:
      "Upload any document for AI-powered proofreading with tracked changes, risk flags, and improvement suggestions.",
    icon: FileSearch,
    color: "#10b981",
    accent: "16, 185, 129",
    link: "/tools/review",
  },
  {
    id: "research",
    name: "Research",
    fullName: "Legal Research",
    description:
      "Ask complex legal questions and get structured answers with cited case law, statutes, and precedents.",
    icon: ScrollText,
    color: "#8b5cf6",
    accent: "139, 92, 246",
    link: "/tools/research",
  },
  {
    id: "pdf-chat",
    name: "PDF Chat",
    fullName: "Document Chat",
    description:
      "Upload a PDF and have an intelligent conversation about its contents. Extract clauses, summarize, and compare.",
    icon: MessageSquare,
    color: "#f43f5e",
    accent: "244, 63, 94",
    link: "/tools/pdf-chat",
  },
  {
    id: "arguments",
    name: "Arguments",
    fullName: "Case Arguments",
    description:
      "Generate structured arguments for both sides of a case. Perfect for moot courts and case preparation.",
    icon: Scale,
    color: "#f59e0b",
    accent: "245, 158, 11",
    link: "/tools/arguments",
  },
];

// Memoized sparkles so they don't re-render on parent state changes
const OrbitSparkles = React.memo(function OrbitSparkles() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <SparklesCore
        background="transparent"
        minSize={0.2}
        maxSize={0.6}
        particleDensity={250}
        className="w-full h-full"
        particleColor="#ffffff"
        speed={0.8}
      />

      <div className="absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,transparent_20%,black_100%)]" />
    </div>
  );
});

export const RadialOrbitalTimeline = ({ onToolSelect }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTool, setActiveTool] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredTool, setHoveredTool] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setRotation((prev) => prev + 0.08);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-cycle active tool every 5s when not paused
  useEffect(() => {
    if (isPaused) return;
    const cycle = setInterval(() => {
      setActiveTool((prev) => (prev + 1) % tools.length);
    }, 5000);
    return () => clearInterval(cycle);
  }, [isPaused]);

  const handleToolClick = useCallback((index) => {
    setActiveTool(index);
    setIsPaused(true);
    // Resume rotation after 8s of inactivity
    setTimeout(() => setIsPaused(false), 8000);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const RADIUS = isMobile ? 110 : isTablet ? 170 : 240;
  const ORBIT_SIZE = RADIUS * 2;
  const SATELLITE_SIZE = isMobile ? 52 : isTablet ? 60 : 72;
  const SATELLITE_OFFSET = SATELLITE_SIZE / 2;
  const CENTER_SIZE = isMobile ? 56 : isTablet ? 68 : 80;
  const ICON_SIZE = isMobile ? 20 : isTablet ? 24 : 28;
  const ActiveIcon = tools[activeTool].icon;
  const activeColor = tools[activeTool].color;
  const activeAccent = tools[activeTool].accent;

  return (
    <div className="relative w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
      {/* ═══════════ Orbital Visualization ═══════════ */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center"
        style={{
          width: `${ORBIT_SIZE + (isMobile ? 60 : 120)}px`,
          height: `${ORBIT_SIZE + (isMobile ? 60 : 120)}px`,
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Sparkles background (dark mode only) */}
        {!isLight && <OrbitSparkles />}

        {/* Ambient glow that shifts with active tool */}
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none z-0"
          animate={{
            backgroundColor: activeColor,
            opacity: isLight ? 0.06 : 0.08,
          }}
          transition={{ duration: 1 }}
        />

        {/* ── Orbit Rings ── */}

        {/* Main orbit track — always visible */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: `${ORBIT_SIZE}px`,
            height: `${ORBIT_SIZE}px`,
            border: `1px solid rgba(${activeAccent}, ${isLight ? "0.25" : "0.15"})`,
            boxShadow: isLight
              ? "none"
              : `0 0 60px rgba(${activeAccent}, 0.04), inset 0 0 60px rgba(${activeAccent}, 0.02)`,
          }}
          animate={{
            borderColor: `rgba(${activeAccent}, ${isLight ? "0.25" : "0.15"})`,
          }}
          transition={{ duration: 0.8 }}
        />



        {/* ── Center Core ── */}
        <div className="absolute z-10 flex items-center justify-center">


          {/* Core container */}
          <motion.div
            className="rounded-full flex items-center justify-center overflow-hidden relative"
            style={{
              width: `${CENTER_SIZE}px`,
              height: `${CENTER_SIZE}px`,
              background: isLight
                ? `radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f0f0 100%)`
                : "radial-gradient(circle at 30% 30%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 100%)",
              boxShadow: isLight
                ? `0 4px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)`
                : `0 0 60px rgba(${activeAccent}, 0.15), 0 0 120px rgba(${activeAccent}, 0.08), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4)`,
            }}
            animate={{
              borderColor: [
                `rgba(${activeAccent}, 0.25)`,
                `rgba(${activeAccent}, 0.5)`,
                `rgba(${activeAccent}, 0.25)`,
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Dynamic color wash behind logo */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                background: `radial-gradient(circle at center, rgba(${activeAccent}, ${isLight ? "0.08" : "0.15"}) 0%, transparent 65%)`,
              }}
              transition={{ duration: 0.8 }}
            />

            {/* Logo */}
            <img
              src="/legalify-orbit-center.png"
              alt="Legalify"
              className="object-cover relative z-10 transition-all duration-700 scale-105"
              style={{
                width: `${CENTER_SIZE}px`,
                height: `${CENTER_SIZE}px`,
                filter: isLight
                  ? "brightness(0) opacity(0.85)"
                  : "drop-shadow(0 0 20px rgba(255,255,255,0.35))",
              }}
            />
          </motion.div>
        </div>

        {/* ── Orbiting Satellites ── */}
        {tools.map((tool, index) => {
          const isActive = index === activeTool;
          const isHovered = index === hoveredTool;
          const baseAngle = (index * 360) / tools.length - 90;
          const currentAngle = baseAngle + rotation;
          const rad = (currentAngle * Math.PI) / 180;
          const x = Math.cos(rad) * RADIUS;
          const y = Math.sin(rad) * RADIUS;
          const IconComponent = tool.icon;

          return (
            <motion.button
              key={tool.id}
              onClick={() => handleToolClick(index)}
              onMouseEnter={() => setHoveredTool(index)}
              onMouseLeave={() => setHoveredTool(null)}
              className="absolute z-20 flex flex-col items-center gap-1.5 group"
              style={{
                left: `calc(50% + ${x}px - ${SATELLITE_OFFSET}px)`,
                top: `calc(50% + ${y}px - ${SATELLITE_OFFSET}px)`,
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              aria-label={`Select ${tool.name} tool`}
            >
              {/* Satellite glow ring (active only) */}
              {isActive && (
                <motion.div
                  className="absolute rounded-2xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ 
                    width: `${SATELLITE_SIZE}px`, 
                    height: `${SATELLITE_SIZE}px`,
                    boxShadow: `0 0 25px ${tool.color}60, 0 0 50px ${tool.color}30`
                  }}
                />
              )}

              {/* Satellite body */}
              <div
                className={`rounded-2xl flex items-center justify-center transition-all duration-400 relative overflow-hidden ${isActive
                  ? ""
                  : isLight
                    ? "bg-white/90 backdrop-blur-md border border-black/[0.06] shadow-sm group-hover:border-black/10 group-hover:shadow-md"
                    : "bg-zinc-900/80 backdrop-blur-md border border-[rgba(255,255,255,0.06)] group-hover:border-white/20 group-hover:bg-zinc-800/60"
                  }`}
                style={{
                  width: `${SATELLITE_SIZE}px`,
                  height: `${SATELLITE_SIZE}px`,
                  ...(isActive && {
                    background: isLight
                      ? `linear-gradient(135deg, ${tool.color}15 0%, ${tool.color}08 100%)`
                      : `linear-gradient(135deg, ${tool.color}25 0%, ${tool.color}10 100%)`,
                    border: `1.5px solid ${tool.color}${isLight ? "60" : ""}`,
                    boxShadow: isLight
                      ? `0 4px 20px ${tool.color}20`
                      : `0 0 30px ${tool.color}35, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }),
                }}
              >
                {/* Inner shine */}
                {!isLight && (
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent rounded-2xl pointer-events-none" />
                )}
                <IconComponent
                  className="relative z-10 transition-colors duration-300"
                  style={{
                    width: `${ICON_SIZE}px`,
                    height: `${ICON_SIZE}px`,
                    color:
                      isActive || isHovered
                        ? tool.color
                        : isLight
                          ? "#27272a"
                          : "#71717a",
                  }}
                />
              </div>

              {/* Label */}
              <span
                className="text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap"
                style={{
                  color: isActive
                    ? tool.color
                    : isHovered
                      ? isLight
                        ? "#000000"
                        : "#d4d4d8"
                      : isLight
                        ? "#27272a"
                        : "#52525b",
                  textShadow:
                    isActive && !isLight ? `0 0 12px ${tool.color}60` : "none",
                }}
              >
                {tool.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ═══════════ Detail Panel ═══════════ */}
      <div className="flex-1 max-w-lg min-h-[360px] flex flex-col justify-center relative">
        {/* Panel background with dynamic accent tint */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"
          animate={{
            borderColor: isLight
              ? `rgba(${activeAccent}, 0.15)`
              : `rgba(${activeAccent}, 0.12)`,
          }}
          transition={{ duration: 0.5 }}
          style={{
            border: `1px solid ${isLight ? "rgba(0,0,0,0.06)" : `rgba(${activeAccent}, 0.12)`}`,
            background: isLight
              ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 100%)",
            backdropFilter: "blur(40px)",
            boxShadow: isLight
              ? `0 8px 40px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)`
              : `0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        />

        {/* Subtle accent glow inside panel */}
        <motion.div
          className="absolute top-0 left-0 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
          animate={{
            backgroundColor: activeColor,
            opacity: 0.06,
          }}
          transition={{ duration: 0.8 }}
        />

        <div className="relative p-10 z-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col"
            >
              {/* Tool badge row */}
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  className="w-11 h-11 rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${activeColor}30 0%, ${activeColor}10 100%)`,
                    border: `1px solid ${activeColor}40`,
                    boxShadow: `0 0 20px ${activeColor}20`,
                  }}
                >
                  <ActiveIcon
                    className="w-5 h-5 relative z-10"
                    style={{ color: activeColor }}
                  />
                </motion.div>
                <div
                  className="text-[10px] font-bold tracking-[0.15em] px-3 py-1.5 rounded-full border uppercase flex items-center gap-1.5"
                  style={{
                    color: activeColor,
                    borderColor: `${activeColor}30`,
                    backgroundColor: `${activeColor}08`,
                  }}
                >
                  <Zap className="w-3 h-3" />
                  AI-Powered
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-foreground"
              >
                {tools[activeTool].fullName}
              </h3>

              {/* Description */}
              <p
                className="text-[15px] leading-relaxed mb-8 max-w-md text-muted-foreground"
              >
                {tools[activeTool].description}
              </p>

              {/* CTA row */}
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => onToolSelect?.(tools[activeTool].id)}
                  className="inline-flex items-center gap-2.5 px-7 py-3 text-sm font-bold rounded-xl text-white transition-all duration-300 group relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${activeColor} 0%, ${activeColor}cc 100%)`,
                    boxShadow: `0 4px 20px ${activeColor}40, 0 0 0 1px ${activeColor}60`,
                  }}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: `0 8px 30px ${activeColor}50, 0 0 0 1px ${activeColor}80`,
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  <span className="relative z-10">Launch Tool</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                {/* Tool position indicators */}
                <div className="flex items-center gap-1.5 ml-1">
                  {tools.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleToolClick(i)}
                      className="transition-all duration-300"
                      aria-label={`Go to ${tools[i].name}`}
                    >
                      <div
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === activeTool ? "20px" : "6px",
                          height: "6px",
                          backgroundColor:
                            i === activeTool
                              ? activeColor
                              : isLight
                                ? "rgba(0,0,0,0.1)"
                                : "rgba(255,255,255,0.15)",
                          boxShadow:
                            i === activeTool && !isLight
                              ? `0 0 8px ${activeColor}60`
                              : "none",
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
