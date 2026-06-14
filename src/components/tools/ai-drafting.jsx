"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  PenLine,
  Sparkles,
  ChevronLeft,
  Lock,
  FileText,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Download,
  Copy,
  RefreshCw,
  Scale,
  MessageSquare,
  Search,
  Gavel,
  ChevronDown,
  Check,
  FileDigit,
} from "lucide-react";

import { Component as AILoader } from "@/components/ui/ai-loader";
import { supabase } from "@/lib/supabase";

// ─── Constants ───
const AI_TOOLS = [
  {
    id: "cases-for",
    label: "Cases For You",
    desc: "Find landmark and relevant judgments that support your legal position",
    icon: Scale,
    color: "#10b981",
  },
  {
    id: "cases-against",
    label: "Cases Against You",
    desc: "Find potential opposing cases that go against the present matter",
    icon: Gavel,
    color: "#ef4444",
  },
  {
    id: "arguments",
    label: "Arguments In Your Favour",
    desc: "Generate compelling legal arguments based on your case facts, landmark and relevant cases and applicable laws",
    icon: MessageSquare,
    color: "#8b5cf6",
  },
  {
    id: "neutral",
    label: "Neutral Judicial Evaluation",
    desc: "How would a judge likely view this dispute? Get an impartial judicial evaluation of your case",
    icon: Search,
    color: "#f59e0b",
  },
];

const INDIAN_LANGUAGES = [
  "English",
  "Assamese",
  "Bengali",
  "Bodo",
  "Dogri",
  "Gujarati",
  "Hindi",
  "Kannada",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Malayalam",
  "Manipuri",
  "Marathi",
  "Nepali",
  "Odia",
  "Punjabi",
  "Sanskrit",
  "Santali",
  "Sindhi",
  "Tamil",
  "Telugu",
  "Urdu",
];

