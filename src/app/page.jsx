"use client";

import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {

  return (
    <main
      className="min-h-screen relative w-full flex flex-col items-center justify-center overflow-hidden bg-black text-foreground"
    >
      {/* Subtle light bloom behind title */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[600px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Title with fade-in */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="md:text-7xl text-5xl lg:text-9xl font-bold text-center relative z-20 tracking-tight text-foreground"
      >
        Legalify
      </motion.h1>

      {/* Gradient line under the title */}
      <div className="w-full max-w-5xl h-[2px] relative mt-4">
        <div className="absolute inset-x-1/4 top-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent h-[2px] w-1/2 blur-none" />
        <div className="absolute inset-x-1/4 top-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px w-1/2 blur-sm" />
        <div
          className="absolute inset-x-10 top-0 bg-gradient-to-r from-transparent dark:via-sky-500 via-blue-400 to-transparent h-[5px] blur-sm"
        />
        <div
          className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent dark:via-sky-400 via-blue-300 to-transparent h-px blur-lg"
        />
      </div>

      {/* Sparkles below the line — Refined density for premium feel */}
      <div className="w-full h-48 relative -mt-1 overflow-hidden">
        <SparklesCore
          background="transparent"
          minSize={0.2}
          maxSize={0.8}
          particleDensity={1500}
          className="w-full h-full"
          particleColor="#ffffff"
          speed={0.5}
        />

        {/* Smooth edge fade using radial gradient mask — Adjusted for black background */}
        <div
          className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(ellipse_50%_100%_at_50%_0%,transparent_20%,black_90%)]"
        />
      </div>

      {/* Tagline + Social proof + CTA with fade-in */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="relative z-20 flex flex-col items-center -mt-6"
      >
        <p
          className="text-lg md:text-xl max-w-xl text-center mb-3 px-4 text-muted-foreground"
        >
          AI-Powered Legal Assistant
        </p>

        {/* Sleek ghost button — minimal B&W aesthetic */}
        <Link
          href="/login"
          className="px-8 py-3 border font-medium rounded-full transition-all duration-300 ease-in-out border-zinc-300 text-zinc-100 hover:bg-zinc-800 hover:text-white hover:border-white hover:shadow-[0_0_25px_rgba(0,0,0,0.15)] dark:border-zinc-700 dark:text-white dark:hover:bg-white dark:hover:text-black dark:hover:border-white dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
        >
          Get Started
        </Link>
      </motion.div>

      {/* Footer */}
      <footer
        className="absolute bottom-0 w-full border-t z-20 border-border"
      >
        <div className="max-w-6xl mx-auto px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            className="text-sm text-muted-foreground"
          >
            &copy; 2026 Legalify. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
