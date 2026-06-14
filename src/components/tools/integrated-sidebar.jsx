"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Save, Filter, Loader2, BookOpen, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";

export function IntegratedSidebar() {
  const [activeTab, setActiveTab] = useState("research"); // "research" | "notes"
  
  // Research State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [researchResult, setResearchResult] = useState("");
  const [searchError, setSearchError] = useState("");
  const abortRef = useRef(null);

  // Notes State — start with "" on both server and client to avoid hydration mismatch,
  // then load from localStorage after mount.
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("legalify_case_notes");
    if (saved) setNotes(saved);
  }, []);

  const handleSaveNotes = () => {
    localStorage.setItem("legalify_case_notes", notes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setResearchResult("");
    setSearchError("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/ai/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: searchQuery }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402) {
          throw new Error("⚠️ AI quota exceeded. Please upgrade.");
        }
        throw new Error(errorData.error || "Search failed.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream.");

      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResearchResult(text);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setSearchError(err.message || "An error occurred.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 border-l border-white/10 overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-white/10 shrink-0">
        <button
          onClick={() => setActiveTab("research")}
          className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all ${
            activeTab === "research"
              ? "text-white border-b-2 border-emerald-500 bg-white/5"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/2"
          }`}
        >
          AI Legal Research
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all ${
            activeTab === "notes"
              ? "text-white border-b-2 border-emerald-500 bg-white/5"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/2"
          }`}
        >
          Notes
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        
        {/* ── Research Tab ── */}
        {activeTab === "research" && (
          <div className="p-4 flex flex-col h-full">
            {/* Search Box */}
            <form onSubmit={handleSearch} className="shrink-0 mb-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search case law..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-2 text-zinc-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Filter Mock */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-zinc-500">Filters:</span>
                <select className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-zinc-400 focus:outline-none appearance-none">
                  <option>All Courts</option>
                  <option>Supreme Court</option>
                  <option>High Courts</option>
                </select>
                <Filter className="w-3 h-3 text-zinc-500 ml-1" />
              </div>
            </form>

            {/* Error Area */}
            {searchError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Results Area */}
            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-4 overflow-y-auto custom-scrollbar">
              {!researchResult && !isSearching && !searchError && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <BookOpen className="w-8 h-8 mb-3 text-zinc-500" />
                  <p className="text-sm text-zinc-400">
                    Search for specific case laws, statutes, or legal definitions to aid your arguments.
                  </p>
                </div>
              )}

              {(researchResult || isSearching) && (
                <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-4 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xs font-bold text-emerald-400 mt-3 mb-1 uppercase tracking-wider">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{children}</a>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
                    }}
                  >
                    {researchResult || "Searching Indian jurisprudence..."}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Notes Tab ── */}
        {activeTab === "notes" && (
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs text-zinc-500 font-medium">
                Draft arguments, save snippets, or jot down thoughts.
              </span>
              <button
                onClick={handleSaveNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white rounded-lg transition-colors border border-white/10"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaved ? "Saved!" : "Save"}
              </button>
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Start typing your notes here..."
              className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
}
