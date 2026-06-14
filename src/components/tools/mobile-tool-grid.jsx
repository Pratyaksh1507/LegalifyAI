"use client";

import React from "react";
import { FileText, FileSearch, ScrollText, MessageSquare, Scale } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const tools = [
  { id: "draft", name: "Draft", icon: FileText, color: "#3b82f6" },
  { id: "review", name: "Review", icon: FileSearch, color: "#10b981" },
  { id: "research", name: "Research", icon: ScrollText, color: "#8b5cf6" },
  { id: "pdf-chat", name: "PDF Chat", icon: MessageSquare, color: "#f43f5e" },
  { id: "arguments", name: "Arguments", icon: Scale, color: "#f59e0b" },
];

export function MobileToolGrid({ onToolSelect }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="w-full max-w-[100vw] px-4 py-6 flex flex-col items-center">
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect?.(tool.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 min-h-[80px] bg-[rgba(255,255,255,0.03)] border border-white/10 hover:bg-[rgba(255,255,255,0.06)] active:scale-95"
              aria-label={`Select ${tool.name} tool`}
            >
              <div
                className="rounded-xl flex items-center justify-center"
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: `${tool.color}20`,
                }}
              >
                <IconComponent style={{ width: "20px", height: "20px", color: tool.color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: tool.color }}>
                {tool.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
