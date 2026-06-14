"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Gavel,
  MessageSquare,
  Search,
  ChevronLeft,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  Download,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";
import { Component as AILoader } from "@/components/ui/ai-loader";
import { IntegratedSidebar } from "./integrated-sidebar";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

// ─── Mode Config ───────────────────────────────────────────────
const MODES = [
  {
    id: "cases-for",
    label: "Cases For You",
    shortLabel: "For You",
    desc: "Find landmark judgments and precedents that support your legal position",
    icon: Scale,
    color: "#10b981",
    accent: "16, 185, 129",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    button: "from-emerald-600 to-emerald-500",
    glow: "shadow-emerald-500/25",
  },
  {
    id: "cases-against",
    label: "Cases Against You",
    shortLabel: "Against",
    desc: "Anticipate adverse precedents the opposing side will rely on — and prepare counters",
    icon: Gavel,
    color: "#ef4444",
    accent: "239, 68, 68",
    gradient: "from-red-500/20 to-red-600/5",
    border: "border-red-500/30",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    button: "from-red-600 to-red-500",
    glow: "shadow-red-500/25",
  },
  {
    id: "arguments",
    label: "Arguments In Your Favour",
    shortLabel: "Arguments",
    desc: "Craft compelling, court-ready legal submissions grounded in Indian law",
    icon: MessageSquare,
    color: "#8b5cf6",
    accent: "139, 92, 246",
    gradient: "from-violet-500/20 to-violet-600/5",
    border: "border-violet-500/30",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    button: "from-violet-600 to-violet-500",
    glow: "shadow-violet-500/25",
  },
  {
    id: "neutral",
    label: "Judicial Evaluation",
    shortLabel: "Evaluation",
    desc: "Get an impartial assessment of how a judge would likely view and decide the matter",
    icon: Search,
    color: "#f59e0b",
    accent: "245, 158, 11",
    gradient: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    button: "from-amber-500 to-amber-400",
    glow: "shadow-amber-500/25",
  },
];

