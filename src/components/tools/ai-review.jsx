"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileSearch,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Info,
  Download,
  Copy,
  Check,
  ArrowUp,
  FileEdit,
  ListTodo,
  FileCheck,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Severity config ──
const SEVERITY_CONFIG = {
  HIGH: { color: "red", icon: AlertTriangle, label: "High Risk" },
  MEDIUM: { color: "yellow", icon: AlertCircle, label: "Medium Risk" },
  LOW: { color: "blue", icon: Info, label: "Low Risk" },
};

const TYPE_LABELS = {
  risk_clause: "Risky Clause",
  missing_protection: "Missing Protection",
  grammar: "Grammar / Style",
  compliance: "Compliance",
  ambiguity: "Ambiguity",
  unfavorable_term: "Unfavorable Term",
  missing_clause: "Missing Clause",
};

// ── Issue Card ──
function IssueCard({ issue, index }) {
  const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.LOW;
  const Icon = config.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-zinc-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-${config.color}-50 shrink-0 mt-0.5 border border-${config.color}-200`}>
          <Icon className={`w-4 h-4 text-${config.color}-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold uppercase tracking-wider text-${config.color}-600`}>
              {config.label}
            </span>
            <span className="text-xs text-zinc-400">
              {TYPE_LABELS[issue.type] || issue.type}
            </span>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed mb-2">
            {issue.explanation}
          </p>
          {issue.originalText && (
            <div className="mb-2 bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
              <p className="text-xs text-red-600 font-semibold mb-1">Original:</p>
              <p className="text-xs text-red-800 line-through">
                {issue.originalText}
              </p>
            </div>
          )}
          {issue.suggestedText && (
            <div className="mb-2 bg-emerald-50 border-l-4 border-emerald-400 p-3 rounded-r">
              <p className="text-xs text-emerald-600 font-semibold mb-1">Suggested:</p>
              <p className="text-xs text-emerald-800">
                {issue.suggestedText.startsWith("ADD:")
                  ? issue.suggestedText.slice(4).trim()
                  : issue.suggestedText}
              </p>
            </div>
          )}
          {expanded && issue.originalText && issue.suggestedText && (
            <div className="mt-3 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <p className="text-xs text-zinc-500 mb-3 font-semibold">Comparison:</p>
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-red-600 font-semibold mt-0.5">−</span>
                  <span className="bg-red-50 text-red-800 px-2 py-1 rounded line-through border-b border-red-200">
                    {issue.originalText}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-emerald-600 font-semibold mt-0.5">+</span>
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded border-b border-emerald-200">
                    {issue.suggestedText.startsWith("ADD:")
                      ? issue.suggestedText.slice(4).trim()
                      : issue.suggestedText}
                  </span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors mt-1 min-h-[44px] flex items-center"
          >
            {expanded ? "Show less" : "Show comparison"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Redlined Text Renderer ──
function RedlinedView({ text }) {
  if (!text) return <p className="text-white/40 italic">No redlined version available.</p>;

  // Parse {{DEL}} and {{ADD}} markers
  const parts = [];
  const regex = /\{\{DEL\}\}(.*?)\{\{\/DEL\}\}|\{\{ADD\}\}(.*?)\{\{\/ADD\}\}/gs;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "normal", text: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      parts.push({ type: "del", text: match[1] });
    }
    if (match[2]) {
      parts.push({ type: "add", text: match[2] });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "normal", text: text.slice(lastIndex) });
  }

  return (
    <div className="text-sm text-zinc-700 leading-[1.9] whitespace-pre-wrap font-mono">
      {parts.map((part, i) => {
        if (part.type === "del") {
          return (
            <span key={i} className="bg-red-100 text-red-800 line-through px-1 rounded border-b-2 border-red-300">
              {part.text}
            </span>
          );
        }
        if (part.type === "add") {
          return (
            <span key={i} className="bg-emerald-100 text-emerald-800 px-1 rounded border-b-2 border-emerald-300">
              {part.text}
            </span>
          );
        }
        return <span key={i}>{part.text}</span>;
      })}
    </div>
  );
}

// ── Main Component ──
export function AIReview({ onSessionCreate }) {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [fullText, setFullText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [rawResponse, setRawResponse] = useState("");
  const [summary, setSummary] = useState("");
  const [issues, setIssues] = useState([]);
  const [redlinedText, setRedlinedText] = useState("");
  const [riskScore, setRiskScore] = useState(null);
  const [activeTab, setActiveTab] = useState("original");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [summary, issues, redlinedText]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showExportMenu && !e.target.closest(".export-menu-container")) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  // ── Parse AI response into sections ──
  const parseResponse = (text) => {
    let summaryText = "";
    let issuesList = [];
    let redlined = "";
    let score = null;

    // Extract summary
    const summaryMatch = text.match(/====\s*SUMMARY\s*====([\s\S]*?)(?=\n====|$)/i);
    if (summaryMatch) {
      summaryText = summaryMatch[1].trim();
      // Extract risk score
      const scoreMatch = summaryText.match(/(\d{1,3})\s*\/\s*100|risk score[:\s]*(\d{1,3})/i);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1] || scoreMatch[2], 10);
      }
    }

    // Extract issues
    const issuesMatch = text.match(/====\s*ISSUES\s*====([\s\S]*?)(?=\n====|$)/i);
    if (issuesMatch) {
      const issuesBlock = issuesMatch[1];

      issuesBlock.split("ISSUE_START").forEach((block) => {
        if (!block.trim() || !block.includes("SEVERITY:")) return;

        const severityMatch = block.match(/SEVERITY:\s*(\w+)/i);
        const typeMatch = block.match(/TYPE:\s*(\w+)/i);
        const originalMatch = block.match(/ORIGINAL_TEXT:\s*([\s\S]*?)(?=SUGGESTED_TEXT:|$)/i);
        const suggestedMatch = block.match(/SUGGESTED_TEXT:\s*([\s\S]*?)(?=EXPLANATION:|$)/i);
        const explanationMatch = block.match(/EXPLANATION:\s*([\s\S]*?)(?=ISSUE_END|ISSUE_START|$)/i);

        if (severityMatch) {
          issuesList.push({
            severity: (severityMatch[1] || "LOW").toUpperCase(),
            type: (typeMatch?.[1] || "other").toLowerCase(),
            originalText: (originalMatch?.[1] || "").trim(),
            suggestedText: (suggestedMatch?.[1] || "").trim(),
            explanation: (explanationMatch?.[1] || "").trim(),
          });
        }
      });
    }

    // Extract redlined
    const redlinedMatch = text.match(/====\s*REDLINED\s*====([\s\S]*?)(?=\n====|$)/i);
    if (redlinedMatch) {
      redlined = redlinedMatch[1].trim();
    }

    return { summary: summaryText, issues: issuesList, redlined, score };
  };

  // ── Handle file upload ──
  const processFile = async (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = [".pdf", ".docx", ".doc", ".txt"];
    const ext = "." + selectedFile.name.split(".").pop().toLowerCase();
    if (!validTypes.includes(ext)) {
      setError(`Unsupported file type. Please upload: ${validTypes.join(", ")}`);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum 10MB allowed.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setExtractedText("");
    setIsDone(false);
    setSummary("");
    setIssues([]);
    setRedlinedText("");
    setRawResponse("");
    setFullText("");

    // Extract text via server API
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/pdf/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to extract text from file.");
      }

      const data = await response.json();
      const text = data.text || "";

      setFullText(text);
      setExtractedText(text.slice(0, 3000) + (text.length > 3000 ? "\n\n[... document truncated for preview ...]" : ""));
    } catch (err) {
      console.error("Text extraction error:", err);
      setError(err.message || "Could not extract text from file. Please try another format.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // ── Start Review ──
  const handleStartReview = async () => {
    if (!file || isReviewing) return;

    setIsReviewing(true);
    setError("");
    setRawResponse("");
    setSummary("");
    setIssues([]);
    setRedlinedText("");
    setIsDone(false);

    if (onSessionCreate) {
      const title = file.name.length > 40 ? file.name.substring(0, 40) + "..." : file.name;
      onSessionCreate(title, "review");
    }

    // Abort previous request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/ai/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: fullText,
          filename: file.name,
          instructions: instructions.trim() || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402) {
          throw new Error("⚠️ You've used all your AI credits. You need more credits to continue using Legalify AI tools.");
        }
        throw new Error(errorData.error || "Failed to start review.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream available.");

      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setRawResponse(fullResponse);
      }

      // Parse the complete response
      setIsParsing(true);
      const parsed = parseResponse(fullResponse);
      setSummary(parsed.summary);
      setIssues(parsed.issues);
      setRedlinedText(parsed.redlined);
      if (parsed.score !== null) setRiskScore(parsed.score);

      setIsParsing(false);
      setIsReviewing(false);
      setIsDone(true);
      setActiveTab("issues");
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Review was cancelled.");
      } else {
        console.error("Review error:", err);
        setError(err.message || "An error occurred during review.");
      }
      setIsReviewing(false);
      setIsParsing(false);
    }
  };

  // ── Export ──
  // ── Export ──
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    if (!file || exporting) return;
    const content = redlinedText || extractedText || rawResponse;
    if (!content) return;

    setExporting(true);
    const baseName = file.name.replace(/\.[^.]+$/, "");

    try {
      if (format === "txt") {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}_reviewed.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }

      if (format === "pdf") {
        const html2pdf = (await import("html2pdf.js")).default;
        const element = document.createElement("div");
        element.style.padding = "40px";
        element.style.fontFamily = "monospace";
        element.style.whiteSpace = "pre-wrap";
        element.style.color = "#000";
        element.style.background = "#fff";
        element.textContent = content;
        document.body.appendChild(element);

        await html2pdf().from(element).set({
          margin: 10,
          filename: `${baseName}_reviewed.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        }).save();

        document.body.removeChild(element);
      }

      if (format === "docx") {
        const { Document, Packer, Paragraph, TextRun } = await import("docx");
        const paragraphs = content.split("\n").map(line =>
          new Paragraph({
            children: [new TextRun({ text: line, font: "Calibri", size: 24 })],
          })
        );

        const doc = new Document({
          sections: [{ children: paragraphs }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}_reviewed.docx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setExtractedText("");
    setInstructions("");
    setIsDone(false);
    setSummary("");
    setIssues([]);
    setRedlinedText("");
    setRawResponse("");
    setRiskScore(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render ──
  const hasResults = isDone && (summary || issues.length > 0 || redlinedText);
const hasFileReady = file && !isReviewing && !isParsing && !hasResults;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-600/[0.05] rounded-full blur-[150px] pointer-events-none z-0" />

      {/* ── Upload State ── */}
      <AnimatePresence mode="wait">
        {!file && !isReviewing && !hasResults && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex items-center justify-center p-6 z-10"
          >
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative inline-block mb-5"
                >
                  <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-3xl bg-black flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0),0_0_0px_rgba(16,185,129,0.2)] overflow-hidden">
                    <FileSearch className="w-10 h-10 text-emerald-400" />
                  </div>
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Review Your Draft
                </h1>
                <p className="text-white/40 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                  Upload a legal document for deep AI review. We'll flag risky clauses,
                  missing protections, compliance gaps, and more.
                </p>
              </div>

              <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                {/* Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 min-h-[200px] ${
                    isDragging
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-white/20 hover:border-emerald-500/30 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                      isDragging ? "bg-emerald-500/20" : "bg-white/5"
                    }`}>
                      <Upload className={`w-8 h-8 ${isDragging ? "text-emerald-400" : "text-zinc-400"}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {isDragging ? "Drop file here" : "Click to upload or drag and drop"}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        PDF, Word Documents, or Text files (Max 10MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-white/50 mb-2">
                    Specific Instructions (Optional)
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Focus on liability clauses, check for compliance with Indian contract law..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 resize-none h-20 text-base md:text-sm"
                  />
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    {error}
                  </p>
                )}

                <div className="mt-6 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartReview}
                    disabled={!file}
                    className={`w-full md:w-auto px-8 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 min-h-[44px] ${
                      file
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                        : "bg-[rgba(255,255,255,0.05)] text-white/20 cursor-not-allowed"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Start Review
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── File Ready State ── */}
        {hasFileReady && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col z-10 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              <div className="max-w-full md:max-w-4xl mx-auto">
                <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-emerald-500/10">
                      <FileText className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-white truncate">{file?.name}</h3>
                      <p className="text-sm text-white/40">
                        {(file?.size / 1024).toFixed(1)} KB • Ready for review
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="ml-auto w-11 h-11 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all"
                      title="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/50 mb-2">
                      Specific Instructions (Optional)
                    </label>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Focus on liability clauses, check for compliance with Indian contract law..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 resize-none h-20 text-base md:text-sm"
                    />
                  </div>

                  {/* Document Preview */}
                  {extractedText && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-white/50 mb-3">Document Preview</h4>
                      <div className="bg-black/40 border border-white/5 rounded-xl p-4 max-h-48 md:max-h-64 overflow-y-auto custom-scrollbar">
                        <pre className="text-xs text-white/60 leading-[1.8] whitespace-pre-wrap font-mono">
                          {extractedText}
                        </pre>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      {error}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartReview}
                      className="px-8 py-3 font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Start Review
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {isReviewing && (
          <motion.div
            key="reviewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center space-y-6 z-10"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/30 blur-[40px] rounded-full" />
              <FileSearch className="w-16 h-16 text-emerald-400 animate-bounce relative z-10" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white text-center px-4">
              Analyzing your document...
            </h2>
            <div className="flex flex-col gap-2 text-white/40 text-sm max-w-md">
              <span className="animate-pulse">Extracting text and preparing document...</span>
              <span className="animate-pulse [animation-delay:0.3s]">Running AI legal review...</span>
              <span className="animate-pulse [animation-delay:0.6s]">Flagging risks and identifying improvements...</span>
            </div>
            <button
              onClick={() => abortControllerRef.current?.abort()}
              className="text-sm text-white/30 hover:text-white/60 transition-colors mt-4 min-h-[44px] flex items-center justify-center"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* ── Parsing State ── */}
        {isParsing && (
          <motion.div
            key="parsing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center space-y-4 z-10"
          >
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
            <h2 className="text-lg md:text-xl font-bold text-white text-center px-4">Processing review results...</h2>
            <p className="text-white/40 text-sm">Parsing issues, summary, and redlined text</p>
          </motion.div>
        )}

        {/* ── Results State ── */}
        {hasResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 md:px-6 pt-4 pb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-white truncate">{file?.name}</h2>
                  <p className="text-xs text-white/40">{file?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {riskScore !== null && (
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    riskScore >= 70 ? "bg-red-500/20 text-red-400" :
                    riskScore >= 40 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    Risk Score: {riskScore}/100
                  </div>
                )}
                <div className="relative export-menu-container">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="w-11 h-11 flex items-center justify-center text-white/25 hover:text-white/70 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all"
                    title="Export document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 top-12 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-2 min-w-[160px] z-50"
                    >
                      <button
                        onClick={() => { handleExport("txt"); setShowExportMenu(false); }}
                        disabled={exporting}
                        className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4" />
                        {exporting ? "Exporting..." : "Export as TXT"}
                      </button>
                      <button
                        onClick={() => { handleExport("pdf"); setShowExportMenu(false); }}
                        disabled={exporting}
                        className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4" />
                        {exporting ? "Exporting..." : "Export as PDF"}
                      </button>
                      <button
                        onClick={() => { handleExport("docx"); setShowExportMenu(false); }}
                        disabled={exporting}
                        className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4" />
                        {exporting ? "Exporting..." : "Export as DOCX"}
                      </button>
                    </motion.div>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-white/40 hover:text-white/70 px-3 py-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 transition-all min-h-[44px] flex items-center"
                >
                  Review Another
                </button>
              </div>
            </div>

            {/* Two-Column Layout: Issues (Left) + Summary (Right) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Tabs + Content */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Tab Bar */}
                <div className="px-4 md:px-6 pt-4 shrink-0">
                  <div className="flex overflow-x-auto md:overflow-visible gap-1 bg-[rgba(255,255,255,0.03)] rounded-xl p-1 max-w-md flex-nowrap">
                    {[
                      { id: "issues", label: "Issues", icon: ListTodo, count: issues.length },
                      { id: "redlined", label: "Redlined", icon: FileEdit },
                      { id: "original", label: "Original", icon: FileText },
                    ].map(({ id, label, icon: Icon, count }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                          activeTab === id
                            ? "bg-emerald-600/20 text-emerald-300 shadow-sm"
                            : "text-white/30 hover:text-white/60 hover:bg-[rgba(255,255,255,0.03)]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                        {count !== undefined && count > 0 && (
                          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                            activeTab === id ? "bg-emerald-500/30" : "bg-white/10"
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-[calc(16px+env(safe-area-inset-bottom))] custom-scrollbar">
                  <div className="max-w-full md:max-w-4xl mx-auto">
                    {/* Issues Tab */}
                    {activeTab === "issues" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                      {/* White Document Page */}
                      <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                        <div className="bg-white text-zinc-900 p-6 md:p-12 min-h-[60vh]">
                          <div className="max-w-4xl mx-auto">
                            <div className="mb-8 pb-6 border-b-2 border-zinc-200">
                              <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-2">Legal Review Report</h2>
                              <p className="text-sm text-zinc-500">{file?.name} • {new Date().toLocaleDateString()}</p>
                            </div>
                            {issues.length > 0 ? (
                              <>
                                {/* Group by severity */}
                                {["HIGH", "MEDIUM", "LOW"].map((severity) => {
                                  const filtered = issues.filter((i) => i.severity === severity);
                                  if (filtered.length === 0) return null;
                                  const config = SEVERITY_CONFIG[severity];
                                  return (
                                    <div key={severity} className="mb-8">
                                      <h3 className={`text-xs font-bold uppercase tracking-widest text-${config.color}-600 mb-4 flex items-center gap-2`}>
                                        <config.icon className={`w-4 h-4 text-${config.color}-500`} />
                                        {config.label} ({filtered.length})
                                      </h3>
                                      <div className="space-y-4">
                                        {filtered.map((issue, i) => (
                                          <IssueCard key={i} issue={issue} index={i} />
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            ) : (
                              <div className="text-center py-12">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400/50 mx-auto mb-4" />
                                <p className="text-zinc-500">No specific issues were flagged. See the summary above.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    )}
                    {/* Redlined Tab */}
                    {activeTab === "redlined" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                          <div className="bg-white text-zinc-900 p-6 md:p-12 min-h-[60vh]">
                            <div className="max-w-4xl mx-auto">
                              <div className="mb-6 pb-4 border-b-2 border-zinc-200">
                                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-1">Redlined Document</h2>
                                <p className="text-sm text-zinc-500">{file?.name}</p>
                              </div>
                              <div className="prose prose-zinc max-w-none">
                                <RedlinedView text={redlinedText} />
                              </div>
                              {!redlinedText && issues.length > 0 && (
                                <div className="space-y-4">
                                  <p className="text-zinc-500 italic text-sm mb-4">
                                    Redlined version not generated by AI. Showing suggested changes from issues below:
                                  </p>
                                  {issues.map((issue, i) => (
                                    <div key={i} className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                          issue.severity === "HIGH" ? "bg-red-100 text-red-700" :
                                          issue.severity === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                                          "bg-green-100 text-green-700"
                                        }`}>{issue.severity}</span>
                                        <span className="text-xs text-zinc-500">{issue.type}</span>
                                      </div>
                                      <p className="text-sm text-red-700 line-through bg-red-50 p-2 rounded mb-2">
                                        {issue.originalText}
                                      </p>
                                      <p className="text-sm text-emerald-700 bg-emerald-50 p-2 rounded">
                                        {issue.suggestedText}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Original Tab */}
                    {activeTab === "original" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                          <div className="bg-white text-zinc-900 p-6 md:p-12 min-h-[60vh]">
                            <div className="max-w-4xl mx-auto">
                              <div className="mb-6 pb-4 border-b-2 border-zinc-200">
                                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-1">Original Document</h2>
                                <p className="text-sm text-zinc-500">{file?.name}</p>
                              </div>
                              <pre className="text-sm text-zinc-700 leading-[1.9] whitespace-pre-wrap font-mono">
                                {extractedText || "No preview available."}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Summary (Sticky) - Hidden on mobile */}
              {summary && (
                <div className="hidden md:flex md:w-72 lg:w-80 flex-col border-l border-white/5 overflow-y-auto shrink-0">
                  <div className="p-4 md:p-6 sticky top-0">
                    <h3 className="text-sm font-bold text-white/60 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Summary
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">{summary}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary on Mobile: Show above tabs */}
            {summary && (
              <div className="md:hidden px-4 py-4 border-t border-white/5 bg-[rgba(255,255,255,0.01)] shrink-0">
                <h3 className="text-sm font-bold text-white/60 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">{summary}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
