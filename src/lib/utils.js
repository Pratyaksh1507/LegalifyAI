import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileText, MessageSquare, Scale, FileSearch, ScrollText } from "lucide-react";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(time) {
  try {
    const date = new Date(time);
    if (isNaN(date)) return time;
    const diffInSeconds = Math.floor((new Date() - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) return `${diffInDays}d ago`;
    if (diffInHours > 0) return `${diffInHours}h ago`;
    if (diffInMinutes > 0) return `${diffInMinutes}m ago`;
    return "Just now";
  } catch (e) {
    return time;
  }
}

export function normalizeToolName(tool) {
  const t = (tool || "").toLowerCase();
  if (t.includes("pdf") || t.includes("expert") || t.includes("analysis")) return "pdf chat";
  if (t.includes("draft")) return "draft";
  if (t.includes("research")) return "research";
  if (t.includes("review")) return "review";
  if (t.includes("argument") || t.includes("case")) return "arguments";
  return t;
}

export function getIconForTool(tool) {
  const t = normalizeToolName(tool);
  if (t === "pdf chat") return MessageSquare;
  if (t === "research") return ScrollText;
  if (t === "review") return FileSearch;
  if (t === "arguments") return Scale;
  return FileText;
}
