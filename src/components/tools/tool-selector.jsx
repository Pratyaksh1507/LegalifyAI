"use client";

import React, { useState, useEffect } from "react";
import { RadialOrbitalTimeline } from "@/components/ui/radial-timeline";
import { MobileToolGrid } from "./mobile-tool-grid";

export function ToolSelector({ onToolSelect }) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 640;

  if (isMobile) {
    return <MobileToolGrid onToolSelect={onToolSelect} />;
  }

  return <RadialOrbitalTimeline onToolSelect={onToolSelect} />;
}