// ─── Markdown Renderer ─────────────────────────────────────────
function MarkdownResult({ content, color }) {
  return (
    <div className="prose prose-invert max-w-none text-[14px] leading-[1.85]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2
              className="text-base font-bold mt-6 mb-3 pb-1.5 border-b"
              style={{ color, borderColor: `${color}30` }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-4 mb-2 text-white/90">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 text-white/70 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white/90">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 space-y-1.5 list-none pl-0">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-white/70">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
              <span>{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-2 pl-4 my-3 text-white/50 italic"
              style={{ borderColor: color }}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export function CaseArguments({ onSessionCreate }) {
  const [step, setStep] = useState("select"); // select | facts | generating | result
  const [selectedMode, setSelectedMode] = useState(null);
  const [facts, setFacts] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll as result streams in
  useEffect(() => {
    if (scrollRef.current && step === "result") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, step]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 240) + "px";
    }
  }, [facts]);

  const promptStrength =
    facts.length < 80
      ? "weak"
      : facts.length < 200
        ? "medium"
        : "strong";

  const strengthPercent = Math.min(100, (facts.length / 250) * 100);

  const mode = MODES.find((m) => m.id === selectedMode);

  const handleGenerate = async () => {
    if (!facts.trim() || !selectedMode) return;

    setStep("generating");
    setChatHistory([]);
    setError("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Session tracking
    if (onSessionCreate) {
      const title =
        facts.length > 40 ? facts.substring(0, 40) + "..." : facts;
      onSessionCreate(title, "arguments");
    }

    try {
      setIsGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/ai/arguments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ facts: facts.trim(), mode: selectedMode }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 402) {
          setError(
            "⚠️ You've used all your AI credits. Please contact support or upgrade your plan."
          );
        } else {
          setError(data.error || "Failed to generate arguments.");
        }
        setStep("facts");
        setIsGenerating(false);
        return;
      }

      setStep("result");
      setChatHistory([{ role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream.");

      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setChatHistory([{ role: "assistant", content: text }]);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "A network error occurred.");
      setStep("facts");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isGenerating) return;

    const userMessage = { role: "user", content: chatInput };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory([...newHistory, { role: "assistant", content: "" }]);
    setChatInput("");
    setIsGenerating(true);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/ai/arguments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // We pass facts so the backend prepends it to the history for context
        body: JSON.stringify({ facts: facts.trim(), mode: selectedMode, messages: newHistory }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = `[Error: ${data.error || "Failed to send message."}]`;
          return updated;
        });
        setIsGenerating(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream.");

      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = text;
          return updated;
        });
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = `[Error: ${err.message || "Network error."}]`;
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = chatHistory.map(msg => `${msg.role === "user" ? "You" : "AI"}:\n${msg.content}`).join("\n\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const textToCopy = chatHistory.map(msg => `${msg.role === "user" ? "You" : "AI"}:\n${msg.content}`).join("\n\n");
    const blob = new Blob([textToCopy], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Legalify_${mode?.label.replace(/ /g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setStep("select");
    setSelectedMode(null);
    setFacts("");
    setChatHistory([]);
    setChatInput("");
    setError("");
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ═══════════ STEP 1: Mode Selection ═══════════ */}
        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-3xl px-4"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative inline-flex mb-5"
              >
                <div className="absolute -inset-3 bg-amber-500/15 rounded-full blur-2xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <Scale className="w-8 h-8 text-amber-400" />
                </div>
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Case Arguments
              </h2>
              <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                Select the type of analysis you need. Each mode uses a
                specialised AI legal expert.
              </p>
            </div>

            {/* Mode Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MODES.map((m, i) => {
                const Icon = m.icon;
                return (
                  <motion.button
                    key={m.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => {
                      setSelectedMode(m.id);
                      setStep("facts");
                    }}
                    className={`group text-left p-5 rounded-2xl border bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 ${m.border} hover:shadow-lg ${m.glow}`}
                    style={{
                      borderColor: `rgba(${m.accent}, 0.2)`,
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                        style={{
                          background: `rgba(${m.accent}, 0.12)`,
                          border: `1px solid rgba(${m.accent}, 0.25)`,
                          boxShadow: `0 0 16px rgba(${m.accent}, 0.1)`,
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: m.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className="text-sm font-semibold"
                            style={{ color: m.color }}
                          >
                            {m.label}
                          </h3>
                          <ChevronRight
                            className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: m.color }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          {m.desc}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══════════ STEP 2: Enter Facts ═══════════ */}
        {step === "facts" && mode && (
          <motion.div
            key="facts"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full max-w-2xl px-4"
          >
            <div
              className="relative rounded-3xl border overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                borderColor: `rgba(${mode.accent}, 0.2)`,
                boxShadow: `0 0 60px rgba(${mode.accent}, 0.06)`,
              }}
            >
              {/* Ambient glow */}
              <div
                className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none"
                style={{
                  background: `radial-gradient(circle, rgba(${mode.accent}, 0.08) 0%, transparent 70%)`,
                }}
              />

              <div className="relative p-8">
                {/* Back + Mode header */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setStep("select")}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${mode.badge}`}
                  >
                    <mode.icon className="w-3.5 h-3.5" />
                    {mode.label}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
                  Describe Your Case
                </h2>
                <p className="text-zinc-500 text-sm mb-6">
                  Provide the key facts, parties involved, and the specific
                  legal issue. The more detail you give, the more accurate the
                  analysis.
                </p>

                {/* Textarea */}
                <div className="relative group mb-4">
                  <div
                    className="absolute -inset-px rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, rgba(${mode.accent}, 0.4), transparent)`,
                    }}
                  />
                  <textarea
                    ref={textareaRef}
                    value={facts}
                    onChange={(e) => setFacts(e.target.value)}
                    placeholder="e.g. My client entered into a partnership agreement with XYZ Ltd in 2021. The respondent has breached Clause 5 of the agreement by diverting business to a competing firm. Client seeks injunction and damages under the Partnership Act 1932 and Indian Contract Act. Delhi High Court jurisdiction..."
                    className="relative w-full min-h-[140px] bg-black/50 border border-white/8 rounded-2xl p-5 text-white placeholder:text-zinc-600 focus:outline-none resize-none text-base md:text-sm leading-relaxed transition-all z-10"
                    style={{
                      borderColor: `rgba(${mode.accent}, 0.15)`,
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = `rgba(${mode.accent}, 0.45)`)
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = `rgba(${mode.accent}, 0.15)`)
                    }
                  />
                </div>

                {/* Prompt strength bar */}
                <div className="mb-6">
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-colors duration-500 ${
                        promptStrength === "weak"
                          ? "bg-red-500"
                          : promptStrength === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      animate={{ width: `${Math.max(2, strengthPercent)}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 px-0.5">
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider ${
                        promptStrength === "weak"
                          ? "text-red-400"
                          : promptStrength === "medium"
                            ? "text-amber-400"
                            : "text-emerald-400"
                      }`}
                    >
                      {promptStrength === "weak"
                        ? "Add more context for better results"
                        : promptStrength === "medium"
                          ? "Good — more detail will improve accuracy"
                          : "Excellent detail!"}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {facts.length} chars
                    </span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* CTA */}
                <motion.button
                  onClick={handleGenerate}
                  disabled={!facts.trim()}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r ${mode.button} shadow-lg ${mode.glow}`}
                  whileHover={facts.trim() ? { scale: 1.02 } : {}}
                  whileTap={facts.trim() ? { scale: 0.98 } : {}}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate {mode.shortLabel}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ STEP 3: Generating ═══════════ */}
        {step === "generating" && mode && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center gap-6 px-4"
          >
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-[50px] opacity-30"
                style={{ background: mode.color }}
              />
              <div
                className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: `rgba(${mode.accent}, 0.12)`,
                  border: `1px solid rgba(${mode.accent}, 0.3)`,
                  boxShadow: `0 0 40px rgba(${mode.accent}, 0.2)`,
                }}
              >
                <mode.icon
                  className="w-9 h-9 animate-pulse"
                  style={{ color: mode.color }}
                />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Analysing your case...
              </h2>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                Our AI legal expert is researching Indian precedents and
                crafting your{" "}
                <span style={{ color: mode.color }}>{mode.label}</span> analysis
              </p>
            </div>
            <div className="flex flex-col gap-1.5 text-zinc-600 text-xs">
              <span className="animate-pulse">Searching Indian case law database...</span>
              <span className="animate-pulse [animation-delay:0.4s]">Evaluating applicable statutes...</span>
              <span className="animate-pulse [animation-delay:0.8s]">Structuring legal arguments...</span>
            </div>
            <button
              onClick={() => {
                if (abortRef.current) abortRef.current.abort();
                setStep("facts");
              }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* ═══════════ STEP 4: Result ═══════════ */}
        {step === "result" && mode && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full flex flex-col overflow-hidden"
          >
            {/* Top bar */}
            <div
              className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b"
              style={{ borderColor: `rgba(${mode.accent}, 0.15)` }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("facts")}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${mode.badge}`}
                >
                  <mode.icon className="w-3 h-3" />
                  {mode.label}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-xs transition-all"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden md:inline">{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Save</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-xs transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">New</span>
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                    showSidebar 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                  title="Toggle Research Sidebar"
                >
                  {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Left Pane (Main Content) */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Switch modes bar */}
                <div
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 border-b overflow-x-auto"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 shrink-0 mr-1">
                    Switch:
                  </span>
                  {MODES.map((m) => {
                    const Icon = m.icon;
                    const isActive = m.id === selectedMode;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMode(m.id);
                          setChatHistory([]);
                          setStep("facts");
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                          isActive
                            ? `${m.badge}`
                            : "bg-white/3 border-white/8 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {m.shortLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Result content */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar"
                >
                  <div className="max-w-3xl mx-auto space-y-6">
                    {chatHistory.length > 0 ? (
                      chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          {msg.role === "user" ? (
                            <div className="bg-white/10 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] text-sm shadow-sm border border-white/5">
                              {msg.content}
                            </div>
                          ) : (
                            <div className="w-full">
                              {msg.content ? (
                                <MarkdownResult content={msg.content} color={mode.color} />
                              ) : (
                                <div className="flex items-center gap-3 text-zinc-600 text-sm py-4">
                                  <AILoader />
                                  Generating...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center gap-3 text-zinc-600 text-sm h-full">
                        <AILoader />
                        Generating...
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow-up Chat Input Bar */}
                <div className="shrink-0 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-white/10 bg-zinc-950/50 backdrop-blur-sm">
                  <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask a follow-up question..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-base md:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors shadow-inner"
                        disabled={isGenerating}
                      />
                      <button
                        type="submit"
                        disabled={isGenerating || !chatInput.trim()}
                        className="absolute right-2 p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-white/5 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        <Search className="w-4 h-4" /> {/* Or a Send icon */}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Pane (Sidebar) */}
              <AnimatePresence>
                {showSidebar && (
                  <motion.div 
                    initial={isMobile ? { y: "100%" } : { opacity: 0, x: 20 }}
                    animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }}
                    exit={isMobile ? { y: "100%" } : { opacity: 0, x: 20 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className={`${
                      isMobile 
                        ? "fixed inset-0 z-[60] bg-zinc-950 flex flex-col" 
                        : "w-80 md:w-96 shrink-0 border-l border-white/10"
                    }`}
                  >
                    {isMobile && (
                      <div className="shrink-0 h-14 border-b border-white/10 flex items-center justify-between px-5 bg-zinc-900">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Research & Notes</span>
                        <button 
                          onClick={() => setShowSidebar(false)}
                          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60"
                        >
                          <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <IntegratedSidebar />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