const PageNode = ({
  page,
  index,
  total,
  isEditingManually,
  onKeyDown,
  onInputEvents,
  onPageInput,
}) => {
  const ref = React.useRef(null);

  // Only set innerHTML when NOT editing (initial load or field value changes)
  React.useEffect(() => {
    if (ref.current && !isEditingManually) {
      ref.current.innerHTML = page.html;
    }
  }, [page.html, isEditingManually]);

  return (
    <div className="relative flex flex-col items-center w-full mb-10 shrink-0 select-none">
      <div
        className="bg-white border border-gray-200 transition-all duration-300 select-text"
        style={{
          width: "816px",
          height: "1056px",
          padding: "96px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          id={`page-div-${page.id}`}
          ref={ref}
          contentEditable={isEditingManually}
          suppressContentEditableWarning
          onKeyDown={(e) => {
            if (isEditingManually) onKeyDown(e, index);
          }}
          onInput={(e) => {
            onInputEvents(e);
            if (onPageInput) onPageInput(e, index);
          }}
          onKeyUp={onInputEvents}
          onMouseUp={onInputEvents}
          onClick={onInputEvents}
          className={`w-full h-full font-serif text-[16px] leading-[1.6] outline-none overflow-hidden ${
            isEditingManually ? "cursor-text" : "cursor-default"
          }`}
          style={{ color: "#000000" }}
        />
      </div>
      {total > 1 && (
        <div className="text-center mt-2">
          <span className="text-[11px] text-zinc-500 font-medium">
            Page {index + 1} of {total}
          </span>
        </div>
      )}
    </div>
  );
};

export function AIDrafting({ onSessionCreate }) {
  const [mode, setMode] = useState("select");
  const [facts, setFacts] = useState("");
  const [language, setLanguage] = useState("English");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [useBNS, setUseBNS] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [streamingPreview, setStreamingPreview] = useState(""); // live preview during generation
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});
  const [toast, setToast] = useState({ message: "", visible: false });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedIntervalRef = React.useRef(null);
  const abortControllerRef = React.useRef(null);
  const toastTimer = React.useRef(null);
  const showToast = (message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      3000,
    );
  };
  const fileInputRef = React.useRef(null);

  const handleFileUpload = (file) => {
    if (!file) return;
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFacts(e.target?.result);
        setMode("type");
      };
      reader.readAsText(file);
    } else {
      showToast(
        `Parsing ${file.name} requires backend integration. Please upload a .txt file for now.`,
      );
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files?.[0]);
  };
  const [pages, setPages] = useState([{ id: "p-init", html: "" }]);
  const pagesRef = React.useRef(pages);
  React.useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  const promptStrength =
    facts.length < 50 ? "weak" : facts.length < 150 ? "medium" : "strong";
  const strengthColor =
    promptStrength === "weak"
      ? "text-red-400"
      : promptStrength === "medium"
        ? "text-amber-400"
        : "text-emerald-400";
  const strengthPercent = Math.min(100, (facts.length / 200) * 100);

  const startGenerating = async () => {
    setMode("generating");
    setStreamingPreview("");
    setElapsedSeconds(0);

    // Elapsed time counter
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    // Abort controller for cancellation
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/ai/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ facts, language, useBNS }),
        signal: controller.signal,
      });

      if (response.status === 402) {
        setGeneratedDraft(
          "⚠️ You've used all your AI credits. You need more credits to continue using Legalify AI tools. Please contact support or upgrade your plan."
        );
      } else if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setGeneratedDraft(`Error: ${data.error || "Failed to generate draft."}`);
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let generatedText = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            generatedText += decoder.decode(value, { stream: true });
            // Show tokens live in the generating preview
            setStreamingPreview(generatedText);
          }
        } catch (streamErr) {
          if (streamErr.name !== "AbortError") {
            generatedText += `\n\n[Stream Error: ${streamErr.message}]`;
          }
        } finally {
          reader.releaseLock();
        }
        setGeneratedDraft(generatedText);
        if (onSessionCreate) {
          const title =
            facts.length > 40
              ? facts.substring(0, 40) + "..."
              : facts || "Untitled Draft";
          onSessionCreate(title, "draft");
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setGeneratedDraft(
          "A network error occurred while reaching the AI drafting engine. Please check your connection and try again."
        );
      }
    } finally {
      clearInterval(elapsedIntervalRef.current);
      setMode("editor");
      setIsEditingManually(false);
      setStreamingPreview("");
    }
  };

  // Paginate draft whenever generatedDraft or fieldValues change
  React.useEffect(() => {
    if (generatedDraft && !isEditingManually) {
      let text = generatedDraft;
      Object.entries(fieldValues).forEach(([key, value]) => {
        if (value) text = text.replace(new RegExp(`\\{${key}\\}`, "g"), value);
      });

      // Convert markdown to normal text HTML
      text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
      text = text.replace(/\*(.*?)\*/g, "<i>$1</i>");
      text = text.replace(/^#+\s*(.*?)$/gm, "<b>$1</b>");
      text = text.replace(/^[-*]\s+(.*?)$/gm, "• $1");

      text = text.replace(/\n/g, "<br/>");
      const lines = text.split("<br/>");
      const pagesArray = [];
      let current = [];
      let currentVisualLines = 0;
      for (let line of lines) {
        current.push(line);

        // Remove HTML tags to count actual text characters
        const cleanText = line.replace(/<[^>]*>?/gm, "");
        // Approximate visual lines: 1 base line + 1 line for every ~90 characters of wrapping
        const visualLines = 1 + Math.floor(cleanText.length / 90);
        currentVisualLines += visualLines;

        // Approx 34 visual lines per A4 page to leave safe margins
        if (currentVisualLines >= 34) {
          pagesArray.push({
            id: `p-${Date.now()}-${pagesArray.length}`,
            html: current.join("<br/>"),
          });
          current = [];
          currentVisualLines = 0;
        }
      }
      if (current.length > 0) {
        pagesArray.push({
          id: `p-${Date.now()}-${pagesArray.length}`,
          html: current.join("<br/>"),
        });
      }
      setTimeout(() => {
        setPages(
          pagesArray.length ? pagesArray : [{ id: `p-${Date.now()}`, html: "" }],
        );
      }, 0);
    }
  }, [generatedDraft, fieldValues, isEditingManually]);

  const dynamicFields = React.useMemo(() => {
    const regex = /\{([a-zA-Z0-9_]+)\}/g;
    const matches = Array.from(generatedDraft.matchAll(regex));
    const uniqueKeys = Array.from(new Set(matches.map((m) => m[1])));
    return uniqueKeys.map((key) => ({
      key,
      label: key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    }));
  }, [generatedDraft]);

  // Sync DOM content back to state before toggling edit mode off
  const syncPagesToState = () => {
    setPages((prev) =>
      prev.map((p) => {
        const node = document.getElementById(`page-div-${p.id}`);
        return { ...p, html: node ? node.innerHTML : p.html };
      }),
    );
  };

  const handleConvertBNS = () => {
    if (!useBNS) {
      setUseBNS(true);
      startGenerating();
    } else {
      showToast("This draft is already using BNS/BNSS terminology.");
    }
  };

  const handleModifyDraft = () => {
    if (!isEditingManually) {
      setIsEditingManually(true);
      showToast("Edit mode unlocked. You can now modify the text directly.");
    }
  };

  const toggleEditMode = () => {
    if (isEditingManually) {
      // Turning OFF: sync DOM content back to React state
      syncPagesToState();
    }
    setIsEditingManually(!isEditingManually);
  };

  const handleAIToolClick = (toolName) => {
    showToast(`${toolName} is being integrated. Check back soon!`);
  };

  const updateFormatState = () => {
    if (!isEditingManually) return;
    const formats = [
      "bold",
      "italic",
      "underline",
      "strikeThrough",
      "justifyLeft",
      "justifyCenter",
      "justifyRight",
      "justifyFull",
      "insertUnorderedList",
      "insertOrderedList",
    ];
    const newFormats = {};
    formats.forEach((format) => {
      newFormats[format] = document.queryCommandState(format);
    });
    setActiveFormats(newFormats);
  };

  const formatText = (command, value) => {
    if (!isEditingManually) return;
    document.execCommand(command, false, value);
    updateFormatState();
  };

  const formatBtnClass = (command) => {
    const base = "p-1.5 rounded-md transition-colors disabled:opacity-50 ";
    if (activeFormats[command]) {
      return base + "bg-blue-500/20 text-blue-400";
    }
    return base + "hover:bg-white/10 text-zinc-400 hover:text-white";
  };

  const handleCopy = () => {
    const text = pages
      .map((p) => document.getElementById(`page-div-${p.id}`)?.innerText || "")
      .join("\\n\\n");
    navigator.clipboard.writeText(text);
    showToast("Draft copied to clipboard!");
  };

  const handleDownloadPDF = async () => {
    setShowDownloadMenu(false);
    showToast("Generating PDF...");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const container = document.createElement("div");
      container.style.cssText =
        'font-family: "Times New Roman", serif; font-size: 16px; line-height: 1.6; color: #000;';
      pages.forEach((p, i) => {
        const el = document.getElementById(`page-div-${p.id}`);
        if (el) {
          const clone = el.cloneNode(true);
          clone.style.cssText = "padding: 0; color: #000;";
          if (i > 0) {
            const br = document.createElement("div");
            br.style.pageBreakBefore = "always";
            container.appendChild(br);
          }
          container.appendChild(clone);
        }
      });
      await html2pdf()
        .set({
          margin: [1, 1, 1, 1],
          filename: "Legalify_Draft.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          // @ts-expect-error - html2pdf types are incomplete
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(container)
        .save();
      showToast("PDF downloaded successfully!");
    } catch {
      showToast("PDF export failed. Please try again.");
    }
  };

  const handleDownloadDOCX = () => {
    const htmlContent = pages
      .map((p) => document.getElementById(`page-div-${p.id}`)?.innerHTML || "")
      .join('<br clear="all" style="page-break-before:always" />');
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Legal Draft</title><style>body{font-family:"Times New Roman",serif;font-size:16px;line-height:1.6;color:#000;margin:1in;}@page{margin:1in;}</style></head><body>`;
    const postHtml = "</body></html>";
    const html = preHtml + htmlContent + postHtml;

    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Legalify_Draft.doc";
    link.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
    showToast("DOCX downloaded successfully!");
  };

  const handleExportObsidian = () => {
    const text = pages
      .map((p) => document.getElementById(`page-div-${p.id}`)?.innerText || "")
      .join("\n\n");

    if (!text) return;

    const vaultName = "Legalify";
    const fileName = `Draft_${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const content = encodeURIComponent(
      `# Legal Draft\n\n${text}\n\n--- \n*Generated by Legalify AI on ${new Date().toLocaleString()}*`,
    );

    const uri = `obsidian://new?vault=${vaultName}&name=${fileName}&content=${content}`;
    window.location.href = uri;
    setShowDownloadMenu(false);
  };

  const handlePageKeyDown = (e, index) => {
    const currentPages = pagesRef.current;
    if (!currentPages[index]) return;
    const el = document.getElementById(`page-div-${currentPages[index].id}`);
    if (!el) return;

    if (e.key === "Backspace" && index > 0) {
      if (!el.innerText || el.innerText.trim() === "") {
        e.preventDefault();
        const newPages = currentPages.map((p, i) => {
          if (i === index) return p;
          const node = document.getElementById(`page-div-${p.id}`);
          return { ...p, html: node ? node.innerHTML : p.html };
        });
        newPages.splice(index, 1);
        setPages(newPages);
        setTimeout(() => {
          const prevEl = document.getElementById(
            `page-div-${newPages[index - 1].id}`,
          );
          if (prevEl) {
            prevEl.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(prevEl);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }, 50);
      }
    }
  };

  const handlePageInput = (e, index) => {
    paginatePages(index);
  };

  function paginatePages(startIndex) {
    let currentPageIndex = startIndex;
    let hasStateChanges = false;
    let tempPages = [...pagesRef.current];

    const syncTempPagesFromDOM = (pagesArray) => {
      return pagesArray.map((p) => {
        const node = document.getElementById(`page-div-${p.id}`);
        return node ? { ...p, html: node.innerHTML } : p;
      });
    };

    // Check selection before DOM manipulation
    const selection = window.getSelection();
    let selectionNode = null;
    let selectionOffset = 0;
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      selectionNode = range.startContainer;
      selectionOffset = range.startOffset;
    }

    const MAX_CONTENT_HEIGHT = 864; // US Letter page content height limit

    // 1. Cascading overflow: move content down
    while (currentPageIndex < tempPages.length) {
      const el = document.getElementById(`page-div-${tempPages[currentPageIndex].id}`);
      if (!el) break;

      if (el.scrollHeight > MAX_CONTENT_HEIGHT) {
        // Create a new page if we are at the end
        if (currentPageIndex === tempPages.length - 1) {
          const newId = `p-${Date.now()}-${tempPages.length}`;
          tempPages.push({ id: newId, html: "" });
          hasStateChanges = true;
          tempPages = syncTempPagesFromDOM(tempPages);
          setPages(tempPages);
          // Recursively paginate in the next tick to let DOM render the new page
          setTimeout(() => paginatePages(currentPageIndex), 0);
          return;
        }

        const nextEl = document.getElementById(`page-div-${tempPages[currentPageIndex + 1].id}`);
        if (!nextEl) break;

        // Move nodes from bottom of current page to top of next page
        while (el.scrollHeight > MAX_CONTENT_HEIGHT && el.childNodes.length > 1) {
          const lastChild = el.lastChild;
          nextEl.insertBefore(lastChild, nextEl.firstChild);
        }
      }
      currentPageIndex++;
    }

    // 2. Underflow: pull content up
    currentPageIndex = startIndex;
    while (currentPageIndex < tempPages.length - 1) {
      const el = document.getElementById(`page-div-${tempPages[currentPageIndex].id}`);
      const nextEl = document.getElementById(`page-div-${tempPages[currentPageIndex + 1].id}`);
      if (!el || !nextEl) break;

      while (el.scrollHeight < MAX_CONTENT_HEIGHT && nextEl.childNodes.length > 0) {
        const firstChild = nextEl.firstChild;
        el.appendChild(firstChild);
        
        if (el.scrollHeight > MAX_CONTENT_HEIGHT) {
          // Put it back
          nextEl.insertBefore(firstChild, nextEl.firstChild);
          break;
        }
      }

      if (nextEl.childNodes.length === 0) {
        tempPages.splice(currentPageIndex + 1, 1);
        hasStateChanges = true;
        tempPages = syncTempPagesFromDOM(tempPages);
        setPages(tempPages);
        return;
      }

      currentPageIndex++;
    }

    // Restore selection if node is still in document
    if (selectionNode && document.body.contains(selectionNode)) {
      try {
        const range = document.createRange();
        range.setStart(selectionNode, selectionOffset);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } catch (err) {
        console.warn("Failed to restore selection:", err);
      }
    }

    // 3. Sync DOM back to React state
    let htmlChanged = false;
    const synchronizedPages = tempPages.map((p) => {
      const node = document.getElementById(`page-div-${p.id}`);
      if (node) {
        const currentHtml = node.innerHTML;
        const refPage = pagesRef.current.find(rp => rp.id === p.id);
        if (currentHtml !== (refPage ? refPage.html : p.html)) {
          htmlChanged = true;
          return { ...p, html: currentHtml };
        }
      }
      return p;
    });

    if (htmlChanged || hasStateChanges) {
      setPages(synchronizedPages);
    }
  }

  // Adjust pagination using real DOM heights once loaded in editor mode
  React.useEffect(() => {
    if (mode === "editor" && pages.length > 0) {
      const timer = setTimeout(() => {
        paginatePages(0);
      }, 150);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, generatedDraft, fieldValues]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950">
      <AnimatePresence mode="wait">
        {/* ═══════ Step 1: Select Mode ═══════ */}
        {mode === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-950 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/20 w-full max-w-2xl relative overflow-hidden p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none rounded-3xl" />

            <h2 className="text-2xl font-bold text-white mb-8 text-center relative z-10">
              Start drafting by
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <button
                onClick={() => setMode("upload")}
                className="group flex flex-col items-start p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  Upload reference documents
                </h3>

                <p className="text-sm text-zinc-400 text-left">
                  Upload existing documents to use as reference for your draft
                </p>
              </button>

              <button
                onClick={() => setMode("type")}
                className="group flex flex-col items-start p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PenLine className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  Type facts of the matter
                </h3>

                <p className="text-sm text-zinc-400 text-left">
                  Start fresh by providing the facts and details of your case
                </p>
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════ Step 1b: Upload ═══════ */}
        {mode === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            className="bg-zinc-950 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-3xl relative overflow-visible"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-3xl" />
            <button
              onClick={() => setMode("select")}
              className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10 z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt,.pdf,.docx"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
            />

            <div className="flex flex-col items-center justify-center mb-6 mt-4">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                Upload Reference Document
              </h2>
              <p className="text-zinc-500 text-center text-sm mt-2">
                Securely upload your files to guide the AI drafting process
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDrop={onDrop}
              className="relative group flex flex-col items-center justify-center p-16 border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-2xl bg-[#121216] hover:bg-[#1a1a24] transition-all duration-500 cursor-pointer overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none" />

              <div className="relative w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-500">
                <Upload className="w-10 h-10" />
              </div>

              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-100 transition-colors">
                Click to upload or drag and drop
              </h3>
              <p className="text-sm text-zinc-400 font-medium">
                PDF, DOCX, or TXT
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Maximum file size: 10MB
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══════ Step 2: Type Facts (10/10 Premium UI) ═══════ */}
        {mode === "type" && (
          <motion.div
            key="type"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            className="bg-zinc-950 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-3xl relative overflow-visible"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-3xl" />
            <button
              onClick={() => setMode("select")}
              className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center justify-center mb-8 mt-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <PenLine className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                Tell us about what you want to draft
              </h2>
              <p className="text-zinc-500 text-center text-sm mt-2">
                Include which legal document you want and the facts of the case
              </p>
            </div>

            <div className="space-y-6 relative z-10">
              <div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                  <textarea
                    value={facts}
                    onChange={(e) => setFacts(e.target.value)}
                    placeholder="e.g. My client has been charged with Section 6 POCSO and rape charges. The FIR no. is 94 of 2023 and it is alleged that he committed rape of a minor girl in 2017 but he was not in India at that time. I need to draft a petition for quashing the FIR in Delhi high court..."
                    className="relative w-full h-40 bg-[#121216] border border-white/10 rounded-2xl p-5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none text-[15px] leading-relaxed shadow-inner transition-colors"
                  />
                </div>
                {/* Prompt strength bar */}
                <div className="mt-4 px-1">
                  <div className="h-1.5 w-full bg-[#121216] border border-white/5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        promptStrength === "weak"
                          ? "bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"
                          : promptStrength === "medium"
                            ? "bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      }`}
                      style={{ width: `${Math.max(2, strengthPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider ${strengthColor}`}
                    >
                      {promptStrength} Prompt:{" "}
                      {promptStrength === "strong"
                        ? "Great detail!"
                        : "Add more context for better quality."}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-500">
                      {facts.length} chars
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5">
                <div className="flex flex-col gap-2.5 relative">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Drafting Language
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setIsLangOpen(!isLangOpen)}
                      className={`flex items-center justify-between w-full bg-[#121216] border ${isLangOpen ? "border-blue-500/50 ring-1 ring-blue-500/30" : "border-white/10 hover:border-white/20"} rounded-xl px-4 py-3 text-sm text-white transition-all shadow-inner focus:outline-none`}
                    >
                      <span className="font-medium">{language}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isLangOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isLangOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-full bg-[#1e1e24]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 max-h-64 overflow-y-auto custom-scrollbar p-1.5"
                        >
                          {INDIAN_LANGUAGES.map((lang) => (
                            <button
                              key={lang}
                              onClick={() => {
                                setLanguage(lang);
                                setIsLangOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${
                                language === lang
                                  ? "bg-blue-500/20 text-blue-400 font-semibold"
                                  : "text-zinc-300 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              {lang}
                              {language === lang && (
                                <Check className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex flex-col gap-3 justify-end">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-[#121216] hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input
                        type="checkbox"
                        checked={useBNS}
                        onChange={(e) => setUseBNS(e.target.checked)}
                        className="peer sr-only"
                      />

                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 ${useBNS ? "bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-[#1a1a24] border-white/20 group-hover:border-white/40"}`}
                      >
                        {useBNS && (
                          <Check
                            className="w-3.5 h-3.5 text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-zinc-200 font-medium text-sm group-hover:text-white transition-colors">
                      Draft in BNS / BNSS
                    </span>
                  </label>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#121216] opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded border border-white/10 bg-[#1a1a24]" />
                      <div>
                        <span className="text-zinc-300 font-medium text-sm block">
                          Deep thinking model
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                          Pro Feature
                        </span>
                      </div>
                    </div>
                    <Lock className="w-4 h-4 text-zinc-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 mt-6 border-t border-white/5">
                <button
                  onClick={() => setMode("select")}
                  className="text-sm font-medium text-zinc-500 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={startGenerating}
                  disabled={!facts.trim()}
                  className="group relative px-8 py-3 bg-blue-600 disabled:bg-zinc-800 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                  <span className="relative z-10 flex items-center gap-2">
                    Start Drafting <Sparkles className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════ Step 3: Generating — Live Streaming Preview ═══════ */}
        {mode === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-3xl relative overflow-hidden flex flex-col"
            style={{ minHeight: "480px", maxHeight: "75vh" }}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping opacity-40" />
                </div>
                <span className="text-sm font-semibold text-white/80">
                  Drafting your legal document
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 tabular-nums">
                  {elapsedSeconds < 60
                    ? `${elapsedSeconds}s elapsed`
                    : `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s elapsed`
                  }
                </span>
                <span className="text-[10px] text-zinc-600 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                  {elapsedSeconds < 15 ? "Starting up..." : elapsedSeconds < 45 ? "Drafting..." : "Finalising..."}
                </span>
                <button
                  onClick={() => abortControllerRef.current?.abort()}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Live streaming area */}
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
              {streamingPreview ? (
                <pre
                  className="text-[13px] text-zinc-300 leading-[1.75] whitespace-pre-wrap font-serif break-words"
                  style={{ fontFamily: '"Times New Roman", serif' }}
                >
                  {streamingPreview}
                  <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-5 pt-10">
                  <AILoader size={120} />
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <p className="text-sm text-zinc-400">Connecting to AI drafting engine...</p>
                    <p className="text-xs text-zinc-600">First tokens will appear within 5–10 seconds</p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-zinc-900 shrink-0">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-1000"
                style={{ width: `${Math.min(95, (elapsedSeconds / 60) * 95)}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* ═══════ Step 4: Full Editor ═══════ */}
        {mode === "editor" && (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col overflow-hidden bg-white max-h-full min-h-[60vh]"
          >
            {/* ── Top Bar: Formatting + AI Tools ── */}
            <div className="border-b border-white/10 bg-[#1e1e24] shrink-0">
              {/* Row 1: Format toolbar */}
              <div className="flex items-center gap-1 px-4 pt-3 pb-2 overflow-x-auto md:overflow-visible">
                <select
                  onChange={(e) => formatText("fontName", e.target.value)}
                  disabled={!isEditingManually}
                  className="bg-[#2a2a32] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50 w-36 hover:bg-[#34343e] transition-colors disabled:opacity-40"
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                </select>
                <div className="w-px h-5 bg-white/10 mx-1.5" />
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("bold")}
                  className={formatBtnClass("bold")}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("italic")}
                  className={formatBtnClass("italic")}
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("underline")}
                  className={formatBtnClass("underline")}
                >
                  <Underline className="w-4 h-4" />
                </button>
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("strikeThrough")}
                  className={formatBtnClass("strikeThrough")}
                >
                  <Strikethrough className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-white/10 mx-1.5" />
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("justifyLeft")}
                  className={formatBtnClass("justifyLeft")}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("justifyCenter")}
                  className={formatBtnClass("justifyCenter")}
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("justifyRight")}
                  className={formatBtnClass("justifyRight")}
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("justifyFull")}
                  className={formatBtnClass("justifyFull")}
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-white/10 mx-1.5" />
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("insertUnorderedList")}
                  className={formatBtnClass("insertUnorderedList")}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("insertOrderedList")}
                  className={formatBtnClass("insertOrderedList")}
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-white/10 mx-1.5" />
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("undo")}
                  className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  disabled={!isEditingManually}
                  onClick={() => formatText("redo")}
                  className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={toggleEditMode}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isEditingManually
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300"
                    }`}
                  >
                    <PenLine className="w-3.5 h-3.5" />{" "}
                    {isEditingManually ? "Editing" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Row 2: AI actions + utility buttons */}
              <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto md:overflow-visible">
                <button
                  onClick={handleModifyDraft}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Modify Draft
                </button>
                <button
                  onClick={handleConvertBNS}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${useBNS ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300"}`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />{" "}
                  {useBNS ? "BNS/BNSS Applied" : "Convert to BNS/BNSS"}
                </button>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {AI_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleAIToolClick(tool.label)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all text-xs font-medium group"
                    title={tool.desc}
                  >
                    <tool.icon
                      className="w-3.5 h-3.5"
                      style={{ color: tool.color }}
                    />
                    <span className="text-zinc-500 group-hover:text-zinc-200 hidden lg:inline">
                      {tool.label}
                    </span>
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Export{" "}
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                    {showDownloadMenu && (
                      <div className="absolute top-full right-0 mt-1.5 w-40 bg-[#2a2a32] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1">
                        <button
                          onClick={handleDownloadPDF}
                          className="w-full text-left px-4 py-2.5 text-xs text-zinc-200 hover:bg-white/5 transition-colors"
                        >
                          Save as PDF
                        </button>
                        <button
                          onClick={handleDownloadDOCX}
                          className="w-full text-left px-4 py-2.5 text-xs text-zinc-200 hover:bg-white/5 transition-colors"
                        >
                          Save as DOCX
                        </button>
                        <button
                          onClick={handleExportObsidian}
                          className="w-full text-left px-4 py-2.5 text-xs text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-2"
                        >
                          <FileDigit className="w-3.5 h-3.5" /> Save to Obsidian
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setMode("select")}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    + New Draft
                  </button>
                </div>
              </div>
            </div>

            {/* ── Body: Document + Right Sidebar ── */}
            <div className="flex-1 flex min-h-0 overflow-hidden bg-gray-100">
              {/* Document Area */}
              <div className="flex-1 overflow-y-auto overflow-x-auto flex flex-col items-center custom-scrollbar py-10 pb-[calc(128px+env(safe-area-inset-bottom))]">
                <div className="flex flex-col items-center min-w-[848px] px-8 py-2">
                  {pages.map((page, index) => (
                    <PageNode
                      key={page.id}
                      page={page}
                      index={index}
                      total={pages.length}
                      isEditingManually={isEditingManually}
                      onKeyDown={handlePageKeyDown}
                      onInputEvents={updateFormatState}
                      onPageInput={handlePageInput}
                    />
                  ))}
                </div>
              </div>

              {/* Right: Template Fields */}
              <div
                className={`w-72 shrink-0 border-l border-white/8 bg-[#1e1e24] overflow-y-auto hidden lg:flex lg:flex-col custom-scrollbar transition-all duration-300 ${isEditingManually ? "opacity-40 pointer-events-none" : ""}`}
              >
                <div className="p-5 border-b border-white/5 sticky top-0 bg-[#1e1e24] z-10">
                  <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" /> Fill Details
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    {isEditingManually
                      ? "Disabled during manual editing."
                      : "Fill in to auto-replace placeholders."}
                  </p>
                </div>
                <div className="p-5 space-y-5">
                  {dynamicFields.length === 0 ? (
                    <div className="text-center text-zinc-600 text-xs py-12">
                      No placeholders detected.
                    </div>
                  ) : (
                    dynamicFields.map((f) => (
                      <div key={f.key} className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium text-zinc-400">
                          {f.label}
                        </label>
                        <input
                          type="text"
                          value={fieldValues[f.key] || ""}
                          onChange={(e) =>
                            setFieldValues((prev) => ({
                              ...prev,
                              [f.key]: e.target.value,
                            }))
                          }
                          placeholder={`{${f.key}}`}
                          className="bg-[#121216] border border-white/8 rounded-lg px-3 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 placeholder:text-zinc-600 transition-all"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-[#1e1e24] border border-white/10 rounded-xl shadow-2xl text-sm text-zinc-200 font-medium max-w-md text-center"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
