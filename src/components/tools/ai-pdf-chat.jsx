"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Upload,
  MessageSquare,
  ArrowUp,
  Paperclip,
  Calendar,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  RefreshCw,
  Scale,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  FileSearch,
  Zap,
  Users,
  Trash2,
  CornerDownLeft,
  Clock,
  ScanSearch,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
const formatBytes = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-content prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-[1.8] text-white/80">{children}</p>,
          h1: ({ children }) => <h1 className="text-xl font-bold mb-4 text-rose-400">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-3 text-rose-400/90">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-3 text-rose-400/80">{children}</h3>,
          ul: ({ children }) => <ul className="space-y-2 mb-4 list-disc pl-5 text-white/70">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-2 mb-4 list-decimal pl-5 text-white/70">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[12px] text-rose-300">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.02)]">
              <table className="w-full text-left text-[13px] border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="p-3 border-b border-white/10 font-bold text-rose-400/80 uppercase tracking-tighter">{children}</th>,
          td: ({ children }) => <td className="p-3 border-b border-white/5 text-white/60">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const ThinkingBlock = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Auto-open if it's very short (still generating)
  useEffect(() => {
    if (children && children.length < 50) setIsOpen(true);
  }, [children]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.02)] border border-white/5 transition-colors hover:border-white/10"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 cursor-pointer outline-none group"
      >
        <div className="flex items-center gap-2">
          <Sparkles className={`w-3.5 h-3.5 transition-colors ${isOpen ? "text-rose-500" : "text-white/20 group-hover:text-rose-500/50"}`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-white/60 transition-colors">
            Neural Analysis
          </span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 text-white/20 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="px-4 pb-4 text-[13px] text-white/40 leading-relaxed italic font-light border-t border-white/5 pt-3 mt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const EqLoaderInline = () => (
  <div className="flex items-end gap-1 h-3">
    {[0, 0.2, 0.1, 0.3].map((delay, i) => (
      <div
        key={i}
        className="w-[3px] rounded-full bg-rose-500/60"
        style={{
          height: "100%",
          animation: `eqBar 0.8s ease-in-out ${delay}s infinite`,
        }}
      />
    ))}
  </div>
);

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export function AIPdfChat({ onSessionCreate }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState(0); // 0: loading, 1: reading, 2: building index
  const [parseProgressText, setParseProgressText] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [parseTime, setParseTime] = useState(0);
  const [documentId, setDocumentId] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [copied, setCopied] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [docInsights, setDocInsights] = useState(null);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const resizerRef = useRef(null);
  const isResizing = useRef(false);
  
  // Recent documents mockup for Upload Screen
  const recentDocs = [
    { name: "Service Agreement v2.pdf", date: "2 days ago" },
    { name: "NDA_TechCorp.pdf", date: "Last week" }
  ];

  // Dynamic prompts pool
  const followUpPool = [
    { icon: Lightbulb, text: "Can you explain this in simpler terms?" },
    { icon: AlertTriangle, text: "What are the potential legal risks here?" },
    { icon: FileSearch, text: "Are there any hidden clauses?" },
    { icon: Calendar, text: "What are the key dates and deadlines?" },
    { icon: Users, text: "Who are the parties and their obligations?" },
    { icon: ShieldCheck, text: "Is there a termination clause? How does it work?" },
    { icon: AlertCircle, text: "What happens in case of a breach?" }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isAsking]);

  const extractInsights = (text, pages) => {
    // Simple client-side regex heuristics for insights
    const insights = {
      pages: pages,
      type: "Document",
      parties: 0,
      dates: 0
    };
    
    if (text.toLowerCase().includes("agreement") || text.toLowerCase().includes("contract")) insights.type = "Contract / Agreement";
    else if (text.toLowerCase().includes("notice") || text.toLowerCase().includes("order")) insights.type = "Legal Notice";
    else if (text.toLowerCase().includes("brief")) insights.type = "Legal Brief";
    
    // Naive party counting (looking for "between X and Y" or "M/S")
    const partyMatches = (text.match(/between\s+(.+?)\s+and\s+(.+?)[.,]/gi) || []).length;
    const msMatches = (text.match(/M\/[sS]\s+[A-Za-z\s]+/g) || []).length;
    const mrMatches = (text.match(/(Mr\.|Mrs\.|Shri|Smt\.)\s+[A-Za-z\s]+/g) || []).length;
    insights.parties = Math.max(2, Math.min(partyMatches * 2 + msMatches + (mrMatches > 0 ? 1 : 0), 10)); // rough estimate
    
    // Naive date counting
    const dateMatches = (text.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g) || []).length + 
                        (text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/gi) || []).length;
    insights.dates = dateMatches;
    
    setDocInsights(insights);
  };

  const handleFile = async (file) => {
    if (!file || file.type !== "application/pdf") return;
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    
    const startTime = Date.now();
    setPdfFile(file);
    setPdfUrl(URL.createObjectURL(file));
    setMessages([]);
    setPdfText("");
    setDocumentId(null);
    setIsParsing(true);
    setParseStep(0);
    setParseProgressText("Accessing Document...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      setPageCount(pdf.numPages);
      setParseStep(1);

      for (let i = 1; i <= pdf.numPages; i++) {
        setParseProgressText(`Scanning Page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        fullText += `\n--- PAGE ${i} ---\n${pageText}`;
      }
      
      setParseStep(2);
      setParseProgressText("Building Intelligence Index...");
      setPdfText(fullText);
      extractInsights(fullText, pdf.numPages);
      
      const endTime = Date.now();
      setParseTime(((endTime - startTime) / 1000).toFixed(1));

      if (onSessionCreate) onSessionCreate(file.name, "pdf chat");

      // Upload text to process/save in database once
      try {
        setParseProgressText("Syncing index to server...");
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const processRes = await fetch("/api/pdf/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            text: fullText,
            filename: file.name,
          }),
        });

        if (processRes.ok) {
          const processData = await processRes.json();
          if (processData.document_id) {
            setDocumentId(processData.document_id);
          }
        }
      } catch (procErr) {
        console.error("Failed to index PDF on server:", procErr);
      }
      
      await new Promise((r) => setTimeout(r, 800)); // give user time to see success
    } catch (err) {
      console.error("PDF parse error:", err);
      setParseProgressText(`Error: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
    setIsParsing(false);
    setParseStep(0);
    
    // Initial suggested follow-ups
    shuffleFollowUps();
  };

  const shuffleFollowUps = () => {
    const shuffled = [...followUpPool].sort(() => 0.5 - Math.random());
    setSuggestedFollowUps(shuffled.slice(0, 3));
  };

  const handleSend = useCallback(async (text) => {
    const trimmed = (text || query).trim();
    if (!trimmed || isAsking || !pdfFile || !pdfText) return;
    
    setQuery("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: "user", content: trimmed, timestamp }]);
    setIsAsking(true);
    setSuggestedFollowUps([]);

    try {
      const chatHistory = messages.slice(-4).map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/pdf/simple-chat", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        method: "POST",
        body: JSON.stringify({
          question: trimmed,
          documentId: documentId || undefined,
          fullText: documentId ? undefined : pdfText,
          filename: pdfFile.name,
          history: chatHistory,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const aiTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setMessages((prev) => [...prev, {
            role: "ai",
            content: "⚠️ **You've used all your AI credits.** You need more credits to continue using Legalify AI tools. Please contact support or upgrade your plan.",
            raw: "",
            timestamp: aiTimestamp,
          }]);
          setIsAsking(false);
          return;
        }
        throw new Error("Connection unstable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      const aiTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [...prev, { role: "ai", content: "", raw: "", timestamp: aiTimestamp, citedPages: [] }]);

      let citationsParsed = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const newMessages = [...prev];
            const last = { ...newMessages[newMessages.length - 1] };
            let fullRaw = (last.raw || "") + chunk;

            // Parse citation metadata (null-byte delimited prefix sent by server)
            let citedPages = last.citedPages || [];
            if (!citationsParsed && fullRaw.includes("\x00CITATIONS:")) {
              const metaMatch = fullRaw.match(/\x00CITATIONS:(\[.*?\])\x00/);
              if (metaMatch) {
                try { citedPages = JSON.parse(metaMatch[1]); } catch (_) {}
                fullRaw = fullRaw.replace(/\x00CITATIONS:\[.*?\]\x00/, "");
                citationsParsed = true;
              }
            }

            const thinkMatch = fullRaw.match(/<think>([\s\S]*?)<\/think>/);
            const thinking = thinkMatch ? thinkMatch[1] : (fullRaw.includes("<think>") ? fullRaw.split("<think>")[1] : "");
            const content = fullRaw.includes("</think>") ? fullRaw.split("</think>")[1] : (fullRaw.includes("<think>") ? "" : fullRaw);

            newMessages[newMessages.length - 1] = {
              ...last,
              raw: fullRaw,
              thinking: thinking.trim(),
              content: content.trimStart(),
              citedPages,
            };
            return newMessages;
          });
        }
      }
    } catch (error) {
      const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [...prev, { role: "ai", content: "⚠️ Analysis interrupted. Please retry your request.", timestamp: errorTimestamp }]);
    } finally {
      setIsAsking(false);
      shuffleFollowUps();
    }
  }, [query, isAsking, pdfFile, pdfText, messages, followUpPool, documentId]);

  const handleCopy = useCallback((text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const handleClearChat = () => {
    setMessages([]);
    shuffleFollowUps();
  };

  // Drag to resize handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.body.classList.remove('select-none');
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Mouse move for dynamic background
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const handleBgMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  // ─── RENDERING ───────────────────────────────────────────────

  if (!pdfFile) {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#09090b] relative overflow-hidden"
        onMouseMove={handleBgMouseMove}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
      >
        {/* Animated Background Mesh */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{ 
            backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(244,63,94,0.06) 0%, transparent 40%), radial-gradient(circle at ${100 - mousePos.x}% ${100 - mousePos.y}%, rgba(59,130,246,0.03) 0%, transparent 40%)` 
          }} 
        />

        {/* Dragging Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-rose-500/10 backdrop-blur-sm border-2 border-rose-500/50 m-4 rounded-3xl"
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex flex-col items-center gap-4 bg-black/60 p-8 rounded-2xl border border-rose-500/30"
              >
                <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <ArrowUp className="w-8 h-8 text-rose-500" />
                </div>
                <span className="text-xl font-bold text-white tracking-wide">Drop PDF to analyze</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl relative z-10 flex flex-col items-center"
        >
          {/* Header Area */}
          <div className="flex flex-col items-center text-center space-y-6 mb-10 w-full">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400"
             >
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-[pulseRing_2s_infinite]" />
                <span className="text-[10.5px] font-bold uppercase tracking-[0.2em]">Legal Intelligence Engine</span>
             </motion.div>
             
             <div className="space-y-4">
               <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex gap-3 justify-center items-center">
                  <span>DOCUMENT</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600 italic">ANALYSIS</span>
               </h1>
             </div>
             
             {/* Feature Pills */}
             <div className="flex flex-wrap justify-center gap-3 mt-2">
                <div className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/5 flex items-center gap-2 text-xs text-white/60">
                   <Zap className="w-3.5 h-3.5 text-rose-400" /> Extract Key Clauses
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/5 flex items-center gap-2 text-xs text-white/60">
                   <FileSearch className="w-3.5 h-3.5 text-blue-400" /> Summarize in Seconds
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/5 flex items-center gap-2 text-xs text-white/60">
                   <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Flag Legal Risks
                </div>
             </div>
          </div>

          {/* Upload Dropzone */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full relative cursor-pointer group"
          >
            {/* Outer Glow */}
            <div className="absolute -inset-1 rounded-[2.5rem] blur-2xl transition-all duration-700 bg-rose-500/5 opacity-0 group-hover:opacity-100" />
            
            {/* Main Box */}
            <div 
              className="relative overflow-hidden rounded-[2rem] transition-all duration-500 flex flex-col items-center justify-center py-20 px-6 bg-[rgba(255,255,255,0.01)] border-white/10 group-hover:border-white/20 group-hover:bg-[rgba(255,255,255,0.02)] border-dashed border shadow-2xl"
            >
               <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
               
               {/* Icon Container */}
               <div className="relative mb-6">
                 <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.03)] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 relative z-10 shadow-inner">
                    <Upload className="w-8 h-8 transition-colors duration-300 text-white/40 group-hover:text-rose-400" />
                 </div>
                 {/* Scanner Line Effect */}
                 <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="w-full h-[2px] bg-rose-500/50 absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                 </div>
               </div>

               <div className="text-center space-y-2 relative z-10">
                  <p className="text-white/90 font-medium text-lg tracking-wide">
                    Select or drop your PDF here
                  </p>
                  <p className="text-white/40 text-sm">Upload contracts, agreements, or legal briefs</p>
               </div>
            </div>
          </motion.div>

          {/* Bottom Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-8 gap-4 px-2">
             {/* Trust Bar */}
             <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.02)] border border-white/5 text-[10.5px] font-bold text-white/30 uppercase tracking-widest">
               <span>PDF ONLY</span>
               <span className="w-1 h-1 rounded-full bg-white/10" />
               <span>MAX 50MB</span>
               <span className="w-1 h-1 rounded-full bg-white/10" />
               <span className="flex items-center gap-1.5 text-emerald-400/70"><ShieldCheck className="w-3.5 h-3.5" /> ENCRYPTED</span>
             </div>

             {/* Recent Docs Mockup */}
             <div className="flex gap-2">
                {recentDocs.map((doc, idx) => (
                  <button key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-white/5 hover:bg-[rgba(255,255,255,0.05)] transition-colors text-xs text-white/50 group">
                    <FileText className="w-3.5 h-3.5 text-white/20 group-hover:text-rose-400" />
                    <span className="truncate max-w-[100px]">{doc.name}</span>
                  </button>
                ))}
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isParsing) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#09090b] relative">
         
         <div className="max-w-md w-full bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-3xl p-10 flex flex-col items-center relative overflow-hidden shadow-2xl">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent w-[200%] animate-[shimmer_2s_infinite]" />
            
            <div className="relative mb-8">
               <ScanSearch className="w-16 h-16 text-rose-500/80" />
               <motion.div 
                 className="absolute top-0 left-0 w-full h-[2px] bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                 animate={{ top: ["0%", "100%", "0%"] }}
                 transition={{ duration: 2, ease: "linear", repeat: Infinity }}
               />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Document</h3>
            <p className="text-sm text-white/40 mb-6 h-5">{parseProgressText}</p>

            {/* Page progress bar */}
            {pageCount > 0 && parseStep === 1 && (
              <div className="w-full mb-6">
                <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
                  <span>Reading pages</span>
                  <span className="tabular-nums">
                    {parseProgressText.match(/(\d+)/)?.[1] || 0} / {pageCount}
                  </span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round(((parseInt(parseProgressText.match(/(\d+)/)?.[1] || 0)) / pageCount) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Progress Steps */}
            <div className="w-full space-y-4">
               {[
                 { step: 0, label: "Initializing engine" },
                 { step: 1, label: `Reading pages (${pageCount ? `${pageCount} pages` : '...'})` },
                 { step: 2, label: "Building intelligence index" }
               ].map((item, idx) => {
                 const isCompleted = parseStep > item.step;
                 const isActive = parseStep === item.step;
                 
                 return (
                   <div key={idx} className="flex items-center gap-3">
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] transition-colors duration-300 ${
                       isCompleted ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                       isActive ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' :
                       'bg-white/5 border-white/10 text-white/20'
                     }`}>
                       {isCompleted ? <Check className="w-3 h-3" /> : (idx + 1)}
                     </div>
                     <span className={`text-sm font-medium transition-colors duration-300 ${
                       isCompleted ? 'text-white/80' :
                       isActive ? 'text-white animate-pulse' :
                       'text-white/20'
                     }`}>{item.label}</span>
                   </div>
                 );
               })}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-[#09090b] text-white font-sans overflow-hidden relative">
      
      {/* ════════ LEFT: PDF ════════ */}
      <div
        className="relative bg-[#121215] flex flex-col w-full h-[40vh] md:h-full shrink-0 md:shrink"
        style={{ width: isMobile ? "100%" : `${leftWidth}%` }}
      >
        <div className="h-14 bg-[#09090b] flex items-center justify-between px-5 border-b border-white/5 z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-rose-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white/90 truncate">{pdfFile.name}</div>
              <div className="text-[10px] font-medium text-white/40 flex gap-2">
                <span>{formatBytes(pdfFile.size)}</span>
                <span>•</span>
                <span>{pageCount} Pages</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[rgba(255,255,255,0.03)] border border-white/5 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New PDF</span>
          </button>
        </div>
        <div className="flex-1 relative">
          <iframe src={`${pdfUrl}#zoom=page-width&view=FitH`} className="w-full h-full border-none opacity-90 absolute inset-0" title="PDF Viewer" />
        </div>
      </div>

      {/* Resizer Handle - Hidden on mobile */}
      <div
        ref={resizerRef}
        onMouseDown={(e) => {
          isResizing.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.classList.add('select-none');
        }}
        className="hidden md:flex w-1.5 h-full bg-white/5 hover:bg-rose-500/50 cursor-col-resize shrink-0 transition-colors z-30 items-center justify-center"
      >
        <div className="w-0.5 h-8 bg-white/20 rounded-full" />
      </div>

      {/* ════════ RIGHT: AI ════════ */}
      <div className="flex-1 flex flex-col bg-[#0c0c0e] min-w-0 md:h-full">
        
        {/* Document Insights Bar (Sticky Top) */}
        {docInsights && (
          <div className="h-10 border-b border-white/5 bg-[rgba(255,255,255,0.01)] flex items-center px-4 gap-3 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-black tracking-widest uppercase text-white/20 mr-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Insights
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.03)] border border-white/5 text-[11px] text-white/60 whitespace-nowrap">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" /> {docInsights.type}
            </div>
            {docInsights.parties > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.03)] border border-white/5 text-[11px] text-white/60 whitespace-nowrap">
                <Users className="w-3.5 h-3.5 text-purple-400" /> ~{docInsights.parties} Parties
              </div>
            )}
            {docInsights.dates > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.03)] border border-white/5 text-[11px] text-white/60 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> {docInsights.dates} Dates
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.03)] border border-white/5 text-[11px] text-white/60 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Parsed in {parseTime}s
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-10 custom-scrollbar relative">
           {/* Empty State */}
           {messages.length === 0 && !isAsking && (
              <div className="h-full flex flex-col items-center justify-center pt-10">
                 <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                    <Scale className="w-8 h-8 text-white/20" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">How can I help with this document?</h2>
                 <p className="text-sm text-white/40 mb-10 text-center max-w-sm">
                   Legalify AI has read all {pageCount} pages. Ask any question or use a starter prompt below.
                 </p>
                 
                 <div className="grid gap-3 w-full max-w-lg">
                    {[
                      { icon: FileSearch, text: "Provide a comprehensive summary of this document" },
                      { icon: Users, text: "Who are the key parties and what are their obligations?" },
                      { icon: AlertTriangle, text: "Identify any critical legal risks, penalties, or liabilities" }
                    ].map((prompt, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleSend(prompt.text)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/5 text-left transition-all group"
                      >
                         <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center shrink-0 group-hover:bg-rose-500/20 transition-colors">
                            <prompt.icon className="w-4 h-4 text-white/40 group-hover:text-rose-400 transition-colors" />
                         </div>
                         <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">{prompt.text}</span>
                      </motion.button>
                    ))}
                 </div>
              </div>
           )}

           {/* Messages */}
           <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[90%] md:max-w-[85%] flex flex-col items-end gap-1">
                      <div 
                        className="px-5 py-3.5 rounded-2xl rounded-tr-sm text-[14px] font-medium leading-relaxed text-white relative shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, rgba(225, 29, 72, 0.9), rgba(244, 63, 94, 0.7))",
                          boxShadow: "0 8px 25px -8px rgba(225, 29, 72, 0.4)",
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                         <span className="relative z-10">{msg.content}</span>
                      </div>
                      <span className="text-[10px] font-medium text-white/20 px-1">{msg.timestamp}</span>
                    </div>
                  ) : (
                    <div className="max-w-[90%] flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20 mt-1">
                         <span className="text-white font-bold text-sm">L</span>
                       </div>
                       <div className="flex-1 min-w-0 relative group pt-1.5">
                          {msg.thinking && <ThinkingBlock>{msg.thinking}</ThinkingBlock>}
                          <div className="pr-8 pb-1">
                             <MarkdownRenderer content={msg.content} />
                          </div>
                          
                          {/* Page Citation Badges */}
                          {msg.citedPages && msg.citedPages.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Sources:</span>
                              {msg.citedPages.map((pg) => (
                                <span
                                  key={pg}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[10px] font-semibold text-rose-400"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  pg.{pg}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-medium text-white/20">{msg.timestamp}</span>
                            {/* Copy Button */}
                            <button
                              onClick={() => handleCopy(msg.content, i)}
                              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1.5"
                            >
                              {copied === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span className="text-[9px] font-bold uppercase tracking-wider">{copied === i ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                       </div>
                    </div>
                  )}
                </motion.div>
              ))}
           </AnimatePresence>

           {isAsking && !messages[messages.length-1]?.content && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20 mt-1">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <div className="flex items-center gap-3 h-10 px-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-white/5">
                  <span className="text-xs font-medium text-white/40">Analyzing</span>
                  <EqLoaderInline />
                </div>
              </motion.div>
           )}
           <div className="h-4" /> {/* Bottom padding */}
        </div>

        {/* Input Area */}
        <div className="px-6 md:px-10 pb-[calc(24px+env(safe-area-inset-bottom))] md:pb-8 pt-2 relative z-20">
           
           {/* Floating Follow-up Options */}
           <div className="absolute bottom-full left-0 right-0 px-6 md:px-10 pb-4 flex justify-start pointer-events-none overflow-hidden">
             <AnimatePresence>
               {!isAsking && messages.length > 0 && suggestedFollowUps.length > 0 && (
                 <motion.div 
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 15 }}
                   className="flex gap-2.5 overflow-x-auto no-scrollbar pointer-events-auto pb-2 -mb-2 w-full"
                 >
                   {suggestedFollowUps.map((item, idx) => (
                     <button 
                       key={idx}
                       onClick={() => handleSend(item.text)}
                       className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-rose-500/20 bg-[#121215]/90 backdrop-blur-md text-[11px] font-medium text-white/70 hover:text-white hover:border-rose-500/50 hover:bg-rose-500/10 transition-all shadow-lg shrink-0"
                     >
                        <item.icon className="w-3 h-3 text-rose-400" />
                        {item.text}
                     </button>
                   ))}
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

           <div className={`relative transition-all duration-300 rounded-[1.8rem] border ${isFocused ? "border-rose-500/40 bg-[rgba(255,255,255,0.04)] shadow-[0_0_20px_rgba(244,63,94,0.05)]" : "border-white/10 bg-[rgba(255,255,255,0.02)]"} overflow-hidden px-5 py-3.5 flex items-end gap-3`}>
              
              <button
                onClick={handleClearChat}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors shrink-0 mb-1"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex-1 flex flex-col justify-center min-h-[40px]">
                <textarea
                   ref={inputRef}
                   value={query}
                   onChange={(e) => {
                     setQuery(e.target.value);
                     e.target.style.height = "auto";
                     e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                   }}
                   onFocus={() => setIsFocused(true)}
                   onBlur={() => setIsFocused(false)}
                   onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                   placeholder="Ask about clauses, parties, risks..."
                   className="w-full bg-transparent border-none focus:ring-0 text-base md:text-[14px] text-white/90 placeholder-white/20 resize-none max-h-[150px] outline-none leading-relaxed py-2 custom-scrollbar"
                   rows={1}
                />
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0 mb-0.5">
                <motion.button
                   whileTap={{ scale: 0.9 }}
                   onClick={() => handleSend()}
                   disabled={!query.trim() || isAsking}
                   className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${query.trim() && !isAsking ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" : "bg-white/5 text-white/10"}`}
                >
                   <ArrowUp className="w-4 h-4" />
                </motion.button>
              </div>
           </div>
           
           <div className="flex items-center justify-between mt-3 px-2">
             <div className="flex items-center gap-2 text-[10px] font-medium text-white/20">
               <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> to send</span>
               <span>•</span>
               <span>Shift + Enter for new line</span>
             </div>
             <p className="text-[9px] font-black tracking-[0.3em] text-white/10 uppercase">
                Legalify · DeepSeek V4 Pro
             </p>
           </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes eqBar {
          0%, 100% { height: 30%; opacity: 0.3; }
          50% { height: 100%; opacity: 1; }
        }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(244,63,94,0.3); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .markdown-content p { margin-bottom: 1rem; }
        .markdown-content p:last-child { margin-bottom: 0; }
        .markdown-content strong { color: #fff; font-weight: 600; }
        .markdown-content ul { margin-top: 0.5rem; }
        .markdown-content li { margin-bottom: 0.25rem; }
      `}</style>
    </div>
  );
}
