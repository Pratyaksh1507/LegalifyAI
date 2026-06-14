"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  Gavel,
  FileText,
  ArrowUp,
  Scale,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Search,
  ChevronRight,
  Mic,
  MicOff,
  Plus,
  FileDigit,
  Sparkles,
} from "lucide-react";

import { Component as AILoader } from "@/components/ui/ai-loader";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════
// SUGGESTION CHIPS
// ═══════════════════════════════════════
const SUGGESTIONS = [
  {
    icon: Gavel,
    label: "Section 148A Income Tax",
    query: "Explain the procedure under Section 148A of the Income Tax Act for reassessment.",
  },
  {
    icon: Scale,
    label: "Hindu daughter coparcenary",
    query: "What are the coparcenary rights of a Hindu daughter under the 2005 amendment?",
  },
  {
    icon: BookOpen,
    label: "Intestate succession",
    query: "Summarize Indian laws regarding intestate succession for Hindus.",
  },
  {
    icon: FileText,
    label: "S.138 NI Act liability",
    query: "What is the liability of a director for bounced cheques under Section 138 of NI Act?",
  },
];

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export function AIResearch({ onSessionCreate }) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [messages, setMessages] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSearching]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [query]);

  // ── Web Speech API setup ──
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setQuery(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setQuery("");
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSearch = async (text) => {
    if (!text.trim() || isSearching) return;
    const userMsg = text.trim();
    setQuery("");
    
    // Call onSessionCreate for the first message of a new research session
    if (messages.length === 0 && onSessionCreate) {
      const title = userMsg.length > 40 ? userMsg.substring(0, 40) + "..." : userMsg;
      onSessionCreate(title, "research");
    }

    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsSearching(true);
    setSearchStatus("Connecting to AI...");

    // Abort any previous request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // After 8s show 'still thinking' message
    const statusTimer = setTimeout(() => setSearchStatus("This model thinks deeply. Almost there..."), 8000);
    // After 90s, abort and show error
    const timeoutTimer = setTimeout(() => controller.abort(), 90000);

    const cleanupTimers = () => {
      clearTimeout(statusTimer);
      clearTimeout(timeoutTimer);
    };

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/ai/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: userMsg }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const isQuotaError = response.status === 402;
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: isQuotaError
              ? "⚠️ **You've used all your AI credits.** You need more credits to continue using Legalify AI tools. Please contact support or upgrade your plan."
              : `Error: ${errorData.error || "Failed to process query."}`,
          },
        ]);
        setIsSearching(false);
        setSearchStatus("");
        cleanupTimers();
        return;
      }

      cleanupTimers();
      setIsSearching(false);
      setSearchStatus("");
      setMessages((prev) => [...prev, { role: "ai", text: "", thinking: "", isThinking: true }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      // Initialize raw field for the AI message
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1].raw = "";
        return next;
      });

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (lastIndex < 0) return prev;

            const currentMsg = { ...newMessages[lastIndex] };
            let fullRaw = (currentMsg.raw || "") + chunk;
            currentMsg.raw = fullRaw;

            // Parse reasoning and content
            let thinking = "";
            let content = fullRaw;

            if (fullRaw.includes("<think>")) {
              const parts = fullRaw.split("<think>");
              const afterThink = parts[1] || "";
              if (afterThink.includes("</think>")) {
                const thinkParts = afterThink.split("</think>");
                thinking = thinkParts[0];
                content = thinkParts[1] || "";
              } else {
                thinking = afterThink;
                content = "";
              }
            }

            // Minimal cleaning - don't over-strip
            let cleanedText = content
              .replace(/```[\s\S]*?```/g, '') // Remove code blocks entirely if needed, or keep them?
              // Let's keep markdown but maybe strip just the most intrusive ones if requested
              .trimStart();

            newMessages[lastIndex] = {
              ...currentMsg,
              thinking: thinking.trim(),
              text: content.trimStart(), // Use raw content for now to avoid stripping issues
              isThinking: content.trim().length === 0,
            };
            return newMessages;
          });
        }
      }
    } catch (err) {
      setIsSearching(false);
      setSearchStatus("");
      cleanupTimers();
      const errMsg = err.name === "AbortError"
        ? "Request timed out. The AI is taking too long. Please try again."
        : "A network error occurred while reaching the AI.";
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: errMsg },
      ]);
    }
  };

  const exportToObsidian = (text) => {
    if (!text) return;
    
    const vaultName = "Legalify";
    const fileName = `Research_${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const content = encodeURIComponent(`# Legal Research: ${query || "Untitled"}\n\n${text}\n\n--- \n*Generated by Legalify AI on ${new Date().toLocaleString()}*`);
    
    const uri = `obsidian://new?vault=${vaultName}&name=${fileName}&content=${content}`;
    window.location.href = uri;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewChat = () => {
    setMessages([]);
    setQuery("");
    setIsSearching(false);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">

      {/* ── Subtle purple ambient glow ── */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-600/[0.07] rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/[0.05] rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ═══════ Empty State (No messages) ═══════ */}
      <AnimatePresence mode="wait">
        {!hasMessages && !isSearching && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col items-center justify-center px-4 z-10"
          >
            {/* ─── Hero Icon ─── */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className="relative mb-5"
            >
              {/* Outer glow ring */}
              <div className="absolute -inset-4 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -inset-8 bg-purple-500/10 rounded-full blur-3xl" />
              
              {/* Icon container */}
              <div className="relative w-20 h-20 rounded-3xl bg-black flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0),0_0_0px_rgba(1,92,246,0.2)] overflow-hidden">
                <img src="/legalify-orbit-center.png" alt="Legalify AI" className="w-16 h-16 object-contain drop-shadow-lg scale-[1.35]" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
            </motion.div>

            {/* ─── Title ─── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-1"
            >
              <h1 className="text-4xl font-bold text-white tracking-tight">
                AI Legal Research
              </h1>
            
            </motion.div>

            {/* ─── Description ─── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-white/40 text-center max-w-md mb-8 leading-relaxed text-[15px]"
            >
              Ask any question about Indian law — statutes, case precedents,
              procedures, or legal principles.
            </motion.p>

            {/* ─── Suggestion Chips ─── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl"
            >
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSearch(s.query)}
                  className="group flex items-center gap-2.5 px-4 py-2.5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] hover:border-purple-500/30 rounded-2xl text-sm transition-all duration-300 active:scale-95"
                >
                  <s.icon className="w-4 h-4 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
                  <span className="text-white/50 group-hover:text-white/90 font-medium transition-colors">
                    {s.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors ml-0.5" />
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Chat Messages ═══════ */}
      {(hasMessages || isSearching) && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pt-4 pb-4 z-10 custom-scrollbar"
        >
          <div className="max-w-full md:max-w-4xl mx-auto space-y-5">

            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-end"
                >
                  <div className="bg-gradient-to-br from-purple-600 to-purple-500 text-white px-5 py-3.5 rounded-[22px] rounded-br-lg max-w-[90%] md:max-w-[80%] text-[15px] whitespace-pre-wrap leading-relaxed shadow-lg shadow-purple-500/10">
                    {msg.text}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-full"
                >
                  {/* AI text — left-border accent for visual anchoring */}
                  <div className="max-w-full">
                    {msg.thinking && (
                      <div className="mb-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-[13px] text-white/40 leading-relaxed italic relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20" />
                        <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-widest font-bold text-purple-400/60 not-italic">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          Analytical Reasoning
                        </div>
                        <div className="pl-2 border-l border-white/5">
                          {msg.thinking}
                          {msg.isThinking && <span className="animate-pulse ml-1">...</span>}
                        </div>
                      </div>
                    )}

                    {/* Show pulsing 'Thinking...' when no text yet and no think tag either */}
                    {msg.isThinking && !msg.thinking && (
                      <div className="flex items-center gap-3 pl-4 border-l-2 border-purple-500/25 py-2">
                        <div className="flex items-end gap-[3px] h-4">
                          <span className="w-[3px] bg-purple-400/70 rounded-full" style={{ animation: 'eqBar 0.8s ease-in-out infinite', animationDelay: '0ms' }} />
                          <span className="w-[3px] bg-purple-400/70 rounded-full" style={{ animation: 'eqBar 0.8s ease-in-out infinite', animationDelay: '200ms' }} />
                          <span className="w-[3px] bg-purple-400/70 rounded-full" style={{ animation: 'eqBar 0.8s ease-in-out infinite', animationDelay: '400ms' }} />
                        </div>
                        <span className="text-white/30 text-sm">Thinking...</span>
                      </div>
                    )}
                    
                    {msg.text && (
                      <div className="border-l-2 border-purple-500/25 pl-4 text-white/80 text-[15px] leading-[1.9] tracking-[0.01em]">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-4 text-purple-400">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-bold mb-3 text-purple-400/90">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold mb-3 text-purple-400/80">{children}</h3>,
                            ul: ({ children }) => <ul className="space-y-2 mb-4 list-disc pl-5">{children}</ul>,
                            ol: ({ children }) => <ol className="space-y-2 mb-4 list-decimal pl-5">{children}</ol>,
                            li: ({ children }) => <li className="pl-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                            em: ({ children }) => <em className="text-white/90">{children}</em>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-purple-500/30 pl-4 italic text-white/60 my-4">{children}</blockquote>,
                            code: ({ children }) => <code className="bg-white/5 px-1.5 py-0.5 rounded text-sm text-purple-300">{children}</code>,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Action buttons below the text */}
                  {msg.text && (
                    <div className="flex items-center gap-1 mt-3">
                      <button
                        onClick={() => handleCopy(msg.text)}
                        className="p-1.5 text-white/25 hover:text-white/60 rounded-md transition-colors duration-200"
                        title={copied ? "Copied!" : "Copy"}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => exportToObsidian(msg.text)}
                        className="p-1.5 text-white/25 hover:text-purple-400 rounded-md transition-colors duration-200"
                        title="Export to Obsidian"
                      >
                        <FileDigit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-white/25 hover:text-white/60 rounded-md transition-colors duration-200"
                        title="Share"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ),
            )}

            {/* AI Loader — equalizer bars */}
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-4 flex items-end gap-3 pl-4 border-l-2 border-purple-500/25"
              >
                <div className="flex items-end gap-[3px] h-5">
                  <span className="w-[3px] bg-purple-400/70 rounded-full" style={{ animation: 'eqBar 0.8s ease-in-out infinite', animationDelay: '0ms' }} />
                  <span className="w-[3px] bg-purple-400/70 rounded-full" style={{ animation: 'eqBar 0.8s ease-in-out infinite', animationDelay: '200ms' }} />
                  <span className="w-[3px] bg-purple-400/70 rounded-full" style={{ animation: 'eqBar 0.8s ease-in-out infinite', animationDelay: '400ms' }} />
                  <span className="w-[3px] bg-purple-400/50 rounded-full" style={{ animation: 'eqBar 0.8s ease-in-out infinite', animationDelay: '600ms' }} />
                </div>
                <span className="text-white/30 text-sm animate-pulse">{searchStatus || "Researching..."}</span>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ Input Bar ═══════ */}
      <div className="relative z-10 px-4 pb-[calc(20px+env(safe-area-inset-bottom))] md:pb-5 pt-2">
        <div className="max-w-4xl mx-auto">
          <motion.div
            animate={{
              borderColor: isFocused ? "rgba(139, 92, 246, 0.25)" : "rgba(255,255,255,0.08)",
              boxShadow: isFocused
                ? "0 0 0 1px rgba(139,92,246,0.15), 0 8px 40px rgba(0,0,0,0.4), 0 0 80px rgba(139,92,246,0.06)"
                : "0 8px 40px rgba(0,0,0,0.3)",
            }}
            transition={{ duration: 0.3 }}
            className="w-full bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border rounded-[28px] overflow-hidden"
          >
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch(query);
                }
              }}
              placeholder="Ask a legal question..."
              className="w-full bg-transparent px-6 pt-5 pb-3 text-white text-base md:text-[15px] placeholder-white/20 border-none focus:ring-0 resize-none min-h-[60px] max-h-[160px] outline-none leading-relaxed"
              rows={1}
            />

            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-0.5">
                <button className="p-2 text-white/25 hover:text-white/70 hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all duration-200">
                  <Paperclip className="w-[18px] h-[18px]" />
                </button>
                <button className="p-2 text-white/25 hover:text-white/70 hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all duration-200">
                  <Search className="w-[18px] h-[18px]" />
                </button>

                {/* ── Mic button with concentric wave rings ── */}
                <div className="relative flex items-center">
                  <motion.button
                    onClick={toggleListening}
                    whileTap={{ scale: 0.9 }}
                    className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 z-10 ${
                      isListening
                        ? "text-purple-400 bg-purple-500/15"
                        : "text-white/25 hover:text-white/70 hover:bg-[rgba(255,255,255,0.05)]"
                    }`}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {/* 3 concentric wave rings */}
                    {isListening && (
                      <>
                        <span className="absolute inset-0 m-auto w-8 h-8 rounded-full border-2 border-purple-400/40 pointer-events-none" style={{ animation: 'micWave 1.8s ease-out infinite' }} />
                        <span className="absolute inset-0 m-auto w-8 h-8 rounded-full border-2 border-purple-400/30 pointer-events-none" style={{ animation: 'micWave 1.8s ease-out infinite 0.5s' }} />
                        <span className="absolute inset-0 m-auto w-8 h-8 rounded-full border-2 border-purple-400/20 pointer-events-none" style={{ animation: 'micWave 1.8s ease-out infinite 1.0s' }} />
                      </>
                    )}
                    {isListening ? (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <MicOff className="w-[18px] h-[18px] relative z-10" />
                      </motion.div>
                    ) : (
                      <Mic className="w-[18px] h-[18px]" />
                    )}
                  </motion.button>

                  {/* "Listening..." label */}
                  <AnimatePresence>
                    {isListening && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.2 }}
                        className="ml-1.5 text-xs font-medium text-purple-400/80 whitespace-nowrap"
                      >
                        Listening...
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Separator */}
                {hasMessages && (
                  <div className="w-px h-4 bg-[rgba(255,255,255,0.08)] mx-1" />
                )}

                {/* New Research — inline, only visible when chat has messages */}
                {hasMessages && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNewChat}
                    className="p-2 text-white/25 hover:text-white/70 hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all duration-200"
                    title="New Research"
                  >
                    <RotateCcw className="w-[16px] h-[16px]" />
                  </motion.button>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSearch(query)}
                disabled={!query.trim() || isSearching}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  query.trim() && !isSearching
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                    : "bg-[rgba(255,255,255,0.05)] text-white/20 cursor-not-allowed"
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>

          <p className="text-center text-[10px] text-white/20 mt-3.5 tracking-wide">
            Legalify AI can make mistakes. Always verify important legal
            information with qualified counsel.
          </p>
        </div>
      </div>
    </div>
  );
}
